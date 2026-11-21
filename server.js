require("dotenv").config();
const path = require("path");
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
const frontEndPath = path.join(__dirname, "source code", "front-end");
app.use(express.static(frontEndPath));
app.use("/uploads", express.static(path.join(__dirname, "source code", "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Điều hướng trang chủ về index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(frontEndPath, "index.html"));
});

// Gắn các router chuyển đổi từ Java Spring Boot sang Node.js
try {
    const ownerRoutes = require("./source code/backend/owner/ownerRoutes");
    app.use("/api/owner", ownerRoutes);
    console.log("Đã kích hoạt thành công API Chủ xe (/api/owner)");
} catch (err) {
    console.warn("Chưa nạp được /api/owner:", err.message);
}

try {
    const handoverRoutes = require("./source code/backend/handover/handoverRoutes");
    app.use("/api/handover", handoverRoutes);
    console.log("Đã kích hoạt thành công API Giao nhận xe (/api/handover)");
} catch (err) {
    console.warn("Chưa nạp được /api/handover:", err.message);
}

try {
    const adminRoutes = require("./source code/backend/admin/adminRoutes");
    app.use("/api/admin", adminRoutes);
    console.log("Đã kích hoạt thành công API Quản trị (/api/admin)");
} catch (err) {
    console.warn("Chưa nạp được /api/admin:", err.message);
}

try {
    const profileRoutes = require("./source code/backend/profile/profileRoutes");
    app.use("/api/user", profileRoutes);
    console.log("Đã kích hoạt thành công API Hồ sơ & eKYC (/api/user)");
} catch (err) {
    console.warn("Chưa nạp được /api/user:", err.message);
}

try {
    const bookingRoutes = require("./source code/backend/booking/bookingRoutes");
    app.use("/api", bookingRoutes);
    console.log("Đã kích hoạt thành công API Đặt xe, Ví & Voucher (/api/bookings, /api/vouchers, /api/wallet/withdraw)");
} catch (err) {
    console.warn("Chưa nạp được /api/bookings:", err.message);
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "group08_db",
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10
});

// Tự động kiểm tra và đồng bộ cấu trúc bảng vehicles nếu CSDL đang chạy schema cũ
async function initDatabaseSchema() {
    try {
        const [cols] = await pool.query("SHOW COLUMNS FROM vehicles");
        const existingCols = new Set(cols.map(c => c.Field));

        if (!existingCols.has("vehicle_type")) {
            await pool.query("ALTER TABLE vehicles ADD COLUMN vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Xe tay ga'");
            console.log("-> Đã bổ sung cột vehicle_type vào bảng vehicles");
        }
        if (!existingCols.has("engine_cc")) {
            await pool.query("ALTER TABLE vehicles ADD COLUMN engine_cc VARCHAR(30) NOT NULL DEFAULT '110cc'");
            console.log("-> Đã bổ sung cột engine_cc vào bảng vehicles");
        }
        if (!existingCols.has("fuel_type")) {
            await pool.query("ALTER TABLE vehicles ADD COLUMN fuel_type VARCHAR(30) NOT NULL DEFAULT 'Xăng'");
            console.log("-> Đã bổ sung cột fuel_type vào bảng vehicles");
        }
        if (!existingCols.has("price_per_hour")) {
            await pool.query("ALTER TABLE vehicles ADD COLUMN price_per_hour DOUBLE NOT NULL DEFAULT 0");
            console.log("-> Đã bổ sung cột price_per_hour vào bảng vehicles");
        }
        if (!existingCols.has("available_from")) {
            await pool.query("ALTER TABLE vehicles ADD COLUMN available_from DATE DEFAULT NULL");
            console.log("-> Đã bổ sung cột available_from vào bảng vehicles");
        }
        if (!existingCols.has("available_to")) {
            await pool.query("ALTER TABLE vehicles ADD COLUMN available_to DATE DEFAULT NULL");
            console.log("-> Đã bổ sung cột available_to vào bảng vehicles");
        }
        if (!existingCols.has("approval_status")) {
            await pool.query("ALTER TABLE vehicles ADD COLUMN approval_status VARCHAR(30) NOT NULL DEFAULT 'pending'");
            console.log("-> Đã bổ sung cột approval_status vào bảng vehicles");
        }
        if (!existingCols.has("availability_status")) {
            await pool.query("ALTER TABLE vehicles ADD COLUMN availability_status VARCHAR(30) NOT NULL DEFAULT 'available'");
            console.log("-> Đã bổ sung cột availability_status vào bảng vehicles");
        }
        if (!existingCols.has("area")) {
            await pool.query("ALTER TABLE vehicles ADD COLUMN area VARCHAR(100) NOT NULL DEFAULT 'Quận 1'");
            console.log("-> Đã bổ sung cột area vào bảng vehicles");
            const sampleAreas = ["Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 7", "Quận Phú Nhuận", "Quận Bình Thạnh", "Quận Gò Vấp", "TP. Thủ Đức"];
            const [allVehicles] = await pool.query("SELECT vehicle_id FROM vehicles ORDER BY vehicle_id ASC");
            for (let idx = 0; idx < allVehicles.length; idx++) {
                await pool.query("UPDATE vehicles SET area = ? WHERE vehicle_id = ?", [sampleAreas[idx % sampleAreas.length], allVehicles[idx].vehicle_id]);
            }
            console.log("-> Đã phân bổ khu vực thực tế cho các xe trong CSDL");
        } else {
            await pool.query("UPDATE vehicles SET area = 'Quận 1' WHERE area IS NULL OR area = ''");
        }

        // Tạo bảng vehicle_files nếu chưa có
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vehicle_files (
                file_id     INT NOT NULL AUTO_INCREMENT,
                vehicle_id  INT NOT NULL,
                kind        VARCHAR(20)  NOT NULL,
                file_path   VARCHAR(255) NOT NULL,
                uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (file_id),
                CONSTRAINT fk_vehicle_files_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        // Đồng bộ cột cho bảng bookings nếu schema chưa có
        const [bCols] = await pool.query("SHOW COLUMNS FROM bookings");
        const existingBCols = new Set(bCols.map(c => c.Field));
        if (!existingBCols.has("rental_type")) {
            await pool.query("ALTER TABLE bookings ADD COLUMN rental_type VARCHAR(20) NOT NULL DEFAULT 'daily'");
        }
        if (!existingBCols.has("delivery_method")) {
            await pool.query("ALTER TABLE bookings ADD COLUMN delivery_method VARCHAR(30) NOT NULL DEFAULT 'self_pickup'");
        }
        if (!existingBCols.has("delivery_address")) {
            await pool.query("ALTER TABLE bookings ADD COLUMN delivery_address VARCHAR(255) DEFAULT NULL");
        }
        if (!existingBCols.has("delivery_fee")) {
            await pool.query("ALTER TABLE bookings ADD COLUMN delivery_fee DOUBLE NOT NULL DEFAULT 0");
        }
        if (!existingBCols.has("deposit_status")) {
            await pool.query("ALTER TABLE bookings ADD COLUMN deposit_status VARCHAR(30) NOT NULL DEFAULT 'held'");
        }

        // Đảm bảo tất cả user (kể cả Admin) đều có thể đóng vai trò người thuê xe
        await pool.query("INSERT IGNORE INTO renters (user_id) SELECT user_id FROM users");

        // Đồng bộ lại AUTO_INCREMENT tránh xung đột khóa chính từ dữ liệu seed
        const pks = {
            bookings: 'booking_id', transactions: 'transaction_id',
            notifications: 'notification_id', wallets: 'wallet_id',
            vehicles: 'vehicle_id', users: 'user_id'
        };
        for (const [tbl, pk] of Object.entries(pks)) {
            try {
                const [maxRows] = await pool.query(`SELECT COALESCE(MAX(${pk}), 0) AS maxId FROM ${tbl}`);
                const maxId = maxRows[0].maxId;
                const [status] = await pool.query(`SHOW TABLE STATUS LIKE '${tbl}'`);
                const currAi = status[0] ? status[0].Auto_increment : null;
                if (currAi && currAi <= maxId) {
                    await pool.query(`ALTER TABLE ${tbl} AUTO_INCREMENT = ${maxId + 1}`);
                }
            } catch (err) { }
        }

        console.log("-> Cấu trúc bảng vehicles, bookings & CSDL đã được kiểm tra và đồng bộ hoàn tất.");
    } catch (e) {
        console.warn("Lưu ý initDatabaseSchema:", e.message);
    }
}
initDatabaseSchema();

// Khởi tạo tài khoản mẫu nếu chưa tồn tại (KHÔNG ghi đè mật khẩu khi người dùng đã đổi)
async function initDemoUsers() {
    try {
        await pool.query(`
            INSERT IGNORE INTO users (user_id, full_name, email, phone, password_hash, kyc_status, status)
            VALUES (8, 'Trần Văn Hiền', 'tranvanhien@gmail.com', '0908425939', '123456789', 'verified', 'active');
        `);
        console.log("Đã sẵn sàng tài khoản Trần Văn Hiền (email: tranvanhien@gmail.com)");
    } catch (e) {
        console.warn("Lưu ý initDemoUsers:", e.message);
    }
}
initDemoUsers();

// Kiểm tra kết nối MySQL
app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ ok: true, database: process.env.DB_NAME || "group08_db" });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// Lấy danh sách xe đã được Admin duyệt từ bảng vehicles để hiển thị cho khách thuê kèm đánh giá trung bình
app.get("/api/vehicles", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT v.vehicle_id AS id, v.owner_id, u.full_name AS owner,
                    v.brand, v.model,
                    CONCAT(v.brand, ' ', v.model) AS name,
                    COALESCE(v.vehicle_type, 'Xe tay ga') AS type,
                    COALESCE(v.engine_cc, '110cc') AS cc,
                    COALESCE(v.fuel_type, 'Xăng') AS fuel,
                    COALESCE(v.area, 'Quận 1') AS area,
                    v.license_plate,
                    COALESCE(v.price_per_hour, ROUND(v.price_per_day / 6, -3)) AS hourPrice,
                    v.price_per_day AS dayPrice,
                    COALESCE(v.deposit_amount, 300000) AS deposit,
                    v.approval_status, v.availability_status,
                    COALESCE(ROUND(AVG(r.rating), 1), 0.0) AS avg_rating,
                    COUNT(r.review_id) AS total_reviews
             FROM vehicles v
             JOIN users u ON v.owner_id = u.user_id
             LEFT JOIN reviews r ON v.vehicle_id = r.vehicle_id
             WHERE v.approval_status = 'approved' AND v.availability_status = 'available'
             GROUP BY v.vehicle_id, v.owner_id, u.full_name, v.brand, v.model, v.vehicle_type, v.engine_cc, v.fuel_type, v.area, v.license_plate, v.price_per_hour, v.price_per_day, v.deposit_amount, v.approval_status, v.availability_status
             ORDER BY v.vehicle_id ASC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Người dùng gửi yêu cầu ký gửi thêm xe mới (trạng thái ban đầu: pending - Chờ Admin duyệt)
app.post("/api/vehicles/consign", async (req, res) => {
    const { user_id, brand, model, vehicle_type, engine_cc, fuel_type, hour_price, day_price, license_plate, area } = req.body || {};
    const hPrice = Number(hour_price);
    const dPrice = Number(day_price);
    if (!user_id || !brand || !model || !license_plate || !hPrice || !dPrice) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ hãng xe, mẫu xe, giá thuê và biển số kiểm soát!" });
    }

    const cleanPlate = String(license_plate).trim().toUpperCase();
    const normPlate = cleanPlate.replace(/[\s.\-]/g, "");
    if (!normPlate) {
        return res.status(400).json({ message: "Biển số xe không hợp lệ!" });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Đảm bảo user có bản ghi trong bảng vehicle_owners
        await conn.query("INSERT IGNORE INTO vehicle_owners (user_id) VALUES (?)", [user_id]);

        // Kiểm tra biển số xe trùng (chuẩn hóa không phân biệt khoảng trắng, dấu chấm, dấu gạch ngang)
        const PLATE_NORM_SQL = "REPLACE(REPLACE(REPLACE(UPPER(license_plate),' ',''),'.',''),'-','')";
        const [existing] = await conn.query(
            `SELECT vehicle_id, license_plate, brand, model FROM vehicles WHERE ${PLATE_NORM_SQL} = ? LIMIT 1`,
            [normPlate]
        );
        if (existing.length > 0) {
            await conn.rollback();
            return res.status(409).json({
                message: `Biển số xe "${cleanPlate}" đã bị trùng với xe "${existing[0].brand} ${existing[0].model}" (${existing[0].license_plate}) trong hệ thống!`
            });
        }

        const depositAmt = dPrice * 3;

        // Kiểm tra các cột thực tế có trong bảng vehicles để đảm bảo tương thích 100%
        const [cols] = await conn.query("SHOW COLUMNS FROM vehicles");
        const existingCols = new Set(cols.map(c => c.Field));

        const fields = ["owner_id", "brand", "model", "license_plate", "price_per_day", "deposit_amount"];
        const values = [user_id, brand.trim(), model.trim(), cleanPlate, dPrice, depositAmt];
        const placeholders = ["?", "?", "?", "?", "?", "?"];

        if (existingCols.has("vehicle_type")) {
            fields.push("vehicle_type");
            values.push(vehicle_type || "Xe tay ga");
            placeholders.push("?");
        }
        if (existingCols.has("engine_cc")) {
            fields.push("engine_cc");
            values.push(engine_cc || "110cc");
            placeholders.push("?");
        }
        if (existingCols.has("fuel_type")) {
            fields.push("fuel_type");
            values.push(fuel_type || "Xăng");
            placeholders.push("?");
        }
        if (existingCols.has("price_per_hour")) {
            fields.push("price_per_hour");
            values.push(hPrice);
            placeholders.push("?");
        }
        if (existingCols.has("approval_status")) {
            fields.push("approval_status");
            values.push("pending");
            placeholders.push("?");
        }
        if (existingCols.has("availability_status")) {
            fields.push("availability_status");
            values.push("unavailable");
            placeholders.push("?");
        }
        if (existingCols.has("area")) {
            fields.push("area");
            values.push((area || "Quận 1").trim());
            placeholders.push("?");
        }

        const [ins] = await conn.query(
            `INSERT INTO vehicles (${fields.join(", ")}) VALUES (${placeholders.join(", ")})`,
            values
        );

        await conn.commit();
        res.status(201).json({
            ok: true,
            vehicle_id: ins.insertId,
            message: `Hồ sơ ký gửi xe ${brand} ${model} (${cleanPlate}) đã gửi lên Admin. Vui lòng chờ phê duyệt!`
        });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: "Lỗi lưu xe: " + err.message });
    } finally {
        conn.release();
    }
});

// Chủ xe xem danh sách xe của chính mình cùng trạng thái duyệt
app.get("/api/owner/my-vehicles", async (req, res) => {
    const userId = Number(req.query.user_id);
    if (!userId) return res.json([]);
    try {
        const [rows] = await pool.query(
            `SELECT vehicle_id AS id, brand, model, CONCAT(brand, ' ', model) AS name,
                    vehicle_type AS type, engine_cc AS cc, fuel_type AS fuel, license_plate,
                    COALESCE(area, 'Quận 1') AS area,
                    price_per_hour AS hourPrice, price_per_day AS dayPrice, deposit_amount AS deposit,
                    approval_status, availability_status
             FROM vehicles
             WHERE owner_id = ?
             ORDER BY vehicle_id DESC`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Thống kê số chuyến hoàn tất và Doanh thu ròng cho chủ xe (Công thức: Tiền thuê * 90%)
app.get("/api/owner/revenue-stats", async (req, res) => {
    try {
        const userId = Number(req.query.user_id);
        if (!userId) {
            return res.json({ completed_trips: 0, net_revenue: 0 });
        }
        const [rows] = await pool.query(`
            SELECT 
                COUNT(b.booking_id) AS completed_trips,
                COALESCE(SUM(ROUND((CASE WHEN b.total_amount > b.deposit_amount THEN (b.total_amount - b.deposit_amount) ELSE b.total_amount END) * 0.9)), 0) AS net_revenue
            FROM bookings b
            JOIN vehicles v ON b.vehicle_id = v.vehicle_id
            WHERE v.owner_id = ? AND b.status = 'completed'
        `, [userId]);

        res.json({
            completed_trips: Number(rows[0]?.completed_trips) || 0,
            net_revenue: Number(rows[0]?.net_revenue) || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper: Lấy admin_id hợp lệ (đảm bảo thỏa mãn foreign key constraint với bảng admins)
async function getValidAdminId(requestedId) {
    const id = Number(requestedId);
    if (id) {
        const [rows] = await pool.query("SELECT user_id FROM admins WHERE user_id = ?", [id]);
        if (rows.length > 0) return rows[0].user_id;
    }
    const [def] = await pool.query("SELECT user_id FROM admins ORDER BY user_id ASC LIMIT 1");
    return def.length > 0 ? def[0].user_id : 6;
}

// Admin: Lấy danh sách xe đang chờ duyệt (approval_status = 'pending')
app.get("/api/admin/vehicles/pending", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT v.vehicle_id, v.owner_id, u.full_name AS owner_name, u.phone AS owner_phone,
                    v.brand, v.model, v.license_plate, v.vehicle_type, v.engine_cc, v.fuel_type,
                    COALESCE(v.area, 'Quận 1') AS area,
                    v.price_per_hour, v.price_per_day, v.deposit_amount, v.approval_status
             FROM vehicles v
             JOIN users u ON v.owner_id = u.user_id
             WHERE v.approval_status = 'pending'
             ORDER BY v.vehicle_id DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Phê duyệt xe lên sàn (chuyển sang 'approved' và 'available')
app.post("/api/admin/vehicles/:id/approve", async (req, res) => {
    const vehicleId = Number(req.params.id);
    try {
        const adminId = await getValidAdminId(req.body.admin_id);
        const [result] = await pool.query(
            `UPDATE vehicles 
             SET approval_status = 'approved', availability_status = 'available', approved_by = ?
             WHERE vehicle_id = ?`,
            [adminId, vehicleId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy xe hoặc xe không tồn tại!" });
        }
        res.json({ ok: true, message: `Đã duyệt xe #${vehicleId} lên sàn thành công! Khách thuê có thể thấy xe này trên trang chủ.` });
    } catch (err) {
        console.error("Lỗi duyệt xe:", err);
        res.status(500).json({ ok: false, message: "Lỗi duyệt xe: " + err.message, error: err.message });
    }
});

// Admin: Phê duyệt TẤT CẢ xe đang chờ duyệt lên sàn
app.post("/api/admin/vehicles/approve-all", async (req, res) => {
    try {
        const adminId = await getValidAdminId(req.body.admin_id);
        const [result] = await pool.query(
            `UPDATE vehicles 
             SET approval_status = 'approved', availability_status = 'available', approved_by = ?
             WHERE approval_status = 'pending'`,
            [adminId]
        );
        res.json({
            ok: true,
            count: result.affectedRows,
            message: `Đã duyệt thành công ${result.affectedRows} xe lên sàn! Tất cả xe đã sẵn sàng cho khách thuê.`
        });
    } catch (err) {
        console.error("Lỗi duyệt tất cả xe:", err);
        res.status(500).json({ ok: false, message: "Lỗi duyệt tất cả xe: " + err.message, error: err.message });
    }
});

// Admin: Từ chối xe ký gửi
app.post("/api/admin/vehicles/:id/reject", async (req, res) => {
    const vehicleId = Number(req.params.id);
    try {
        const [result] = await pool.query(
            `UPDATE vehicles 
             SET approval_status = 'rejected', availability_status = 'unavailable'
             WHERE vehicle_id = ?`,
            [vehicleId]
        );
        res.json({ ok: true, message: "Đã từ chối xe ký gửi." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy thông tin ví và lịch sử biến động số dư của người dùng
app.get("/api/wallet", async (req, res) => {
    const userId = Number(req.query.user_id);
    if (!userId) {
        return res.status(400).json({ message: "Thiếu user_id!" });
    }
    try {
        await pool.query("INSERT IGNORE INTO wallets (user_id, balance) VALUES (?, 0)", [userId]);
        const [wallets] = await pool.query("SELECT wallet_id, balance FROM wallets WHERE user_id = ?", [userId]);
        const wallet = wallets[0];

        const [txs] = await pool.query(
            `SELECT transaction_id, wallet_id, booking_id, amount, type, status, description,
                    DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') AS created_at
             FROM transactions
             WHERE wallet_id = ?
             ORDER BY transaction_id DESC`,
            [wallet.wallet_id]
        );
        res.json({
            wallet_id: wallet.wallet_id,
            balance: Number(wallet.balance),
            transactions: txs
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Người dùng gửi yêu cầu nạp tiền QR (trạng thái ban đầu: pending - Chờ Admin duyệt)
app.post("/api/wallet/deposit-request", async (req, res) => {
    const { user_id, amount } = req.body || {};
    const numAmt = Number(amount);
    if (!user_id || !numAmt || numAmt <= 0) {
        return res.status(400).json({ message: "Số tiền nạp không hợp lệ!" });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query("INSERT IGNORE INTO wallets (user_id, balance) VALUES (?, 0)", [user_id]);
        const [wallets] = await conn.query("SELECT wallet_id FROM wallets WHERE user_id = ?", [user_id]);
        const walletId = wallets[0].wallet_id;

        const [ins] = await conn.query(
            `INSERT INTO transactions (wallet_id, amount, type, status, description)
             VALUES (?, ?, 'deposit', 'pending', ?)`,
            [walletId, numAmt, `Nạp tiền qua chuyển khoản QR`]
        );

        await conn.commit();
        res.status(201).json({
            ok: true,
            transaction_id: ins.insertId,
            message: "Yêu cầu nạp tiền đã được gửi. Vui lòng chờ Admin kiểm tra và duyệt để cộng tiền vào tài khoản!"
        });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: "Lỗi tạo yêu cầu nạp: " + err.message });
    } finally {
        conn.release();
    }
});

// Admin: Lấy danh sách các yêu cầu nạp tiền đang chờ duyệt
app.get("/api/admin/deposits/pending", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT t.transaction_id, t.wallet_id, t.amount, t.status, t.description,
                    DATE_FORMAT(t.created_at, '%d/%m/%Y %H:%i') AS created_at,
                    u.user_id, u.full_name, u.phone, u.email
             FROM transactions t
             JOIN wallets w ON t.wallet_id = w.wallet_id
             JOIN users u ON w.user_id = u.user_id
             WHERE t.type = 'deposit' AND t.status = 'pending'
             ORDER BY t.transaction_id DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Duyệt yêu cầu nạp tiền -> hoàn tất giao dịch & cộng số dư vào ví
app.post("/api/admin/deposits/:id/approve", async (req, res) => {
    const txId = Number(req.params.id);
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [txs] = await conn.query(
            "SELECT transaction_id, wallet_id, amount, status FROM transactions WHERE transaction_id = ? AND status = 'pending' FOR UPDATE",
            [txId]
        );
        if (txs.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Không tìm thấy yêu cầu nạp tiền hoặc yêu cầu đã được xử lý!" });
        }
        const tx = txs[0];

        // 1. Cập nhật trạng thái transaction
        await conn.query(
            "UPDATE transactions SET status = 'completed', description = 'Nạp tiền qua chuyển khoản QR (Admin đã duyệt)' WHERE transaction_id = ?",
            [txId]
        );

        // 2. Cộng tiền vào ví
        await conn.query(
            "UPDATE wallets SET balance = balance + ? WHERE wallet_id = ?",
            [tx.amount, tx.wallet_id]
        );

        await conn.commit();
        res.json({ ok: true, message: `Đã duyệt nạp ${tx.amount.toLocaleString('vi-VN')}đ thành công! Tiền đã được cộng vào ví của người dùng.` });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// Admin: Từ chối yêu cầu nạp tiền
app.post("/api/admin/deposits/:id/reject", async (req, res) => {
    const txId = Number(req.params.id);
    try {
        const [result] = await pool.query(
            "UPDATE transactions SET status = 'rejected', description = 'Nạp tiền bị từ chối bởi Admin' WHERE transaction_id = ? AND status = 'pending'",
            [txId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy yêu cầu nạp tiền hoặc yêu cầu đã được xử lý!" });
        }
        res.json({ ok: true, message: "Đã từ chối yêu cầu nạp tiền!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Đăng nhập bằng email hoặc số điện thoại
app.post("/api/auth/login", async (req, res) => {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
        return res.status(400).json({ message: "Vui lòng nhập email/SĐT và mật khẩu!" });
    }

    const idClean = String(identifier).trim();
    const passClean = String(password).trim();

    try {
        const [rows] = await pool.query(
            `SELECT u.user_id, u.full_name, u.email, u.phone, u.password_hash, u.kyc_status, u.status,
                    a.admin_level, vo.user_id AS owner_uid
             FROM users u
             LEFT JOIN admins a ON u.user_id = a.user_id
             LEFT JOIN vehicle_owners vo ON u.user_id = vo.user_id
             WHERE u.email = ? OR u.phone = ?
             LIMIT 1`,
            [idClean, idClean]
        );

        if (rows.length === 0 || String(rows[0].password_hash).trim() !== passClean) {
            return res.status(401).json({ message: "Sai email/SĐT hoặc mật khẩu!" });
        }

        const user = rows[0];
        if (user.status !== "active") {
            return res.status(403).json({ message: "Tài khoản đang bị khóa hoặc ngừng hoạt động!" });
        }

        const role = user.admin_level ? "ADMIN" : (user.owner_uid ? "OWNER" : "RENTER");
        console.log(`[AUTH] ${user.full_name} (${user.email}) đăng nhập thành công vai trò ${role}`);
        res.json({
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            kyc_status: user.kyc_status,
            role
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi hệ thống: " + err.message });
    }
});

// Đăng xuất
app.post("/api/auth/logout", (req, res) => {
    res.json({ ok: true, message: "Đăng xuất thành công!" });
});

// Đổi mật khẩu tài khoản (kết nối CSDL users, hỗ trợ cả user_id hoặc email/sđt)
app.post("/api/user/change-password", async (req, res) => {
    const { user_id, identifier, old_password, new_password } = req.body || {};
    const idClean = String(identifier || "").trim();
    const oldClean = String(old_password || "").trim();
    const newClean = String(new_password || "").trim();

    if ((!user_id && !idClean) || !oldClean || !newClean) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin (tài khoản, mật khẩu cũ và mới)!" });
    }
    if (newClean.length < 8) {
        return res.status(400).json({ message: "Mật khẩu mới phải có tối thiểu 8 ký tự!" });
    }
    if (newClean === oldClean) {
        return res.status(400).json({ message: "Mật khẩu mới không được trùng với mật khẩu cũ!" });
    }

    try {
        let rows;
        if (idClean) {
            [rows] = await pool.query(
                "SELECT user_id, password_hash, full_name, email, phone FROM users WHERE email = ? OR phone = ? LIMIT 1",
                [idClean, idClean]
            );
        } else {
            [rows] = await pool.query(
                "SELECT user_id, password_hash, full_name, email, phone FROM users WHERE user_id = ? LIMIT 1",
                [user_id]
            );
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: `Không tìm thấy tài khoản "${idClean}" trong hệ thống CSDL!` });
        }

        const user = rows[0];
        const hashClean = String(user.password_hash).trim();

        if (hashClean !== oldClean) {
            return res.status(400).json({
                message: `Mật khẩu hiện tại không chính xác!`
            });
        }

        const [updateResult] = await pool.query(
            "UPDATE users SET password_hash = ? WHERE user_id = ?",
            [newClean, user.user_id]
        );

        console.log(`[AUTH] Đã đổi mật khẩu thành công cho ${user.full_name} (${user.email}). Cập nhật ${updateResult.affectedRows} dòng.`);
        res.json({ ok: true, message: "Đổi mật khẩu thành công!" });
    } catch (err) {
        console.error("[AUTH] Lỗi đổi mật khẩu:", err);
        res.status(500).json({ message: "Lỗi hệ thống CSDL: " + err.message });
    }
});

// Hàm kiểm tra trùng lặp email và số điện thoại chi tiết khi đăng ký tài khoản
async function checkRegistrationDuplicates(db, email, phone) {
    const cleanEmail = (email || "").trim();
    const cleanPhone = (phone || "").trim();
    const normPhone = cleanPhone.replace(/[\s\-\.]/g, "").replace(/^\+84/, "0");

    let emailMatches = [];
    if (cleanEmail) {
        const [rows] = await db.query(
            "SELECT user_id, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
            [cleanEmail]
        );
        emailMatches = rows;
    }

    let phoneMatches = [];
    if (cleanPhone) {
        const [rows] = await db.query(
            "SELECT user_id, phone FROM users WHERE phone = ? OR REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+84', '0') = ? LIMIT 1",
            [cleanPhone, normPhone]
        );
        phoneMatches = rows;
    }

    const isEmailDuplicate = emailMatches.length > 0;
    const isPhoneDuplicate = phoneMatches.length > 0;

    let duplicateFields = [];
    let validFields = [];
    let message = "";

    if (isEmailDuplicate && isPhoneDuplicate) {
        duplicateFields = ["email", "phone"];
        message = `❌ Trùng cả Email và Số điện thoại:\n` +
            `• Email "${cleanEmail}" đã được sử dụng bởi tài khoản khác (cần đổi email mới).\n` +
            `• Số điện thoại "${cleanPhone}" đã được sử dụng bởi tài khoản khác (cần đổi số điện thoại mới).`;

    } else if (isEmailDuplicate) {
        duplicateFields = ["email"];
        validFields = ["phone"];
        message = `❌ Email "${cleanEmail}" đã bị trùng (đã tồn tại trên hệ thống)!`;
    } else if (isPhoneDuplicate) {
        duplicateFields = ["phone"];
        validFields = ["email"];
        message = `❌ Số điện thoại "${cleanPhone}" đã bị trùng (đã tồn tại trên hệ thống)!`;
    }

    return {
        hasDuplicate: isEmailDuplicate || isPhoneDuplicate,
        isEmailDuplicate,
        isPhoneDuplicate,
        duplicateFields,
        validFields,
        duplicate_fields: duplicateFields,
        valid_fields: validFields,
        email: cleanEmail,
        phone: cleanPhone,
        message
    };
}

// Đăng ký tài khoản người thuê mới
app.post("/api/auth/register", async (req, res) => {
    const { full_name, email, phone, password } = req.body || {};
    if (!full_name || !email || !phone || !password) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: "Mật khẩu phải có ít nhất 8 ký tự!" });
    }

    const cleanPhone = (phone || "").trim();
    if (!cleanPhone || /\s/.test(cleanPhone) || !/^0[0-9]{9}$/.test(cleanPhone)) {
        return res.status(400).json({
            message: "Số điện thoại không hợp lệ! Bắt buộc phải có đúng 10 chữ số (0-9), bắt đầu bằng số 0 và không có khoảng trống."
        });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const dupCheck = await checkRegistrationDuplicates(conn, email, phone);
        if (dupCheck.hasDuplicate) {
            await conn.rollback();
            return res.status(409).json({
                message: dupCheck.message,
                duplicate_fields: dupCheck.duplicateFields,
                valid_fields: dupCheck.validFields,
                isEmailDuplicate: dupCheck.isEmailDuplicate,
                isPhoneDuplicate: dupCheck.isPhoneDuplicate,
                email: dupCheck.email,
                phone: dupCheck.phone
            });
        }

        const [userResult] = await conn.query(
            "INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)",
            [full_name.trim(), email.trim(), phone.trim(), password]
        );
        const newUserId = userResult.insertId;

        await conn.query("INSERT INTO renters (user_id) VALUES (?)", [newUserId]);
        await conn.query("INSERT INTO wallets (user_id, balance) VALUES (?, 0)", [newUserId]);

        await conn.commit();
        res.status(201).json({ message: "Đăng ký thành công!", user_id: newUserId });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: "Lỗi hệ thống: " + err.message });
    } finally {
        conn.release();
    }
});

// API kiểm tra trùng lặp email / số điện thoại trước khi submit
app.post("/api/auth/check-duplicate", async (req, res) => {
    const { email, phone } = req.body || {};
    try {
        const dupCheck = await checkRegistrationDuplicates(pool, email, phone);
        res.json(dupCheck);
    } catch (err) {
        res.status(500).json({ message: "Lỗi kiểm tra trùng lặp: " + err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
