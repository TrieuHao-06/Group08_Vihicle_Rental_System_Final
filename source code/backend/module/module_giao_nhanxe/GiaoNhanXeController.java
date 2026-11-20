package com.thuexe.handover;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.web.bind.annotation.*;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/handover")
public class GiaoNhanXeController {

    private final JdbcTemplate jdbc;

    public GiaoNhanXeController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        ensureTables();
    }

    public record HandoverRequest(
            String bookingCode,
            String transactionType,
            String role,
            Integer odometer,
            Integer fuelLevel,
            String imageUrl,
            String note
    ) {}

    public record IncidentRequest(
            String bookingCode,
            String transactionType,
            String role,
            String description,
            Long estimatedCost
    ) {}

    public record ReviewRequest(
            String bookingCode,
            Integer rating,
            String comment
    ) {}

    private void ensureTables() {
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS check_in_out_reports (
                    report_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    booking_code VARCHAR(30) NOT NULL,
                    transaction_type VARCHAR(20) NOT NULL,
                    role VARCHAR(20) NOT NULL,
                    odometer INT,
                    fuel_level INT,
                    image_url VARCHAR(500),
                    note TEXT,
                    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
                    matched BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at DATETIME NOT NULL
                )
                """);

        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS handover_incidents (
                    incident_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    booking_code VARCHAR(30) NOT NULL,
                    transaction_type VARCHAR(20) NOT NULL,
                    role VARCHAR(20) NOT NULL,
                    description TEXT NOT NULL,
                    estimated_cost BIGINT NOT NULL,
                    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
                    created_at DATETIME NOT NULL
                )
                """);

        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS reviews (
                    review_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    booking_code VARCHAR(30) NOT NULL,
                    rating INT NOT NULL,
                    comment TEXT,
                    created_at DATETIME NOT NULL
                )
                """);
    }

    @PostMapping("/reports")
    public ResponseEntity<Map<String, Object>> submitReport(@RequestBody HandoverRequest request) {
        validateReport(request);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    INSERT INTO check_in_out_reports
                    (booking_code, transaction_type, role, odometer, fuel_level, image_url, note, status, matched, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', FALSE, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, request.bookingCode().trim());
            ps.setString(2, request.transactionType().trim());
            ps.setString(3, request.role().trim());
            ps.setInt(4, request.odometer());
            ps.setInt(5, request.fuelLevel());
            ps.setString(6, request.imageUrl());
            ps.setString(7, request.note());
            ps.setObject(8, LocalDateTime.now());
            return ps;
        }, keyHolder);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "reportId", keyHolder.getKey().longValue(),
                "status", "PENDING",
                "message", "Đã ghi nhận biên bản giao nhận"
        ));
    }

    @GetMapping("/reports/{bookingCode}")
    public List<Map<String, Object>> getReports(@PathVariable String bookingCode) {
        return jdbc.queryForList("""
                SELECT report_id, booking_code, transaction_type, role, odometer, fuel_level,
                       image_url, note, status, matched, created_at
                FROM check_in_out_reports
                WHERE booking_code = ?
                ORDER BY created_at DESC
                """, bookingCode);
    }

    @PostMapping("/incidents")
    public ResponseEntity<Map<String, Object>> submitIncident(@RequestBody IncidentRequest request) {
        if (isBlank(request.bookingCode()) || isBlank(request.description())) {
            throw new IllegalArgumentException("Mã đơn và mô tả sự cố không được để trống");
        }
        if (request.estimatedCost() == null || request.estimatedCost() < 0) {
            throw new IllegalArgumentException("Chi phí đền bù không hợp lệ");
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    INSERT INTO handover_incidents
                    (booking_code, transaction_type, role, description, estimated_cost, status, created_at)
                    VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, request.bookingCode().trim());
            ps.setString(2, request.transactionType());
            ps.setString(3, request.role());
            ps.setString(4, request.description().trim());
            ps.setLong(5, request.estimatedCost());
            ps.setObject(6, LocalDateTime.now());
            return ps;
        }, keyHolder);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "incidentId", keyHolder.getKey().longValue(),
                "status", "PENDING",
                "message", "Đã gửi báo cáo sự cố"
        ));
    }

    @PostMapping("/reviews")
    public ResponseEntity<Map<String, Object>> submitReview(@RequestBody ReviewRequest request) {
        if (isBlank(request.bookingCode())) {
            throw new IllegalArgumentException("Mã đơn không được để trống");
        }
        if (request.rating() == null || request.rating() < 1 || request.rating() > 5) {
            throw new IllegalArgumentException("Điểm đánh giá phải từ 1 đến 5");
        }
        if (isBlank(request.comment())) {
            throw new IllegalArgumentException("Vui lòng nhập nhận xét");
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    INSERT INTO reviews (booking_code, rating, comment, created_at)
                    VALUES (?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, request.bookingCode().trim());
            ps.setInt(2, request.rating());
            ps.setString(3, request.comment().trim());
            ps.setObject(4, LocalDateTime.now());
            return ps;
        }, keyHolder);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "reviewId", keyHolder.getKey().longValue(),
                "message", "Đã gửi đánh giá"
        ));
    }

    private void validateReport(HandoverRequest request) {
        if (request == null
                || isBlank(request.bookingCode())
                || isBlank(request.transactionType())
                || isBlank(request.role())
                || isBlank(request.imageUrl())) {
            throw new IllegalArgumentException("Thiếu mã đơn, loại giao dịch, vai trò hoặc ảnh giao nhận");
        }
        if (!"Check-in".equals(request.transactionType()) && !"Check-out".equals(request.transactionType())) {
            throw new IllegalArgumentException("Loại giao dịch không hợp lệ");
        }
        if (!"Khách thuê".equals(request.role()) && !"Chủ xe".equals(request.role())) {
            throw new IllegalArgumentException("Vai trò không hợp lệ");
        }
        if (request.odometer() == null || request.odometer() < 0
                || request.fuelLevel() == null || request.fuelLevel() < 0 || request.fuelLevel() > 100) {
            throw new IllegalArgumentException("Odometer hoặc mức xăng/pin không hợp lệ");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleInvalidRequest(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }
}
