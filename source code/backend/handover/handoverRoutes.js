const express = require("express");
const pool = require("../booking&promotion/backend/config/db");

const router = express.Router();

const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);
const pad = (n, len) => String(n).padStart(len, "0");

function parseBookingId(raw) {
    if (!raw) return null;
    const n = Number(String(raw).replace(/\D/g, ""));
    return Number.isInteger(n) && n > 0 ? n : null;
}

// Đảm bảo cấu trúc các cột mở rộng cho bảng check_in_out_reports nếu cần
async function initHandoverSchema() {
    try {
        const [cols] = await pool.query("SHOW COLUMNS FROM check_in_out_reports");
        const existingCols = new Set(cols.map(c => c.Field));

        if (!existingCols.has("booking_code")) {
            await pool.query("ALTER TABLE check_in_out_reports ADD COLUMN booking_code VARCHAR(30) NULL");
        }
        if (!existingCols.has("transaction_type")) {
            await pool.query("ALTER TABLE check_in_out_reports ADD COLUMN transaction_type VARCHAR(20) DEFAULT 'Check-in'");
        }
        if (!existingCols.has("role")) {
            await pool.query("ALTER TABLE check_in_out_reports ADD COLUMN role VARCHAR(20) DEFAULT 'Khách thuê'");
        }
        if (!existingCols.has("odometer")) {
            await pool.query("ALTER TABLE check_in_out_reports ADD COLUMN odometer INT DEFAULT 0");
        }
        if (!existingCols.has("fuel_level")) {
            await pool.query("ALTER TABLE check_in_out_reports ADD COLUMN fuel_level VARCHAR(20) DEFAULT '100%'");
        }
        if (!existingCols.has("status")) {
            await pool.query("ALTER TABLE check_in_out_reports ADD COLUMN status VARCHAR(30) DEFAULT 'completed'");
        }
        if (!existingCols.has("matched")) {
            await pool.query("ALTER TABLE check_in_out_reports ADD COLUMN matched BOOLEAN DEFAULT TRUE");
        }
        if (!existingCols.has("created_at")) {
            await pool.query("ALTER TABLE check_in_out_reports ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        }

        // Tạo bảng sự cố nếu chưa có
        await pool.query(`
            CREATE TABLE IF NOT EXISTS handover_incidents (
                incident_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                booking_code VARCHAR(30) NOT NULL,
                transaction_type VARCHAR(20) NOT NULL,
                role VARCHAR(20) NOT NULL,
                description TEXT NOT NULL,
                estimated_cost BIGINT NOT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    } catch (e) {
        console.warn("[handover] initHandoverSchema note:", e.message);
    }
}
initHandoverSchema();

/**
 * 1. Gửi biên bản giao / nhận xe (Chuyển đổi từ GiaoNhanXeController.submitReport)
 * POST /api/handover/reports
 */
router.post("/reports", wrap(async (req, res) => {
    const { bookingCode, transactionType, role, odometer, fuelLevel, imageUrl, note } = req.body || {};

    if (!bookingCode || !transactionType || !role) {
        return res.status(400).json({ message: "Thiếu mã đơn, loại giao dịch hoặc vai trò người gửi!" });
    }
    if (transactionType !== "Check-in" && transactionType !== "Check-out") {
        return res.status(400).json({ message: "Loại giao dịch không hợp lệ (phải là Check-in hoặc Check-out)!" });
    }

    const bId = parseBookingId(bookingCode);
    const cleanCode = "BK" + pad(bId || 1, 4);
    const odo = Number(odometer) || 0;
    const fuel = String(fuelLevel != null ? fuelLevel : "100%").includes("%") ? String(fuelLevel) : (fuelLevel + "%");

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Kiểm tra và khóa dòng đơn booking trong CSDL với khóa bi quan (Pessimistic Locking)
        let booking = null;
        if (bId) {
            const [bRows] = await conn.query(
                "SELECT booking_id, vehicle_id, renter_id, total_amount, deposit_amount, deposit_status, status FROM bookings WHERE booking_id = ? FOR UPDATE",
                [bId]
            );
            if (bRows.length > 0) booking = bRows[0];
        }

        // 2. YÊU CẦU: Nếu xe/đơn đã check-out (completed) và cọc đã hoàn thì KHÓA, không cho tương tác tiếp
        if (booking && booking.status === "completed" && booking.deposit_status === "refunded") {
            await conn.rollback();
            return res.status(400).json({ 
                message: "Đơn đặt xe này đã hoàn tất Check-out (Đã trả xe & hoàn cọc) và đã bị khóa. Vui lòng thực hiện theo quy trình: Đặt xe mới -> Check-in từ đầu!" 
            });
        }

        // 3. YÊU CẦU: BẮT BUỘC PHẢI CHECK-IN MỚI ĐƯỢC CHECK-OUT
        if (transactionType === "Check-out") {
            const [checkinReports] = await conn.query(
                "SELECT report_id FROM check_in_out_reports WHERE (booking_id = ? OR booking_code = ?) AND transaction_type = 'Check-in'",
                [bId || 0, cleanCode]
            );
            if (checkinReports.length === 0) {
                await conn.rollback();
                return res.status(400).json({ 
                    message: "Bắt buộc phải hoàn tất Check-in nhận xe trước khi thực hiện Check-out trả xe!" 
                });
            }
        }

        // Kiểm tra xem bên đối ứng đã gửi biên bản cùng loại giao dịch chưa (Đối chiếu 2 chiều)
        let isTwoWayCompleted = false;
        if (transactionType === "Check-out") {
            const [otherReports] = await conn.query(
                "SELECT report_id, role, odometer, fuel_level FROM check_in_out_reports WHERE (booking_id = ? OR booking_code = ?) AND transaction_type = 'Check-out' AND role != ?",
                [bId || 0, cleanCode, role]
            );
            if (otherReports.length > 0) {
                isTwoWayCompleted = true;
                // Cập nhật biên bản của bên thứ nhất thành COMPLETED & MATCHED
                await conn.query(
                    "UPDATE check_in_out_reports SET status = 'COMPLETED', matched = TRUE WHERE report_id = ?",
                    [otherReports[0].report_id]
                );
            }
        }

        // Lưu bản ghi vào bảng check_in_out_reports
        const reportStatus = (transactionType === "Check-in" || isTwoWayCompleted) ? "COMPLETED" : "PENDING";
        const isMatched = (transactionType === "Check-in" || isTwoWayCompleted);

        const [result] = await conn.query(
            `INSERT INTO check_in_out_reports 
             (booking_id, booking_code, transaction_type, role, odometer, fuel_level, inspection_photos, damage_notes, status, matched, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [bId || 1, cleanCode, transactionType, role, odo, fuel, imageUrl || null, note || null, reportStatus, isMatched]
        );

        // 4. Cập nhật trạng thái booking và xử lý hoàn cọc / doanh thu nguyên tử
        if (booking) {
            if (transactionType === "Check-in") {
                await conn.query("UPDATE bookings SET status = 'active' WHERE booking_id = ?", [bId]);
            } else if (transactionType === "Check-out" && isTwoWayCompleted) {
                // CHỈ KHI CẢ 2 BÊN ĐÃ GỬI BIÊN BẢN CHECK-OUT MỚI HOÀN TẤT ĐƠN & HOÀN CỌC NGUYÊN TỬ
                await conn.query("UPDATE bookings SET status = 'completed' WHERE booking_id = ?", [bId]);

                // Mở lại trạng thái sẵn sàng cho xe
                await conn.query("UPDATE vehicles SET availability_status = 'available' WHERE vehicle_id = ?", [booking.vehicle_id]);

                // 5. Tính toán doanh thu và hoàn cọc
                const gross = Number(booking.total_amount) || 0;
                const deposit = Number(booking.deposit_amount) || 0;
                const rentalAmount = (gross > deposit) ? (gross - deposit) : gross;
                const netRevenue = Math.round(rentalAmount * 0.9);

                // HOÀN CỌC 100% VỀ VÍ NGƯỜI ĐẶT XE (Khóa ví người thuê với FOR UPDATE chống race condition)
                const renterId = booking.renter_id;
                const refundDeposit = deposit > 0 ? deposit : 300000;

                if (booking.deposit_status !== "refunded" && renterId && refundDeposit > 0) {
                    await conn.query("UPDATE bookings SET deposit_status = 'refunded' WHERE booking_id = ?", [bId]);

                    await conn.query("INSERT IGNORE INTO wallets (user_id, balance) VALUES (?, 0)", [renterId]);
                    const [renterWallets] = await conn.query("SELECT wallet_id, balance FROM wallets WHERE user_id = ? FOR UPDATE", [renterId]);
                    
                    if (renterWallets.length > 0) {
                        const rWallet = renterWallets[0];
                        await conn.query("UPDATE wallets SET balance = balance + ? WHERE wallet_id = ?", [refundDeposit, rWallet.wallet_id]);
                        await conn.query(`
                            INSERT INTO transactions (wallet_id, booking_id, amount, type, status, description, created_at)
                            VALUES (?, ?, ?, 'deposit_refund', 'completed', ?, NOW())
                        `, [
                            rWallet.wallet_id,
                            bId,
                            refundDeposit,
                            `Hoàn tiền cọc tự động đơn #${cleanCode}`
                        ]);
                    }
                }

                // CỘNG DOANH THU CHO CHỦ XE (Khóa ví chủ xe với FOR UPDATE)
                const [vehRows] = await conn.query("SELECT owner_id, brand, model FROM vehicles WHERE vehicle_id = ?", [booking.vehicle_id]);
                if (vehRows.length > 0) {
                    const ownerId = vehRows[0].owner_id;
                    await conn.query("INSERT IGNORE INTO wallets (user_id, balance) VALUES (?, 0)", [ownerId]);
                    const [ownerWallets] = await conn.query("SELECT wallet_id, balance FROM wallets WHERE user_id = ? FOR UPDATE", [ownerId]);

                    if (ownerWallets.length > 0) {
                        const oWallet = ownerWallets[0];
                        await conn.query("UPDATE wallets SET balance = balance + ? WHERE wallet_id = ?", [netRevenue, oWallet.wallet_id]);
                        await conn.query(`
                            INSERT INTO transactions (wallet_id, booking_id, amount, type, status, description, created_at)
                            VALUES (?, ?, ?, 'rental_income', 'completed', ?, NOW())
                        `, [
                            oWallet.wallet_id,
                            bId,
                            netRevenue,
                            `Cộng doanh thu đơn #${cleanCode} (${vehRows[0].brand} ${vehRows[0].model}): Tiền thuê ${rentalAmount.toLocaleString('vi-VN')}đ x 90%`
                        ]);
                    }
                }

                // GHI NHẬN HOA HỒNG SÀN 10% VÀO VÍ ADMIN (Đảm bảo bất biến SUM(amount) = 0)
                const platformFee = rentalAmount - netRevenue;
                if (platformFee > 0) {
                    await conn.query("INSERT IGNORE INTO wallets (user_id, balance) VALUES (6, 0)");
                    const [adminWallets] = await conn.query("SELECT wallet_id, balance FROM wallets WHERE user_id = 6 FOR UPDATE");
                    if (adminWallets.length > 0) {
                        const aWallet = adminWallets[0];
                        await conn.query("UPDATE wallets SET balance = balance + ? WHERE wallet_id = ?", [platformFee, aWallet.wallet_id]);
                        await conn.query(`
                            INSERT INTO transactions (wallet_id, booking_id, amount, type, status, description, created_at)
                            VALUES (?, ?, ?, 'platform_fee', 'completed', ?, NOW())
                        `, [
                            aWallet.wallet_id,
                            bId,
                            platformFee,
                            `Hoa hồng nền tảng 10% đơn #${cleanCode}`
                        ]);
                    }
                }
            }
        }

        await conn.commit();
        res.status(201).json({
            ok: true,
            reportId: result.insertId,
            bookingCode: cleanCode,
            status: "COMPLETED",
            message: `Đã lưu biên bản ${transactionType} thành công vào CSDL!`
        });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

/**
 * 2. Lấy danh sách biên bản theo mã đơn (Chuyển đổi từ GiaoNhanXeController.getReports)
 * GET /api/handover/reports/:bookingCode
 */
router.get("/reports/:bookingCode", wrap(async (req, res) => {
    const raw = req.params.bookingCode;
    const bId = parseBookingId(raw);
    const cleanCode = "BK" + pad(bId || 0, 4);

    const [rows] = await pool.query(
        `SELECT report_id, booking_id, booking_code, transaction_type, role, 
                odometer, fuel_level, inspection_photos, damage_notes, status, matched,
                DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') AS created_at
         FROM check_in_out_reports
         WHERE booking_id = ? OR booking_code = ?
         ORDER BY report_id DESC`,
        [bId || 0, cleanCode]
    );

    res.json(rows);
}));

/**
 * 3. Báo cáo sự cố khi giao nhận xe (Chuyển đổi từ GiaoNhanXeController.submitIncident)
 * POST /api/handover/incidents
 */
router.post("/incidents", wrap(async (req, res) => {
    const { bookingCode, transactionType, role, description, estimatedCost } = req.body || {};

    if (!bookingCode || !description) {
        return res.status(400).json({ message: "Mã đơn và mô tả sự cố không được để trống!" });
    }
    const cost = Number(estimatedCost) || 0;
    if (cost < 0) {
        return res.status(400).json({ message: "Chi phí ước tính không hợp lệ!" });
    }

    const bId = parseBookingId(bookingCode);
    const cleanCode = "BK" + pad(bId || 1, 4);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [ins] = await conn.query(
            `INSERT INTO handover_incidents 
             (booking_code, transaction_type, role, description, estimated_cost, status, created_at)
             VALUES (?, ?, ?, ?, ?, 'PENDING', NOW())`,
            [cleanCode, transactionType || "Check-out", role || "Khách thuê", description.trim(), cost]
        );

        // Cập nhật phí phát sinh vào biên bản check_in_out_reports nếu có
        if (bId) {
            await conn.query(
                `UPDATE check_in_out_reports 
                 SET damage_notes = CONCAT(COALESCE(damage_notes, ''), '\n[SỰ CỐ]: ', ?),
                     extra_fee = extra_fee + ?
                 WHERE booking_id = ?
                 ORDER BY report_id DESC LIMIT 1`,
                [description.trim(), cost, bId]
            );
        }

        await conn.commit();
        res.status(201).json({
            ok: true,
            incidentId: ins.insertId,
            status: "PENDING",
            message: "Đã gửi báo cáo sự cố thành công lên hệ thống!"
        });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

/**
 * 4. Đánh giá chất lượng sau chuyến đi (Chuyển đổi từ GiaoNhanXeController.submitReview)
 * POST /api/handover/reviews
 */
router.post("/reviews", wrap(async (req, res) => {
    const { bookingCode, renterId, rating, comment } = req.body || {};

    if (!bookingCode) {
        return res.status(400).json({ message: "Mã đơn không được để trống!" });
    }
    const rateNum = Number(rating);
    if (!rateNum || rateNum < 1 || rateNum > 5) {
        return res.status(400).json({ message: "Điểm đánh giá phải từ 1 đến 5 sao!" });
    }
    if (!comment || !String(comment).trim()) {
        return res.status(400).json({ message: "Vui lòng nhập lời nhận xét!" });
    }

    const bId = parseBookingId(bookingCode);
    if (!bId) {
        return res.status(400).json({ message: "Mã đơn đặt xe không hợp lệ!" });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [bookings] = await conn.query(
            "SELECT booking_id, renter_id, vehicle_id, status FROM bookings WHERE booking_id = ?",
            [bId]
        );
        if (bookings.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Không tìm thấy đơn đặt xe trong CSDL!" });
        }
        const b = bookings[0];

        // Nếu đơn đã có đánh giá thì cập nhật lại đánh giá mới
        const [existing] = await conn.query("SELECT review_id FROM reviews WHERE booking_id = ?", [bId]);
        if (existing.length > 0) {
            await conn.query(
                "UPDATE reviews SET rating = ?, comment = ?, created_at = NOW() WHERE review_id = ?",
                [rateNum, String(comment).trim(), existing[0].review_id]
            );
            await conn.commit();
            return res.json({
                ok: true,
                reviewId: existing[0].review_id,
                message: "Đã cập nhật thành công đánh giá chất lượng cho đơn hàng!"
            });
        }

        const rId = Number(renterId) || b.renter_id;
        const [ins] = await conn.query(
            `INSERT INTO reviews (booking_id, renter_id, vehicle_id, rating, comment, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [bId, rId, b.vehicle_id, rateNum, String(comment).trim()]
        );

        await conn.commit();
        res.status(201).json({
            ok: true,
            reviewId: ins.insertId,
            message: "Cảm ơn bạn đã gửi đánh giá thành công!"
        });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

module.exports = router;
