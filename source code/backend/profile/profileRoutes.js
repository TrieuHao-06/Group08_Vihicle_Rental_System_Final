const express = require("express");
const pool = require("../booking&promotion/backend/config/db");

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

/* =========================================================================
   1. QUẢN LÝ HỒ SƠ CÁ NHÂN (Chuyển từ ProfileService.java)
   ========================================================================= */

// GET /api/user/profile - Xem hồ sơ chi tiết người dùng
router.get("/profile", wrap(async (req, res) => {
    const userId = Number(req.query.user_id || req.get("x-user-id"));
    if (!userId) {
        return res.status(400).json({ message: "Thiếu user_id!" });
    }

    const [rows] = await pool.query(`
        SELECT u.user_id, u.full_name, u.email, u.phone, u.identity_card_no,
               u.kyc_status, u.status, DATE_FORMAT(u.created_at, '%d/%m/%Y') AS created_at,
               COALESCE(w.balance, 0) AS balance,
               r.driving_license_no,
               vo.bank_account,
               a.admin_level
        FROM users u
        LEFT JOIN wallets w ON u.user_id = w.user_id
        LEFT JOIN renters r ON u.user_id = r.user_id
        LEFT JOIN vehicle_owners vo ON u.user_id = vo.user_id
        LEFT JOIN admins a ON u.user_id = a.user_id
        WHERE u.user_id = ?
    `, [userId]);

    if (rows.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }

    const u = rows[0];
    let role = "Khách thuê";
    if (u.admin_level) role = "ADMIN (" + u.admin_level + ")";
    else if (u.bank_account) role = "Chủ xe";

    res.json({
        user_id: u.user_id,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        identity_card_no: u.identity_card_no || "",
        kyc_status: u.kyc_status,
        status: u.status,
        created_at: u.created_at,
        balance: Number(u.balance),
        role,
        driving_license_no: u.driving_license_no || "",
        bank_account: u.bank_account || ""
    });
}));

// PUT /api/user/profile - Cập nhật thông tin cơ bản
router.put("/profile", wrap(async (req, res) => {
    const userId = Number(req.body.user_id || req.get("x-user-id"));
    const { full_name, phone, identity_card_no, driving_license_no, bank_account } = req.body || {};

    if (!userId) {
        return res.status(400).json({ message: "Thiếu user_id!" });
    }
    if (!full_name || !phone) {
        return res.status(400).json({ message: "Họ tên và số điện thoại không được để trống!" });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Kiểm tra trùng SĐT với người khác
        const [dup] = await conn.query(
            "SELECT user_id FROM users WHERE phone = ? AND user_id <> ? LIMIT 1",
            [phone.trim(), userId]
        );
        if (dup.length > 0) {
            await conn.rollback();
            return res.status(409).json({ message: "Số điện thoại này đã được sử dụng bởi tài khoản khác!" });
        }

        await conn.query(
            "UPDATE users SET full_name = ?, phone = ?, identity_card_no = ? WHERE user_id = ?",
            [full_name.trim(), phone.trim(), identity_card_no ? identity_card_no.trim() : null, userId]
        );

        if (driving_license_no) {
            await conn.query("INSERT IGNORE INTO renters (user_id) VALUES (?)", [userId]);
            await conn.query("UPDATE renters SET driving_license_no = ? WHERE user_id = ?", [driving_license_no.trim(), userId]);
        }
        if (bank_account) {
            await conn.query("INSERT IGNORE INTO vehicle_owners (user_id) VALUES (?)", [userId]);
            await conn.query("UPDATE vehicle_owners SET bank_account = ? WHERE user_id = ?", [bank_account.trim(), userId]);
        }

        await conn.commit();
        res.json({ ok: true, message: "Cập nhật hồ sơ cá nhân thành công!" });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

/* =========================================================================
   2. NỘP HỒ SƠ GIẤY TỜ eKYC (Chuyển từ ProfileService.java)
   ========================================================================= */

// POST /api/user/kyc - Nộp giấy tờ tùy thân CCCD / GPLX
router.post("/kyc", wrap(async (req, res) => {
    const userId = Number(req.body.user_id || req.get("x-user-id"));
    const { type, document_no, image_url, images, full_name, phone } = req.body || {};

    if (!userId) {
        return res.status(400).json({ message: "Vui lòng đăng nhập để nộp eKYC!" });
    }
    if (!type || !document_no) {
        return res.status(400).json({ message: "Vui lòng nhập loại giấy tờ (CCCD/GPLX) và số giấy tờ!" });
    }

    const cleanType = String(type).trim().toUpperCase();
    const cleanDocNo = String(document_no).trim();

    let cleanImg = "";
    if (Array.isArray(images) && images.length > 0) {
        cleanImg = images.filter(Boolean).map(s => String(s).trim()).join(";");
    } else if (image_url) {
        cleanImg = String(image_url).trim();
    } else {
        cleanImg = `uploads/kyc/${cleanType.toLowerCase()}_user${userId}.jpg`;
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [ins] = await conn.query(
            `INSERT INTO identity_documents (user_id, type, document_no, image_url, status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [userId, cleanType, cleanDocNo, cleanImg]
        );

        // Đánh dấu users.kyc_status = 'pending' và cập nhật thông tin
        await conn.query(
            `UPDATE users SET kyc_status = 'pending',
                             identity_card_no = ?,
                             full_name = COALESCE(?, full_name),
                             phone = COALESCE(?, phone)
             WHERE user_id = ?`,
            [cleanDocNo, full_name ? String(full_name).trim() : null, phone ? String(phone).trim() : null, userId]
        );

        // Tự động phát sinh thông báo cho người dùng
        const numPhotos = cleanImg ? cleanImg.split(";").length : 1;
        await conn.query(
            `INSERT INTO notifications (user_id, title, content, is_read)
             VALUES (?, 'Hồ sơ eKYC đã được tiếp nhận', ?, FALSE)`,
            [userId, `Hồ sơ ${cleanType} (số ${cleanDocNo}) đính kèm ${numPhotos} ảnh minh chứng của bạn đã được gửi. Quản trị viên sẽ phê duyệt trong 24h.`]
        );

        await conn.commit();
        res.status(201).json({
            ok: true,
            document_id: ins.insertId,
            message: `Hồ sơ ${cleanType} của bạn đã được gửi lên hệ thống và đang chờ Admin thẩm định!`
        });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

// GET /api/user/kyc - Xem lịch sử giấy tờ đã nộp
router.get("/kyc", wrap(async (req, res) => {
    const userId = Number(req.query.user_id || req.get("x-user-id"));
    if (!userId) return res.json([]);

    const [rows] = await pool.query(
        `SELECT document_id, type, document_no, image_url, status,
                DATE_FORMAT(verified_at, '%d/%m/%Y %H:%i') AS verified_at
         FROM identity_documents
         WHERE user_id = ?
         ORDER BY document_id DESC`,
        [userId]
    );
    res.json(rows);
}));

/* =========================================================================
   3. QUẢN LÝ THÔNG BÁO (Notifications)
   ========================================================================= */

// GET /api/user/notifications - Lấy danh sách thông báo
router.get("/notifications", wrap(async (req, res) => {
    const userId = Number(req.query.user_id || req.get("x-user-id"));
    if (!userId) return res.json([]);

    const [rows] = await pool.query(
        `SELECT notification_id, title, content, is_read,
                DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') AS created_at
         FROM notifications
         WHERE user_id = ?
         ORDER BY notification_id DESC`,
        [userId]
    );
    res.json(rows);
}));

// PATCH /api/user/notifications/:id/read - Đánh dấu thông báo đã đọc
router.patch("/notifications/:id/read", wrap(async (req, res) => {
    const notiId = Number(req.params.id);
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE notification_id = ?", [notiId]);
    res.json({ ok: true });
}));

module.exports = router;
