/*
 * Nối frontend với backend. Cách dùng:
 *  1. Đặt thuexe.html, thuexe.css, thuexe.js, thuexe-auth.js vào src/main/resources/static/
 *  2. Trong thuexe.html, thêm DÒNG NÀY ngay sau <script src="thuexe.js"></script>:
 *        <script src="thuexe-auth.js"></script>
 *  3. Trong thuexe.js XÓA 4 handler cũ: btnLogout, btnSubmitLogin, btnRegister, btnForgotPassword
 *     (nếu không xóa, handler cũ vẫn chạy song song với handler mới).
 */

async function authApi(path, body) {
    const res = await fetch("/api/auth" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Có lỗi xảy ra, vui lòng thử lại!");
    return data;
}

/* Đăng nhập */
document.getElementById("btnSubmitLogin").addEventListener("click", async () => {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    try {
        const data = await authApi("/login", { username, password });

        document.getElementById("sessionBarLoggedIn").classList.remove("hidden");
        document.getElementById("sessionBarLoggedOut").classList.add("hidden");
        document.getElementById("ekycFileLoggedIn").classList.remove("hidden");
        document.getElementById("ekycFileLoggedOut").classList.add("hidden");
        document.getElementById("sessionUserText").textContent = data.sessionText;

        switchTab(data.tab);
    } catch (e) {
        alert("⚠️ " + e.message);
    }
});

/* Đăng xuất */
document.getElementById("btnLogout").addEventListener("click", async () => {
    try { await authApi("/logout"); } catch (e) { /* bỏ qua, vẫn đăng xuất phía giao diện */ }
    document.getElementById("sessionBarLoggedIn").classList.add("hidden");
    document.getElementById("sessionBarLoggedOut").classList.remove("hidden");
    document.getElementById("ekycFileLoggedIn").classList.add("hidden");
    document.getElementById("ekycFileLoggedOut").classList.remove("hidden");
});

/* Đăng ký (frontend chưa có form đăng ký nên dùng prompt để giữ nguyên HTML) */
document.getElementById("btnRegister").addEventListener("click", async () => {
    const username = prompt("Tên đăng nhập:");
    if (!username) return;
    const password = prompt("Mật khẩu (tối thiểu 8 ký tự):");
    if (!password) return;
    const phone = prompt("Số điện thoại:");
    if (!phone) return;
    const email = prompt("Email:");
    if (!email) return;
    try {
        const data = await authApi("/register", { username, password, phone, email });
        alert("✅ " + data.message);
    } catch (e) {
        alert("⚠️ " + e.message);
    }
});

/* Quên mật khẩu */
document.getElementById("btnForgotPassword").addEventListener("click", async () => {
    const email = prompt("Nhập email đã đăng ký tài khoản:");
    if (!email) return;
    try {
        const data = await authApi("/forgot-password", { email });
        alert(data.message);
    } catch (e) {
        alert("⚠️ " + e.message);
    }
});