import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Scanner;

/**
 * AdminService.java
 * Hệ thống Quản lý Thuê Xe Máy (Group08)
 * 
 * PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN MODULE)
 * ---------------------------------------------------------
 * USE CASE 4: Manage Users (Admin khóa / mở khóa tài khoản)
 * 1. Liệt kê danh sách tất cả tài khoản trong hệ thống kèm trạng thái.
 * 2. Khóa tài khoản người dùng (15 ngày, 30 ngày, vĩnh viễn) kèm lý do.
 * 3. Mở khóa tài khoản đưa về trạng thái hoạt động bình thường (active).
 * 
 * USE CASE 5: Verify Documents / Approve Registration (Admin duyệt eKYC)
 * 4. Xem danh sách hồ sơ giấy tờ tùy thân (CCCD, GPLX) đang chờ thẩm định.
 * 5. Phê duyệt (Approve) hoặc Từ chối (Reject) hồ sơ eKYC kèm lý do.
 * 6. Tự động đồng bộ trạng thái sang bảng users và gửi thông báo notifications.
 */
public class AdminService {

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

    /**
     * Kiểm tra xem một user_id có thực sự là Quản trị viên (Admin) hay không.
     */
    public static boolean isAdmin(int adminId) {
        String sql = "SELECT admin_level FROM admins WHERE user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, adminId);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            return false;
        }
    }

    // =========================================================================
    // USE CASE 4: MANAGE USERS (KHÓA / MỞ KHÓA TÀI KHOẢN)
    // =========================================================================

    /**
     * 1. Xem danh sách toàn bộ tài khoản người dùng trong hệ thống
     */
    public static void listAllUsers(int adminId) {
        if (!isAdmin(adminId)) {
            System.out.println("⛔ Lỗi bảo mật: Bạn không có quyền Quản trị viên (Admin)!");
            return;
        }

        String sql = "SELECT u.user_id, u.full_name, u.email, u.phone, u.status, u.kyc_status, "
                   + "       a.admin_level, vo.bank_account "
                   + "FROM users u "
                   + "LEFT JOIN admins a ON u.user_id = a.user_id "
                   + "LEFT JOIN vehicle_owners vo ON u.user_id = vo.user_id "
                   + "ORDER BY u.user_id ASC";

        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            System.out.println("\n=========================== DANH SÁCH TÀI KHOẢN HỆ THỐNG ===========================");
            System.out.printf("%-6s %-22s %-25s %-14s %-16s %-16s%n",
                    "ID", "Họ và tên", "Email", "SĐT", "Vai trò", "Trạng thái");
            System.out.println("-------------------------------------------------------------------------------------");

            while (rs.next()) {
                int id = rs.getInt("user_id");
                String name = rs.getString("full_name");
                String email = rs.getString("email");
                String phone = rs.getString("phone");
                String status = rs.getString("status");

                String role = "Khách thuê";
                if (rs.getString("admin_level") != null) {
                    role = "ADMIN (" + rs.getString("admin_level") + ")";
                } else if (rs.getString("bank_account") != null) {
                    role = "Chủ xe";
                }

                System.out.printf("%-6d %-22s %-25s %-14s %-16s %-16s%n",
                        id, name, email, phone, role, status);
            }
            System.out.println("=====================================================================================");

        } catch (SQLException e) {
            System.out.println("❌ Lỗi Database: " + e.getMessage());
        }
    }

    /**
     * 2. Khóa hoặc thay đổi trạng thái tài khoản người dùng kèm lý do
     */
    public static boolean changeUserStatus(int adminId, int targetUserId, String newStatus, String reason) {
        if (!isAdmin(adminId)) {
            System.out.println("⛔ Lỗi bảo mật: Bạn không có quyền Quản trị viên (Admin)!");
            return false;
        }

        // Quy tắc bảo mật: Không được tự khóa tài khoản của chính mình
        if (adminId == targetUserId) {
            System.out.println("❌ Lỗi: Bạn không thể tự khóa tài khoản của chính mình!");
            return false;
        }

        // Kiểm tra target user có phải là Super Admin không
        String checkAdminSql = "SELECT admin_level FROM admins WHERE user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement checkStmt = conn.prepareStatement(checkAdminSql)) {
            checkStmt.setInt(1, targetUserId);
            try (ResultSet rs = checkStmt.executeQuery()) {
                if (rs.next() && "super_admin".equalsIgnoreCase(rs.getString("admin_level"))) {
                    System.out.println("⛔ Không thể khóa tài khoản của Super Admin cấp cao nhất!");
                    return false;
                }
            }
        } catch (SQLException e) {
            System.out.println("❌ Lỗi kiểm tra tài khoản: " + e.getMessage());
            return false;
        }

        String updateSql = "UPDATE users SET status = ? WHERE user_id = ?";
        String notifySql = "INSERT INTO notifications (user_id, title, content, is_read) VALUES (?, ?, ?, FALSE)";

        Connection conn = null;
        try {
            conn = getConnection();
            conn.setAutoCommit(false); // Dùng Transaction

            // Cập nhật trạng thái người dùng
            try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                updateStmt.setString(1, newStatus.trim());
                updateStmt.setInt(2, targetUserId);
                int affected = updateStmt.executeUpdate();
                if (affected == 0) {
                    System.out.println("❌ Không tìm thấy User ID: " + targetUserId);
                    conn.rollback();
                    return false;
                }
            }

            // Gửi thông báo đến người dùng bị xử lý
            String title = "Thông báo trạng thái tài khoản";
            String content = "Tài khoản của bạn đã được chuyển sang trạng thái: [" + newStatus.trim() + "]. "
                           + (reason != null && !reason.trim().isEmpty() ? "Lý do: " + reason.trim() : "");

            try (PreparedStatement notiStmt = conn.prepareStatement(notifySql)) {
                notiStmt.setInt(1, targetUserId);
                notiStmt.setString(2, title);
                notiStmt.setString(3, content);
                notiStmt.executeUpdate();
            }

            conn.commit();
            System.out.println("✅ Đã cập nhật trạng thái User ID " + targetUserId + " thành: [" + newStatus.trim() + "]");
            return true;

        } catch (SQLException e) {
            System.out.println("❌ Lỗi Database: " + e.getMessage());
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
     * 3. Mở khóa tài khoản (chuyển về trạng thái hoạt động 'active')
     */
    public static boolean unlockUser(int adminId, int targetUserId) {
        return changeUserStatus(adminId, targetUserId, "active", "Tài khoản đã được Quản trị viên mở khóa.");
    }

    // =========================================================================
    // USE CASE 5: VERIFY DOCUMENTS / APPROVE REGISTRATION (ADMIN DUYỆT eKYC)
    // =========================================================================

    /**
     * 4. Xem danh sách hồ sơ giấy tờ (CCCD / GPLX) đang chờ phê duyệt (status = 'pending')
     */
    public static void listPendingDocuments(int adminId) {
        if (!isAdmin(adminId)) {
            System.out.println("⛔ Lỗi bảo mật: Bạn không có quyền Quản trị viên (Admin)!");
            return;
        }

        String sql = "SELECT d.document_id, d.user_id, u.full_name, u.email, u.phone, "
                   + "       d.type, d.document_no, d.image_url, d.status "
                   + "FROM identity_documents d "
                   + "JOIN users u ON d.user_id = u.user_id "
                   + "WHERE d.status = 'pending' "
                   + "ORDER BY d.document_id ASC";

        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            System.out.println("\n======================== DANH SÁCH HỒ SƠ eKYC CHỜ DUYỆT ========================");
            System.out.printf("%-8s %-8s %-20s %-8s %-16s %-30s%n",
                    "Doc ID", "User ID", "Người nộp", "Loại", "Số giấy tờ", "Ảnh tài liệu");
            System.out.println("--------------------------------------------------------------------------------");

            boolean hasPending = false;
            while (rs.next()) {
                hasPending = true;
                System.out.printf("%-8d %-8d %-20s %-8s %-16s %-30s%n",
                        rs.getInt("document_id"),
                        rs.getInt("user_id"),
                        rs.getString("full_name"),
                        rs.getString("type"),
                        rs.getString("document_no"),
                        rs.getString("image_url"));
            }

            if (!hasPending) {
                System.out.println("🎉 Hiện tại không có hồ sơ eKYC nào đang chờ duyệt!");
            }
            System.out.println("================================================================================");

        } catch (SQLException e) {
            System.out.println("❌ Lỗi Database khi tải danh sách eKYC: " + e.getMessage());
        }
    }

    /**
     * 5. Thẩm định hồ sơ giấy tờ eKYC (Phê duyệt hoặc Từ chối)
     * @param adminId Admin thực hiện duyệt
     * @param documentId Mã hồ sơ giấy tờ
     * @param isApproved true = Phê duyệt (verified), false = Từ chối (rejected)
     * @param reason Lý do (nếu từ chối) hoặc ghi chú
     */
    public static boolean verifyDocument(int adminId, int documentId, boolean isApproved, String reason) {
        if (!isAdmin(adminId)) {
            System.out.println("⛔ Lỗi bảo mật: Bạn không có quyền Quản trị viên (Admin)!");
            return false;
        }

        // Lấy thông tin tài liệu cần duyệt
        String findDocSql = "SELECT user_id, type, document_no, status FROM identity_documents WHERE document_id = ?";
        int targetUserId = -1;
        String docType = "";
        String docNo = "";

        try (Connection conn = getConnection();
             PreparedStatement findStmt = conn.prepareStatement(findDocSql)) {
            findStmt.setInt(1, documentId);
            try (ResultSet rs = findStmt.executeQuery()) {
                if (!rs.next()) {
                    System.out.println("❌ Không tìm thấy hồ sơ giấy tờ với Document ID: " + documentId);
                    return false;
                }
                targetUserId = rs.getInt("user_id");
                docType = rs.getString("type");
                docNo = rs.getString("document_no");
            }
        } catch (SQLException e) {
            System.out.println("❌ Lỗi kiểm tra hồ sơ: " + e.getMessage());
            return false;
        }

        String newDocStatus = isApproved ? "verified" : "rejected";
        String newUserKycStatus = isApproved ? "verified" : "rejected";

        String updateDocSql = "UPDATE identity_documents SET status = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP WHERE document_id = ?";
        String updateUserSql = "UPDATE users SET kyc_status = ? WHERE user_id = ?";
        String notifySql = "INSERT INTO notifications (user_id, title, content, is_read) VALUES (?, ?, ?, FALSE)";

        Connection conn = null;
        try {
            conn = getConnection();
            conn.setAutoCommit(false); // Dùng Transaction đảm bảo đồng bộ cả 2 bảng

            // 1. Cập nhật bảng identity_documents
            try (PreparedStatement docStmt = conn.prepareStatement(updateDocSql)) {
                docStmt.setString(1, newDocStatus);
                docStmt.setInt(2, adminId);
                docStmt.setInt(3, documentId);
                docStmt.executeUpdate();
            }

            // 2. Cập nhật bảng users (nếu là CCCD hoặc xác thực chính)
            try (PreparedStatement userStmt = conn.prepareStatement(updateUserSql)) {
                userStmt.setString(1, newUserKycStatus);
                userStmt.setInt(2, targetUserId);
                userStmt.executeUpdate();
            }

            // 3. Gửi thông báo kết quả thẩm định đến người dùng
            String title = isApproved ? "Hồ sơ eKYC đã được phê duyệt" : "Hồ sơ eKYC bị từ chối";
            String content = isApproved
                    ? "Chúc mừng! Giấy tờ " + docType + " (Số: " + docNo + ") của bạn đã được Admin phê duyệt thành công. Bạn đã đủ điều kiện thuê xe."
                    : "Hồ sơ " + docType + " (Số: " + docNo + ") của bạn đã bị từ chối. Lý do: "
                      + (reason != null && !reason.trim().isEmpty() ? reason.trim() : "Hình ảnh không rõ nét / thông tin không khớp.")
                      + " Vui lòng nộp lại.";

            try (PreparedStatement notiStmt = conn.prepareStatement(notifySql)) {
                notiStmt.setInt(1, targetUserId);
                notiStmt.setString(2, title);
                notiStmt.setString(3, content);
                notiStmt.executeUpdate();
            }

            conn.commit();
            if (isApproved) {
                System.out.println("🎉 ĐÃ DUYỆT THÀNH CÔNG hồ sơ Document ID " + documentId + " (" + docType + ") của User ID " + targetUserId);
            } else {
                System.out.println("⚠️ ĐÃ TỪ CHỐI hồ sơ Document ID " + documentId + " (" + docType + "). Lý do: " + reason);
            }
            return true;

        } catch (SQLException e) {
            System.out.println("❌ Lỗi Database khi duyệt hồ sơ: " + e.getMessage());
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
     * Menu Console để kiểm thử trực tiếp cả Use Case 4 & 5
     */
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in, "UTF-8");

        System.out.println("==================================================");
        System.out.println("   MODULE ADMIN - MANAGE USERS & KYC (USE CASE 4&5)");
        System.out.println("==================================================");

        // Mặc định đăng nhập với tư cách Super Admin (ID: 6)
        int currentAdminId = 6;
        System.out.println("👑 Quản trị viên đang đăng nhập: Super Admin (User ID: " + currentAdminId + ")");

        boolean running = true;
        while (running) {
            System.out.println("\n----------------- MENU QUẢN TRỊ -----------------");
            System.out.println("1. Xem danh sách toàn bộ tài khoản người dùng");
            System.out.println("2. Khóa tài khoản (15 ngày / 30 ngày / Vĩnh viễn)");
            System.out.println("3. Mở khóa tài khoản (Chuyển về Hoạt động)");
            System.out.println("4. Xem danh sách hồ sơ eKYC đang chờ duyệt (Pending)");
            System.out.println("5. Thẩm định hồ sơ eKYC (Phê duyệt / Từ chối)");
            System.out.println("0. Thoát chương trình");
            System.out.print("👉 Mời bạn chọn (0-5): ");

            String choice = scanner.nextLine().trim();
            switch (choice) {
                case "1":
                    listAllUsers(currentAdminId);
                    break;

                case "2":
                    System.out.println("\n--- KHÓA TÀI KHOẢN NGƯỜI DÙNG ---");
                    System.out.print("Nhập User ID cần khóa: ");
                    String idStr = scanner.nextLine().trim();
                    if (idStr.isEmpty()) break;
                    int targetId = Integer.parseInt(idStr);

                    System.out.println("Chọn mức độ khóa:");
                    System.out.println("  a. Khóa 15 ngày (locked_15_days)");
                    System.out.println("  b. Khóa 30 ngày (locked_30_days)");
                    System.out.println("  c. Khóa vĩnh viễn (banned)");
                    System.out.print("👉 Chọn (a/b/c): ");
                    String opt = scanner.nextLine().trim().toLowerCase();

                    String statusToSet = "locked_15_days";
                    if (opt.equals("b")) statusToSet = "locked_30_days";
                    else if (opt.equals("c")) statusToSet = "banned";

                    System.out.print("Nhập lý do khóa: ");
                    String reason = scanner.nextLine();

                    changeUserStatus(currentAdminId, targetId, statusToSet, reason);
                    break;

                case "3":
                    System.out.println("\n--- MỞ KHÓA TÀI KHOẢN ---");
                    System.out.print("Nhập User ID cần mở khóa: ");
                    String unlockIdStr = scanner.nextLine().trim();
                    if (!unlockIdStr.isEmpty()) {
                        unlockUser(currentAdminId, Integer.parseInt(unlockIdStr));
                    }
                    break;

                case "4":
                    listPendingDocuments(currentAdminId);
                    break;

                case "5":
                    System.out.println("\n--- THẨM ĐỊNH HỒ SƠ eKYC ---");
                    System.out.print("Nhập Document ID cần thẩm định: ");
                    String docIdStr = scanner.nextLine().trim();
                    if (docIdStr.isEmpty()) break;
                    int docId = Integer.parseInt(docIdStr);

                    System.out.print("👉 Bạn muốn (1) Phê duyệt (Approve) hay (2) Từ chối (Reject)? Chọn (1/2): ");
                    String action = scanner.nextLine().trim();
                    boolean isApproved = "1".equals(action);

                    String rejectReason = "";
                    if (!isApproved) {
                        System.out.print("Nhập lý do từ chối: ");
                        rejectReason = scanner.nextLine();
                    }

                    verifyDocument(currentAdminId, docId, isApproved, rejectReason);
                    break;

                case "0":
                    running = false;
                    System.out.println("👋 Tạm biệt Admin!");
                    break;

                default:
                    System.out.println("⚠️ Lựa chọn không hợp lệ, vui lòng chọn lại!");
            }
        }

        scanner.close();
    }
}
