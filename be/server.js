const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ success: true, message: "Backend Node.js & MySQL group08_db hoạt động bình thường." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi kết nối MySQL: " + err.message });
    }
});

app.use("/api/bookings", bookingRoutes);

app.listen(PORT, () => {
    console.log(`MotoRenter Booking Backend đang chạy tại http://localhost:${PORT}`);
});
