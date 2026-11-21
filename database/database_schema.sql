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
DROP TABLE IF EXISTS `vehicle_files`;
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
    `vehicle_type` VARCHAR(50) NOT NULL DEFAULT 'Xe tay ga',
    `engine_cc` VARCHAR(30) NOT NULL DEFAULT '110cc',
    `fuel_type` VARCHAR(30) NOT NULL DEFAULT 'Xăng',
    `license_plate` VARCHAR(20) NOT NULL,
    `price_per_day` DOUBLE NOT NULL,
    `price_per_hour` DOUBLE NOT NULL DEFAULT 0,
    `deposit_amount` DOUBLE NOT NULL DEFAULT 0,
    `area` VARCHAR(100) NOT NULL DEFAULT 'Quận 1',
    `available_from` DATE DEFAULT NULL,
    `available_to` DATE DEFAULT NULL,
    `approval_status` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `availability_status` VARCHAR(30) NOT NULL DEFAULT 'available',
    PRIMARY KEY (`vehicle_id`),
    UNIQUE KEY `uq_vehicles_plate` (`license_plate`),
    CONSTRAINT `fk_vehicles_owner` FOREIGN KEY (`owner_id`) REFERENCES `vehicle_owners` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_vehicles_admin` FOREIGN KEY (`approved_by`) REFERENCES `admins` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Thông tin xe máy cho thuê, giá thuê và trạng thái duyệt';

-- ----------------------------------------------------------------------------
-- 10b. vehicle_files: Bảng lưu ảnh xe + giấy tờ xe (cà vẹt, đăng kiểm)
-- ----------------------------------------------------------------------------
CREATE TABLE `vehicle_files` (
    `file_id`     INT NOT NULL AUTO_INCREMENT,
    `vehicle_id`  INT NOT NULL,
    `kind`        VARCHAR(20)  NOT NULL,            -- 'photo' | 'document'
    `file_path`   VARCHAR(255) NOT NULL,            -- đường dẫn tương đối trong thư mục uploads/vehicles
    `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`file_id`),
    CONSTRAINT `fk_vehicle_files_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Ảnh xe và giấy tờ xe do chủ xe tải lên';

-- ----------------------------------------------------------------------------
-- 11. bookings: Lưu thông tin đơn đặt thuê xe
-- ----------------------------------------------------------------------------
CREATE TABLE `bookings` (
    `booking_id` INT NOT NULL AUTO_INCREMENT,
    `renter_id` INT NOT NULL,
    `vehicle_id` INT NOT NULL,
    `rental_type` VARCHAR(20) NOT NULL DEFAULT 'daily',
    `delivery_method` VARCHAR(30) NOT NULL DEFAULT 'self_pickup',
    `delivery_address` VARCHAR(255) DEFAULT NULL,
    `delivery_fee` DOUBLE NOT NULL DEFAULT 0,
    `start_date` DATETIME NOT NULL,
    `end_date` DATETIME NOT NULL,
    `total_amount` DOUBLE NOT NULL,
    `deposit_amount` DOUBLE NOT NULL DEFAULT 0,
    `deposit_status` VARCHAR(30) NOT NULL DEFAULT 'held',
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

-- ============================================================================
-- NẠP DỮ LIỆU MẪU: 7 TÀI KHOẢN (5 CHỦ XE & 2 ADMIN) + 100 PHƯƠNG TIỆN
-- ============================================================================

INSERT INTO `users` (`user_id`, `full_name`, `email`, `phone`, `password_hash`) VALUES
(1, 'Nguyễn Văn An', 'an.nguyen@gmail.com', '0901111111', '12345678'),
(2, 'Trần Thị Bình', 'binh.tran@gmail.com', '0902222222', '12345678'),
(3, 'Lê Hoàng Cường', 'cuong.le@gmail.com', '0903333333', '12345678'),
(4, 'Phạm Minh Dung', 'dung.pham@gmail.com', '0904444444', '12345678'),
(5, 'Hoàng Văn Em', 'em.hoang@gmail.com', '0905555555', '12345678'),
(6, 'Super Admin Hệ Thống', 'admin.root@rentcar.vn', '0909999999', '12345678'),
(7, 'Quản Trị Viên Phụ', 'admin.sub@rentcar.vn', '0908888888', '12345678'),
(8, 'Trần Văn Hiền', 'tranvanhien@gmail.com', '0908425939', '123456789');

INSERT INTO `renters` (`user_id`, `driving_license_no`) VALUES
(8, '790123456789');

INSERT INTO `vehicle_owners` (`user_id`, `bank_account`) VALUES
(1, 'VCB - 0123456789'),
(2, 'TCB - 9876543210'),
(3, 'BIDV - 5555666677'),
(4, 'MB - 1238889999'),
(5, 'ACB - 4443332221');

INSERT INTO `admins` (`user_id`, `admin_level`) VALUES
(6, 'super_admin'),
(7, 'moderator');

INSERT INTO `vehicles` (`owner_id`, `brand`, `model`, `license_plate`, `price_per_day`, `deposit_amount`) VALUES
(3, 'VinFast', 'Klubo (2025)', '60B1-85557', 150000, 600000),
(2, 'Se Điện Pega', 'Pega X-Men (2026)', '29B1-90431', 80000, 320000),
(3, 'VinFast', 'Evo200 (2023)', '43C1-83482', 180000, 720000),
(3, 'Dat Bike', 'Weaver 2023 (2023)', '59A1-63740', 200000, 800000),
(1, 'Dat Bike', 'Quantum (2022)', '59A1-91159', 120000, 480000),
(4, 'Se Điện Pega', 'Pega New Tech (2023)', '29B1-37618', 100000, 400000),
(5, 'Yadea', 'Yadea X-Bull (2026)', '43C1-40596', 150000, 600000),
(3, 'Se Điện Pega', 'Pega Aura+ (2022)', '29B1-37810', 100000, 400000),
(2, 'Se Điện Pega', 'Pega New Tech (2025)', '50F1-16226', 150000, 600000),
(5, 'Se Điện Pega', 'Pega X-Men (2023)', '29B1-31590', 80000, 320000),
(4, 'Yadea', 'Yadea Odora (2022)', '59A1-36166', 200000, 800000),
(5, 'Dibao', 'Dibao Tesla Chic (2025)', '59A1-92005', 150000, 600000),
(1, 'Dat Bike', 'Weaver (2022)', '60B1-87818', 180000, 720000),
(1, 'Dibao', 'Dibao Gogo Cross (2022)', '59A1-94571', 180000, 720000),
(3, 'VinFast', 'Evo200 (2026)', '59A1-33480', 80000, 320000),
(4, 'Dibao', 'Dibao Pansy S (2023)', '59A1-45705', 180000, 720000),
(4, 'Dat Bike', 'Weaver (2022)', '29B1-65627', 150000, 600000),
(1, 'Dat Bike', 'Weaver 2023 (2023)', '29B1-56176', 120000, 480000),
(5, 'Se Điện Pega', 'Pega Aura+ (2026)', '50F1-70990', 100000, 400000),
(5, 'Dat Bike', 'Weaver 2023 (2023)', '50F1-17464', 80000, 320000),
(2, 'Dibao', 'Dibao Tesla Chic (2022)', '43C1-66211', 80000, 320000),
(2, 'Dat Bike', 'Weaver (2025)', '60B1-45958', 120000, 480000),
(1, 'Dat Bike', 'Weaver (2024)', '29B1-37508', 180000, 720000),
(5, 'Se Điện Pega', 'Pega Eco (2023)', '59A1-43059', 120000, 480000),
(4, 'Dibao', 'Dibao Jeek One (2026)', '29B1-97679', 150000, 600000),
(4, 'Dibao', 'Dibao Jeek One (2023)', '43C1-78171', 80000, 320000),
(3, 'Yadea', 'Yadea X-Bull (2025)', '29B1-25635', 200000, 800000),
(2, 'VinFast', 'Evo200 (2026)', '29B1-50644', 150000, 600000),
(5, 'Dat Bike', 'Quantum (2022)', '29B1-99420', 150000, 600000),
(1, 'Dibao', 'Dibao Pansy S (2026)', '59A1-88976', 150000, 600000),
(5, 'Dibao', 'Dibao Gogo Cross (2022)', '50F1-77420', 100000, 400000),
(1, 'Yadea', 'Yadea Odora (2023)', '59A1-72554', 100000, 400000),
(2, 'Dat Bike', 'Quantum (2024)', '59A1-95740', 100000, 400000),
(3, 'Dat Bike', 'Quantum (2023)', '60B1-90140', 200000, 800000),
(4, 'Se Điện Pega', 'Pega Aura+ (2025)', '59A1-64446', 100000, 400000),
(2, 'Dat Bike', 'Quantum (2025)', '60B1-38714', 150000, 600000),
(4, 'Yadea', 'Yadea Odora (2024)', '59A1-92282', 200000, 800000),
(2, 'VinFast', 'Klubo (2023)', '59A1-71332', 150000, 600000),
(3, 'Yadea', 'Yadea i8 (2022)', '43C1-29953', 100000, 400000),
(2, 'Dat Bike', 'Quantum S (2024)', '43C1-12462', 120000, 480000),
(1, 'Se Điện Pega', 'Pega New Tech (2024)', '29B1-98033', 200000, 800000),
(1, 'Yadea', 'Yadea X-Bull (2023)', '43C1-75980', 200000, 800000),
(4, 'Yadea', 'Yadea Odora (2024)', '50F1-30423', 180000, 720000),
(4, 'Yadea', 'Yadea i8 (2024)', '60B1-28651', 200000, 800000),
(1, 'VinFast', 'Theon S (2024)', '50F1-21708', 150000, 600000),
(5, 'Dibao', 'Dibao Jeek One (2024)', '43C1-16907', 80000, 320000),
(5, 'Yadea', 'Yadea Odora (2022)', '60B1-72870', 200000, 800000),
(1, 'Yadea', 'Yadea G5 (2025)', '59A1-41881', 80000, 320000),
(2, 'Dat Bike', 'Weaver++ (2022)', '60B1-26400', 100000, 400000),
(4, 'Yadea', 'Yadea Ulike (2025)', '29B1-92474', 80000, 320000),
(5, 'Piaggio', 'Medley 125 (2023)', '60B1-38923', 250000, 1000000),
(3, 'Piaggio', 'Vespa Sprint 150 (2023)', '29B1-12873', 100000, 400000),
(4, 'Suzuki', 'Address 110 (2022)', '43C1-44804', 220000, 880000),
(2, 'Suzuki', 'Raider R150 (2022)', '59A1-73860', 150000, 600000),
(2, 'Piaggio', 'Vespa Primavera (2021)', '43C1-86216', 100000, 400000),
(2, 'Honda', 'Air Blade 150 (2025)', '59A1-67607', 250000, 1000000),
(3, 'Yamaha', 'Sirius (2023)', '50F1-10591', 220000, 880000),
(1, 'Suzuki', 'Raider R150 (2024)', '29B1-34793', 220000, 880000),
(3, 'Honda', 'Winner X (2024)', '50F1-21568', 180000, 720000),
(5, 'Yamaha', 'Jupiter Finn (2022)', '43C1-14415', 130000, 520000),
(2, 'Yamaha', 'Grande (2023)', '29B1-95404', 130000, 520000),
(3, 'Yamaha', 'Grande (2022)', '43C1-12501', 220000, 880000),
(2, 'Honda', 'Vision 2023', '43C1-19475', 220000, 880000),
(1, 'Suzuki', 'Burgman Street (2024)', '50F1-45201', 150000, 600000),
(3, 'Suzuki', 'Address 110 (2023)', '59A1-79797', 100000, 400000),
(5, 'Piaggio', 'Vespa Sprint 150 (2022)', '50F1-25050', 150000, 600000),
(2, 'Piaggio', 'Liberty 125 (2025)', '60B1-25721', 180000, 720000),
(3, 'Yamaha', 'Jupiter Finn (2024)', '29B1-95746', 220000, 880000),
(3, 'Yamaha', 'Janus (2021)', '59A1-26373', 130000, 520000),
(2, 'Piaggio', 'Vespa Primavera (2024)', '50F1-22812', 220000, 880000),
(5, 'Yamaha', 'Grande (2021)', '43C1-50463', 180000, 720000),
(3, 'Honda', 'Lead 125 (2021)', '59A1-46520', 180000, 720000),
(3, 'Honda', 'Future 125 (2021)', '43C1-75468', 130000, 520000),
(4, 'Suzuki', 'Burgman Street (2022)', '60B1-59052', 130000, 520000),
(3, 'Honda', 'Wave Alpha (2024)', '60B1-91032', 100000, 400000),
(4, 'Piaggio', 'Vespa Primavera (2025)', '50F1-60698', 130000, 520000),
(5, 'Piaggio', 'Vespa Primavera (2025)', '60B1-65791', 100000, 400000),
(1, 'Honda', 'Vision 2024', '43C1-28651', 150000, 600000),
(3, 'Suzuki', 'Burgman Street (2023)', '60B1-19086', 100000, 400000),
(2, 'Yamaha', 'Jupiter Finn (2024)', '43C1-57954', 130000, 520000),
(5, 'Suzuki', 'Raider R150 (2023)', '59A1-56345', 130000, 520000),
(1, 'Yamaha', 'Sirius (2024)', '60B1-18603', 130000, 520000),
(5, 'Yamaha', 'Exciter 155 VVA (2025)', '59A1-78553', 130000, 520000),
(3, 'Piaggio', 'Medley 125 (2021)', '60B1-80098', 220000, 880000),
(2, 'Piaggio', 'Medley 125 (2021)', '29B1-94205', 130000, 520000),
(2, 'Honda', 'Future 125 (2021)', '59A1-76041', 220000, 880000),
(3, 'Piaggio', 'Liberty 125 (2023)', '59A1-69665', 220000, 880000),
(5, 'Yamaha', 'Jupiter Finn (2023)', '29B1-48115', 180000, 720000),
(4, 'Yamaha', 'Exciter 155 VVA (2024)', '59A1-40723', 250000, 1000000),
(1, 'Yamaha', 'Sirius (2025)', '43C1-90530', 250000, 1000000),
(1, 'Suzuki', 'Satria F150 (2023)', '43C1-54316', 250000, 1000000),
(3, 'Honda', 'Vision 2023', '50F1-41406', 250000, 1000000),
(2, 'Suzuki', 'Satria F150 (2024)', '60B1-26685', 100000, 400000),
(4, 'Piaggio', 'Vespa Primavera (2024)', '60B1-19336', 150000, 600000),
(4, 'Piaggio', 'Liberty 125 (2021)', '29B1-21898', 130000, 520000),
(4, 'Honda', 'Future 125 (2021)', '59A1-49510', 150000, 600000),
(3, 'Honda', 'Winner X (2025)', '43C1-91533', 100000, 400000),
(1, 'Suzuki', 'Satria F150 (2022)', '29B1-39171', 180000, 720000),
(1, 'Honda', 'Lead 125 (2025)', '59A1-78616', 100000, 400000),
(1, 'Piaggio', 'Vespa Primavera (2022)', '50F1-85090', 130000, 520000);

-- ============================================================================
-- NẠP DỮ LIỆU MẪU: BẢNG VOUCHERS (MÃ GIẢM GIÁ)
-- ============================================================================
INSERT INTO `vouchers` (`code`, `discount_percent`, `end_date`, `usage_limit`, `status`) VALUES
('CONBO01', 10.0, '2027-01-29 23:59:59', 300, 'active'),
('CONHEO01', 30.0, '2027-01-19 23:59:59', 300, 'active'),
('CONCHO01', 15.0, '2026-11-14 23:59:59', 300, 'expired'),
('BONBON10', 10.0, '2027-12-31 23:59:59', 500, 'active');

-- ============================================================================
-- NẠP DỮ LIỆU MẪU: BẢNG WALLETS (VÍ ĐIỆN TỬ)
-- ============================================================================
INSERT INTO `wallets` (`user_id`, `balance`) VALUES
(1, 2500000.0),
(2, 1800000.0),
(3, 3200000.0),
(4, 1500000.0),
(5, 2000000.0),
(6, 10000000.0),
(7, 5000000.0),
(8, 2500000.0);

-- ============================================================================
-- NẠP DỮ LIỆU MẪU: BẢNG IDENTITY_DOCUMENTS (XÁC THỰC eKYC)
-- ============================================================================
INSERT INTO `identity_documents` (`user_id`, `verified_by`, `type`, `document_no`, `image_url`, `status`, `verified_at`) VALUES
(8, 6, 'CCCD', '089208001234', 'uploads/kyc/cccd_user8.jpg', 'verified', '2026-11-04 10:30:00'),
(8, 6, 'GPLX', '790123456789', 'uploads/kyc/gplx_user8.jpg', 'verified', '2026-11-04 10:35:00'),
(1, 6, 'CCCD', '079090001111', 'uploads/kyc/cccd_user1.jpg', 'verified', '2026-10-25 09:15:00'),
(2, NULL, 'CCCD', '079090002222', 'uploads/kyc/cccd_user2.jpg', 'pending', NULL);

-- ============================================================================
-- NẠP DỮ LIỆU MẪU: BẢNG BOOKINGS (ĐƠN ĐẶT THUÊ XE)
-- ============================================================================
INSERT INTO `bookings` (
    `booking_id`, `renter_id`, `vehicle_id`, `voucher_id`, 
    `rental_type`, `delivery_method`, `delivery_address`, `delivery_fee`, 
    `start_date`, `end_date`, `total_amount`, `deposit_amount`, 
    `deposit_status`, `status`
) VALUES
(1, 8, 1, 1, 'daily', 'self_pickup', 'Quận 1, TP.HCM', 0.0, 
 '2026-11-04 08:00:00', '2026-11-05 08:00:00', 126000.0, 300000.0, 'approved_refund', 'completed'),
(2, 8, 4, NULL, 'hourly', 'delivery_to_door', 'Ga Quốc nội Sân bay Tân Sơn Nhất, Quận Tân Bình', 40000.0, 
 '2026-11-19 14:00:00', '2026-11-19 18:00:00', 140000.0, 800000.0, 'held', 'active'),
(3, 8, 12, NULL, 'daily', 'delivery_to_door', 'Khách sạn Rex, 141 Nguyễn Huệ, Quận 1', 30000.0, 
 '2026-11-25 08:00:00', '2026-11-28 08:00:00', 480000.0, 600000.0, 'held', 'pending');

-- ============================================================================
-- NẠP DỮ LIỆU MẪU: BẢNG CHECK_IN_OUT_REPORTS (BIÊN BẢN GIAO NHẬN XE 2 CHIỀU)
-- ============================================================================
INSERT INTO `check_in_out_reports` (
    `report_id`, `booking_id`, `audited_by`, 
    `check_in_odometer`, `check_out_odometer`, 
    `check_in_fuel`, `check_out_fuel`, 
    `inspection_photos`, `damage_notes`, `extra_fee`
) VALUES
(1, 1, 6, 8420, 8485, '90%', '85%', 'uploads/inspections/bk1_renter.jpg, uploads/inspections/bk1_owner.jpg', 'Biên bản 2 chiều đã khớp hoàn toàn. Đủ 02 mũ bảo hiểm, xe nguyên vẹn.', 0.0),
(2, 2, NULL, 12500, NULL, '100%', NULL, 'uploads/inspections/bk2_pickup.jpg', 'Bàn giao xe tại sân bay TSN. Xe mới, pin 100%.', 0.0);

-- ============================================================================
-- NẠP DỮ LIỆU MẪU: BẢNG REVIEWS (ĐÁNH GIÁ VÀ NHẬN XÉT CỦA KHÁCH)
-- ============================================================================
INSERT INTO `reviews` (
    `review_id`, `booking_id`, `renter_id`, `vehicle_id`, 
    `rating`, `comment`, `created_at`
) VALUES
-- Bài đánh giá 5 sao cho đơn #BK0001 (xe VinFast Klubo ID 1) từ khách Triệu Quang Hào (ID 8)
(1, 1, 8, 1, 5, 'Xe chạy rất êm, bình xăng/pin đầy đủ. Chủ xe bàn giao đúng giờ và hướng dẫn rất nhiệt tình!', '2026-11-05 09:30:00');

-- ============================================================================
-- NẠP DỮ LIỆU MẪU: BẢNG TRANSACTIONS (LỊCH SỬ GIAO DỊCH VÀ BIẾN ĐỘNG VÍ)
-- ============================================================================
INSERT INTO `transactions` (
    `transaction_id`, `wallet_id`, `booking_id`, 
    `amount`, `type`, `status`, `description`, `created_at`
)
SELECT 100, w.wallet_id, NULL, 2200000.0, 'topup', 'completed', 'Nạp tiền qua ngân hàng', '2026-11-03 14:20:00'
FROM `wallets` w WHERE w.user_id = 8
UNION ALL
SELECT 101, w.wallet_id, 1, -300000.0, 'deposit_held', 'completed', 'Tạm giữ cọc xe đơn #BK0001', '2026-11-04 08:00:00'
FROM `wallets` w WHERE w.user_id = 8
UNION ALL
SELECT 102, w.wallet_id, 1, -126000.0, 'rental_payment', 'completed', 'Thanh toán tiền thuê xe đơn #BK0001', '2026-11-04 08:00:00'
FROM `wallets` w WHERE w.user_id = 8
UNION ALL
SELECT 103, w.wallet_id, 1, 300000.0, 'deposit_refund', 'completed', 'Hoàn cọc tự động đơn #BK0001 (Admin duyệt)', '2026-11-05 09:00:00'
FROM `wallets` w WHERE w.user_id = 8;

-- ============================================================================
-- NẠP DỮ LIỆU MẪU: BẢNG WITHDRAWAL_REQUESTS (YÊU CẦU RÚT TIỀN)
-- ============================================================================
INSERT INTO `withdrawal_requests` (
    `request_id`, `wallet_id`, `approved_by`, `amount`, `bank_info`, `status`, `requested_at`, `processed_at`
)
SELECT 1, w.wallet_id, 6, 1000000.0, 'VCB - 0123456789 - Nguyen Van An', 'approved', '2026-11-06 14:00:00', '2026-11-06 15:30:00'
FROM `wallets` w WHERE w.user_id = 1
UNION ALL
SELECT 2, w.wallet_id, NULL, 500000.0, 'MB - 0908425939 - Trieu Quang Hao', 'pending', '2026-11-19 20:00:00', NULL
FROM `wallets` w WHERE w.user_id = 8;

-- ============================================================================
-- NẠP DỮ LIỆU MẪU: BẢNG NOTIFICATIONS (THÔNG BÁO HỆ THỐNG)
-- ============================================================================
INSERT INTO `notifications` (`user_id`, `title`, `content`, `is_read`, `created_at`) VALUES
(1, 'Rút tiền thành công', 'Yêu cầu rút 1.000.000đ về tài khoản VCB của bạn đã được Admin phê duyệt.', TRUE, '2026-11-06 15:30:00'),
(8, 'Yêu cầu rút tiền đang chờ xử lý', 'Hệ thống đã tiếp nhận yêu cầu rút 500.000đ của bạn. Quản trị viên sẽ xử lý trong vòng 24h.', FALSE, '2026-11-19 20:00:00'),
(8, 'Đặt xe #BK0001 thành công', 'Đơn đặt xe VinFast Klubo của bạn đã được xác nhận. Chúc bạn có một chuyến đi an toàn!', TRUE, '2026-11-04 08:00:00');

-- ============================================================================
-- CẬP NHẬT GIÁ THUÊ THEO GIỜ & KHUNG NGÀY CHO THUÊ (TAB XE CỦA BẠN)
-- ============================================================================
UPDATE `vehicles` SET `price_per_hour` = ROUND(`price_per_day` / 6, -3) WHERE `price_per_hour` = 0;

-- Phân bổ khu vực xe theo các quận/huyện TP.HCM cho các xe mẫu
UPDATE `vehicles`
   SET `area` = ELT(1 + (`vehicle_id` % 9), 'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 7', 'Quận Phú Nhuận', 'Quận Bình Thạnh', 'Quận Gò Vấp', 'TP. Thủ Đức');

-- Cấu hình duyệt và lịch rảnh cho chủ xe mẫu (user_id = 1)
UPDATE `vehicles`
   SET `approval_status` = 'approved', `available_from` = '2026-11-01', `available_to` = '2026-12-31'
 WHERE `owner_id` = 1;

-- Ví của chủ xe 1 có sẵn 1.350.000đ để thử rút tiền
INSERT INTO `wallets` (`user_id`, `balance`) VALUES (1, 1350000)
ON DUPLICATE KEY UPDATE `balance` = VALUES(`balance`);







