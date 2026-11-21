@echo off
chcp 65001 >nul
echo ========================================================
echo        HỆ THỐNG THUÊ XE MÁY - CÀI ĐẶT DOCKER (WINDOWS)
echo ========================================================
echo.

where docker >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Máy của bạn ĐÃ CÀI ĐẶT Docker!
    docker --version
    echo Bạn có thể chạy file "start.bat" hoặc gõ: docker compose up -d --build
    pause
    exit /b 0
)

echo [!] Chưa tìm thấy Docker trên máy của bạn.
echo Đang tiến hành cài đặt Docker Desktop qua công cụ Winget...
echo (Lưu ý: Yêu cầu kết nối mạng ổn định và quyền Quản trị Administrator)
echo.

winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo [THÀNH CÔNG] Docker Desktop đã được cài đặt!
    echo Vui lòng mở ứng dụng "Docker Desktop" từ Start Menu hoặc
    echo khởi động lại máy nếu Docker yêu cầu kích hoạt WSL 2.
    echo Sau khi Docker bật, bạn chỉ cần chạy "start.bat" để vào web.
    echo ========================================================
) else (
    echo.
    echo [THÔNG BÁO] Không thể tự cài qua Winget. 
    echo Đang mở trình duyệt để tải Docker Desktop trực tiếp từ trang chủ...
    start https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
)

echo.
pause
