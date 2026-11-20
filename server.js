require("dotenv").config();
const path = require("path");
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
const frontEndPath = path.join(__dirname, "source code", "front-end");
app.use(express.static(frontEndPath));
app.use(express.static(path.join(__dirname, "scr")));

// Điều hướng trang chủ về index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(frontEndPath, "index.html"));
});

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

// Đăng ký tài khoản người thuê mới
app.post("/api/auth/register", async (req, res) => {
    const { full_name, email, phone, password } = req.body || {};
    if (!full_name || !email || !phone || !password) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: "Mật khẩu phải có ít nhất 8 ký tự!" });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [existing] = await conn.query(
            "SELECT user_id FROM users WHERE email = ? OR phone = ? LIMIT 1",
            [email.trim(), phone.trim()]
        );
        if (existing.length > 0) {
            await conn.rollback();
            return res.status(409).json({ message: "Email hoặc số điện thoại đã được đăng ký!" });
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

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
