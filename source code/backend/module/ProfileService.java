import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Scanner;

/**
 * ProfileService.java
 * Hệ thống Quản lý Thuê Xe Máy (Group08)
 * 
 * Chức năng 2: Quản lý hồ sơ cá nhân (Manage Profile)
 * - Xem hồ sơ chi tiết (kèm trạng thái eKYC & số dư ví).
 * - Cập nhật thông tin cơ bản (họ tên, SĐT, email).
 * - Đổi mật khẩu tài khoản.
 * 
 * Chức năng 3: Nộp giấy tờ tùy thân eKYC (Upload Identity Document)
 * - Nộp ảnh & số CCCD (trạng thái pending chờ Admin duyệt).
 * - Nộp Bằng lái xe (GPLX).
 * - Tự động phát sinh thông báo vào bảng notifications.
 */
public class ProfileService {

    // Cấu hình kết nối MySQL database
    private static final String DB_HOST = "127.0.0.1";
    private static final int DB_PORT = 3306;
    private static final String DB_NAME = "group08_db";
    private static final String DB_USER = "root";
    private static final String DB_PASS = "123456";

    private static final String DB_URL = "jdbc:mysql://" + DB_HOST + ":" + DB_PORT + "/" + DB_NAME
            + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8&useUnicode=true";

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
    }

    // =========================================================================
    // CHỨC NĂNG 2: QUẢN LÝ HỒ SƠ CÁ NHÂN (MANAGE PROFILE)
    // =========================================================================

    /**
     * Xem thông tin hồ sơ chi tiết của người dùng.
     */
    public static void viewProfile(int userId) {
        String sql = "SELECT u.user_id, u.full_name, u.email, u.phone, u.identity_card_no, "
                   + "       u.kyc_status, u.status, u.created_at, "
                   + "       w.balance, r.driving_license_no, vo.bank_account, a.admin_level "
                   + "FROM users u "
                   + "LEFT JOIN wallets w ON u.user_id = w.user_id "
                   + "LEFT JOIN renters r ON u.user_id = r.user_id "
                   + "LEFT JOIN vehicle_owners vo ON u.user_id = vo.user_id "
                   + "LEFT JOIN admins a ON u.user_id = a.user_id "
                   + "WHERE u.user_id = ?";

        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (!rs.next()) {
                    System.out.println("❌ Không tìm thấy thông tin cho User ID: " + userId);
                    return;
                }

                System.out.println("\n========== THÔNG TIN HỒ SƠ NGƯỜI DÙNG ==========");
                System.out.println("🆔 User ID           : " + rs.getInt("user_id"));
                System.out.println("👤 Họ và tên         : " + rs.getString("full_name"));
                System.out.println("📧 Email             : " + rs.getString("email"));
                System.out.println("📱 Số điện thoại     : " + rs.getString("phone"));
                System.out.println("🪪 Số CCCD           : " + (rs.getString("identity_card_no") != null ? rs.getString("identity_card_no") : "Chưa cập nhật"));
                System.out.println("🚦 Trạng thái eKYC   : " + rs.getString("kyc_status"));
                System.out.println("🔒 Trạng thái tài khoản: " + rs.getString("status"));
                System.out.println("📅 Ngày tham gia     : " + rs.getString("created_at"));

                // Thông tin ví
                double balance = rs.getDouble("balance");
                System.out.printf("💰 Số dư ví điện tử  : %,.0f VNĐ%n", balance);

                // Vai trò mở rộng
                if (rs.getString("admin_level") != null) {
                    System.out.println("👑 Vai trò           : QUẢN TRỊ VIÊN (" + rs.getString("admin_level") + ")");
                } else if (rs.getString("bank_account") != null) {
                    System.out.println("🛵 Vai trò           : CHỦ XE (STK: " + rs.getString("bank_account") + ")");
                } else {
                    System.out.println("🛵 Vai trò           : NGƯỜI THUÊ XE");
                    String gplx = rs.getString("driving_license_no");
                    System.out.println("📋 Bằng lái xe (GPLX): " + (gplx != null ? gplx : "Chưa cập nhật"));
                }
                System.out.println("================================================");
            }

        } catch (SQLException e) {
            System.out.println("❌ Lỗi Database khi tải hồ sơ: " + e.getMessage());
        }
    }

    /**
     * Cập nhật thông tin cơ bản: Họ tên, Số điện thoại.
     */
    public static boolean updateProfile(int userId, String newFullName, String newPhone) {
        if (newFullName == null || newFullName.trim().isEmpty()
                || newPhone == null || newPhone.trim().isEmpty()) {
            System.out.println("❌ Lỗi: Họ tên và số điện thoại không được để trống!");
            return false;
        }

        // Kiểm tra xem số điện thoại mới có bị trùng với người khác không
        String checkPhoneSql = "SELECT user_id FROM users WHERE phone = ? AND user_id <> ? LIMIT 1";
        String updateSql = "UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?";

        try (Connection conn = getConnection()) {
            try (PreparedStatement checkStmt = conn.prepareStatement(checkPhoneSql)) {
                checkStmt.setString(1, newPhone.trim());
                checkStmt.setInt(2, userId);
                try (ResultSet rs = checkStmt.executeQuery()) {
                    if (rs.next()) {
                        System.out.println("❌ Lỗi: Số điện thoại này đã được sử dụng bởi tài khoản khác!");
                        return false;
                    }
                }
            }

            try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                updateStmt.setString(1, newFullName.trim());
                updateStmt.setString(2, newPhone.trim());
                updateStmt.setInt(3, userId);

                int rows = updateStmt.executeUpdate();
                if (rows > 0) {
                    System.out.println("✅ Cập nhật hồ sơ thành công!");
                    return true;
                } else {
                    System.out.println("❌ Không tìm thấy người dùng để cập nhật!");
                    return false;
                }
            }

        } catch (SQLException e) {
            System.out.println("❌ Lỗi Database khi cập nhật hồ sơ: " + e.getMessage());
            return false;
        }
    }

    /**
     * Đổi mật khẩu tài khoản.
     */
    public static boolean changePassword(int userId, String oldPassword, String newPassword) {
        if (oldPassword == null || oldPassword.isEmpty() || newPassword == null || newPassword.isEmpty()) {
            System.out.println("❌ Lỗi: Vui lòng nhập đầy đủ mật khẩu cũ và mới!");
            return false;
        }

        if (newPassword.length() < 8) {
            System.out.println("❌ Lỗi: Mật khẩu mới phải có tối thiểu 8 ký tự!");
            return false;
        }

        String checkSql = "SELECT password_hash FROM users WHERE user_id = ?";
        String updateSql = "UPDATE users SET password_hash = ? WHERE user_id = ?";

        try (Connection conn = getConnection();
             PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {

            checkStmt.setInt(1, userId);
            try (ResultSet rs = checkStmt.executeQuery()) {
                if (!rs.next()) {
                    System.out.println("❌ Không tìm thấy tài khoản!");
                    return false;
                }

                String currentPasswordHash = rs.getString("password_hash");
                if (!oldPassword.equals(currentPasswordHash)) {
                    System.out.println("❌ Mật khẩu hiện tại không đúng!");
                    return false;
                }
            }

            try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                updateStmt.setString(1, newPassword);
                updateStmt.setInt(2, userId);
                updateStmt.executeUpdate();
                System.out.println("✅ Đổi mật khẩu thành công!");
                return true;
            }

        } catch (SQLException e) {
            System.out.println("❌ Lỗi Database khi đổi mật khẩu: " + e.getMessage());
            return false;
        }
    }

    // =========================================================================
    // CHỨC NĂNG 3: NỘP HỒ SƠ TÙY THÂN eKYC (UPLOAD IDENTITY DOCUMENT)
    // =========================================================================

    /**
     * Nộp giấy tờ tùy thân (CCCD / GPLX) lên hệ thống để chờ Admin phê duyệt.
     */
    public static boolean uploadDocument(int userId, String type, String documentNo, String imageUrl) {
        if (type == null || (!type.equalsIgnoreCase("CCCD") && !type.equalsIgnoreCase("GPLX"))) {
            System.out.println("❌ Lỗi: Loại giấy tờ phải là 'CCCD' hoặc 'GPLX'!");
            return false;
        }

        if (documentNo == null || documentNo.trim().isEmpty() || imageUrl == null || imageUrl.trim().isEmpty()) {
            System.out.println("❌ Lỗi: Số giấy tờ và đường dẫn ảnh không được để trống!");
            return false;
        }

        String insertDocSql = "INSERT INTO identity_documents (user_id, verified_by, type, document_no, image_url, status) "
                            + "VALUES (?, NULL, ?, ?, ?, 'pending')";
        String updateUserSql = type.equalsIgnoreCase("CCCD")
                ? "UPDATE users SET identity_card_no = ?, kyc_status = 'pending' WHERE user_id = ?"
                : "UPDATE renters SET driving_license_no = ? WHERE user_id = ?";
        String notifySql = "INSERT INTO notifications (user_id, title, content, is_read) VALUES (?, ?, ?, FALSE)";

        Connection conn = null;
        try {
            conn = getConnection();
            conn.setAutoCommit(false); // Dùng Transaction

            // 1. Thêm bản ghi vào bảng identity_documents
            try (PreparedStatement docStmt = conn.prepareStatement(insertDocSql)) {
                docStmt.setInt(1, userId);
                docStmt.setString(2, type.toUpperCase());
                docStmt.setString(3, documentNo.trim());
                docStmt.setString(4, imageUrl.trim());
                docStmt.executeUpdate();
            }

            // 2. Cập nhật số giấy tờ vào bảng users hoặc renters
            try (PreparedStatement userStmt = conn.prepareStatement(updateUserSql)) {
                userStmt.setString(1, documentNo.trim());
                userStmt.setInt(2, userId);
                userStmt.executeUpdate();
            }

            // 3. Gửi thông báo hệ thống vào bảng notifications
            try (PreparedStatement notiStmt = conn.prepareStatement(notifySql)) {
                notiStmt.setInt(1, userId);
                notiStmt.setString(2, "Đã gửi hồ sơ xác minh " + type.toUpperCase());
                notiStmt.setString(3, "Hệ thống đã tiếp nhận giấy tờ " + type.toUpperCase() + " (Số: " + documentNo.trim() + ") của bạn. Quản trị viên sẽ kiểm tra và phê duyệt sớm.");
                notiStmt.executeUpdate();
            }

            conn.commit();
            System.out.println("✅ Nộp hồ sơ " + type.toUpperCase() + " thành công!");
            System.out.println("📌 Trạng thái hiện tại: 'pending' (Đang chờ Admin thẩm định và duyệt)");
            return true;

        } catch (SQLException e) {
            System.out.println("❌ Lỗi Database khi nộp giấy tờ: " + e.getMessage());
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ignored) {}
            }
            return false;
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException ignored) {}
            }
        }
    }

    /**
     * Menu Console để kiểm thử trực tiếp
     */
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in, "UTF-8");

        System.out.println("==================================================");
        System.out.println("   MODULE QUẢN LÝ HỒ SƠ & eKYC (GROUP 08)         ");
        System.out.println("==================================================");

        // Nhập ID người dùng muốn thao tác (Mặc định tài khoản vừa tạo là 8)
        System.out.print("👉 Nhập User ID muốn quản lý (Mặc định nhấn Enter lấy ID = 8): ");
        String idInput = scanner.nextLine().trim();
        int currentUserId = idInput.isEmpty() ? 8 : Integer.parseInt(idInput);

        boolean running = true;
        while (running) {
            System.out.println("\n----------------- MENU CHỨC NĂNG -----------------");
            System.out.println("1. Xem chi tiết hồ sơ cá nhân (kèm eKYC & Ví)");
            System.out.println("2. Cập nhật thông tin cá nhân (Họ tên, SĐT)");
            System.out.println("3. Đổi mật khẩu");
            System.out.println("4. Nộp hồ sơ CCCD (eKYC)");
            System.out.println("5. Nộp hồ sơ Bằng lái xe (GPLX)");
            System.out.println("0. Thoát chương trình");
            System.out.print("👉 Mời bạn chọn (0-5): ");

            String choice = scanner.nextLine().trim();
            switch (choice) {
                case "1":
                    viewProfile(currentUserId);
                    break;

                case "2":
                    System.out.println("\n--- CẬP NHẬT THÔNG TIN CÁ NHÂN ---");
                    System.out.print("Nhập Họ và tên mới: ");
                    String newName = scanner.nextLine();
                    System.out.print("Nhập Số điện thoại mới: ");
                    String newPhone = scanner.nextLine();
                    updateProfile(currentUserId, newName, newPhone);
                    break;

                case "3":
                    System.out.println("\n--- ĐỔI MẬT KHẨU ---");
                    System.out.print("Nhập mật khẩu cũ: ");
                    String oldPass = scanner.nextLine();
                    System.out.print("Nhập mật khẩu mới: ");
                    String newPass = scanner.nextLine();
                    System.out.print("Xác nhận mật khẩu mới: ");
                    String confirmPass = scanner.nextLine();

                    if (!newPass.equals(confirmPass)) {
                        System.out.println("❌ Lỗi: Mật khẩu xác nhận không khớp!");
                        break;
                    }
                    changePassword(currentUserId, oldPass, newPass);
                    break;

                case "4":
                    System.out.println("\n--- NỘP HỒ SƠ CCCD (eKYC) ---");
                    System.out.print("Nhập số CCCD (12 chữ số): ");
                    String cccdNo = scanner.nextLine();
                    System.out.print("Nhập đường dẫn ảnh mặt trước/sau: ");
                    String cccdImg = scanner.nextLine();
                    if (cccdImg.isEmpty()) cccdImg = "uploads/kyc/cccd_" + currentUserId + ".jpg";
                    uploadDocument(currentUserId, "CCCD", cccdNo, cccdImg);
                    break;

                case "5":
                    System.out.println("\n--- NỘP HỒ SƠ BẰNG LÁI XE (GPLX) ---");
                    System.out.print("Nhập số GPLX: ");
                    String gplxNo = scanner.nextLine();
                    System.out.print("Nhập đường dẫn ảnh GPLX: ");
                    String gplxImg = scanner.nextLine();
                    if (gplxImg.isEmpty()) gplxImg = "uploads/kyc/gplx_" + currentUserId + ".jpg";
                    uploadDocument(currentUserId, "GPLX", gplxNo, gplxImg);
                    break;

                case "0":
                    running = false;
                    System.out.println("👋 Tạm biệt!");
                    break;

                default:
                    System.out.println("⚠️ Lựa chọn không hợp lệ, vui lòng chọn lại!");
            }
        }

        scanner.close();
    }
}
