package com.thuexe.service;

import com.thuexe.dto.WalletDto.*;
import com.thuexe.entity.*;
import com.thuexe.entity.WalletTransaction.Status;
import com.thuexe.entity.WalletTransaction.Type;
import com.thuexe.exception.ApiException;
import com.thuexe.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class WalletService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Pattern QUARTER = Pattern.compile("^(\\d{4})-Q([1-4])$");
    private static final List<Type> PAID = List.of(Type.PAYMENT);
    private static final EnumSet<RequestStatus> OPEN = EnumSet.of(RequestStatus.PENDING, RequestStatus.APPROVED);

    private final WalletRepository wallets;
    private final WalletTransactionRepository txs;
    private final RefundRequestRepository refunds;
    private final WithdrawalRequestRepository withdrawals;
    private final AccountRepository accounts;

    /** Phí nền tảng trừ vào doanh thu của chủ xe */
    @Value("${app.wallet.commission-rate:0.10}")
    private double commissionRate;

    public WalletService(WalletRepository wallets, WalletTransactionRepository txs,
                         RefundRequestRepository refunds, WithdrawalRequestRepository withdrawals,
                         AccountRepository accounts) {
        this.wallets = wallets;
        this.txs = txs;
        this.refunds = refunds;
        this.withdrawals = withdrawals;
        this.accounts = accounts;
    }

    /* ================= TIỆN ÍCH ================= */

    /** Ví thường được tạo lúc đăng ký; chưa có thì tạo bù */
    private Wallet lockWallet(Long userId) {
        return wallets.findByUserIdForUpdate(userId)
                .orElseGet(() -> wallets.save(new Wallet(userId)));
    }

    private Wallet lockWalletById(Long walletId) {
        return wallets.findByIdForUpdate(walletId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy ví"));
    }

    /** Mọi thay đổi số dư ví đều được ghi vào lịch sử giao dịch (4.7.3) */
    private WalletTransaction record(Wallet w, Long bookingId, Type type, long amount, String desc, Status status) {
        return txs.save(new WalletTransaction(w.getId(), bookingId, type, amount, desc, status));
    }

    private static String vnd(long n) {
        return NumberFormat.getInstance(Locale.forLanguageTag("vi-VN")).format(n) + "đ";
    }

    private static String bookingCode(Long id) {
        return String.format("BK%04d", id);
    }

    private String usernameOfWallet(Long walletId) {
        return wallets.findById(walletId)
                .flatMap(w -> accounts.findById(w.getUserId()))
                .map(Account::getUsername).orElse("#" + walletId);
    }

    private TransactionResponse toResponse(WalletTransaction t) {
        return new TransactionResponse(t.getId(), t.getCode(), t.getType().name(), t.getDescription(),
                t.getAmount(), t.getStatus().name(), t.getStatus().getLabel(),
                t.getBookingId(), t.getCreatedAt().format(FMT));
    }

    private RefundResponse toResponse(RefundRequest r) {
        return new RefundResponse(r.getId(), r.getBookingId(), bookingCode(r.getBookingId()),
                usernameOfWallet(r.getWalletId()), r.getAmount(), r.getCancellationFee(), r.getReason(),
                r.getStatus().name(), r.getStatus().getLabel(), r.getApprovedBy(),
                r.getRequestedAt().format(FMT),
                r.getProcessedAt() == null ? null : r.getProcessedAt().format(FMT));
    }

    private WithdrawalResponse toResponse(WithdrawalRequest w) {
        return new WithdrawalResponse(w.getId(), usernameOfWallet(w.getWalletId()), w.getAmount(),
                w.getBankInfo(), w.getStatus().name(), w.getStatus().getLabel(), w.getApprovedBy(),
                w.getRequestedAt().format(FMT),
                w.getProcessedAt() == null ? null : w.getProcessedAt().format(FMT));
    }

    private record Period(String label, LocalDateTime from, LocalDateTime to) {}

    /** "2026-11" = tháng, "2026-Q4" = quý, bỏ trống = tháng hiện tại */
    private Period parsePeriod(String raw) {
        if (raw == null || raw.isBlank()) {
            YearMonth ym = YearMonth.now();
            return new Period(ym.toString(), ym.atDay(1).atStartOfDay(), ym.plusMonths(1).atDay(1).atStartOfDay());
        }
        String p = raw.trim().toUpperCase();
        Matcher m = QUARTER.matcher(p);
        if (m.matches()) {
            int year = Integer.parseInt(m.group(1));
            int q = Integer.parseInt(m.group(2));
            LocalDateTime from = LocalDate.of(year, (q - 1) * 3 + 1, 1).atStartOfDay();
            return new Period(year + "-Q" + q, from, from.plusMonths(3));
        }
        try {
            YearMonth ym = YearMonth.parse(p);
            return new Period(ym.toString(), ym.atDay(1).atStartOfDay(), ym.plusMonths(1).atDay(1).atStartOfDay());
        } catch (DateTimeParseException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Kỳ báo cáo không hợp lệ, dùng yyyy-MM hoặc yyyy-Qn");
        }
    }

    /* ================= VÍ CỦA TÔI ================= */

    @Transactional
    public WalletResponse getWallet(Long userId) {
        Wallet w = lockWallet(userId);
        return new WalletResponse(w.getId(), w.getBalance());
    }

    /** Deposit Money: hệ thống cộng tiền vào ví */
    @Transactional
    public WalletActionResponse deposit(Long userId, long amount) {
        Wallet w = lockWallet(userId);
        w.setBalance(w.getBalance() + amount);
        WalletTransaction tx = record(w, null, Type.TOP_UP, amount, "Nạp tiền vào ví nội bộ", Status.COMPLETED);
        return new WalletActionResponse(w.getBalance(), List.of(toResponse(tx)), "Nạp tiền thành công");
    }

    /**
     * Withdraw Money / Withdraw Earnings: tạo yêu cầu rút tiền chờ Admin duyệt.
     * Rút quá số dư thì hủy yêu cầu (4.7.2.2).
     */
    @Transactional
    public WalletActionResponse withdraw(Long userId, long amount, String bankInfo) {
        Wallet w = lockWallet(userId);
        if (amount > w.getBalance()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Số dư trong ví (" + vnd(w.getBalance()) + ") không đủ để rút " + vnd(amount)
                            + ". Yêu cầu rút tiền đã bị hủy.");
        }
        w.setBalance(w.getBalance() - amount); // giữ tiền trong lúc chờ duyệt

        WalletTransaction tx = record(w, null, Type.WITHDRAW, -amount,
                "Rút tiền về tài khoản ngân hàng", Status.PENDING);
        withdrawals.save(new WithdrawalRequest(w.getId(), amount, bankInfo.trim(), tx.getId()));

        return new WalletActionResponse(w.getBalance(), List.of(toResponse(tx)),
                "Yêu cầu rút tiền đã được gửi, vui lòng chờ Admin duyệt");
    }

    /** View Transaction History */
    @Transactional(readOnly = true)
    public List<TransactionResponse> history(Long userId) {
        return wallets.findByUserId(userId)
                .map(w -> txs.findByWalletIdOrderByIdDesc(w.getId()).stream().map(this::toResponse).toList())
                .orElse(List.of());
    }

    /* ================= THANH TOÁN ================= */

    /**
     * Make Payment: trừ tiền trong ví khách để trả tiền cọc hoặc toàn bộ đơn (4.9),
     * đồng thời cộng doanh thu cho chủ xe sau khi trừ phí nền tảng.
     * Thiếu tiền trong ví thì chặn (4.9.2.2).
     */
    @Transactional
    public WalletActionResponse pay(Long userId, PaymentRequest req) {
        Long bookingId = req.bookingId();
        long total = req.totalAmount();
        String type = req.paymentType().trim().toUpperCase();

        Wallet w = lockWallet(userId); // khóa ví để các kiểm tra trùng bên dưới không chạy song song
        long alreadyPaid = -txs.sumByWalletAndBooking(w.getId(), bookingId, PAID, Status.COMPLETED);

        long charge;
        String desc;
        if (type.equals("DEPOSIT")) {
            long deposit = req.depositAmount() == null ? 0 : req.depositAmount();
            if (deposit <= 0 || deposit > total) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Tiền đặt cọc không hợp lệ");
            }
            if (alreadyPaid > 0) {
                throw new ApiException(HttpStatus.CONFLICT, "Đơn #" + bookingCode(bookingId) + " đã được thanh toán");
            }
            charge = deposit;
            desc = "Đặt cọc đơn #" + bookingCode(bookingId);
        } else {
            charge = total - alreadyPaid;
            if (charge <= 0) {
                throw new ApiException(HttpStatus.CONFLICT, "Đơn #" + bookingCode(bookingId) + " đã thanh toán đủ");
            }
            desc = "Thanh toán thuê xe đơn #" + bookingCode(bookingId);
        }

        if (w.getBalance() < charge) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Số dư trong ví (" + vnd(w.getBalance()) + ") không đủ để thanh toán " + vnd(charge)
                            + "! Vui lòng nạp thêm tiền vào tài khoản.");
        }
        w.setBalance(w.getBalance() - charge);
        WalletTransaction tx = record(w, bookingId, Type.PAYMENT, -charge, desc, Status.COMPLETED);

        creditOwner(req.ownerId(), bookingId, charge);

        return new WalletActionResponse(w.getBalance(), List.of(toResponse(tx)), "Thanh toán thành công");
    }

    /** Cộng doanh thu cho chủ xe (EARNING), đồng thời ghi phí nền tảng (COMMISSION) */
    private void creditOwner(Long ownerId, Long bookingId, long gross) {
        accounts.findById(ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy chủ xe"));
        long commission = Math.round(gross * commissionRate);

        Wallet ow = lockWallet(ownerId);
        ow.setBalance(ow.getBalance() + gross - commission);
        record(ow, bookingId, Type.EARNING, gross,
                "Doanh thu thuê xe đơn #" + bookingCode(bookingId), Status.COMPLETED);
        if (commission > 0) {
            record(ow, bookingId, Type.COMMISSION, -commission,
                    "Phí nền tảng đơn #" + bookingCode(bookingId), Status.COMPLETED);
        }
    }

    /* ================= HOÀN TIỀN ================= */

    /**
     * Request Refund (Renter): sau khi hủy đặt xe, tạo yêu cầu hoàn phần tiền còn lại
     * (số đã thanh toán trừ phí hủy) - use-case 4.10.
     */
    @Transactional
    public RefundResponse requestRefund(Long userId, RefundBody body) {
        Long bookingId = body.bookingId();

        Wallet w = lockWallet(userId);
        long paid = -txs.sumByWalletAndBooking(w.getId(), bookingId, PAID, Status.COMPLETED);
        if (paid <= 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy khoản thanh toán của đơn #" + bookingCode(bookingId));
        }
        if (refunds.existsByBookingIdAndStatusIn(bookingId, OPEN)) {
            throw new ApiException(HttpStatus.CONFLICT, "Đơn #" + bookingCode(bookingId) + " đã có yêu cầu hoàn tiền");
        }

        long fee = body.cancellationFee() == null ? 0 : body.cancellationFee();
        if (fee >= paid) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Đơn #" + bookingCode(bookingId) + " không còn khoản nào để hoàn");
        }

        String reason = (body.reason() == null || body.reason().isBlank()) ? "Hủy đặt xe" : body.reason().trim();
        return toResponse(refunds.save(new RefundRequest(bookingId, w.getId(), paid - fee, fee, reason)));
    }

    /** Approve Refunds (Admin) */
    @Transactional(readOnly = true)
    public List<RefundResponse> listRefunds(RequestStatus status) {
        List<RefundRequest> list = (status == null)
                ? refunds.findAllByOrderByIdDesc() : refunds.findByStatusOrderByIdDesc(status);
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional
    public RefundResponse approveRefund(Long adminId, Long refundId) {
        RefundRequest r = pendingRefund(refundId);

        Wallet w = lockWalletById(r.getWalletId());
        w.setBalance(w.getBalance() + r.getAmount());
        record(w, r.getBookingId(), Type.REFUND, r.getAmount(),
                "Hoàn tiền hủy đặt xe đơn #" + bookingCode(r.getBookingId()), Status.COMPLETED);

        r.resolve(RequestStatus.APPROVED, adminId);
        return toResponse(r);
    }

    @Transactional
    public RefundResponse rejectRefund(Long adminId, Long refundId) {
        RefundRequest r = pendingRefund(refundId);
        r.resolve(RequestStatus.REJECTED, adminId);
        return toResponse(r);
    }

    private RefundRequest pendingRefund(Long id) {
        RefundRequest r = refunds.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu hoàn tiền"));
        if (r.getStatus() != RequestStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Yêu cầu hoàn tiền này đã được xử lý");
        }
        return r;
    }

    /* ================= CHỦ XE ================= */

    /** View Earnings (Owner): doanh thu và số dư ví ròng, theo tháng hoặc quý */
    @Transactional
    public EarningsResponse earnings(Long ownerId, String period) {
        Period p = parsePeriod(period);
        Wallet w = lockWallet(ownerId);

        long trips = txs.countByWallet(w.getId(), Type.EARNING, Status.COMPLETED, p.from(), p.to());
        long gross = txs.sumAmountByWallet(w.getId(), Type.EARNING, Status.COMPLETED, p.from(), p.to());
        long commission = -txs.sumAmountByWallet(w.getId(), Type.COMMISSION, Status.COMPLETED, p.from(), p.to());
        return new EarningsResponse(p.label(), trips, gross, commission, gross - commission, w.getBalance());
    }

    /* ================= ADMIN: DUYỆT RÚT TIỀN ================= */

    /** Approve Withdrawal (Admin) */
    @Transactional(readOnly = true)
    public List<WithdrawalResponse> listWithdrawals(RequestStatus status) {
        List<WithdrawalRequest> list = (status == null)
                ? withdrawals.findAllByOrderByIdDesc() : withdrawals.findByStatusOrderByIdDesc(status);
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional
    public WithdrawalResponse approveWithdrawal(Long adminId, Long id) {
        WithdrawalRequest r = pendingWithdrawal(id);
        txs.findById(r.getTransactionId()).ifPresent(t -> t.setStatus(Status.COMPLETED));
        r.resolve(RequestStatus.APPROVED, adminId);
        return toResponse(r);
    }

    /** Từ chối: trả lại số tiền đã giữ về ví và ghi vào lịch sử giao dịch */
    @Transactional
    public WithdrawalResponse rejectWithdrawal(Long adminId, Long id) {
        WithdrawalRequest r = pendingWithdrawal(id);

        Wallet w = lockWalletById(r.getWalletId());
        w.setBalance(w.getBalance() + r.getAmount());
        txs.findById(r.getTransactionId()).ifPresent(t -> t.setStatus(Status.REJECTED));
        record(w, null, Type.WITHDRAW_REVERSAL, r.getAmount(),
                "Hoàn tiền yêu cầu rút #" + r.getId() + " bị từ chối", Status.COMPLETED);

        r.resolve(RequestStatus.REJECTED, adminId);
        return toResponse(r);
    }

    private WithdrawalRequest pendingWithdrawal(Long id) {
        WithdrawalRequest r = withdrawals.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu rút tiền"));
        if (r.getStatus() != RequestStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Yêu cầu rút tiền này đã được xử lý");
        }
        return r;
    }

    /* ================= ADMIN: BÁO CÁO ================= */

    /**
     * View Revenue & System Reports (Admin) - KPI ở mục 1.4: tổng doanh thu (GMV),
     * số giao dịch thành công, tỷ lệ hủy đặt xe, người dùng mới (+ doanh thu phí nền tảng).
     */
    @Transactional(readOnly = true)
    public RevenueReportResponse revenueReport(String period) {
        Period p = parsePeriod(period);
        LocalDateTime from = p.from();
        LocalDateTime to = p.to();

        long gmv = Math.abs(txs.sumAmount(Type.PAYMENT, Status.COMPLETED, from, to));
        long platformRevenue = Math.abs(txs.sumAmount(Type.COMMISSION, Status.COMPLETED, from, to));
        long successful = txs.countByType(Type.PAYMENT, Status.COMPLETED, from, to);

        long bookings = txs.countDistinctBookings(PAID, Status.COMPLETED, from, to);
        long cancelled = refunds.countByStatusAndRequestedAtGreaterThanEqualAndRequestedAtLessThan(
                RequestStatus.APPROVED, from, to);
        double cancellationRate = bookings == 0 ? 0.0 : Math.round(cancelled * 10000.0 / bookings) / 100.0;

        return new RevenueReportResponse(
                p.label(), gmv, platformRevenue, successful, cancellationRate,
                accounts.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(from, to),
                refunds.countByStatus(RequestStatus.PENDING),
                withdrawals.countByStatus(RequestStatus.PENDING));
    }
}
