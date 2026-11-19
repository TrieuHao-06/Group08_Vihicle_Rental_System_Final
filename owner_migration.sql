-- ============================================================================
-- Migration cho tab "Xe của bạn" (Hồng Trung)
-- Chạy 1 LẦN trên group08_db SAU KHI đã chạy database_schema.sql.
-- (gộp giúp phần này vào database_schema.sql nha)
-- ============================================================================
USE `group08_db`;

-- 1) Thêm các cột mà form "Đăng ký ký gửi xe" cần nhưng bảng vehicles chưa có
ALTER TABLE `vehicles`
    ADD COLUMN `vehicle_type`   VARCHAR(50) NOT NULL DEFAULT 'Xe tay ga' AFTER `model`,
    ADD COLUMN `engine_cc`      VARCHAR(30) NOT NULL DEFAULT '110cc'     AFTER `vehicle_type`,
    ADD COLUMN `fuel_type`      VARCHAR(30) NOT NULL DEFAULT 'Xăng'      AFTER `engine_cc`,
    ADD COLUMN `price_per_hour` DOUBLE      NOT NULL DEFAULT 0           AFTER `price_per_day`,
    ADD COLUMN `available_from` DATE        DEFAULT NULL,
    ADD COLUMN `available_to`   DATE        DEFAULT NULL;

-- Xe có sẵn trong DB chưa có giá theo giờ -> tạm lấy giá ngày / 6 (làm tròn nghìn)
UPDATE `vehicles` SET `price_per_hour` = ROUND(`price_per_day` / 6, -3) WHERE `price_per_hour` = 0;

-- 2) Bảng lưu ảnh xe + giấy tờ xe (cà vẹt, đăng kiểm) khi chủ xe đăng ký
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

-- ============================================================================
-- DỮ LIỆU DEMO (chỉ để test tab "Xe của bạn" với chủ xe user_id = 1). Không bắt buộc.
-- ============================================================================
-- Cho xe của chủ xe 1 được "duyệt" sẵn + có khung ngày cho thuê
UPDATE `vehicles`
   SET `approval_status` = 'approved', `available_from` = '2026-11-01', `available_to` = '2026-12-31'
 WHERE `owner_id` = 1;

-- Cho user 2, 3 đóng vai người thuê (bookings.renter_id phải có trong bảng renters)
INSERT IGNORE INTO `renters` (`user_id`) VALUES (2), (3);

INSERT INTO `bookings` (`renter_id`, `vehicle_id`, `start_date`, `end_date`, `total_amount`, `deposit_amount`, `status`) VALUES
(2, (SELECT vehicle_id FROM vehicles WHERE license_plate = '59A1-91159'), '2026-11-20 08:00:00', '2026-11-22 08:00:00',  240000, 480000, 'pending'),
(3, (SELECT vehicle_id FROM vehicles WHERE license_plate = '59A1-91159'), '2026-11-21 08:00:00', '2026-11-23 08:00:00',  240000, 480000, 'pending'),
(2, (SELECT vehicle_id FROM vehicles WHERE license_plate = '60B1-87818'), '2026-10-01 08:00:00', '2026-10-06 08:00:00', 1000000, 720000, 'completed'),
(3, (SELECT vehicle_id FROM vehicles WHERE license_plate = '60B1-87818'), '2026-10-10 08:00:00', '2026-10-13 08:00:00',  500000, 720000, 'completed');

-- Ví của chủ xe 1 có sẵn 1.350.000đ để thử rút tiền
INSERT INTO `wallets` (`user_id`, `balance`) VALUES (1, 1350000)
ON DUPLICATE KEY UPDATE `balance` = VALUES(`balance`);
