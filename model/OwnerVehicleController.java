package com.thuexe.owner;

import com.thuexe.owner.OwnerDto.*;
import com.thuexe.service.AuthGuard;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * API tab "Xe của bạn" (Chủ xe). Cùng đường dẫn gốc /api/owner với API xem doanh thu
 * (/api/owner/earnings) của module Ví, nhưng khác phần đường dẫn phía sau nên không trùng.
 *
 *   GET    /api/owner/vehicles                    danh sách xe của tôi
 *   POST   /api/owner/vehicles                    đăng ký xe mới (multipart: ảnh + giấy tờ)
 *   PUT    /api/owner/vehicles/{id}               sửa thông tin xe
 *   PATCH  /api/owner/vehicles/{id}/availability  khóa / mở lịch
 *   GET    /api/owner/bookings                    yêu cầu đặt xe gửi tới xe của tôi
 *   POST   /api/owner/bookings/{id}/approve       chấp nhận đơn
 *   POST   /api/owner/bookings/{id}/reject        từ chối đơn
 */
@RestController
@RequestMapping("/api/owner")
public class OwnerVehicleController {

    private final OwnerService service;
    private final AuthGuard guard;

    public OwnerVehicleController(OwnerService service, AuthGuard guard) {
        this.service = service;
        this.guard = guard;
    }

    /** Lấy id chủ xe đang đăng nhập (chưa đăng nhập / không phải chủ xe thì AuthGuard tự báo lỗi) */
    private Long owner(HttpServletRequest request) {
        return guard.requireRole(request.getSession(false), AuthGuard.OWNER);
    }

    /* ---- Xe của tôi ---- */

    @GetMapping("/vehicles")
    public ResponseEntity<List<VehicleResponse>> vehicles(HttpServletRequest request) {
        return ResponseEntity.ok(service.listVehicles(owner(request)));
    }

    @PostMapping(value = "/vehicles", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VehicleResponse> register(@RequestParam Map<String, String> params,
                                                    @RequestParam(value = "images", required = false) List<MultipartFile> images,
                                                    @RequestParam(value = "docs", required = false) List<MultipartFile> docs,
                                                    HttpServletRequest request) {
        Long ownerId = owner(request);
        VehicleResponse created = service.registerVehicle(ownerId, VehicleForm.fromParams(params), images, docs);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/vehicles/{id}")
    public ResponseEntity<VehicleResponse> update(@PathVariable Long id, @RequestBody VehicleForm form,
                                                  HttpServletRequest request) {
        return ResponseEntity.ok(service.updateVehicle(owner(request), id, form));
    }

    @PatchMapping("/vehicles/{id}/availability")
    public ResponseEntity<VehicleResponse> toggle(@PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(service.toggleAvailability(owner(request), id));
    }

    /* ---- Yêu cầu đặt xe ---- */

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> bookings(HttpServletRequest request) {
        return ResponseEntity.ok(service.listBookings(owner(request)));
    }

    /** {id} nhận cả "BK0003" lẫn "3" */
    @PostMapping("/bookings/{id}/approve")
    public ResponseEntity<BookingResponse> approve(@PathVariable String id, HttpServletRequest request) {
        return ResponseEntity.ok(service.approveBooking(owner(request), id));
    }

    @PostMapping("/bookings/{id}/reject")
    public ResponseEntity<BookingResponse> reject(@PathVariable String id, HttpServletRequest request) {
        return ResponseEntity.ok(service.rejectBooking(owner(request), id));
    }
}
