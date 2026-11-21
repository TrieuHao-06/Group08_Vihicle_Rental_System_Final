# Cơ Sở Dữ Liệu Hệ Thống Thuê Xe Máy (Group 08)

Thư mục này lưu trữ kịch bản SQL và tài liệu thiết kế cơ sở dữ liệu cho dự án:

- **`database_schema.sql`**:
  - Chứa toàn bộ câu lệnh DDL khởi tạo cấu trúc 14 bảng dữ liệu quan hệ (`users`, `vehicles`, `bookings`, `wallets`, `transactions`, `vouchers`, `withdrawal_requests`, v.v.).
  - Chứa kịch bản DML nạp 100% dữ liệu mẫu (Seed Data) chuẩn hóa (100 xe máy, 8 người dùng, đơn đặt mẫu, lịch sử ví, biên bản giao nhận).
  - Tự động được nạp khi khởi chạy dự án bằng Docker (`docker-compose.yml`).
- **`DATABASE_NOTES.md`**:
  - Bảng đặc tả chi tiết 14 bảng, kiểu dữ liệu, các ràng buộc khóa ngoại (Foreign Keys) và quy tắc nghiệp vụ.
