const express = require("express");
const pool = require("../booking&promotion/backend/config/db");

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);
const COMMISSION_RATE = Number(process.env.COMMISSION_RATE || 0.1);

async function notify(conn, userId, title, content) {
    await conn.query(
        "INSERT INTO notifications (user_id, title, content, is_read) VALUES (?, ?, ?, FALSE)",
        [userId, title, content]
    );
}

async function getValidAdminId(conn, requestedId) {
    const id = Number(requestedId);
    if (id) {
        const [rows] = await conn.query("SELECT user_id FROM admins WHERE user_id = ?", [id]);
        if (rows.length > 0) return rows[0].user_id;
    }
    const [def] = await conn.query("SELECT user_id FROM admins ORDER BY user_id ASC LIMIT 1");
    return def.length > 0 ? def[0].user_id : 6;
}

/* =========================================================================
   1. QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG (Chuyển từ AdminService.java)
   ========================================================================= */

// GET /api/admin/users - Danh sách toàn bộ tài khoản
router.get("/users", wrap(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT u.user_id, u.full_name, u.email, u.phone, u.status, u.kyc_status,
               u.identity_card_no, DATE_FORMAT(u.created_at, '%d/%m/%Y') AS created_at,
               a.admin_level, vo.bank_account, r.driving_license_no,
               COALESCE(w.balance, 0) AS balance
        FROM users u
        LEFT JOIN admins a ON u.user_id = a.user_id
        LEFT JOIN vehicle_owners vo ON u.user_id = vo.user_id
        LEFT JOIN renters r ON u.user_id = r.user_id
        LEFT JOIN wallets w ON u.user_id = w.user_id
        ORDER BY u.user_id ASC
    `);

    const result = rows.map(u => {
        let role = "Khách thuê";
        if (u.admin_level) role = "ADMIN (" + u.admin_level + ")";
        else if (u.bank_account) role = "Chủ xe";

        return {
            id: u.user_id,
            username: u.full_name,
            fullName: u.full_name,
            email: u.email,
            phone: u.phone,
            role,
            status: u.status,
            kycStatus: u.kyc_status,
            balance: Number(u.balance),
            createdAt: u.created_at
        };
    });

    res.json(result);
}));

// PATCH /api/admin/users/:id/status - Khóa / Mở khóa tài khoản
router.patch("/users/:id/status", wrap(async (req, res) => {
    const targetUserId = Number(req.params.id);
    const { status, reason, adminId } = req.body || {};
    const adminUid = Number(adminId) || 6;

    if (!status) {
        return res.status(400).json({ message: "Vui lòng chọn trạng thái mới cho tài khoản!" });
    }
    if (adminUid === targetUserId) {
        return res.status(400).json({ message: "Bạn không thể tự khóa tài khoản của chính mình!" });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Kiểm tra xem có phải Super Admin không
        const [admins] = await conn.query("SELECT admin_level FROM admins WHERE user_id = ?", [targetUserId]);
        if (admins.length > 0 && admins[0].admin_level === "super_admin") {
            await conn.rollback();
            return res.status(403).json({ message: "Không thể khóa tài khoản của Super Admin cấp cao nhất!" });
        }

        const [upd] = await conn.query("UPDATE users SET status = ? WHERE user_id = ?", [status, targetUserId]);
        if (upd.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Không tìm thấy người dùng!" });
        }

        const note = reason ? ` Lý do: ${reason}` : "";
        await notify(
            conn,
            targetUserId,
            "Cập nhật trạng thái tài khoản",
            `Tài khoản của bạn đã được chuyển sang trạng thái: [${status}].${note}`
        );

        await conn.commit();
        res.json({ ok: true, message: `Đã cập nhật trạng thái tài khoản thành [${status}] thành công!` });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

/* =========================================================================
   2. DUYỆT HỒ SƠ eKYC (Chuyển từ AdminService.java)
   ========================================================================= */

// GET /api/admin/kyc/pending - Danh sách hồ sơ eKYC chờ duyệt
router.get("/kyc/pending", wrap(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT d.document_id, d.user_id, d.type, d.document_no, d.image_url, d.status,
               u.full_name, u.email, u.phone
        FROM identity_documents d
        JOIN users u ON d.user_id = u.user_id
        WHERE d.status = 'pending'
        ORDER BY d.document_id DESC
    `);
    res.json(rows);
}));

// POST /api/admin/kyc/:id/approve - Duyệt hồ sơ eKYC
router.post("/kyc/:id/approve", wrap(async (req, res) => {
    const docId = Number(req.params.id);
    const conn = await pool.getConnection();
    try {
        const adminId = await getValidAdminId(conn, req.body.adminId);
        await conn.beginTransaction();

        const [docs] = await conn.query(
            "SELECT document_id, user_id, type, document_no FROM identity_documents WHERE document_id = ? AND status = 'pending'",
            [docId]
        );
        if (docs.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Không tìm thấy hồ sơ hoặc hồ sơ đã được xử lý!" });
        }
        const doc = docs[0];

        await conn.query(
            "UPDATE identity_documents SET status = 'verified', verified_by = ?, verified_at = NOW() WHERE document_id = ?",
            [adminId, docId]
        );

        // Cập nhật users.kyc_status và số CCCD nếu nộp CCCD
        if (doc.type === "CCCD") {
            await conn.query(
                "UPDATE users SET kyc_status = 'verified', identity_card_no = ? WHERE user_id = ?",
                [doc.document_no, doc.user_id]
            );
        } else {
            await conn.query("UPDATE users SET kyc_status = 'verified' WHERE user_id = ?", [doc.user_id]);
        }

        await notify(
            conn,
            doc.user_id,
            "Hồ sơ eKYC đã được phê duyệt",
            `Hồ sơ giấy tờ ${doc.type} (${doc.document_no}) của bạn đã được Admin phê duyệt thành công!`
        );

        await conn.commit();
        res.json({ ok: true, message: `Đã duyệt thành công hồ sơ ${doc.type} cho người dùng!` });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

// POST /api/admin/kyc/:id/reject - Từ chối hồ sơ eKYC
router.post("/kyc/:id/reject", wrap(async (req, res) => {
    const docId = Number(req.params.id);
    const { reason, adminId } = req.body || {};
    const adminUid = Number(adminId) || 6;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [docs] = await conn.query(
            "SELECT document_id, user_id, type FROM identity_documents WHERE document_id = ? AND status = 'pending'",
            [docId]
        );
        if (docs.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Không tìm thấy hồ sơ hoặc hồ sơ đã được xử lý!" });
        }
        const doc = docs[0];

        await conn.query(
            "UPDATE identity_documents SET status = 'rejected', verified_by = ? WHERE document_id = ?",
            [adminUid, docId]
        );
        await conn.query("UPDATE users SET kyc_status = 'rejected' WHERE user_id = ?", [doc.user_id]);

        const note = reason ? ` Lý do: ${reason}` : "";
        await notify(
            conn,
            doc.user_id,
            "Hồ sơ eKYC bị từ chối",
            `Hồ sơ giấy tờ ${doc.type} của bạn đã bị Admin từ chối.${note}. Vui lòng nộp lại giấy tờ rõ ràng hơn!`
        );

        await conn.commit();
        res.json({ ok: true, message: "Đã từ chối hồ sơ eKYC." });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

/* =========================================================================
   3. DUYỆT HOÀN CỌC & TRANH CHẤP (Chuyển từ AdminFinanceController.java)
   ========================================================================= */

// GET /api/admin/refunds - Danh sách các đơn chờ xử lý hoàn cọc
router.get("/refunds", wrap(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT b.booking_id, b.renter_id, u.full_name AS renter_name, u.phone AS renter_phone,
               b.vehicle_id, CONCAT(v.brand, ' ', v.model) AS vehicle_name, v.license_plate,
               b.deposit_amount, b.deposit_status, b.status,
               DATE_FORMAT(b.end_date, '%d/%m/%Y %H:%i') AS end_date,
               r.extra_fee, r.damage_notes
        FROM bookings b
        JOIN users u ON b.renter_id = u.user_id
        JOIN vehicles v ON b.vehicle_id = v.vehicle_id
        LEFT JOIN check_in_out_reports r ON b.booking_id = r.booking_id
        WHERE b.deposit_status IN ('held', 'reviewing')
        ORDER BY b.booking_id DESC
    `);
    res.json(rows);
}));

// POST /api/admin/refunds/:id/approve - Duyệt hoàn cọc về ví khách thuê
router.post("/refunds/:id/approve", wrap(async (req, res) => {
    const bookingId = Number(req.params.id);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [bookings] = await conn.query(
            "SELECT booking_id, renter_id, deposit_amount, deposit_status FROM bookings WHERE booking_id = ? FOR UPDATE",
            [bookingId]
        );
        if (bookings.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Không tìm thấy đơn đặt xe!" });
        }
        const b = bookings[0];
        if (b.deposit_status === "approved_refund") {
            await conn.rollback();
            return res.status(409).json({ message: "Đơn này đã được duyệt hoàn cọc rồi!" });
        }

        // 1. Cập nhật deposit_status
        await conn.query("UPDATE bookings SET deposit_status = 'approved_refund' WHERE booking_id = ?", [bookingId]);

        // 2. Đảm bảo ví tồn tại và cộng lại tiền cọc
        await conn.query("INSERT IGNORE INTO wallets (user_id, balance) VALUES (?, 0)", [b.renter_id]);
        await conn.query("UPDATE wallets SET balance = balance + ? WHERE user_id = ?", [b.deposit_amount, b.renter_id]);

        const [wallets] = await conn.query("SELECT wallet_id FROM wallets WHERE user_id = ?", [b.renter_id]);
        const walletId = wallets[0].wallet_id;

        // 3. Ghi lịch sử giao dịch
        await conn.query(`
            INSERT INTO transactions (wallet_id, booking_id, amount, type, status, description, created_at)
            VALUES (?, ?, ?, 'deposit_refund', 'completed', ?, NOW())
        `, [walletId, bookingId, b.deposit_amount, `Hoàn cọc tự động đơn #BK${String(bookingId).padStart(4, "0")} (Admin duyệt)`]);

        // 4. Thông báo cho khách
        await notify(
            conn,
            b.renter_id,
            "Hoàn tiền đặt cọc xe thành công",
            `Tiền cọc ${Number(b.deposit_amount).toLocaleString("vi-VN")}đ của đơn #BK${String(bookingId).padStart(4, "0")} đã được hoàn vào ví của bạn.`
        );

        await conn.commit();
        res.json({
            ok: true,
            message: `Đã duyệt hoàn cọc ${Number(b.deposit_amount).toLocaleString("vi-VN")}đ cho khách thành công!`
        });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

// POST /api/admin/refunds/:id/reject - Từ chối hoàn cọc (tịch thu cọc)
router.post("/refunds/:id/reject", wrap(async (req, res) => {
    const bookingId = Number(req.params.id);
    const { reason } = req.body || {};

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [bookings] = await conn.query(
            "SELECT booking_id, renter_id, deposit_amount FROM bookings WHERE booking_id = ?",
            [bookingId]
        );
        if (bookings.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Không tìm thấy đơn đặt xe!" });
        }
        const b = bookings[0];

        await conn.query("UPDATE bookings SET deposit_status = 'confiscated' WHERE booking_id = ?", [bookingId]);

        const note = reason ? ` Lý do: ${reason}` : "";
        await notify(
            conn,
            b.renter_id,
            "Tiền đặt cọc không được hoàn lại",
            `Tiền cọc đơn #BK${String(bookingId).padStart(4, "0")} không được hoàn trả do vi phạm điều khoản thuê xe.${note}`
        );

        await conn.commit();
        res.json({ ok: true, message: "Đã từ chối hoàn cọc cho đơn thuê này." });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

/* =========================================================================
   4. DUYỆT RÚT TIỀN (Chuyển từ AdminFinanceController.java)
   ========================================================================= */

// GET /api/admin/withdrawals - Danh sách yêu cầu rút tiền đang chờ duyệt
router.get("/withdrawals", wrap(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT wr.request_id, wr.wallet_id, wr.amount, wr.bank_info, wr.status,
               DATE_FORMAT(wr.requested_at, '%d/%m/%Y %H:%i') AS requested_at,
               u.user_id, u.full_name, u.phone, u.email
        FROM withdrawal_requests wr
        JOIN wallets w ON wr.wallet_id = w.wallet_id
        JOIN users u ON w.user_id = u.user_id
        WHERE wr.status = 'pending'
        ORDER BY wr.request_id DESC
    `);
    res.json(rows);
}));

// POST /api/admin/withdrawals/:id/approve - Duyệt lệnh rút tiền
router.post("/withdrawals/:id/approve", wrap(async (req, res) => {
    const reqId = Number(req.params.id);
    const conn = await pool.getConnection();
    try {
        const adminId = await getValidAdminId(conn, req.body.adminId);
        await conn.beginTransaction();

        const [reqs] = await conn.query(
            "SELECT wr.request_id, wr.wallet_id, wr.amount, wr.status, w.user_id FROM withdrawal_requests wr JOIN wallets w ON wr.wallet_id = w.wallet_id WHERE wr.request_id = ? AND wr.status = 'pending' FOR UPDATE",
            [reqId]
        );
        if (reqs.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Không tìm thấy yêu cầu rút tiền hoặc đã được xử lý!" });
        }
        const wReq = reqs[0];

        // Đổi trạng thái yêu cầu rút
        await conn.query(
            "UPDATE withdrawal_requests SET status = 'approved', approved_by = ?, processed_at = NOW() WHERE request_id = ?",
            [adminId, reqId]
        );

        // Ghi / Cập nhật transaction
        await conn.query(
            `INSERT INTO transactions (wallet_id, amount, type, status, description, created_at)
             VALUES (?, ?, 'withdraw', 'completed', ?, NOW())`,
            [wReq.wallet_id, -wReq.amount, `Rút tiền về tài khoản ngân hàng (Admin đã duyệt)`]
        );

        await notify(
            conn,
            wReq.user_id,
            "Rút tiền thành công",
            `Yêu cầu rút ${Number(wReq.amount).toLocaleString("vi-VN")}đ của bạn đã được Admin phê duyệt và chuyển khoản thành công.`
        );

        await conn.commit();
        res.json({ ok: true, message: `Đã duyệt yêu cầu rút ${Number(wReq.amount).toLocaleString("vi-VN")}đ thành công!` });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

// POST /api/admin/withdrawals/:id/reject - Từ chối lệnh rút tiền -> hoàn tiền lại vào ví
router.post("/withdrawals/:id/reject", wrap(async (req, res) => {
    const reqId = Number(req.params.id);
    const { reason, adminId } = req.body || {};

    const conn = await pool.getConnection();
    try {
        const adminUid = await getValidAdminId(conn, adminId);
        await conn.beginTransaction();

        const [reqs] = await conn.query(
            "SELECT wr.request_id, wr.wallet_id, wr.amount, wr.status, w.user_id FROM withdrawal_requests wr JOIN wallets w ON wr.wallet_id = w.wallet_id WHERE wr.request_id = ? AND wr.status = 'pending' FOR UPDATE",
            [reqId]
        );
        if (reqs.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Không tìm thấy yêu cầu rút tiền hoặc đã được xử lý!" });
        }
        const wReq = reqs[0];

        await conn.query(
            "UPDATE withdrawal_requests SET status = 'rejected', approved_by = ?, processed_at = NOW() WHERE request_id = ?",
            [adminUid, reqId]
        );

        // Hoàn lại tiền vào ví
        await conn.query("UPDATE wallets SET balance = balance + ? WHERE wallet_id = ?", [wReq.amount, wReq.wallet_id]);

        const note = reason ? ` Lý do: ${reason}` : "";
        await notify(
            conn,
            wReq.user_id,
            "Yêu cầu rút tiền bị từ chối",
            `Yêu cầu rút ${Number(wReq.amount).toLocaleString("vi-VN")}đ của bạn đã bị từ chối.${note}. Số tiền đã được hoàn lại vào ví của bạn.`
        );

        await conn.commit();
        res.json({ ok: true, message: "Đã từ chối yêu cầu rút tiền và hoàn tiền về ví cho người dùng." });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

/* =========================================================================
   5. BÁO CÁO DOANH THU HỆ THỐNG (Chuyển từ WalletService.revenueReport)
   ========================================================================= */

// GET /api/admin/reports/revenue - Báo cáo tổng thể hệ thống
router.get("/reports/revenue", wrap(async (req, res) => {
    // 1. Tổng chuyến hoàn thành & tiền thuê
    const [trips] = await pool.query(`
        SELECT COUNT(*) AS totalCompleted,
               COALESCE(SUM(CASE WHEN total_amount > deposit_amount THEN (total_amount - deposit_amount) ELSE total_amount END), 0) AS rentalTotal,
               COALESCE(SUM(total_amount), 0) AS grossRevenue
        FROM bookings WHERE status = 'completed'
    `);

    // 2. Tổng cọc đã hoàn
    const [refunds] = await pool.query(
        "SELECT COALESCE(SUM(deposit_amount), 0) AS totalRefunded FROM bookings WHERE deposit_status IN ('approved_refund', 'refunded')"
    );

    // 3. Tổng cọc đang giữ
    const [holding] = await pool.query(
        "SELECT COALESCE(SUM(deposit_amount), 0) AS totalHeld FROM bookings WHERE deposit_status = 'held'"
    );

    // 4. Tổng người dùng và xe
    const [counts] = await pool.query(`
        SELECT 
            (SELECT COUNT(*) FROM users) AS totalUsers,
            (SELECT COUNT(*) FROM vehicles WHERE approval_status = 'approved') AS activeVehicles,
            (SELECT COUNT(*) FROM vehicles WHERE approval_status = 'pending') AS pendingVehicles
    `);

    const rentalGross = Number(trips[0].rentalTotal);
    const platformFee = Math.round(rentalGross * COMMISSION_RATE);
    const ownerNet = rentalGross - platformFee;

    res.json({
        period: req.query.period || "Toàn thời gian",
        totalCompletedTrips: Number(trips[0].totalCompleted),
        grossRevenue: Number(trips[0].grossRevenue),
        rentalRevenue: rentalGross,
        commissionRate: COMMISSION_RATE,
        platformRevenue: platformFee,
        ownerNetRevenue: ownerNet,
        totalDepositRefunded: Number(refunds[0].totalRefunded),
        totalDepositHeld: Number(holding[0].totalHeld),
        totalUsers: Number(counts[0].totalUsers),
        activeVehicles: Number(counts[0].activeVehicles),
        pendingVehicles: Number(counts[0].pendingVehicles)
    });
}));

// GET /api/admin/reports/daily-revenue - Báo cáo doanh thu theo từng ngày & biểu đồ cột
router.get("/reports/daily-revenue", wrap(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT 
            DATE_FORMAT(b.end_date, '%Y-%m-%d') AS date_raw,
            DATE_FORMAT(b.end_date, '%d/%m/%Y') AS date_formatted,
            COUNT(b.booking_id) AS total_orders,
            COALESCE(SUM(b.total_amount), 0) AS gross_total,
            COALESCE(SUM(b.deposit_amount), 0) AS deposit_total,
            COALESCE(SUM(CASE WHEN b.total_amount > b.deposit_amount THEN (b.total_amount - b.deposit_amount) ELSE b.total_amount END), 0) AS rental_total,
            COALESCE(SUM(ROUND((CASE WHEN b.total_amount > b.deposit_amount THEN (b.total_amount - b.deposit_amount) ELSE b.total_amount END) * 0.9)), 0) AS net_revenue,
            COALESCE(SUM(ROUND((CASE WHEN b.total_amount > b.deposit_amount THEN (b.total_amount - b.deposit_amount) ELSE b.total_amount END) * 0.1)), 0) AS platform_revenue
        FROM bookings b
        WHERE b.status = 'completed'
        GROUP BY DATE_FORMAT(b.end_date, '%Y-%m-%d'), DATE_FORMAT(b.end_date, '%d/%m/%Y')
        ORDER BY date_raw DESC
        LIMIT 14
    `);
    res.json(rows);
}));

module.exports = router;
