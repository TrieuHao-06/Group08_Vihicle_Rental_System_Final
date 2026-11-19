package com.thuexe.controller;

import com.thuexe.dto.WalletDto.*;
import com.thuexe.entity.RequestStatus;
import com.thuexe.service.AuthGuard;
import com.thuexe.service.WalletService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Phần tài chính của Admin: duyệt hoàn tiền, duyệt rút tiền, xem báo cáo. */
@RestController
@RequestMapping("/api/admin")
public class AdminFinanceController {

    private final WalletService walletService;
    private final AuthGuard guard;

    public AdminFinanceController(WalletService walletService, AuthGuard guard) {
        this.walletService = walletService;
        this.guard = guard;
    }

    private Long admin(HttpServletRequest request) {
        return guard.requireRole(request.getSession(false), AuthGuard.ADMIN);
    }

    /* ---- Approve Refunds ---- */

    @GetMapping("/refunds")
    public ResponseEntity<List<RefundResponse>> refunds(@RequestParam(required = false) RequestStatus status,
                                                        HttpServletRequest request) {
        admin(request);
        return ResponseEntity.ok(walletService.listRefunds(status));
    }

    @PostMapping("/refunds/{id}/approve")
    public ResponseEntity<RefundResponse> approveRefund(@PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(walletService.approveRefund(admin(request), id));
    }

    @PostMapping("/refunds/{id}/reject")
    public ResponseEntity<RefundResponse> rejectRefund(@PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(walletService.rejectRefund(admin(request), id));
    }

    /* ---- Approve Withdrawal ---- */

    @GetMapping("/withdrawals")
    public ResponseEntity<List<WithdrawalResponse>> withdrawals(@RequestParam(required = false) RequestStatus status,
                                                                HttpServletRequest request) {
        admin(request);
        return ResponseEntity.ok(walletService.listWithdrawals(status));
    }

    @PostMapping("/withdrawals/{id}/approve")
    public ResponseEntity<WithdrawalResponse> approveWithdrawal(@PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(walletService.approveWithdrawal(admin(request), id));
    }

    @PostMapping("/withdrawals/{id}/reject")
    public ResponseEntity<WithdrawalResponse> rejectWithdrawal(@PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(walletService.rejectWithdrawal(admin(request), id));
    }

    /* ---- View Revenue & System Reports ---- */

    @GetMapping("/reports/revenue")
    public ResponseEntity<RevenueReportResponse> revenue(@RequestParam(required = false) String period,
                                                         HttpServletRequest request) {
        admin(request);
        return ResponseEntity.ok(walletService.revenueReport(period));
    }
}
