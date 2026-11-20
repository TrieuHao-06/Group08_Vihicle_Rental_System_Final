import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Scanner;

/**
 * AuthService.java
 * Hệ thống Quản lý Thuê Xe Máy (Group08)
 * 
 * Chức năng:
 * 1. Đăng ký tài khoản mới (lưu vào users, renters, wallets).
 * 2. Đăng nhập (đối chiếu users, xác định quyền ADMIN/OWNER/RENTER).
 * 3. Đăng xuất (xóa phiên đăng nhập hiện tại).
 */
public class AuthService {

    // Cấu hình kết nối MySQL database
    private static final String DB_HOST = "127.0.0.1";
    private static final int DB_PORT = 3306;
    private static final String DB_NAME = "group08_db";
    private static final String DB_USER = "root";
    private static final String DB_PASS = "123456";

    private static final String DB_URL = "jdbc:mysql://" + DB_HOST + ":" + DB_PORT + "/" + DB_NAME
            + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8&useUnicode=true";

    // Đối tượng lưu thông tin người dùng đang đăng nhập (Session)
    private static UserSession currentUser = null;

    public static class UserSession {
        private final int userId;
        private final String fullName;
        private final String email;
        private final String phone;
        private final String role; // ADMIN, OWNER, RENTER

        public UserSession(int userId, String fullName, String email, String phone, String role) {
            this.userId = userId;
            this.fullName = fullName;
            this.email = email;
            this.phone = phone;
            this.role = role;
        }

        public int getUserId() { return userId; }
        public String getFullName() { return fullName; }
        public String getEmail() { return email; }
        public String getPhone() { return phone; }
        public String getRole() { return role; }

        @Override
        public String toString() {
            return "ID=" + userId + " | Họ tên: " + fullName + " | Email: " + email 
                    + " | SĐT: " + phone + " | Vai trò: " + role;
        }
    }

    /**
     * Mở kết nối đến MySQL database.
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
    }

    /**
     * 1. CHỨC NĂNG ĐĂNG KÝ
     * Nhận dữ liệu đầu vào, kiểm tra hợp lệ & trùng lặp,
     * sau đó nạp dữ liệu vào các bảng: users, renters, wallets.
     */
    public static boolean register(String fullName, String email, String phone, String password) {
        // Kiểm tra dữ liệu đầu vào
        if (fullName == null || fullName.trim().isEmpty()
                || email == null || email.trim().isEmpty()
                || phone == null || phone.trim().isEmpty()
                || password == null || password.trim().isEmpty()) {
            System.out.println("❌ Lỗi: Vui lòng nhập đầy đủ tất cả các trường!");
            return false;
        }

        if (password.length() < 8) {
            System.out.println("❌ Lỗi: Mật khẩu phải có tối thiểu 8 ký tự!");
            return false;
        }

        String checkSql = "SELECT user_id FROM users WHERE email = ? OR phone = ? LIMIT 1";
        String insertUserSql = "INSERT INTO users (full_name, email, phone, password_hash, status) VALUES (?, ?, ?, ?, 'active')";
        String insertRenterSql = "INSERT INTO renters (user_id) VALUES (?)";
        String insertWalletSql = "INSERT INTO wallets (user_id, balance) VALUES (?, 0)";

        Connection conn = null;
        try {
            conn = getConnection();
            conn.setAutoCommit(false); // Dùng Transaction để đảm bảo tính toàn vẹn

            // 1. Đối chiếu xem email hoặc số điện thoại đã tồn tại trong database chưa
            try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                checkStmt.setString(1, email.trim());
                checkStmt.setString(2, phone.trim());
                try (ResultSet rs = checkStmt.executeQuery()) {
                    if (rs.next()) {
                        System.out.println("❌ Lỗi: Email hoặc số điện thoại đã được đăng ký trong hệ thống!");
                        conn.rollback();
                        return false;
                    }
                }
            }

            // 2. Nạp dữ liệu vào bảng users
            int newUserId = -1;
            try (PreparedStatement userStmt = conn.prepareStatement(insertUserSql, Statement.RETURN_GENERATED_KEYS)) {
                userStmt.setString(1, fullName.trim());
                userStmt.setString(2, email.trim());
                userStmt.setString(3, phone.trim());
                userStmt.setString(4, password); // mật khẩu lưu trữ
                userStmt.executeUpdate();

                try (ResultSet generatedKeys = userStmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        newUserId = generatedKeys.getInt(1);
                    } else {
                        throw new SQLException("Không thể lấy user_id tự tăng!");
                    }
                }
            }

            // 3. Nạp dữ liệu kế thừa vào bảng renters (mặc định người đăng ký mới là người thuê)
            try (PreparedStatement renterStmt = conn.prepareStatement(insertRenterSql)) {
                renterStmt.setInt(1, newUserId);
                renterStmt.executeUpdate();
            }

            // 4. Khởi tạo ví điện tử số dư 0đ trong bảng wallets
            try (PreparedStatement walletStmt = conn.prepareStatement(insertWalletSql)) {
                walletStmt.setInt(1, newUserId);
                walletStmt.executeUpdate();
            }

            conn.commit(); // Hoàn tất giao dịch
            System.out.println("✅ Đăng ký thành công! Đã tạo người dùng mới với User ID: " + newUserId);
            return true;

        } catch (SQLException e) {
            System.out.println("❌ Lỗi Database khi đăng ký: " + e.getMessage());
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) { /* ignore */ }
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
     * 2. CHỨC NĂNG ĐĂNG NHẬP
     * Đối chiếu thông tin (email hoặc số điện thoại) và mật khẩu với dữ liệu trong database.
     * Xác định vai trò: ADMIN, OWNER hoặc RENTER.
     */
    public static boolean login(String identifier, String password) {
        if (identifier == null || identifier.trim().isEmpty()
                || password == null || password.trim().isEmpty()) {
            System.out.println("❌ Lỗi: Vui lòng nhập email/SĐT và mật khẩu!");
            return false;
        }

        String sql = "SELECT u.user_id, u.full_name, u.email, u.phone, u.password_hash, u.status, "
                   + "       a.admin_level, vo.bank_account "
                   + "FROM users u "
                   + "LEFT JOIN admins a ON u.user_id = a.user_id "
                   + "LEFT JOIN vehicle_owners vo ON u.user_id = vo.user_id "
                   + "WHERE u.email = ? OR u.phone = ? "
                   + "LIMIT 1";

        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, identifier.trim());
            stmt.setString(2, identifier.trim());

            try (ResultSet rs = stmt.executeQuery()) {
                if (!rs.next()) {
                    System.out.println("❌ Đăng nhập thất bại: Tài khoản không tồn tại trong hệ thống!");
                    return false;
                }

                String dbPassword = rs.getString("password_hash");
                String status = rs.getString("status");

                // Đối chiếu mật khẩu
                if (!password.equals(dbPassword)) {
                    System.out.println("❌ Đăng nhập thất bại: Mật khẩu không chính xác!");
                    return false;
                }

                // Kiểm tra trạng thái tài khoản
                if (!"active".equalsIgnoreCase(status)) {
                    System.out.println("❌ Tài khoản này đang bị khóa hoặc ngừng hoạt động (status: " + status + ")!");
                    return false;
                }

                // Phân quyền dựa trên sự xuất hiện trong bảng admins hoặc vehicle_owners
                String role = "RENTER";
                if (rs.getString("admin_level") != null) {
                    role = "ADMIN (" + rs.getString("admin_level") + ")";
                } else if (rs.getString("bank_account") != null) {
                    role = "OWNER";
                }

                currentUser = new UserSession(
                        rs.getInt("user_id"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        role
                );

                System.out.println("🎉 Đăng nhập thành công!");
                System.out.println(">> Xin chào: " + currentUser.getFullName() + " [" + currentUser.getRole() + "]");
                return true;
            }

        } catch (SQLException e) {
            System.out.println("❌ Lỗi Database khi đăng nhập: " + e.getMessage());
            return false;
        }
    }

    /**
     * 3. CHỨC NĂNG ĐĂNG XUẤT
     * Hủy phiên làm việc của người dùng hiện tại.
     */
    public static void logout() {
        if (currentUser == null) {
            System.out.println("⚠️ Bạn chưa đăng nhập tài khoản nào!");
            return;
        }
        System.out.println("👋 Đã đăng xuất khỏi tài khoản: " + currentUser.getFullName());
        currentUser = null;
    }

    public static UserSession getCurrentUser() {
        return currentUser;
    }

    /**
     * Hàm main cung cấp menu console tương tác trực tiếp
     */
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in, "UTF-8");

        System.out.println("==================================================");
        System.out.println("   HỆ THỐNG QUẢN LÝ THUÊ XE MÁY (GROUP 08)        ");
        System.out.println("==================================================");

        boolean running = true;
        while (running) {
            System.out.println("\n----------------- MENU CHỨC NĂNG -----------------");
            if (currentUser != null) {
                System.out.println("👤 Đang đăng nhập: " + currentUser.getFullName() + " | Quyền: " + currentUser.getRole());
            } else {
                System.out.println("👤 Trạng thái: Chưa đăng nhập");
            }
            System.out.println("1. Đăng nhập");
            System.out.println("2. Đăng ký tài khoản");
            System.out.println("3. Đăng xuất");
            System.out.println("4. Xem thông tin tài khoản hiện tại");
            System.out.println("0. Thoát chương trình");
            System.out.print("👉 Mời bạn chọn (0-4): ");

            String choice = scanner.nextLine().trim();
            switch (choice) {
                case "1":
                    if (currentUser != null) {
                        System.out.println("⚠️ Bạn đang đăng nhập tài khoản: " + currentUser.getFullName() + ". Hãy đăng xuất trước!");
                        break;
                    }
                    System.out.print("Nhập Email hoặc Số điện thoại: ");
                    String id = scanner.nextLine();
                    System.out.print("Nhập Mật khẩu: ");
                    String pass = scanner.nextLine();
                    login(id, pass);
                    break;

                case "2":
                    System.out.println("\n--- ĐĂNG KÝ TÀI KHOẢN MỚI ---");
                    System.out.print("Họ và tên: ");
                    String name = scanner.nextLine();
                    System.out.print("Email: ");
                    String email = scanner.nextLine();
                    System.out.print("Số điện thoại (+84...): ");
                    String phone = scanner.nextLine();
                    System.out.print("Mật khẩu (>= 8 ký tự): ");
                    String newPass = scanner.nextLine();
                    System.out.print("Xác nhận mật khẩu: ");
                    String confirmPass = scanner.nextLine();

                    if (!newPass.equals(confirmPass)) {
                        System.out.println("❌ Lỗi: Mật khẩu xác nhận không khớp!");
                        break;
                    }
                    register(name, email, phone, newPass);
                    break;

                case "3":
                    logout();
                    break;

                case "4":
                    if (currentUser != null) {
                        System.out.println("\n📋 THÔNG TIN TÀI KHOẢN ĐANG ĐĂNG NHẬP:");
                        System.out.println(currentUser);
                    } else {
                        System.out.println("⚠️ Chưa có người dùng nào đăng nhập!");
                    }
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
