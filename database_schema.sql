-- SQLBook: Code
-- ============================================================================
-- Dự án: Hệ thống Thuê Xe Máy (Group08)
-- Mô tả: Script khởi tạo cơ sở dữ liệu group08_db theo chuẩn MySQL (InnoDB, utf8mb4)
-- ============================================================================
CREATE DATABASE IF NOT EXISTS `group08_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE `group08_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- Xóa các bảng cũ nếu tồn tại (bao gồm bảng users đang có sẵn)
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `check_in_out_reports`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `vehicles`;
DROP TABLE IF EXISTS `withdrawal_requests`;
DROP TABLE IF EXISTS `wallets`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `identity_documents`;
DROP TABLE IF EXISTS `renters`;
DROP TABLE IF EXISTS `vehicle_owners`;
DROP TABLE IF EXISTS `admins`;
DROP TABLE IF EXISTS `vouchers`;
DROP TABLE IF EXISTS `users`;

-- ----------------------------------------------------------------------------
-- 1. users: Lưu trữ thông tin tài khoản chung của người dùng hệ thống
-- ----------------------------------------------------------------------------
CREATE TABLE `users` (
    `user_id` INT NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `identity_card_no` VARCHAR(30) DEFAULT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `kyc_status` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thông tin tài khoản chung (Admin, Chủ xe, Người thuê)';

-- ----------------------------------------------------------------------------
-- 2. vouchers: Quản lý mã giảm giá và chương trình khuyến mãi
-- ----------------------------------------------------------------------------
CREATE TABLE `vouchers` (
    `voucher_id` INT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(10) NOT NULL,
    `discount_percent` DOUBLE NOT NULL,
    `end_date` DATETIME NOT NULL,
    `usage_limit` INT NOT NULL DEFAULT 0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`voucher_id`),
    UNIQUE KEY `uq_vouchers_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Quản lý mã giảm giá áp dụng cho đơn thuê xe';

-- ----------------------------------------------------------------------------
-- 3. admins: Lưu thông tin mở rộng của quản trị viên (kế thừa từ users)
-- ----------------------------------------------------------------------------
CREATE TABLE `admins` (
    `user_id` INT NOT NULL,
    `admin_level` VARCHAR(50) NOT NULL DEFAULT 'moderator',
    `voucher_id` INT DEFAULT NULL,
    PRIMARY KEY (`user_id`),
    CONSTRAINT `fk_admins_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_admins_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`voucher_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thông tin quản trị viên hệ thống';

-- ----------------------------------------------------------------------------
-- 4. vehicle_owners: Lưu thông tin mở rộng của chủ xe (kế thừa từ users)
-- ----------------------------------------------------------------------------
CREATE TABLE `vehicle_owners` (
    `user_id` INT NOT NULL,
    `bank_account` VARCHAR(100) DEFAULT NULL,
    PRIMARY KEY (`user_id`),
    CONSTRAINT `fk_vehicle_owners_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thông tin chủ xe cho thuê và tài khoản nhận tiền';

-- ----------------------------------------------------------------------------
-- 5. renters: Lưu thông tin mở rộng của người thuê xe (kế thừa từ users)
-- ----------------------------------------------------------------------------
CREATE TABLE `renters` (
    `user_id` INT NOT NULL,
    `driving_license_no` VARCHAR(50) DEFAULT NULL,
    PRIMARY KEY (`user_id`),
    CONSTRAINT `fk_renters_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thông tin người thuê xe và giấy phép lái xe';

-- ----------------------------------------------------------------------------
-- 6. identity_documents: Lưu giấy tờ tùy thân (CCCD/GPLX) phục vụ xác minh KYC
-- ----------------------------------------------------------------------------
CREATE TABLE `identity_documents` (
    `document_id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `verified_by` INT DEFAULT NULL,
    `type` VARCHAR(30) NOT NULL,
    `document_no` VARCHAR(50) NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `verified_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`document_id`),
    CONSTRAINT `fk_identity_docs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_identity_docs_admin` FOREIGN KEY (`verified_by`) REFERENCES `admins` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Hồ sơ giấy tờ tùy thân và trạng thái duyệt KYC';

-- ----------------------------------------------------------------------------
-- 7. notifications: Lưu thông báo gửi tới người dùng
-- ----------------------------------------------------------------------------
CREATE TABLE `notifications` (
    `notification_id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `content` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`notification_id`),
    CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thông báo hệ thống gửi cho người dùng';

-- ----------------------------------------------------------------------------
-- 8. wallets: Quản lý ví điện tử và số dư của từng người dùng
-- ----------------------------------------------------------------------------
CREATE TABLE `wallets` (
    `wallet_id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `balance` DOUBLE NOT NULL DEFAULT 0,
    PRIMARY KEY (`wallet_id`),
    UNIQUE KEY `uq_wallets_user` (`user_id`),
    CONSTRAINT `fk_wallets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Ví tiền nội bộ và số dư khả dụng của người dùng';

-- ----------------------------------------------------------------------------
-- 9. withdrawal_requests: Quản lý yêu cầu rút tiền từ ví về ngân hàng
-- ----------------------------------------------------------------------------
CREATE TABLE `withdrawal_requests` (
    `request_id` INT NOT NULL AUTO_INCREMENT,
    `wallet_id` INT NOT NULL,
    `approved_by` INT DEFAULT NULL,
    `amount` DOUBLE NOT NULL,
    `bank_info` VARCHAR(255) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `processed_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`request_id`),
    CONSTRAINT `fk_withdrawal_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`wallet_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_withdrawal_admin` FOREIGN KEY (`approved_by`) REFERENCES `admins` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Yêu cầu rút tiền từ ví và trạng thái phê duyệt';

-- ----------------------------------------------------------------------------
-- 10. vehicles: Danh sách xe máy cho thuê của các chủ xe
-- ----------------------------------------------------------------------------
CREATE TABLE `vehicles` (
    `vehicle_id` INT NOT NULL AUTO_INCREMENT,
    `owner_id` INT NOT NULL,
    `approved_by` INT DEFAULT NULL,
    `brand` VARCHAR(50) NOT NULL,
    `model` VARCHAR(50) NOT NULL,
    `license_plate` VARCHAR(20) NOT NULL,
    `price_per_day` DOUBLE NOT NULL,
    `deposit_amount` DOUBLE NOT NULL DEFAULT 0,
    `approval_status` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `availability_status` VARCHAR(30) NOT NULL DEFAULT 'available',
    PRIMARY KEY (`vehicle_id`),
    UNIQUE KEY `uq_vehicles_plate` (`license_plate`),
    CONSTRAINT `fk_vehicles_owner` FOREIGN KEY (`owner_id`) REFERENCES `vehicle_owners` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_vehicles_admin` FOREIGN KEY (`approved_by`) REFERENCES `admins` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thông tin xe máy cho thuê, giá thuê và trạng thái duyệt';

-- ----------------------------------------------------------------------------
-- 11. bookings: Lưu thông tin đơn đặt thuê xe
-- ----------------------------------------------------------------------------
CREATE TABLE `bookings` (
    `booking_id` INT NOT NULL AUTO_INCREMENT,
    `renter_id` INT NOT NULL,
    `vehicle_id` INT NOT NULL,
    `start_date` DATETIME NOT NULL,
    `end_date` DATETIME NOT NULL,
    `total_amount` DOUBLE NOT NULL,
    `deposit_amount` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `voucher_id` INT DEFAULT NULL,
    PRIMARY KEY (`booking_id`),
    CONSTRAINT `fk_bookings_renter` FOREIGN KEY (`renter_id`) REFERENCES `renters` (`user_id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_bookings_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_bookings_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`voucher_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Đơn đặt thuê xe, thời gian thuê, tổng tiền và tiền cọc';

-- ----------------------------------------------------------------------------
-- 12. check_in_out_reports: Biên bản giao và nhận xe (kiểm tra tình trạng xe)
-- ----------------------------------------------------------------------------
CREATE TABLE `check_in_out_reports` (
    `report_id` INT NOT NULL AUTO_INCREMENT,
    `booking_id` INT NOT NULL,
    `audited_by` INT DEFAULT NULL,
    `check_in_odometer` INT DEFAULT NULL,
    `check_out_odometer` INT DEFAULT NULL,
    `check_in_fuel` VARCHAR(50) DEFAULT NULL,
    `check_out_fuel` VARCHAR(50) DEFAULT NULL,
    `inspection_photos` TEXT DEFAULT NULL,
    `damage_notes` TEXT DEFAULT NULL,
    `extra_fee` DOUBLE NOT NULL DEFAULT 0,
    PRIMARY KEY (`report_id`),
    CONSTRAINT `fk_reports_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reports_admin` FOREIGN KEY (`audited_by`) REFERENCES `admins` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Biên bản giao/nhận xe: số km, mức xăng, ảnh và phí phát sinh';

-- ----------------------------------------------------------------------------
-- 13. reviews: Đánh giá và nhận xét của người thuê sau chuyến đi
-- ----------------------------------------------------------------------------
CREATE TABLE `reviews` (
    `review_id` INT NOT NULL AUTO_INCREMENT,
    `booking_id` INT NOT NULL,
    `renter_id` INT NOT NULL,
    `vehicle_id` INT NOT NULL,
    `rating` INT NOT NULL,
    `comment` TEXT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`review_id`),
    CONSTRAINT `fk_reviews_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reviews_renter` FOREIGN KEY (`renter_id`) REFERENCES `renters` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reviews_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Đánh giá sao và bình luận của người thuê về xe';

-- ----------------------------------------------------------------------------
-- 14. transactions: Lịch sử giao dịch tài chính (thanh toán, cọc, hoàn tiền)
-- ----------------------------------------------------------------------------
CREATE TABLE `transactions` (
    `transaction_id` INT NOT NULL AUTO_INCREMENT,
    `wallet_id` INT NOT NULL,
    `booking_id` INT DEFAULT NULL,
    `amount` DOUBLE NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'completed',
    `description` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`transaction_id`),
    CONSTRAINT `fk_transactions_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`wallet_id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_transactions_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lịch sử biến động số dư ví và thanh toán đơn thuê';

SET FOREIGN_KEY_CHECKS = 1;
