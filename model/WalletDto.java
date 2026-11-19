package com.thuexe.dto;

import jakarta.validation.constraints.*;

import java.util.List;

public final class WalletDto {

    private WalletDto() {}

    /** Deposit Money */
    public record AmountRequest(
            @NotNull(message = "Vui lòng nhập số tiền giao dịch")
            @Positive(message = "Số tiền giao dịch phải lớn hơn 0")
            @Max(value = 10_000_000_000L, message = "Số tiền giao dịch quá lớn") Long amount) {}

    /** Withdraw Money / Withdraw Earnings: số tiền + thông tin ngân hàng (bank_info) */
    public record WithdrawRequest(
            @NotNull(message = "Vui lòng nhập số tiền giao dịch")
            @Positive(message = "Số tiền giao dịch phải lớn hơn 0")
            @Max(value = 10_000_000_000L, message = "Số tiền giao dịch quá lớn") Long amount,
            @NotBlank(message = "Vui lòng nhập thông tin tài khoản ngân hàng")
            @Size(max = 255, message = "Thông tin ngân hàng tối đa 255 ký tự") String bankInfo) {}

    /**
     * Make Payment: "Pay the deposit or full amount for a booking"
     *  DEPOSIT = trả tiền đặt cọc (depositAmount của đơn)
     *  FULL    = trả toàn bộ phần còn lại của đơn (totalAmount)
     */
    public record PaymentRequest(
            @NotNull(message = "Thiếu mã đơn đặt xe") Long bookingId,
            @NotNull(message = "Thiếu tổng tiền đơn")
            @Positive(message = "Tổng tiền đơn không hợp lệ") Long totalAmount,
            @PositiveOrZero(message = "Tiền đặt cọc không hợp lệ") Long depositAmount,
            @NotBlank(message = "Thiếu hình thức thanh toán")
            @Pattern(regexp = "(?i)FULL|DEPOSIT", message = "Hình thức thanh toán phải là FULL hoặc DEPOSIT")
            String paymentType,
            @NotNull(message = "Thiếu mã chủ xe") Long ownerId) {}

    /** Request Refund sau khi hủy đặt xe; cancellationFee do chức năng Cancel Booking tính */
    public record RefundBody(
            @NotNull(message = "Thiếu mã đơn đặt xe") Long bookingId,
            @PositiveOrZero(message = "Phí hủy không hợp lệ") Long cancellationFee,
            @Size(max = 500, message = "Lý do tối đa 500 ký tự") String reason) {}

    public record WalletResponse(Long walletId, long balance) {}

    public record TransactionResponse(Long id, String code, String type, String description, long amount,
                                      String status, String statusLabel, Long bookingId, String createdAt) {}

    public record WalletActionResponse(long balance, List<TransactionResponse> transactions, String message) {}

    public record RefundResponse(Long id, Long bookingId, String bookingCode, String username, long amount,
                                 long cancellationFee, String reason, String status, String statusLabel,
                                 Long approvedBy, String requestedAt, String processedAt) {}

    public record WithdrawalResponse(Long id, String username, long amount, String bankInfo, String status,
                                     String statusLabel, Long approvedBy, String requestedAt, String processedAt) {}

    /** View Earnings: báo cáo theo tháng (yyyy-MM) hoặc quý (yyyy-Qn) */
    public record EarningsResponse(String period, long completedTrips, long grossRevenue, long commission,
                                   long netRevenue, long walletBalance) {}

    /** View Revenue & System Reports: các KPI ở mục 1.4 */
    public record RevenueReportResponse(String period, long gmv, long platformRevenue, long successfulTransactions,
                                        double cancellationRate, long newUsers,
                                        long pendingRefunds, long pendingWithdrawals) {}
}
