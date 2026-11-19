require("dotenv").config();
const path = require("path");
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "scr")));

const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "group08_db",
    waitForConnections: true,
    connectionLimit: 10
});

// Kiểm tra kết nối MySQL
app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ ok: true, database: process.env.DB_NAME || "group08_db" });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// Lấy danh sách xe từ bảng vehicles
app.get("/api/vehicles", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT v.vehicle_id, v.owner_id, u.full_name AS owner_name,
                    v.brand, v.model, v.license_plate,
                    v.price_per_day, v.deposit_amount,
                    v.approval_status, v.availability_status
             FROM vehicles v
             JOIN users u ON v.owner_id = u.user_id
             ORDER BY v.vehicle_id ASC`
        );
        res.json(rows);
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

    try {
        const [rows] = await pool.query(
            `SELECT u.user_id, u.full_name, u.email, u.phone, u.password_hash, u.kyc_status, u.status,
                    a.admin_level, vo.bank_account
             FROM users u
             LEFT JOIN admins a ON u.user_id = a.user_id
             LEFT JOIN vehicle_owners vo ON u.user_id = vo.user_id
             WHERE u.email = ? OR u.phone = ?
             LIMIT 1`,
            [identifier.trim(), identifier.trim()]
        );

        if (rows.length === 0 || rows[0].password_hash !== password) {
            return res.status(401).json({ message: "Sai email/SĐT hoặc mật khẩu!" });
        }

        const user = rows[0];
        if (user.status !== "active") {
            return res.status(403).json({ message: "Tài khoản đang bị khóa hoặc ngừng hoạt động!" });
        }

        const role = user.admin_level ? "ADMIN" : (user.bank_account ? "OWNER" : "RENTER");
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

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
