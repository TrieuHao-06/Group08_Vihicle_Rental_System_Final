package com.thuexe.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Bảng transactions (ERD): transaction_id, wallet_id, booking_id, amount, type, status, description, created_at.
 * amount có dấu: + cộng vào ví, - trừ khỏi ví. Mọi thay đổi số dư ví đều phải có một dòng ở đây.
 */
@Entity
@Table(name = "transactions", indexes = {
        @Index(name = "idx_tx_wallet", columnList = "wallet_id"),
        @Index(name = "idx_tx_booking", columnList = "booking_id")
})
public class WalletTransaction {

    public enum Type {
        TOP_UP,            // Nạp tiền vào ví
        WITHDRAW,          // Rút tiền (chờ Admin duyệt)
        WITHDRAW_REVERSAL, // Hoàn lại tiền khi yêu cầu rút bị từ chối
        PAYMENT,           // Thanh toán đơn đặt xe (tiền cọc hoặc toàn bộ)
        REFUND,            // Hoàn tiền / hoàn cọc (Wallet.refundDeposit)
        EARNING,           // Doanh thu của chủ xe
        COMMISSION         // Phí nền tảng trừ vào doanh thu của chủ xe
    }

    public enum Status {
        COMPLETED("Hoàn tất"), PENDING("Chờ duyệt"), REJECTED("Từ chối");

        private final String label;
        Status(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long id;

    @Column(name = "wallet_id", nullable = false)
    private Long walletId;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(nullable = false)
    private long amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Type type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Status status;

    @Column(nullable = false)
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected WalletTransaction() {}

    public WalletTransaction(Long walletId, Long bookingId, Type type, long amount, String description, Status status) {
        this.walletId = walletId;
        this.bookingId = bookingId;
        this.type = type;
        this.amount = amount;
        this.description = description;
        this.status = status;
    }

    /** Dạng #TX101 */
    public String getCode() { return String.format("#TX%03d", id); }

    public Long getId() { return id; }
    public Long getWalletId() { return walletId; }
    public Long getBookingId() { return bookingId; }
    public long getAmount() { return amount; }
    public Type getType() { return type; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getDescription() { return description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
