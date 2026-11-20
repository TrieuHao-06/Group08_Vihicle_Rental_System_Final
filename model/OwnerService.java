package com.thuexe.owner;

import com.thuexe.entity.Account;
import com.thuexe.entity.RequestStatus;
import com.thuexe.exception.ApiException;
import com.thuexe.owner.OwnerDto.*;
import com.thuexe.owner.OwnerVehicle.Availability;
import com.thuexe.repository.AccountRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Nghiệp vụ tab "Xe của bạn" (Chủ xe):
 *  - Register Vehicles / Update Own Vehicles
 *  - Set Price & Availability (khóa / mở lịch)
 *  - Accept / Reject Booking
 * Phần xem doanh thu và rút tiền đã có trong WalletService (earnings, withdraw).
 */
@Service
public class OwnerService {

    private static final Path UPLOAD_ROOT = Paths.get("uploads", "vehicles"); // tính từ thư mục chạy project
    private static final long MAX_FILE_BYTES = 5L * 1024 * 1024;
    private static final long MAX_MONEY = 10_000_000_000L;
    private static final int MAX_FILES_PER_KIND = 5;

    private final OwnerVehicleRepository vehicles;
    private final OwnerVehicleFileRepository files;
    private final OwnerBookingRepository bookings;
    private final AccountRepository accounts;

    public OwnerService(OwnerVehicleRepository vehicles, OwnerVehicleFileRepository files,
                        OwnerBookingRepository bookings, AccountRepository accounts) {
        this.vehicles = vehicles;
        this.files = files;
        this.bookings = bookings;
        this.accounts = accounts;
    }

    /* ================= TIỆN ÍCH ================= */

    private static ApiException bad(String msg) {
        return new ApiException(HttpStatus.BAD_REQUEST, msg);
    }

    private static String trim(String s) {
        return s == null ? "" : s.trim();
    }

    /** Đổi chuỗi sang số nguyên; rỗng hoặc sai định dạng thì trả null */
    private static Long number(String s) {
        String t = trim(s);
        if (t.isEmpty()) return null;
        try {
            return Long.parseLong(t);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** "59A1-123.45" và "59a1 12345" cho cùng một khóa "59A112345" */
    private static String plateKeyOf(String plate) {
        return plate.toUpperCase(Locale.ROOT).replaceAll("[\\s.\\-]", "");
    }

    private static Long parseBookingId(String raw) {
        String digits = raw == null ? "" : raw.replaceAll("\\D", "");
        if (digits.isEmpty() || digits.length() > 18) throw bad("Mã đơn không hợp lệ.");
        return Long.parseLong(digits);
    }

    private static String bookingCode(Long id) {
        return String.format("BK%04d", id);
    }

    private String renterName(Long renterId) {
        if (renterId == null) return "—";
        return accounts.findById(renterId).map(Account::getUsername).orElse("#" + renterId);
    }

    /** Kết quả sau khi kiểm tra form: đã là số/ngày thật */
    private record Parsed(String brand, String model, String plate, String plateKey, String type, String cc,
                          String fuel, long hourPrice, long dayPrice, long deposit,
                          LocalDate from, LocalDate to) {}

    /** Giống validate() bên xecuaban.js, nhưng server PHẢI kiểm tra lại vì FE có thể bị bỏ qua */
    private Parsed parse(VehicleForm f) {
        String brand = trim(f.brand());
        String model = trim(f.model());
        String plate = trim(f.plate());
        if (brand.isEmpty()) throw bad("Vui lòng nhập hãng xe.");
        if (model.isEmpty()) throw bad("Vui lòng nhập tên mẫu xe & đời xe.");
        if (plate.isEmpty()) throw bad("Vui lòng nhập biển số xe.");
        if (brand.length() > 50) throw bad("Hãng xe tối đa 50 ký tự.");
        if (model.length() > 100) throw bad("Tên mẫu xe tối đa 100 ký tự.");
        if (plate.length() > 20) throw bad("Biển số tối đa 20 ký tự.");

        Long hour = number(f.hourPrice());
        Long day = number(f.dayPrice());
        Long deposit = number(f.deposit());
        if (hour == null || hour <= 0) throw bad("Giá thuê theo giờ phải lớn hơn 0.");
        if (day == null || day <= 0) throw bad("Giá thuê theo ngày phải lớn hơn 0.");
        if (deposit == null || deposit < 0) throw bad("Vui lòng nhập tiền đặt cọc (từ 0 trở lên).");
        if (hour > MAX_MONEY || day > MAX_MONEY || deposit > MAX_MONEY) throw bad("Số tiền quá lớn.");

        LocalDate from;
        LocalDate to;
        try {
            from = LocalDate.parse(trim(f.availFrom()));
            to = LocalDate.parse(trim(f.availTo()));
        } catch (DateTimeParseException e) {
            throw bad("Vui lòng chọn khung ngày xe được phép cho thuê.");
        }
        if (to.isBefore(from)) throw bad("Ngày kết thúc không được trước ngày bắt đầu.");

        String type = trim(f.type()).isEmpty() ? "Xe tay ga" : trim(f.type());
        String cc = trim(f.cc()).isEmpty() ? "110cc" : trim(f.cc());
        String fuel = trim(f.fuel()).isEmpty() ? "Xăng" : trim(f.fuel());
        return new Parsed(brand, model, plate, plateKeyOf(plate), type, cc, fuel, hour, day, deposit, from, to);
    }

    private void apply(OwnerVehicle v, Parsed p) {
        v.setBrand(p.brand());
        v.setModel(p.model());
        v.setPlate(p.plate());
        v.setPlateKey(p.plateKey());
        v.setType(p.type());
        v.setCc(p.cc());
        v.setFuel(p.fuel());
        v.setHourPrice(p.hourPrice());
        v.setDayPrice(p.dayPrice());
        v.setDeposit(p.deposit());
        v.setAvailFrom(p.from());
        v.setAvailTo(p.to());
    }

    private static ApiException duplicatePlate(String plate) {
        return bad("Biển số " + plate + " đã tồn tại trong hệ thống.");
    }

    /* ================= XE CỦA TÔI ================= */

    @Transactional(readOnly = true)
    public List<VehicleResponse> listVehicles(Long ownerId) {
        return vehicles.findByOwnerIdOrderByIdAsc(ownerId).stream().map(VehicleResponse::of).toList();
    }

    /** Register Vehicles: xe mới ở trạng thái PENDING, chờ Admin duyệt mới lên sàn */
    @Transactional
    public VehicleResponse registerVehicle(Long ownerId, VehicleForm form,
                                           List<MultipartFile> images, List<MultipartFile> docs) {
        Parsed p = parse(form);
        List<MultipartFile> imgs = nonEmpty(images);
        List<MultipartFile> dcs = nonEmpty(docs);
        if (imgs.isEmpty()) throw bad("Vui lòng tải lên ít nhất 1 ảnh xe.");
        if (dcs.isEmpty()) throw bad("Vui lòng tải lên giấy tờ xe (cà vẹt, đăng kiểm).");
        if (imgs.size() > MAX_FILES_PER_KIND || dcs.size() > MAX_FILES_PER_KIND) {
            throw bad("Mỗi loại tối đa " + MAX_FILES_PER_KIND + " file.");
        }
        imgs.forEach(f -> checkFile(f, false));
        dcs.forEach(f -> checkFile(f, true));
        if (vehicles.existsByPlateKey(p.plateKey())) throw duplicatePlate(p.plate());

        List<Path> saved = new ArrayList<>(); // để xóa file nếu lưu database bị lỗi
        try {
            OwnerVehicle v = new OwnerVehicle();
            v.setOwnerId(ownerId);
            apply(v, p);
            v.setApprovalStatus(RequestStatus.PENDING);
            v.setAvailability(Availability.AVAILABLE);
            v.setCreatedAt(LocalDateTime.now());
            v = vehicles.saveAndFlush(v);

            for (MultipartFile f : imgs) files.save(new OwnerVehicleFile(v.getId(), "photo", saveFile(f, "photos", saved)));
            for (MultipartFile f : dcs) files.save(new OwnerVehicleFile(v.getId(), "document", saveFile(f, "docs", saved)));
            return VehicleResponse.of(v);
        } catch (DataIntegrityViolationException e) {
            deleteQuietly(saved);
            throw duplicatePlate(p.plate()); // 2 người đăng ký cùng biển số cùng lúc
        } catch (RuntimeException e) {
            deleteQuietly(saved);
            throw e;
        }
    }

    /** Update Own Vehicles: chỉ sửa được xe của chính mình */
    @Transactional
    public VehicleResponse updateVehicle(Long ownerId, Long vehicleId, VehicleForm form) {
        OwnerVehicle v = vehicles.findByIdAndOwnerId(vehicleId, ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy xe của bạn."));
        Parsed p = parse(form);
        if (vehicles.existsByPlateKeyAndIdNot(p.plateKey(), vehicleId)) throw duplicatePlate(p.plate());

        apply(v, p);
        // Xe bị từ chối được sửa lại thì gửi duyệt lại
        if (v.getApprovalStatus() == RequestStatus.REJECTED) v.setApprovalStatus(RequestStatus.PENDING);
        try {
            return VehicleResponse.of(vehicles.saveAndFlush(v));
        } catch (DataIntegrityViolationException e) {
            throw duplicatePlate(p.plate());
        }
    }

    /** Set Availability: khóa lịch <-> mở trống. Xe chưa duyệt hoặc đang có khách thì không đổi được. */
    @Transactional
    public VehicleResponse toggleAvailability(Long ownerId, Long vehicleId) {
        OwnerVehicle v = vehicles.findByIdForUpdate(vehicleId)
                .filter(x -> ownerId.equals(x.getOwnerId()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy xe của bạn."));
        if (v.getApprovalStatus() != RequestStatus.APPROVED || v.getAvailability() == Availability.RENTED) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Không thể đổi lịch: xe chưa được duyệt hoặc đang có khách thuê.");
        }
        v.setAvailability(v.getAvailability() == Availability.LOCKED ? Availability.AVAILABLE : Availability.LOCKED);
        return VehicleResponse.of(v);
    }

    /* ================= YÊU CẦU ĐẶT XE ================= */

    @Transactional(readOnly = true)
    public List<BookingResponse> listBookings(Long ownerId) {
        Map<Long, String> names = new HashMap<>(); // tra tên mỗi người thuê 1 lần
        List<BookingResponse> result = new ArrayList<>();
        for (OwnerBooking b : bookings.findAllOfOwner(ownerId)) {
            String name = names.computeIfAbsent(b.getRenterId(), this::renterName);
            result.add(BookingResponse.of(b, name));
        }
        return result;
    }

    /**
     * Accept Booking. Khóa dòng đơn + dòng xe (FOR UPDATE) để hai đơn trùng giờ
     * không thể cùng được chấp nhận trong cùng một lúc.
     */
    @Transactional
    public BookingResponse approveBooking(Long ownerId, String rawId) {
        Long id = parseBookingId(rawId);
        OwnerBooking b = bookings.findByIdForUpdate(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt xe của bạn."));
        OwnerVehicle v = ownedVehicleOf(b, ownerId);

        if (b.getStatus() != RequestStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Đơn này đã được xử lý rồi.");
        }
        if (v.getApprovalStatus() != RequestStatus.APPROVED) {
            throw new ApiException(HttpStatus.CONFLICT, "Xe này chưa được Admin duyệt nên không thể nhận đơn.");
        }
        if (v.getAvailability() == Availability.LOCKED) {
            throw new ApiException(HttpStatus.CONFLICT, "Xe đang khóa lịch. Hãy mở trống xe trước khi chấp nhận đơn.");
        }
        List<OwnerBooking> overlap = bookings.findOverlapping(
                v.getId(), RequestStatus.APPROVED, b.getId(), b.getStartTime(), b.getEndTime());
        if (!overlap.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "Trùng lịch với đơn #" + bookingCode(overlap.get(0).getId())
                    + ". Không thể chấp nhận đơn này.");
        }

        b.setStatus(RequestStatus.APPROVED);
        return BookingResponse.of(b, renterName(b.getRenterId()));
    }

    /** Reject Booking */
    @Transactional
    public BookingResponse rejectBooking(Long ownerId, String rawId) {
        Long id = parseBookingId(rawId);
        OwnerBooking b = bookings.findByIdForUpdate(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt xe của bạn."));
        ownedVehicleOf(b, ownerId);
        if (b.getStatus() != RequestStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Đơn này đã được xử lý rồi.");
        }
        b.setStatus(RequestStatus.REJECTED);
        return BookingResponse.of(b, renterName(b.getRenterId()));
    }

    /** Lấy xe (đã khóa) của đơn, và chắc chắn xe đó thuộc chủ xe đang đăng nhập */
    private OwnerVehicle ownedVehicleOf(OwnerBooking b, Long ownerId) {
        return vehicles.findByIdForUpdate(b.getVehicleId())
                .filter(x -> ownerId.equals(x.getOwnerId()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt xe của bạn."));
    }

    /* ================= FILE UPLOAD ================= */

    private static List<MultipartFile> nonEmpty(List<MultipartFile> list) {
        if (list == null) return List.of();
        return list.stream().filter(f -> f != null && !f.isEmpty()).toList();
    }

    /** Ảnh xe: chỉ ảnh. Giấy tờ: ảnh hoặc PDF. Mỗi file tối đa 5MB. */
    private static void checkFile(MultipartFile f, boolean allowPdf) {
        String type = f.getContentType() == null ? "" : f.getContentType().toLowerCase(Locale.ROOT);
        boolean ok = type.startsWith("image/") || (allowPdf && type.equals("application/pdf"));
        if (!ok) throw bad("Chỉ chấp nhận file ảnh (giấy tờ có thể là ảnh hoặc PDF).");
        if (f.getSize() > MAX_FILE_BYTES) throw bad("Mỗi file tối đa 5MB.");
    }

    /** Lưu file với tên ngẫu nhiên (không dùng tên người dùng đặt để tránh ghi đè / path traversal) */
    private String saveFile(MultipartFile f, String subFolder, List<Path> saved) {
        try {
            Path dir = UPLOAD_ROOT.resolve(subFolder);
            Files.createDirectories(dir);
            String name = UUID.randomUUID() + extensionOf(f.getOriginalFilename());
            Path target = dir.resolve(name);
            try (InputStream in = f.getInputStream()) {
                Files.copy(in, target);
            }
            saved.add(target);
            return subFolder + "/" + name;
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Không lưu được file tải lên: " + e.getMessage());
        }
    }

    private static String extensionOf(String originalName) {
        if (originalName == null) return "";
        int dot = originalName.lastIndexOf('.');
        if (dot < 0) return "";
        String ext = originalName.substring(dot).toLowerCase(Locale.ROOT).replaceAll("[^.a-z0-9]", "");
        return ext.length() <= 6 ? ext : "";
    }

    private static void deleteQuietly(List<Path> paths) {
        for (Path p : paths) {
            try {
                Files.deleteIfExists(p);
            } catch (IOException ignored) {
                // không xóa được thì bỏ qua
            }
        }
    }
}
