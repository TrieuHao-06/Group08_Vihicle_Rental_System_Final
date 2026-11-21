# Cấu Trúc Frontend Hệ Thống Thuê Xe Máy (Group 08)

Toàn bộ giao diện người dùng được tổ chức tập trung tại thư mục này:

- **`index.html`**: Giao diện Single Page Application (SPA) tích hợp đầy đủ các phân hệ người dùng, chủ xe và quản trị viên.
- **`thuexe.css`**: Hệ thống phong cách giao diện hiện đại (Modern UI, responsive, hiệu ứng chuyển tab, modal, bảng dữ liệu, badges).
- **`thuexe.js`**: Logic frontend chính:
  - Bộ lọc và tìm kiếm danh sách 100 xe.
  - Luồng đặt xe (theo giờ/ngày, giao tận nơi/tự lấy), áp dụng voucher.
  - Biên bản bàn giao 2 chiều Check-in & Check-out, báo cáo sự cố hư hỏng.
  - Phân hệ Quản trị viên: duyệt eKYC, duyệt sự cố, duyệt rút tiền, quản trị voucher và thống kê doanh thu.
  - Hồ sơ cá nhân & gửi minh chứng định danh eKYC.
- **`xecuaban.css` & `xecuaban.js`**: Giao diện và logic dành riêng cho Chủ xe (Đăng tin xe mới, quản lý xe đang cho thuê, theo dõi lịch sử thuê xe).
- **Tài nguyên tĩnh**:
  - `logo.png`: Logo nhận diện thương hiệu ứng dụng.
  - `qr.jpg`: Mã QR thanh toán nạp tiền ví điện tử.
