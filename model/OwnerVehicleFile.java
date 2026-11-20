package com.thuexe.owner;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Ảnh xe / giấy tờ xe (cà vẹt, đăng kiểm) do chủ xe tải lên khi đăng ký (bảng "vehicle_files"). */
@Entity
@Table(name = "vehicle_files")
public class OwnerVehicleFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_id")
    private Long vehicleId;

    /** "photo" hoặc "document" */
    @Column(length = 20)
    private String kind;

    /** Đường dẫn tương đối trong thư mục uploads/vehicles, ví dụ photos/abc.jpg */
    @Column(name = "file_path", length = 255)
    private String filePath;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    public OwnerVehicleFile() {}

    public OwnerVehicleFile(Long vehicleId, String kind, String filePath) {
        this.vehicleId = vehicleId;
        this.kind = kind;
        this.filePath = filePath;
        this.uploadedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getVehicleId() { return vehicleId; }
    public String getKind() { return kind; }
    public String getFilePath() { return filePath; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
}
