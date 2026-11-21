# Cấu Trúc Backend Hệ Thống Thuê Xe Máy (Group 08)

Hệ thống Backend được thiết kế theo kiến trúc module hóa (Modular Architecture), phân định rõ ràng trách nhiệm theo từng nghiệp vụ:

---

## 1. Dịch Vụ Node.js / Express (Active Runtime)

Các dịch vụ API chính đang hoạt động trực tiếp, được nạp bởi `server.js`:

- **`config/`**:
  - `db.js`: Quản lý kết nối MySQL Connection Pool (sử dụng thư viện `mysql2/promise`), hỗ trợ tự động tái kết nối và tối ưu hóa truy vấn CSDL.
- **`admin/`**:
  - `adminRoutes.js`: Quản trị viên duyệt hồ sơ eKYC, xử lý báo cáo sự cố hư hỏng xe, duyệt lệnh rút tiền về ngân hàng của người dùng, cấu hình voucher và thống kê doanh thu hệ thống.
- **`booking/`**:
  - `bookingRoutes.js`: Nghiệp vụ tìm kiếm xe, tạo đơn đặt xe (thuê theo giờ/ngày, giao tận nơi/tự lấy), áp dụng mã giảm giá voucher, quản lý ví điện tử, nạp tiền và yêu cầu rút tiền.
- **`handover/`**:
  - `handoverRoutes.js`: Quy trình bàn giao xe 2 chiều (Check-in nhận xe / Check-out trả xe), ghi nhận ODO, mức xăng/pin, tình trạng xe và gửi báo cáo sự cố phát sinh.
- **`owner/`**:
  - `ownerRoutes.js`: Phân hệ dành riêng cho Chủ xe (quản lý danh sách xe, đăng tải xe mới kèm tải ảnh/giấy tờ, theo dõi lịch sử cho thuê, báo cáo thu nhập).
- **`profile/`**:
  - `profileRoutes.js`: Quản lý thông tin tài khoản người dùng, cập nhật hồ sơ và gửi ảnh minh chứng xác minh định danh eKYC.

---

## 2. Phân Hệ Java Spring Boot (`java_modules/`)

Chứa mã nguồn Java Spring Boot ban đầu của nhóm (Dùng để tham chiếu nghiệp vụ, mô hình DTO, Service, Repository):
- `AuthService.java`: Quản lý đăng ký, đăng nhập và phân quyền người dùng.
- `AdminFinanceController.java`, `AdminService.java`: Nghiệp vụ tài chính quản trị.
- `OwnerService.java`, `OwnerVehicle.java`: Quản lý xe và tệp đính kèm của chủ xe.
- `WalletService.java`, `WalletTransaction.java`: Quản lý số dư ví và giao dịch.
- `ThueXeApplication.java`: Entry point Spring Boot.
