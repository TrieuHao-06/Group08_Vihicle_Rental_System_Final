package com.thuexe.owner;

import com.thuexe.entity.RequestStatus;

import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;

public final class OwnerDto {

    private OwnerDto() {}

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    /**
     * Dữ liệu form đăng ký / sửa xe. Mọi field để dạng chuỗi (giống ô nhập trên web),
     * việc đổi sang số và kiểm tra hợp lệ làm trong OwnerService để báo lỗi tiếng Việt.
     */
    public record VehicleForm(String brand, String model, String plate, String type, String cc, String fuel,
                              String hourPrice, String dayPrice, String deposit,
                              String availFrom, String availTo, String area) {

        /** Dùng cho form multipart (đăng ký xe có upload file) */
        public static VehicleForm fromParams(Map<String, String> p) {
            return new VehicleForm(p.get("brand"), p.get("model"), p.get("plate"), p.get("type"),
                    p.get("cc"), p.get("fuel"), p.get("hourPrice"), p.get("dayPrice"), p.get("deposit"),
                    p.get("availFrom"), p.get("availTo"), p.get("area"));
        }
    }

    /** Tên field khớp với những gì xecuaban.js đang dùng; approval/availability viết thường */
    public record VehicleResponse(Long id, String brand, String model, String plate, String type, String cc,
                                  String fuel, long hourPrice, long dayPrice, long deposit,
                                  String availFrom, String availTo, String approval, String availability, String area) {

        static VehicleResponse of(OwnerVehicle v) {
            return new VehicleResponse(v.getId(), v.getBrand(), v.getModel(), v.getPlate(), v.getType(),
                    v.getCc(), v.getFuel(), n(v.getHourPrice()), n(v.getDayPrice()), n(v.getDeposit()),
                    v.getAvailFrom() == null ? null : v.getAvailFrom().toString(),
                    v.getAvailTo() == null ? null : v.getAvailTo().toString(),
                    lower(v.getApprovalStatus()),
                    v.getAvailability() == null ? "available" : v.getAvailability().name().toLowerCase(Locale.ROOT),
                    v.getArea() == null ? "Quận 1" : v.getArea());
        }
    }

    /** id dạng "BK0003", start/end dạng "2026-11-20T08:00" để FE so sánh chuỗi được */
    public record BookingResponse(String id, Long vehicleId, String renter, String start, String end,
                                  long total, String status) {

        static BookingResponse of(OwnerBooking b, String renterName) {
            return new BookingResponse(String.format("BK%04d", b.getId()), b.getVehicleId(), renterName,
                    b.getStartTime() == null ? null : b.getStartTime().format(DT),
                    b.getEndTime() == null ? null : b.getEndTime().format(DT),
                    n(b.getTotalAmount()), lower(b.getStatus()));
        }
    }

    private static long n(Long x) { return x == null ? 0 : x; }

    private static String lower(RequestStatus s) { return s == null ? "pending" : s.name().toLowerCase(Locale.ROOT); }
}
