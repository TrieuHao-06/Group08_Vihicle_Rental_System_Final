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

// GET /api/admin/kyc - Danh sách hồ sơ eKYC (toàn bộ, ưu tiên pending)
router.get("/kyc", wrap(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT d.document_id, d.user_id, d.type, d.document_no, d.image_url, d.status,
               DATE_FORMAT(d.verified_at, '%d/%m/%Y %H:%i') AS verified_at,
               u.full_name, u.email, u.phone
        FROM identity_documents d
        JOIN users u ON d.user_id = u.user_id
        ORDER BY (d.status = 'pending') DESC, d.document_id DESC
    `);
    res.json(rows);
}));

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

// GET /api/admin/incidents - Danh sách báo cáo sự cố & xử lý tranh chấp
router.get("/incidents", wrap(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT incident_id, booking_code, transaction_type, role, description, estimated_cost, status,
               DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') AS created_at
        FROM handover_incidents
        ORDER BY (status = 'PENDING') DESC, incident_id DESC
    `);
    res.json(rows);
}));

// POST /api/admin/incidents/:id/resolve - Phê duyệt giải quyết bồi thường hoặc bác bỏ
router.post("/incidents/:id/resolve", wrap(async (req, res) => {
    const incId = Number(req.params.id);
    const { action } = req.body || {};
    const newStatus = (action === "REJECTED") ? "REJECTED" : "RESOLVED";

    await pool.query("UPDATE handover_incidents SET status = ? WHERE incident_id = ?", [newStatus, incId]);
    res.json({
        ok: true,
        message: `Đã cập nhật trạng thái sự cố #${incId} thành: ${newStatus === 'RESOLVED' ? 'Đã giải quyết bồi thường' : 'Đã bác bỏ tranh chấp'}`
    });
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
        if (b.deposit_status === "approved_refund" || b.deposit_status === "refunded") {
            await conn.rollback();
            return res.status(409).json({ message: "Đơn này đã được hoàn cọc rồi, không thể hoàn lại lần hai!" });
        }

        // 1. Cập nhật deposit_status
        await conn.query("UPDATE bookings SET deposit_status = 'approved_refund' WHERE booking_id = ?", [bookingId]);

        // 2. Đảm bảo ví tồn tại và khóa ví trước khi cộng lại tiền cọc
        await conn.query("INSERT IGNORE INTO wallets (user_id, balance) VALUES (?, 0)", [b.renter_id]);
        const [wallets] = await conn.query("SELECT wallet_id, balance FROM wallets WHERE user_id = ? FOR UPDATE", [b.renter_id]);
        const walletId = wallets[0].wallet_id;

        await conn.query("UPDATE wallets SET balance = balance + ? WHERE wallet_id = ?", [b.deposit_amount, walletId]);

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

// GET /api/admin/withdrawals - Danh sách yêu cầu rút tiền
router.get("/withdrawals", wrap(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT wr.request_id, wr.wallet_id, wr.amount, wr.bank_info, wr.status,
               DATE_FORMAT(wr.requested_at, '%d/%m/%Y %H:%i') AS requested_at,
               DATE_FORMAT(wr.processed_at, '%d/%m/%Y %H:%i') AS processed_at,
               u.user_id, u.full_name, u.phone, u.email,
               COALESCE(w.balance, 0) AS current_balance
        FROM withdrawal_requests wr
        JOIN wallets w ON wr.wallet_id = w.wallet_id
        JOIN users u ON w.user_id = u.user_id
        ORDER BY (wr.status = 'pending') DESC, wr.request_id DESC
    `);
    res.json(rows);
}));

// POST /api/admin/withdrawals/:id/approve - Duyệt lệnh rút tiền (TRỪ TIỀN TRONG VÍ CỦA USER KHI DUYỆT)
router.post("/withdrawals/:id/approve", wrap(async (req, res) => {
    const reqId = Number(req.params.id);
    const conn = await pool.getConnection();
    try {
        const adminId = await getValidAdminId(conn, req.body.adminId);
        await conn.beginTransaction();

        const [reqs] = await conn.query(
            "SELECT wr.request_id, wr.wallet_id, wr.amount, wr.bank_info, wr.status, w.user_id, w.balance " +
            "FROM withdrawal_requests wr JOIN wallets w ON wr.wallet_id = w.wallet_id " +
            "WHERE wr.request_id = ? AND wr.status = 'pending' FOR UPDATE",
            [reqId]
        );
        if (reqs.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Không tìm thấy yêu cầu rút tiền hoặc đã được xử lý!" });
        }
        const wReq = reqs[0];

        // Kiểm tra số dư ví hiện tại của người dùng trước khi trừ
        if (Number(wReq.balance) < Number(wReq.amount)) {
            await conn.rollback();
            return res.status(400).json({
                message: `Số dư ví của người dùng hiện tại (${Number(wReq.balance).toLocaleString("vi-VN")}đ) không đủ để trừ số tiền rút ${Number(wReq.amount).toLocaleString("vi-VN")}đ!`
            });
        }

        // BÂY GIỜ MỚI CHÍNH THỨC TRỪ TIỀN VÍ CỦA USER
        await conn.query("UPDATE wallets SET balance = balance - ? WHERE wallet_id = ?", [wReq.amount, wReq.wallet_id]);

        // Đổi trạng thái yêu cầu rút
        await conn.query(
            "UPDATE withdrawal_requests SET status = 'approved', approved_by = ?, processed_at = NOW() WHERE request_id = ?",
            [adminId, reqId]
        );

        // Cập nhật transaction thành completed
        await conn.query(
            `UPDATE transactions SET status = 'completed', description = CONCAT(description, ' (Admin đã duyệt - Đã trừ ví)')
             WHERE wallet_id = ? AND type = 'withdraw' AND status = 'pending' AND amount = ?
             ORDER BY transaction_id DESC LIMIT 1`,
            [wReq.wallet_id, -wReq.amount]
        );

        await notify(
            conn,
            wReq.user_id,
            "Rút tiền thành công - Đã trừ tiền ví",
            `Yêu cầu rút ${Number(wReq.amount).toLocaleString("vi-VN")}đ về ${wReq.bank_info} của bạn đã được Admin phê duyệt. Số tiền đã được trừ vào tài khoản ví.`
        );

        await conn.commit();
        res.json({
            ok: true,
            message: `Đã duyệt yêu cầu rút ${Number(wReq.amount).toLocaleString("vi-VN")}đ thành công. Tiền trong ví người dùng đã bị trừ tương ứng!`
        });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

// POST /api/admin/withdrawals/:id/reject - Từ chối lệnh rút tiền (Giữ nguyên số dư vì lúc gửi chưa bị trừ)
router.post("/withdrawals/:id/reject", wrap(async (req, res) => {
    const reqId = Number(req.params.id);
    const { reason, adminId } = req.body || {};

    const conn = await pool.getConnection();
    try {
        const adminUid = await getValidAdminId(conn, adminId);
        await conn.beginTransaction();

        const [reqs] = await conn.query(
            "SELECT wr.request_id, wr.wallet_id, wr.amount, wr.bank_info, wr.status, w.user_id FROM withdrawal_requests wr JOIN wallets w ON wr.wallet_id = w.wallet_id WHERE wr.request_id = ? AND wr.status = 'pending' FOR UPDATE",
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

        // Đánh dấu transaction là failed
        await conn.query(
            `UPDATE transactions SET status = 'failed', description = CONCAT(description, ' (Admin từ chối)')
             WHERE wallet_id = ? AND type = 'withdraw' AND status = 'pending' AND amount = ?
             ORDER BY transaction_id DESC LIMIT 1`,
            [wReq.wallet_id, -wReq.amount]
        );

        const note = reason ? ` Lý do: ${reason}` : "";
        await notify(
            conn,
            wReq.user_id,
            "Yêu cầu rút tiền bị từ chối",
            `Yêu cầu rút ${Number(wReq.amount).toLocaleString("vi-VN")}đ về ${wReq.bank_info} của bạn đã bị từ chối.${note}. Số dư ví của bạn được giữ nguyên không đổi.`
        );

        await conn.commit();
        res.json({ ok: true, message: "Đã từ chối yêu cầu rút tiền. Số dư ví người dùng được giữ nguyên." });
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
