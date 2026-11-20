package com.thuexe.owner;

import com.thuexe.entity.RequestStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Đơn đặt xe (bảng "bookings") — CHỈ gồm các cột mà chủ xe cần để duyệt đơn.
 * Module Đặt xe (Công Hào) tạo đơn; hai bên cần thống nhất dùng chung 1 bảng này.
 * Cố ý không đặt nullable=false để không làm hỏng phần ghi dữ liệu của bạn khác.
 */
@Entity
@Table(name = "bookings")
public class OwnerBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_id")
    private Long vehicleId;

    @Column(name = "renter_id")
    private Long renterId;                       // id tài khoản người thuê

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "total_amount")
    private Long totalAmount;

    @Column(name = "deposit_amount")
    private Long depositAmount;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private RequestStatus status;                // PENDING -> APPROVED / REJECTED

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public OwnerBooking() {}

    public Long getId() { return id; }
    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public Long getRenterId() { return renterId; }
    public void setRenterId(Long renterId) { this.renterId = renterId; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public Long getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Long totalAmount) { this.totalAmount = totalAmount; }
    public Long getDepositAmount() { return depositAmount; }
    public void setDepositAmount(Long depositAmount) { this.depositAmount = depositAmount; }
    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
