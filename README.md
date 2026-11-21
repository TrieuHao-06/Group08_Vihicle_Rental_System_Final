# Group08 - Hệ Thống Thuê Xe Máy Trực Tuyến

Dự án cuối kì môn học Công Nghệ Phần Mềm.
Được đóng gói tự động toàn bộ ứng dụng (Node.js + Express) và Cơ sở dữ liệu (MySQL 8.0) bằng Docker Compose.

---

## Hướng dẫn cài đặt & Chạy dự án bằng Docker (Cách C - GitHub)

Người nhận sau khi clone dự án về máy (`git clone ...`) chỉ cần làm theo 2 bước:

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
