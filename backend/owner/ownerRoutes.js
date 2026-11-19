/* ==========================================================
   BACKEND tab "XE CỦA BẠN" (Chủ xe) — phần của Hồng Trung
   Đây là một "Router" của Express: gom các API của chủ xe vào 1 file riêng,
   để không phải sửa nhiều trong server.js (tránh xung đột với các bạn khác).

   Gắn vào server.js bằng 2 dòng:
       const ownerRoutes = require("./backend/owner/ownerRoutes");
       app.use("/api/owner", ownerRoutes);

   Các API (tất cả đều bắt đầu bằng /api/owner):
       GET    /vehicles                      danh sách xe của tôi
       POST   /vehicles                      đăng ký xe mới (multipart: ảnh + giấy tờ)
       PUT    /vehicles/:id                  sửa thông tin xe
       PATCH  /vehicles/:id/availability     khóa / mở lịch
       GET    /bookings                      yêu cầu đặt xe gửi tới xe của tôi
       POST   /bookings/:id/approve          chấp nhận đơn
       POST   /bookings/:id/reject           từ chối đơn
       GET    /earnings                      doanh thu + số dư + lịch sử rút tiền
       POST   /withdrawals                   gửi yêu cầu rút tiền
   ========================================================== */
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const pool = require("../booking&promotion/backend/config/db"); // pool kết nối MySQL dùng chung

const router = express.Router();

// % hoa hồng sàn (admin cấu hình theo tài liệu yêu cầu; tạm đặt 10%, đổi trong .env: COMMISSION_RATE=0.1)
const COMMISSION_RATE = Number(process.env.COMMISSION_RATE || 0.1);

/* ---------- Thư mục lưu file upload ---------- */
const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads", "vehicles");
fs.mkdirSync(path.join(UPLOAD_ROOT, "photos"), { recursive: true });
fs.mkdirSync(path.join(UPLOAD_ROOT, "docs"), { recursive: true });

/* ==========================================================
   Hàm tiện ích
   ========================================================== */
// Bọc hàm async để lỗi bất ngờ tự trả về HTTP 500 thay vì làm sập server
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

const str = v => (v == null ? "" : String(v).trim());
const pad = (n, len) => String(n).padStart(len, "0");

// "BK0003" -> 3
function parseBookingId(raw) {
    const n = Number(String(raw).replace(/\D/g, ""));
    return Number.isInteger(n) && n > 0 ? n : null;
}

function removeFiles(list) {
    for (const f of list) fs.unlink(f.path, () => { });
}

// So sánh biển số không phân biệt dấu chấm, gạch ngang, khoảng trắng
const PLATE_SQL = "REPLACE(REPLACE(REPLACE(UPPER(license_plate),' ',''),'.',''),'-','')";
const normPlate = p => p.toUpperCase().replace(/[\s.\-]/g, "");

async function plateExists(plate, exceptVehicleId) {
    const [rows] = await pool.execute(
        `SELECT vehicle_id FROM vehicles WHERE ${PLATE_SQL} = ? AND vehicle_id <> ? LIMIT 1`,
        [normPlate(plate), exceptVehicleId || 0]
    );
    return rows.length > 0;
}

/* ==========================================================
   XÁC ĐỊNH CHỦ XE ĐANG ĐĂNG NHẬP
   !!! TẠM THỜI !!!  /api/auth/login hiện chưa trả token/session, nên FE gửi
   user_id qua header "X-User-Id". Header này ai cũng giả mạo được -> chỉ dùng
   để demo. Khi Văn Hiến làm xong đăng nhập thật (session/JWT), chỉ cần sửa
   DUY NHẤT hàm này để lấy user_id từ session/token.
   ========================================================== */
async function requireOwner(req, res, next) {
    try {
        const uid = Number(req.get("x-user-id"));
        if (!Number.isInteger(uid) || uid <= 0) {
            return res.status(401).json({ message: "Bạn chưa đăng nhập." });
        }
        const [rows] = await pool.execute("SELECT user_id FROM vehicle_owners WHERE user_id = ?", [uid]);
        if (rows.length === 0) {
            return res.status(403).json({ message: "Tài khoản này không phải chủ xe." });
        }
        req.ownerId = uid;
        next();
    } catch (err) {
        next(err);
    }
}

/* ==========================================================
   Upload file (multer): field "images" = ảnh xe, field "docs" = giấy tờ xe
   ========================================================== */
const uploader = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) =>
            cb(null, path.join(UPLOAD_ROOT, file.fieldname === "images" ? "photos" : "docs")),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "");
            cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
    fileFilter: (req, file, cb) => {
        const ok = file.mimetype.startsWith("image/") ||
            (file.fieldname === "docs" && file.mimetype === "application/pdf");
        cb(ok ? null : new Error("Chỉ chấp nhận file ảnh (giấy tờ có thể là ảnh hoặc PDF)."), ok);
    }
}).fields([{ name: "images", maxCount: 5 }, { name: "docs", maxCount: 5 }]);

function handleUpload(req, res, next) {
    uploader(req, res, err => {
        if (!err) return next();
        const msg = err.code === "LIMIT_FILE_SIZE" ? "Mỗi file tối đa 5MB." : err.message;
        res.status(400).json({ message: msg });
    });
}

/* ==========================================================
   Đọc + kiểm tra dữ liệu xe (giống validate() bên FE, nhưng server PHẢI kiểm tra lại)
   ========================================================== */
function parseVehicle(b) {
    return {
        brand: str(b.brand),
        model: str(b.model),
        plate: str(b.plate),
        type: str(b.type) || "Xe tay ga",
        cc: str(b.cc) || "110cc",
        fuel: str(b.fuel) || "Xăng",
        hourPrice: Number(b.hourPrice),
        dayPrice: Number(b.dayPrice),
        deposit: str(b.deposit) === "" ? NaN : Number(b.deposit),
        availFrom: str(b.availFrom),
        availTo: str(b.availTo)
    };
}

function validateVehicle(d) {
    const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s);
    if (!d.brand) return "Vui lòng nhập hãng xe.";
    if (!d.model) return "Vui lòng nhập tên mẫu xe & đời xe.";
    if (!d.plate) return "Vui lòng nhập biển số xe.";
    if (d.brand.length > 50 || d.model.length > 50) return "Hãng xe / tên mẫu xe tối đa 50 ký tự.";
    if (d.plate.length > 20) return "Biển số tối đa 20 ký tự.";
    if (!(d.hourPrice > 0)) return "Giá thuê theo giờ phải lớn hơn 0.";
    if (!(d.dayPrice > 0)) return "Giá thuê theo ngày phải lớn hơn 0.";
    if (!(d.deposit >= 0)) return "Vui lòng nhập tiền đặt cọc (từ 0 trở lên).";
    if (!isDate(d.availFrom) || !isDate(d.availTo)) return "Vui lòng chọn khung ngày xe được phép cho thuê.";
    if (d.availTo < d.availFrom) return "Ngày kết thúc không được trước ngày bắt đầu.";
    return null;
}

/* ==========================================================
   1. XE CỦA TÔI
   ========================================================== */
router.get("/vehicles", requireOwner, wrap(async (req, res) => {
    // Đặt tên cột (AS ...) trùng với tên field mà xecuaban.js đang dùng
    const [rows] = await pool.execute(
        `SELECT vehicle_id AS id, brand, model, license_plate AS plate,
                vehicle_type AS type, engine_cc AS cc, fuel_type AS fuel,
                price_per_hour AS hourPrice, price_per_day AS dayPrice, deposit_amount AS deposit,
                DATE_FORMAT(available_from, '%Y-%m-%d') AS availFrom,
                DATE_FORMAT(available_to,   '%Y-%m-%d') AS availTo,
                approval_status AS approval, availability_status AS availability
         FROM vehicles WHERE owner_id = ? ORDER BY vehicle_id ASC`,
        [req.ownerId]
    );
    res.json(rows);
}));

// Đăng ký xe mới: trạng thái ban đầu = pending (chờ Admin duyệt)
router.post("/vehicles", requireOwner, handleUpload, wrap(async (req, res) => {
    const files = req.files || {};
    const images = files.images || [];
    const docs = files.docs || [];
    const d = parseVehicle(req.body);

    let err = validateVehicle(d);
    if (!err && images.length === 0) err = "Vui lòng tải lên ít nhất 1 ảnh xe.";
    if (!err && docs.length === 0) err = "Vui lòng tải lên giấy tờ xe (cà vẹt, đăng kiểm).";
    if (!err && await plateExists(d.plate)) err = `Biển số ${d.plate} đã tồn tại trong hệ thống.`;
    if (err) {
        removeFiles([...images, ...docs]); // validate fail thì xóa file vừa lưu
        return res.status(400).json({ message: err });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [result] = await conn.execute(
            `INSERT INTO vehicles (owner_id, brand, model, vehicle_type, engine_cc, fuel_type, license_plate,
                                   price_per_hour, price_per_day, deposit_amount, available_from, available_to,
                                   approval_status, availability_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'available')`,
            [req.ownerId, d.brand, d.model, d.type, d.cc, d.fuel, d.plate,
            d.hourPrice, d.dayPrice, d.deposit, d.availFrom, d.availTo]
        );
        const vehicleId = result.insertId;
        const fileRows = [
            ...images.map(f => [vehicleId, "photo", "photos/" + f.filename]),
            ...docs.map(f => [vehicleId, "document", "docs/" + f.filename])
        ];
        await conn.query("INSERT INTO vehicle_files (vehicle_id, kind, file_path) VALUES ?", [fileRows]);
        await conn.commit();
        res.status(201).json({ vehicleId, message: "Đã gửi hồ sơ lên Admin." });
    } catch (e) {
        await conn.rollback();
        removeFiles([...images, ...docs]);
        if (e.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: `Biển số ${d.plate} đã tồn tại trong hệ thống.` });
        }
        throw e;
    } finally {
        conn.release();
    }
}));

// Sửa thông tin xe (chỉ sửa xe của chính mình)
router.put("/vehicles/:id", requireOwner, wrap(async (req, res) => {
    const id = Number(req.params.id);
    const d = parseVehicle(req.body);

    const [own] = await pool.execute(
        "SELECT vehicle_id FROM vehicles WHERE vehicle_id = ? AND owner_id = ?", [id, req.ownerId]);
    if (own.length === 0) return res.status(404).json({ message: "Không tìm thấy xe của bạn." });

    let err = validateVehicle(d);
    if (!err && await plateExists(d.plate, id)) err = `Biển số ${d.plate} đã tồn tại trong hệ thống.`;
    if (err) return res.status(400).json({ message: err });

    try {
        await pool.execute(
            `UPDATE vehicles
                SET brand = ?, model = ?, vehicle_type = ?, engine_cc = ?, fuel_type = ?, license_plate = ?,
                    price_per_hour = ?, price_per_day = ?, deposit_amount = ?, available_from = ?, available_to = ?,
                    approval_status = IF(approval_status = 'rejected', 'pending', approval_status)
              WHERE vehicle_id = ? AND owner_id = ?`,
            [d.brand, d.model, d.type, d.cc, d.fuel, d.plate, d.hourPrice, d.dayPrice, d.deposit,
            d.availFrom, d.availTo, id, req.ownerId]
        );
    } catch (e) {
        if (e.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: `Biển số ${d.plate} đã tồn tại trong hệ thống.` });
        }
        throw e;
    }
    res.json({ message: "Đã lưu thay đổi." });
}));

// Khóa / mở lịch: available <-> locked. Xe chưa duyệt hoặc đang có khách (rented) thì không đổi được.
router.patch("/vehicles/:id/availability", requireOwner, wrap(async (req, res) => {
    const id = Number(req.params.id);
    const [result] = await pool.execute(
        `UPDATE vehicles
            SET availability_status = IF(availability_status = 'locked', 'available', 'locked')
          WHERE vehicle_id = ? AND owner_id = ?
            AND approval_status = 'approved'
            AND availability_status IN ('available', 'locked')`,
        [id, req.ownerId]
    );
    if (result.affectedRows === 0) {
        return res.status(409).json({ message: "Không thể đổi lịch: xe chưa được duyệt hoặc đang có khách thuê." });
    }
    const [rows] = await pool.execute("SELECT availability_status AS availability FROM vehicles WHERE vehicle_id = ?", [id]);
    res.json(rows[0]);
}));

/* ==========================================================
   2. YÊU CẦU ĐẶT XE
   ========================================================== */
router.get("/bookings", requireOwner, wrap(async (req, res) => {
    const [rows] = await pool.execute(
        `SELECT b.booking_id, b.vehicle_id AS vehicleId, u.full_name AS renter,
                DATE_FORMAT(b.start_date, '%Y-%m-%dT%H:%i') AS \`start\`,
                DATE_FORMAT(b.end_date,   '%Y-%m-%dT%H:%i') AS \`end\`,
                b.total_amount AS total, b.status
         FROM bookings b
         JOIN vehicles v ON v.vehicle_id = b.vehicle_id
         JOIN users u    ON u.user_id = b.renter_id
         WHERE v.owner_id = ?
         ORDER BY b.booking_id DESC`,
        [req.ownerId]
    );
    // Đổi booking_id 3 -> "BK0003" cho khớp giao diện
    res.json(rows.map(r => ({ ...r, id: "BK" + pad(r.booking_id, 4) })));
}));

async function notify(conn, userId, title, content) {
    await conn.execute("INSERT INTO notifications (user_id, title, content) VALUES (?, ?, ?)", [userId, title, content]);
}

router.post("/bookings/:id/approve", requireOwner, wrap(async (req, res) => {
    const bookingId = parseBookingId(req.params.id);
    if (!bookingId) return res.status(400).json({ message: "Mã đơn không hợp lệ." });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // FOR UPDATE: khóa dòng đơn + dòng xe, để 2 đơn trùng giờ không thể cùng được duyệt một lúc
        const [rows] = await conn.execute(
            `SELECT b.booking_id, b.renter_id, b.vehicle_id, b.start_date, b.end_date, b.status,
                    v.approval_status, v.availability_status
             FROM bookings b JOIN vehicles v ON v.vehicle_id = b.vehicle_id
             WHERE b.booking_id = ? AND v.owner_id = ?
             FOR UPDATE`,
            [bookingId, req.ownerId]
        );
        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Không tìm thấy đơn đặt xe của bạn." });
        }
        const b = rows[0];
        if (b.status !== "pending") {
            await conn.rollback();
            return res.status(409).json({ message: "Đơn này đã được xử lý rồi." });
        }
        if (b.approval_status !== "approved") {
            await conn.rollback();
            return res.status(409).json({ message: "Xe này chưa được Admin duyệt nên không thể nhận đơn." });
        }
        if (b.availability_status === "locked") {
            await conn.rollback();
            return res.status(409).json({ message: "Xe đang khóa lịch. Hãy mở trống xe trước khi chấp nhận đơn." });
        }

        // Không cho 2 đơn đã duyệt trùng khoảng thời gian: A.start < B.end VÀ B.start < A.end
        const [conflict] = await conn.execute(
            `SELECT booking_id FROM bookings
             WHERE vehicle_id = ? AND status = 'approved' AND booking_id <> ?
               AND start_date < ? AND ? < end_date
             LIMIT 1`,
            [b.vehicle_id, bookingId, b.end_date, b.start_date]
        );
        if (conflict.length > 0) {
            await conn.rollback();
            return res.status(409).json({ message: `Trùng lịch với đơn #BK${pad(conflict[0].booking_id, 4)}. Không thể chấp nhận đơn này.` });
        }

        await conn.execute("UPDATE bookings SET status = 'approved' WHERE booking_id = ?", [bookingId]);
        await notify(conn, b.renter_id, "Đơn đặt xe đã được chấp nhận",
            `Chủ xe đã chấp nhận đơn #BK${pad(bookingId, 4)} của bạn.`);
        await conn.commit();
        res.json({ message: "Đã chấp nhận đơn.", status: "approved" });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

router.post("/bookings/:id/reject", requireOwner, wrap(async (req, res) => {
    const bookingId = parseBookingId(req.params.id);
    if (!bookingId) return res.status(400).json({ message: "Mã đơn không hợp lệ." });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute(
            `SELECT b.renter_id FROM bookings b JOIN vehicles v ON v.vehicle_id = b.vehicle_id
             WHERE b.booking_id = ? AND v.owner_id = ? AND b.status = 'pending'
             FOR UPDATE`,
            [bookingId, req.ownerId]
        );
        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Không tìm thấy đơn, hoặc đơn đã được xử lý." });
        }
        await conn.execute("UPDATE bookings SET status = 'rejected' WHERE booking_id = ?", [bookingId]);
        await notify(conn, rows[0].renter_id, "Đơn đặt xe bị từ chối",
            `Chủ xe đã từ chối đơn #BK${pad(bookingId, 4)} của bạn.`);
        await conn.commit();
        res.json({ message: "Đã từ chối đơn.", status: "rejected" });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

/* ==========================================================
   3. DOANH THU & RÚT TIỀN
   Quy ước (đã ghi trong ghi chú gửi nhóm):
     - Chuyến hoàn thành  = bookings.status = 'completed'
     - Doanh thu ròng     = tổng total_amount các chuyến hoàn thành x (1 - hoa hồng)
     - Số dư rút được     = wallets.balance - tổng các yêu cầu rút đang 'pending'
   ========================================================== */
async function getWallet(conn, userId, forUpdate) {
    await conn.execute("INSERT IGNORE INTO wallets (user_id, balance) VALUES (?, 0)", [userId]); // chưa có ví thì tạo
    const [rows] = await conn.execute(
        "SELECT wallet_id, balance FROM wallets WHERE user_id = ?" + (forUpdate ? " FOR UPDATE" : ""),
        [userId]
    );
    return rows[0];
}

async function calcEarnings(conn, ownerId, wallet) {
    const [t] = await conn.execute(
        `SELECT COUNT(*) AS trips, COALESCE(SUM(b.total_amount), 0) AS gross
         FROM bookings b JOIN vehicles v ON v.vehicle_id = b.vehicle_id
         WHERE v.owner_id = ? AND b.status = 'completed'`,
        [ownerId]
    );
    const [p] = await conn.execute(
        "SELECT COALESCE(SUM(amount), 0) AS pending FROM withdrawal_requests WHERE wallet_id = ? AND status = 'pending'",
        [wallet.wallet_id]
    );
    return {
        completedTrips: Number(t[0].trips),
        netRevenue: Math.round(Number(t[0].gross) * (1 - COMMISSION_RATE)),
        withdrawable: Math.max(0, Math.round(Number(wallet.balance) - Number(p[0].pending)))
    };
}

router.get("/earnings", requireOwner, wrap(async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const wallet = await getWallet(conn, req.ownerId, false);
        const earnings = await calcEarnings(conn, req.ownerId, wallet);
        const [list] = await conn.execute(
            `SELECT request_id, bank_info AS bank, amount, status
             FROM withdrawal_requests WHERE wallet_id = ? ORDER BY request_id DESC`,
            [wallet.wallet_id]
        );
        res.json({ ...earnings, withdrawals: list.map(w => ({ ...w, id: "WD" + pad(w.request_id, 3) })) });
    } finally {
        conn.release();
    }
}));

router.post("/withdrawals", requireOwner, wrap(async (req, res) => {
    const amount = Math.round(Number(req.body.amount));
    const bank = str(req.body.bankInfo);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: "Vui lòng nhập số tiền cần rút." });
    if (!bank) return res.status(400).json({ message: "Vui lòng nhập tài khoản ngân hàng nhận tiền." });
    if (bank.length > 255) return res.status(400).json({ message: "Thông tin ngân hàng quá dài (tối đa 255 ký tự)." });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        // Khóa ví của chủ xe: nếu bấm rút 2 lần liên tiếp thì lần 2 phải chờ lần 1 xong -> không rút vượt số dư
        const wallet = await getWallet(conn, req.ownerId, true);
        const before = await calcEarnings(conn, req.ownerId, wallet);
        if (amount > before.withdrawable) {
            await conn.rollback();
            return res.status(400).json({ message: `Số tiền rút vượt quá số dư khả dụng (${before.withdrawable.toLocaleString("vi-VN")}đ).` });
        }
        const [result] = await conn.execute(
            "INSERT INTO withdrawal_requests (wallet_id, amount, bank_info, status) VALUES (?, ?, ?, 'pending')",
            [wallet.wallet_id, amount, bank]
        );
        await conn.commit();
        res.status(201).json({
            id: "WD" + pad(result.insertId, 3),
            message: "Đã gửi yêu cầu rút tiền. Admin sẽ xét duyệt.",
            withdrawable: before.withdrawable - amount
        });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}));

// Xem ảnh xe đã upload (chỉ thư mục photos; thư mục docs chứa giấy tờ nên KHÔNG công khai)
router.use("/files/photos", express.static(path.join(UPLOAD_ROOT, "photos")));

/* ---------- Bắt lỗi chung ---------- */
router.use((err, req, res, next) => {
    console.error("[owner]", err);
    res.status(500).json({ message: "Lỗi hệ thống: " + err.message });
});

module.exports = router;
