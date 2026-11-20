package com.thuexe.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Bảng refund_requests: yêu cầu hoàn tiền sau khi hủy đặt xe (Request Refund), Admin duyệt (Approve Refunds). */
@Entity
@Table(name = "refund_requests", indexes = @Index(name = "idx_refund_booking", columnList = "booking_id"))
public class RefundRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "refund_id")
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "wallet_id", nullable = false)
    private Long walletId;

    /** Số tiền hoàn về ví = số đã thanh toán - phí hủy */
    @Column(nullable = false)
    private long amount;

    @Column(name = "cancellation_fee", nullable = false)
    private long cancellationFee;

    @Column(length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RequestStatus status = RequestStatus.PENDING;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    protected RefundRequest() {}

    public RefundRequest(Long bookingId, Long walletId, long amount, long cancellationFee, String reason) {
        this.bookingId = bookingId;
        this.walletId = walletId;
        this.amount = amount;
        this.cancellationFee = cancellationFee;
        this.reason = reason;
    }

    /** Ghi lại admin nào xử lý và thời điểm xử lý (4.13.3) */
    public void resolve(RequestStatus status, Long adminId) {
        this.status = status;
        this.approvedBy = adminId;
        this.processedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getBookingId() { return bookingId; }
    public Long getWalletId() { return walletId; }
    public long getAmount() { return amount; }
    public long getCancellationFee() { return cancellationFee; }
    public String getReason() { return reason; }
    public RequestStatus getStatus() { return status; }
    public Long getApprovedBy() { return approvedBy; }
    public LocalDateTime getRequestedAt() { return requestedAt; }
    public LocalDateTime getProcessedAt() { return processedAt; }
}
