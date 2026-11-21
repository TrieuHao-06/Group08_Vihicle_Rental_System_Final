@echo off
chcp 65001 >nul
echo ========================================================
echo        KHỞI ĐỘNG DỰ ÁN THUÊ XE MÁY BẰNG DOCKER
echo ========================================================
echo.

where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [LỖI] Máy chưa cài Docker. Vui lòng chạy file "install-docker.bat" trước!
    pause
    exit /b 1
)

echo Đang khởi động hệ thống (App Node.js + CSDL MySQL)...
docker compose up -d --build

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo [THÀNH CÔNG] Hệ thống đã chạy hoàn tất!
    echo Đang mở trình duyệt vào http://localhost:3000 ...
    echo ========================================================
    start http://localhost:3000
) else (
    echo.
    echo [LỖI] Không thể khởi động Docker. Hãy đảm bảo Docker Desktop đã được mở (running).
)

echo.
pause
