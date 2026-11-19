# TÀI LIỆU QUẢN TRỊ DỮ LIỆU & KIẾN TRÚC HỆ THỐNG THUÊ XE MÁY (GROUP 08)
*Ngày cập nhật: 19/11/2026*

Tài liệu này ghi nhớ toàn bộ kiến trúc 14 bảng, ràng buộc khóa ngoại và dữ liệu mẫu (Seed Data) chuẩn hóa đã được người dùng phê duyệt và đồng bộ trong file `database_schema.sql` cũng như Database `group08_db`.

---

## 1. TỔNG QUAN 14 BẢNG DỮ LIỆU ĐÃ HOÀN TẤT (100%)

| STT | Tên bảng | Số bản ghi mẫu | Mô tả chức năng & Ràng buộc |
| :---: | :--- | :---: | :--- |
| **1** | `users` | 8 | Thông tin tài khoản chung (ID 1-5: Chủ xe, ID 6-7: Admin, ID 8: Triệu Quang Hào). |
| **2** | `admins` | 2 | Tài khoản quản trị viên (`super_admin`, `moderator`). |
| **3** | `vehicle_owners`| 5 | Chủ xe cho thuê xe, chứa thông tin tài khoản ngân hàng nhận tiền. |
| **4** | `renters` | 1 | Khách thuê xe (ID 8), liên kết số GPLX (`790123456789`). |
| **5** | `vehicles` | 100 | Danh sách 100 xe máy cho thuê (xe điện & xe xăng), biển số chuẩn hóa duy nhất (`uq_vehicles_plate`). |
| **6** | `vouchers` | 4 | Mã giảm giá (`CONBO01` - 10%, `CONHEO01` - 30%, `CONCHO01` - hết hạn, `BONBON10` - 10%). |
| **7** | `wallets` | 8 | Ví điện tử nội bộ cho cả 8 người dùng (số dư từ 1.5tr đến 10tr). |
| **8** | `identity_documents` | 4 | Hồ sơ CCCD / GPLX xác minh eKYC (đã duyệt & đang chờ duyệt). |
| **9** | `bookings` | 3 | Đơn đặt thuê xe (Hỗ trợ thuê theo ngày/giờ, giao tận nơi/tự lấy, giữ cọc chờ Admin duyệt hoàn cọc). |
| **10**| `check_in_out_reports` | 2 | Biên bản đối chiếu giao nhận xe 2 chiều (Odo, mức xăng/pin, ảnh chụp, ghi chú, kiểm tra bởi Admin). |
| **11**| `reviews` | 1 | Đánh giá 5 sao sau khi đơn kết thúc hoàn tất (chống spam với `UNIQUE booking_id`). |
| **12**| `transactions` | 4 | Lịch sử biến động ví (`#TX100` đến `#TX103`: nạp tiền, giữ cọc, trả tiền thuê, hoàn cọc). |
| **13**| `withdrawal_requests` | 2 | Yêu cầu rút tiền từ ví về ngân hàng (**Có Admin kiểm duyệt**: 1 đơn đã duyệt, 1 đơn chờ duyệt). |
| **14**| `notifications` | 3 | Thông báo hệ thống gửi tới người dùng về đơn đặt xe và trạng thái rút tiền. |

---

## 2. CÁC ĐẶC ĐIỂM ĐỘT PHÁ NGHIỆP VỤ ĐÃ THỐNG NHẤT

1. **Bảng `bookings`:**
   - `rental_type`: Hỗ trợ `'daily'` (theo ngày) và `'hourly'` (theo giờ).
   - `delivery_method`: Hỗ trợ `'self_pickup'` (tự lấy tại điểm) và `'delivery_to_door'` (giao tận nơi kèm phí `delivery_fee`).
   - `deposit_status`: Trạng thái cọc do **Admin kiểm duyệt** (`'held'` $\rightarrow$ `'reviewing'` $\rightarrow$ `'approved_refund'`).
2. **Bảng `withdrawal_requests`:**
   - Rút tiền không tự động mà thông qua **Admin duyệt** (`approved_by`, `processed_at`).
3. **Bảng `reviews`:**
   - Khách chỉ được đánh giá khi đơn đã hoàn thành (`completed`), mỗi đơn chỉ được đánh giá 1 lần duy nhất (`UNIQUE booking_id`).

---

## 3. FILE LƯU TRỮ VÀ THÔNG SỐ KẾT NỐI

- **File mã nguồn DDL & DML hoàn chỉnh:** `database_schema.sql` (gồm cấu trúc 14 bảng + toàn bộ lệnh `INSERT` mẫu).
- **File Java console service:** `model/AuthService.java` (đã biên dịch, hỗ trợ đăng ký, đăng nhập nhận diện quyền, đăng xuất).
- **File Backend API Server:** `server.js` (Express + `mysql2`, đã có sẵn các endpoint auth và vehicles).
- **Thông số MySQL Docker:**
  - Host: `127.0.0.1:3306`
  - User: `root`
  - Password: `123456`
  - Database: `group08_db`
  - Bảng mã: `utf8mb4`
