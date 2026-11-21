# Group08 - Hệ Thống Thuê Xe Máy Trực Tuyến

Dự án cuối kì môn học Công Nghệ Phần Mềm.
Được đóng gói tự động toàn bộ ứng dụng (Node.js + Express) và Cơ sở dữ liệu (MySQL 8.0) bằng Docker Compose.

---

## 📁 Cấu Trúc Thư Mục Dự Án (Project Structure)

Toàn bộ dự án được phân chia bố cục rõ ràng theo đúng chức năng và phân hệ nghiệp vụ:

```text
Group08/
├── database/                    # Quản lý Cơ sở dữ liệu MySQL
│   ├── database_schema.sql      # Kịch bản DDL tạo 14 bảng & DML nạp 100% dữ liệu mẫu
│   ├── DATABASE_NOTES.md        # Đặc tả chi tiết 14 bảng, khóa ngoại và ràng buộc
│   └── README.md                # Tóm tắt vai trò thư mục cơ sở dữ liệu
│
├── doc/                         # Tài liệu đồ án môn học
│   ├── RequirementAndDesignDocument_Group08.docx  # Đặc tả yêu cầu (SRS) & Thiết kế kiến trúc
│   ├── Work_assignment.docx     # Bảng phân công nhiệm vụ thành viên nhóm 08
│   └── README.md                # Mục lục danh sách tài liệu
│
├── source code/                 # Mã nguồn toàn bộ hệ thống
│   ├── backend/                 # Hệ thống Backend API (Node.js Express + Module Java)
│   │   ├── config/              # Cấu hình dùng chung
│   │   │   └── db.js            # Khởi tạo MySQL Connection Pool tập trung
│   │   ├── admin/               # Phân hệ Quản trị viên
│   │   │   └── adminRoutes.js   # Duyệt eKYC, xử lý sự cố, duyệt rút tiền, voucher
│   │   ├── booking/             # Phân hệ Đặt xe & Tài chính
│   │   │   └── bookingRoutes.js # Đặt xe theo giờ/ngày, áp mã giảm giá, ví & giao dịch
│   │   ├── handover/            # Phân hệ Giao nhận xe
│   │   │   └── handoverRoutes.js# Check-in, Check-out, đối chiếu ODO/nhiên liệu & sự cố
│   │   ├── owner/               # Phân hệ Chủ xe
│   │   │   └── ownerRoutes.js   # Đăng tin xe, quản lý xe cho thuê, thống kê thu nhập
│   │   ├── profile/             # Phân hệ Người dùng & Định danh
│   │   │   └── profileRoutes.js # Thông tin cá nhân & tải minh chứng eKYC
│   │   ├── java_modules/        # Các module Java / Spring Boot tham chiếu ban đầu
│   │   │   └── (AuthService, OwnerService, WalletService, v.v.)
│   │   └── README.md            # Tài liệu kiến trúc backend
│   │
│   ├── front-end/               # Giao diện người dùng Web (HTML5/CSS3/Vanilla JS)
│   │   ├── index.html           # Trang giao diện chính của toàn bộ hệ thống
│   │   ├── thuexe.css           # Phong cách giao diện hiện đại (Modern Responsive UI)
│   │   ├── thuexe.js            # Logic frontend tương tác với API backend
│   │   ├── xecuaban.css         # Giao diện dành riêng cho Chủ xe
│   │   ├── xecuaban.js          # Logic quản lý xe của bạn
│   │   ├── logo.png             # Logo thương hiệu ứng dụng
│   │   ├── qr.jpg               # Mã QR mẫu nạp tiền ví điện tử
│   │   └── README.md            # Tài liệu mô tả phân hệ frontend
│   │
│   └── uploads/                 # Lưu trữ tệp tin tải lên của người dùng
│       └── vehicles/            # Thư mục lưu ảnh xe và giấy tờ xe
│           ├── docs/
│           └── photos/
│
├── server.js                    # Web server Node.js chính (Express entry point)
├── package.json                 # Khai báo cấu hình npm & thư viện phụ thuộc
├── Dockerfile                   # Kịch bản đóng gói ứng dụng container Node.js
├── docker-compose.yml           # Cấu hình chạy 1 lệnh đa dịch vụ (App + MySQL 8.0)
├── .dockerignore                # Loại bỏ file thừa khi build Docker
├── .gitignore                   # Cấu hình bỏ qua file nhị phân, node_modules, .env
├── .env.example                 # Mẫu khai báo biến môi trường chuẩn
├── install-docker.bat           # Script 1 chạm tự động cài Docker Desktop trên Windows
├── start.bat                    # Script 1 chạm khởi động dự án và mở trình duyệt web
└── README.md                    # Tài liệu hướng dẫn cài đặt & tổng quan hệ thống
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án Bằng Docker

Sau khi tải hoặc clone dự án về máy (`git clone ...`):

### Bước 1: Cài đặt Docker (Nếu máy chưa có Docker)

- **Trên Windows (Nhanh nhất)**: 
  - Nhấp đúp chuột vào file `install-docker.bat` trong thư mục dự án.
  - Hoặc mở PowerShell (Run as Administrator) và dán lệnh sau:
    ```powershell
    winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
    ```
- **Trên macOS**: Mở Terminal và chạy (yêu cầu Homebrew):
  ```bash
  brew install --cask docker
  ```
- **Trên Ubuntu / Linux**: Mở Terminal và chạy:
  ```bash
  curl -fsSL https://get.docker.com | sudo sh
  ```

> *Lưu ý*: Sau khi cài đặt hoàn tất, hãy **mở ứng dụng Docker Desktop** lên để Docker khởi động.

---

### Bước 2: Khởi chạy dự án

Tại thư mục gốc của dự án (`Group08`):

- **Trên Windows**:
  - Nhấp đúp vào file `start.bat` (file sẽ tự chạy `docker compose` và tự động mở trình duyệt `http://localhost:3000`).

- **Dùng lệnh trực tiếp (Windows / macOS / Linux)**:
  ```bash
  docker compose up -d --build
  ```

Sau khi chạy xong:
- **Địa chỉ truy cập Web**: [http://localhost:3000](http://localhost:3000)
- Cơ sở dữ liệu MySQL tự động khởi tạo và nạp dữ liệu đầy đủ từ `database/database_schema.sql`.

---

### Bước 3: Tắt hệ thống khi không sử dụng

Khi dừng làm việc, mở Terminal trong thư mục dự án và chạy:
```bash
docker compose down
```
*(Nếu muốn xóa dữ liệu đã lưu để chạy lại từ đầu như mới: `docker compose down -v`)*
