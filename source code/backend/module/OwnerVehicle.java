package com.thuexe.owner;

import com.thuexe.entity.RequestStatus;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Xe ký gửi của chủ xe (bảng "vehicles").
 * Cố ý KHÔNG đặt nullable=false ở cột nào: nếu bạn khác cũng ghi vào bảng này thì không bị lỗi thiếu cột.
 * Việc kiểm tra dữ liệu bắt buộc làm trong OwnerService.
 */
@Entity
@Table(name = "vehicles")
public class OwnerVehicle {

    /** Trạng thái cho thuê: trống / đang có khách / chủ xe khóa lịch */
    public enum Availability { AVAILABLE, RENTED, LOCKED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_id")
    private Long ownerId;                       // id tài khoản chủ xe

    @Column(length = 50)
    private String brand;

    @Column(length = 100)
    private String model;

    @Column(name = "license_plate", length = 20)
    private String plate;

    /** Biển số đã chuẩn hóa (in hoa, bỏ khoảng trắng . -) để chặn trùng biển số */
    @Column(name = "plate_key", length = 20, unique = true)
    private String plateKey;

    @Column(name = "vehicle_type", length = 50)
    private String type;

    @Column(name = "engine_cc", length = 30)
    private String cc;

    @Column(name = "fuel_type", length = 30)
    private String fuel;

    @Column(name = "price_per_hour")
    private Long hourPrice;

    @Column(name = "price_per_day")
    private Long dayPrice;

    @Column(name = "deposit_amount")
    private Long deposit;

    @Column(name = "available_from")
    private LocalDate availFrom;

    @Column(name = "available_to")
    private LocalDate availTo;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 30)
    private RequestStatus approvalStatus;       // PENDING / APPROVED / REJECTED (Admin duyệt)

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status", length = 30)
    private Availability availability;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public OwnerVehicle() {}

    public Long getId() { return id; }
    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getPlate() { return plate; }
    public void setPlate(String plate) { this.plate = plate; }
    public String getPlateKey() { return plateKey; }
    public void setPlateKey(String plateKey) { this.plateKey = plateKey; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getCc() { return cc; }
    public void setCc(String cc) { this.cc = cc; }
    public String getFuel() { return fuel; }
    public void setFuel(String fuel) { this.fuel = fuel; }
    public Long getHourPrice() { return hourPrice; }
    public void setHourPrice(Long hourPrice) { this.hourPrice = hourPrice; }
    public Long getDayPrice() { return dayPrice; }
    public void setDayPrice(Long dayPrice) { this.dayPrice = dayPrice; }
    public Long getDeposit() { return deposit; }
    public void setDeposit(Long deposit) { this.deposit = deposit; }
    public LocalDate getAvailFrom() { return availFrom; }
    public void setAvailFrom(LocalDate availFrom) { this.availFrom = availFrom; }
    public LocalDate getAvailTo() { return availTo; }
    public void setAvailTo(LocalDate availTo) { this.availTo = availTo; }
    public RequestStatus getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(RequestStatus approvalStatus) { this.approvalStatus = approvalStatus; }
    public Availability getAvailability() { return availability; }
    public void setAvailability(Availability availability) { this.availability = availability; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
