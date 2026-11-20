import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class InsertVouchers {
    public static void main(String[] args) {
        String url = "jdbc:mysql://127.0.0.1:3306/group08_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8";
        String user = "root";
        String pass = "123456";

        String insertSql = "INSERT INTO vouchers (code, discount_percent, end_date, usage_limit, status) VALUES "
                + "('CONBO01', 10.0, '2027-01-29 23:59:59', 300, 'active'), "
                + "('CONHEO01', 30.0, '2027-01-19 23:59:59', 300, 'active'), "
                + "('CONCHO01', 15.0, '2026-11-14 23:59:59', 300, 'expired'), "
                + "('BONBON10', 10.0, '2027-12-31 23:59:59', 500, 'active') "
                + "ON DUPLICATE KEY UPDATE discount_percent = VALUES(discount_percent)";

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {

            stmt.executeUpdate(insertSql);
            System.out.println("✅ Nạp thành công dữ liệu bảng vouchers!\n");

            try (ResultSet rs = stmt.executeQuery("SELECT voucher_id, code, discount_percent, status FROM vouchers")) {
                System.out.printf("%-12s %-15s %-18s %-12s%n", "voucher_id", "code", "discount(%)", "status");
                System.out.println("----------------------------------------------------------");
                while (rs.next()) {
                    System.out.printf("%-12d %-15s %-18.1f %-12s%n",
                            rs.getInt("voucher_id"),
                            rs.getString("code"),
                            rs.getDouble("discount_percent"),
                            rs.getString("status"));
                }
            }

        } catch (Exception e) {
            System.err.println("❌ Lỗi: " + e.getMessage());
        }
    }
}
