const express = require("express");
const pool = require("../booking&promotion/backend/config/db");

const router = express.Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(err => {
    console.error("Booking route error:", err);
    if (!res.headersSent) {
        res.status(500).json({ ok: false, message: err.message, error: err.message });
    }
});
const pad = (n, len) => String(n).padStart(len, "0");

async function notify(conn, userId, title, content) {
    await conn.query(
        "INSERT INTO notifications (user_id, title, content, is_read) VALUES (?, ?, ?, FALSE)",
        [userId, title, content]
    );
}

/* =========================================================================
   1. ĐẶT XE & THANH TOÁN (Chuyển từ WalletService.pay & Use Case Booking)
   ========================================================================= */

// POST /api/bookings - Tạo đơn đặt xe mới
router.post("/bookings", wrap(async (req, res) => {
    const {
        renter_id,
        vehicle_id,
        rental_type,
        delivery_method,
        delivery_address,
        delivery_fee,
        start_date,
        end_date,
        voucher_code,
        total_amount,
        deposit_amount
    } = req.body || {};

    const renterId = Number(renter_id);
    const vehicleId = Number(vehicle_id);
    if (!renterId || !vehicleId || !start_date || !end_date) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin đặt xe (người thuê, xe, thời gian)!" });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Kiểm tra xe
        const [vehicles] = await conn.query(
            "SELECT vehicle_id, owner_id, brand, model, price_per_day, price_per_hour, deposit_amount, approval_status, availability_status FROM vehicles WHERE vehicle_id = ? FOR UPDATE",
            [vehicleId]
        );
        if (vehicles.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Xe không tồn tại trong hệ thống!" });
        }
        const v = vehicles[0];
        if (v.approval_status !== "approved" || v.availability_status === "locked") {
            await conn.rollback();
            return res.status(409).json({ message: "Xe này hiện đang khóa lịch hoặc chưa được duyệt!" });
        }

        // 2. Kiểm tra trùng lịch đặt xe: start_date < existing.end_date AND end_date > existing.start_date
        const [conflicts] = await conn.query(
            `SELECT booking_id FROM bookings
             WHERE vehicle_id = ? AND status IN ('pending', 'approved', 'active')
               AND start_date < ? AND end_date > ?
             LIMIT 1`,
            [vehicleId, end_date, start_date]
        );
        if (conflicts.length > 0) {
            await conn.rollback();
            return res.status(409).json({ message: `Xe đã có lịch thuê trong khung giờ này (Đơn #BK${pad(conflicts[0].booking_id, 4)})!` });
        }

        // 3. Xử lý Voucher nếu có
        let voucherId = null;
        let discountPct = 0;
        if (voucher_code && String(voucher_code).trim()) {
            const vCode = String(voucher_code).trim().toUpperCase();
            const [vouchers] = await conn.query(
                "SELECT voucher_id, discount_percent, usage_limit, status, end_date FROM vouchers WHERE code = ? AND status = 'active' AND end_date > NOW() LIMIT 1",
                [vCode]
            );
            if (vouchers.length > 0) {
                voucherId = vouchers[0].voucher_id;
                discountPct = vouchers[0].discount_percent;
                await conn.query("UPDATE vouchers SET usage_limit = GREATEST(0, usage_limit - 1) WHERE voucher_id = ?", [voucherId]);
            }
        }

        const rentTotal = Number(total_amount) || 0;
        const depAmount = deposit_amount != null ? Number(deposit_amount) : (v.deposit_amount || 300000);
        const grandTotal = rentTotal;

        // 4. Kiểm tra ví của người thuê
        await conn.query("INSERT IGNORE INTO wallets (user_id, balance) VALUES (?, 0)", [renterId]);
        const [wallets] = await conn.query("SELECT wallet_id, balance FROM wallets WHERE user_id = ? FOR UPDATE", [renterId]);
        const wallet = wallets[0];

        if (Number(wallet.balance) < grandTotal) {
            await conn.rollback();
            return res.status(400).json({
                message: `Số dư trong tài khoản cá nhân (${Number(wallet.balance).toLocaleString("vi-VN")}đ) không đủ để thanh toán ${grandTotal.toLocaleString("vi-VN")}đ!`
            });
        }

        // 5. Trừ tiền ví của người thuê
        await conn.query("UPDATE wallets SET balance = balance - ? WHERE wallet_id = ?", [grandTotal, wallet.wallet_id]);

        // Đảm bảo người dùng tồn tại trong bảng renters (thỏa mãn foreign key fk_bookings_renter)
        await conn.query("INSERT IGNORE INTO renters (user_id) VALUES (?)", [renterId]);

        // 6. Tạo bản ghi đơn đặt xe trong bảng bookings
        const [bookRes] = await conn.query(`
            INSERT INTO bookings (
                renter_id, vehicle_id, rental_type, delivery_method, delivery_address, delivery_fee,
                start_date, end_date, total_amount, deposit_amount, deposit_status, status, voucher_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'held', 'pending', ?)
        `, [
            renterId,
            vehicleId,
            rental_type || "daily",
            delivery_method || "self_pickup",
            delivery_address || "Quận 1, TP.HCM",
            Number(delivery_fee) || 0,
            start_date,
            end_date,
            rentTotal,
            depAmount,
            voucherId
        ]);

        const newBookingId = bookRes.insertId;
        const bookingCode = "BK" + pad(newBookingId, 4);

        // 7. Ghi lịch sử giao dịch vào bảng transactions
        await conn.query(`
            INSERT INTO transactions (wallet_id, booking_id, amount, type, status, description, created_at)
            VALUES (?, ?, ?, 'rental_payment', 'completed', ?, NOW())
        `, [
            wallet.wallet_id,
            newBookingId,
            -grandTotal,
            `Thanh toán thuê xe ${v.brand} ${v.model} (Đơn #${bookingCode})`
        ]);

        // 8. Tạo thông báo cho cả Khách thuê & Chủ xe
        await notify(
            conn,
            renterId,
            `Đặt xe #${bookingCode} thành công`,
            `Đơn đặt xe ${v.brand} ${v.model} (#${bookingCode}) của bạn đã được ghi nhận. Tổng thanh toán: ${grandTotal.toLocaleString("vi-VN")}đ. Chúc bạn có chuyến đi an toàn!`
        );

        await notify(
            conn,
            v.owner_id,
            `Yêu cầu đặt xe mới #${bookingCode}`,
            `Xe ${v.brand} ${v.model} của bạn vừa nhận được đơn đặt xe #${bookingCode}. Vui lòng vào mục 'Xe của bạn' để xác nhận.`
        );

        await conn.commit();
        res.status(201).json({
            ok: true,
            booking_id: newBookingId,
            booking_code: bookingCode,
            total_amount: grandTotal,
            deposit_amount: depAmount,
            message: `Đặt xe thành công! Đơn #${bookingCode} đã được lưu vào hệ thống CSDL.`
        });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

// GET /api/bookings/my-bookings - Lấy danh sách các xe đã đặt của khách thuê
router.get("/bookings/my-bookings", wrap(async (req, res) => {
    const renterId = Number(req.query.renter_id || req.get("x-user-id"));
    if (!renterId) return res.json([]);

    const [rows] = await pool.query(`
        SELECT b.booking_id AS id,
               CONCAT('BK', LPAD(b.booking_id, 4, '0')) AS orderCode,
               b.vehicle_id AS bikeId,
               CONCAT(v.brand, ' ', v.model) AS bikeName,
               v.brand, v.license_plate,
               b.rental_type,
               b.delivery_method,
               b.delivery_address,
               b.total_amount AS totalPrice,
               b.deposit_amount AS deposit,
               b.deposit_status,
               b.status,
               DATE_FORMAT(b.start_date, '%d/%m/%Y %H:%i') AS pickupTime,
               DATE_FORMAT(b.end_date,   '%d/%m/%Y %H:%i') AS returnTime,
               DATE_FORMAT(b.start_date, '%Y-%m-%dT%H:%i') AS startRaw,
               DATE_FORMAT(b.end_date,   '%Y-%m-%dT%H:%i') AS endRaw
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.vehicle_id
        WHERE b.renter_id = ?
        ORDER BY b.booking_id DESC
    `, [renterId]);

    const result = rows.map(r => {
        let statusText = "Chờ duyệt";
        if (r.status === "approved") statusText = "Đã duyệt";
        else if (r.status === "active") statusText = "Đang thuê";
        else if (r.status === "completed") statusText = "Đã trả xe";
        else if (r.status === "rejected") statusText = "Bị từ chối";

        const pkgText = r.rental_type === "daily" ? "Thuê theo ngày" : "Thuê theo giờ";

        return {
            id: r.orderCode,
            booking_id: r.id,
            bikeId: r.bikeId,
            bikeName: r.bikeName,
            brand: r.brand,
            license_plate: r.license_plate,
            area: r.delivery_address || "Quận 1",
            packageText: pkgText,
            pickupTime: r.pickupTime,
            returnTime: r.returnTime,
            totalPrice: Number(r.totalPrice),
            deposit: Number(r.deposit),
            status: statusText,
            deposit_status: r.deposit_status
        };
    });

    res.json(result);
}));

/* =========================================================================
   2. QUẢN LÝ VOUCHER KHUYẾN MÃI (Chuyển từ InsertVouchers.java)
   ========================================================================= */

// GET /api/vouchers - Danh sách toàn bộ voucher
router.get("/vouchers", wrap(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT voucher_id, code, discount_percent, usage_limit, status,
               DATE_FORMAT(end_date, '%d/%m/%Y') AS exp,
               DATE_FORMAT(end_date, '%Y-%m-%d') AS expRaw
        FROM vouchers
        ORDER BY voucher_id DESC
    `);

    const result = rows.map(v => {
        let type = "active";
        let statusText = "Đang hoạt động";
        if (v.status === "expired" || new Date(v.expRaw) < new Date()) {
            type = "expired";
            statusText = "Hết hạn";
        } else if (v.usage_limit <= 50) {
            type = "warn";
            statusText = "Gần hết";
        }

        return {
            voucher_id: v.voucher_id,
            code: v.code,
            uses: v.usage_limit,
            discount: `Giảm ${v.discount_percent}%`,
            discount_percent: v.discount_percent,
            status: statusText,
            type,
            exp: v.exp
        };
    });

    res.json(result);
}));

// POST /api/vouchers - Tạo mới voucher (Admin)
router.post("/vouchers", wrap(async (req, res) => {
    const { code, discount_percent, usage_limit, end_date } = req.body || {};

    if (!code || !discount_percent) {
        return res.status(400).json({ message: "Vui lòng nhập mã voucher và phần trăm giảm giá!" });
    }
    const cleanCode = String(code).trim().toUpperCase();
    const pct = Number(discount_percent);
    const limit = Number(usage_limit) || 100;

    // Chuẩn hóa ngày hết hạn: Hỗ trợ linh hoạt cả YYYY-MM-DD và DD/MM/YYYY
    let expDate = "2027-12-31 23:59:59";
    if (end_date) {
        const rawDate = String(end_date).trim();
        if (rawDate.includes("/")) {
            const parts = rawDate.split("/");
            if (parts.length === 3) {
                // DD/MM/YYYY -> YYYY-MM-DD
                expDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")} 23:59:59`;
            }
        } else if (rawDate.length === 10) {
            expDate = `${rawDate} 23:59:59`;
        } else {
            expDate = rawDate;
        }
    }

    const [existing] = await pool.query("SELECT voucher_id FROM vouchers WHERE code = ?", [cleanCode]);
    if (existing.length > 0) {
        return res.status(409).json({ message: `Mã voucher "${cleanCode}" đã tồn tại trong CSDL!` });
    }

    const [ins] = await pool.query(
        "INSERT INTO vouchers (code, discount_percent, end_date, usage_limit, status) VALUES (?, ?, ?, ?, 'active')",
        [cleanCode, pct, expDate, limit]
    );

    res.status(201).json({
        ok: true,
        voucher_id: ins.insertId,
        message: `Đã tạo thành công voucher "${cleanCode}" (Giảm ${pct}%)!`
    });
}));

// DELETE /api/vouchers/:id - Xóa hoặc vô hiệu hóa voucher
router.delete("/vouchers/:id", wrap(async (req, res) => {
    const vId = Number(req.params.id);
    await pool.query("DELETE FROM vouchers WHERE voucher_id = ?", [vId]);
    res.json({ ok: true, message: "Đã xóa voucher khỏi CSDL!" });
}));

// POST /api/vouchers/apply - Kiểm tra và áp dụng mã voucher
router.post("/vouchers/apply", wrap(async (req, res) => {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ message: "Vui lòng nhập mã voucher!" });

    const cleanCode = String(code).trim().toUpperCase();
    const [rows] = await pool.query(
        "SELECT voucher_id, code, discount_percent, usage_limit, status, end_date FROM vouchers WHERE code = ? LIMIT 1",
        [cleanCode]
    );

    if (rows.length === 0) {
        return res.status(404).json({ message: `Mã giảm giá "${cleanCode}" không tồn tại!` });
    }
    const v = rows[0];
    if (v.status !== "active" || new Date(v.end_date) < new Date()) {
        return res.status(400).json({ message: `Mã giảm giá "${cleanCode}" đã hết hạn sử dụng!` });
    }
    if (v.usage_limit <= 0) {
        return res.status(400).json({ message: `Mã giảm giá "${cleanCode}" đã hết lượt sử dụng!` });
    }

    res.json({
        ok: true,
        voucher_id: v.voucher_id,
        code: v.code,
        discount_percent: v.discount_percent,
        message: `Áp dụng thành công mã giảm ${v.discount_percent}%!`
    });
}));

/* =========================================================================
   3. RÚT TIỀN TỪ VÍ (Chuyển từ WalletService.withdraw)
   ========================================================================= */

// POST /api/wallet/withdraw - Gửi yêu cầu rút tiền về ngân hàng
router.post("/wallet/withdraw", wrap(async (req, res) => {
    const userId = Number(req.body.user_id || req.get("x-user-id"));
    const { amount, bank_info } = req.body || {};

    const numAmt = Number(amount);
    if (!userId || !numAmt || numAmt <= 0) {
        return res.status(400).json({ message: "Số tiền rút không hợp lệ!" });
    }
    const bank = String(bank_info || "Tài khoản ngân hàng liên kết").trim();

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query("INSERT IGNORE INTO wallets (user_id, balance) VALUES (?, 0)", [userId]);
        const [wallets] = await conn.query("SELECT wallet_id, balance FROM wallets WHERE user_id = ? FOR UPDATE", [userId]);
        const wallet = wallets[0];

        if (numAmt > Number(wallet.balance)) {
            await conn.rollback();
            return res.status(400).json({
                message: `Số dư khả dụng (${Number(wallet.balance).toLocaleString("vi-VN")}đ) không đủ để rút ${numAmt.toLocaleString("vi-VN")}đ!`
            });
        }

        // Tạm giữ số tiền rút
        await conn.query("UPDATE wallets SET balance = balance - ? WHERE wallet_id = ?", [numAmt, wallet.wallet_id]);

        // Tạo yêu cầu rút tiền vào withdrawal_requests
        const [wRes] = await conn.query(
            "INSERT INTO withdrawal_requests (wallet_id, amount, bank_info, status, requested_at) VALUES (?, ?, ?, 'pending', NOW())",
            [wallet.wallet_id, numAmt, bank]
        );

        // Ghi transaction trạng thái pending
        await conn.query(`
            INSERT INTO transactions (wallet_id, amount, type, status, description, created_at)
            VALUES (?, ?, 'withdraw', 'pending', ?, NOW())
        `, [
            wallet.wallet_id,
            -numAmt,
            `Rút tiền về ${bank} (Chờ Admin duyệt)`
        ]);

        await notify(
            conn,
            userId,
            "Yêu cầu rút tiền đang chờ duyệt",
            `Yêu cầu rút ${numAmt.toLocaleString("vi-VN")}đ về ${bank} của bạn đã được gửi. Quản trị viên sẽ xử lý trong 24h.`
        );

        await conn.commit();
        res.status(201).json({
            ok: true,
            request_id: wRes.insertId,
            remaining_balance: Number(wallet.balance) - numAmt,
            message: `Đã gửi yêu cầu rút ${numAmt.toLocaleString("vi-VN")}đ thành công. Vui lòng chờ Admin phê duyệt!`
        });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

module.exports = router;
