/*
 * Nối frontend với module Ví / Thanh toán / Hoàn tiền / Doanh thu. Cách dùng:
 *  1. Thêm vào thuexe.html, sau thuexe-auth.js:
 *        <script src="thuexe-wallet.js"></script>
 *  2. Trong thuexe.js XÓA 4 handler cũ: btnBookNow, btnDeposit, btnWithdraw, btnRefundDeposit
 *  3. Trong thuexe-auth.js, ngay sau dòng switchTab(data.tab); thêm:
 *        if (typeof refreshWallet === "function") refreshWallet();
 */

async function walletApi(method, path, body) {
    const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Có lỗi xảy ra, vui lòng thử lại!");
    return data;
}

function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function bookingCodeOf(id) {
    return "BK" + String(id).padStart(4, "0");
}

function txRowHtml(t) {
    const positive = t.amount > 0;
    const badge = t.status === "COMPLETED" ? "badge-success" : "badge-warn-sm";
    return `
      <div class="wallet-table-row">
        <strong>${escHtml(t.code)}</strong>
        <span>${escHtml(t.description)}</span>
        <strong${positive ? ' class="text-green"' : ""}>${positive ? "+" : "-"}${formatVND(Math.abs(t.amount))}</strong>
        <span><span class="${badge}">${escHtml(t.statusLabel)}</span></span>
      </div>`;
}

/* Tải số dư + lịch sử giao dịch từ server */
async function refreshWallet() {
    try {
        const w = await walletApi("GET", "/api/wallet");
        walletBalance = w.balance;
        updateWalletUI();
        const list = await walletApi("GET", "/api/wallet/transactions");
        document.getElementById("walletTxList").innerHTML = list.map(txRowHtml).join("");
    } catch (e) { /* chưa đăng nhập thì bỏ qua */ }
}

/* Nạp tiền */
document.getElementById("btnDeposit").addEventListener("click", async () => {
    const amount = Number(document.getElementById("walletAmountInput").value) || 0;
    try {
        await walletApi("POST", "/api/wallet/deposit", { amount });
        await refreshWallet();
    } catch (e) { alert("⚠️ " + e.message); }
});

/* Rút tiền: tạo yêu cầu chờ Admin duyệt (cần thông tin ngân hàng theo withdrawal_requests.bank_info) */
document.getElementById("btnWithdraw").addEventListener("click", async () => {
    const amount = Number(document.getElementById("walletAmountInput").value) || 0;
    const bankInfo = prompt("Nhập thông tin tài khoản ngân hàng (Ngân hàng - Số tài khoản - Chủ tài khoản):");
    if (!bankInfo) return;
    try {
        const data = await walletApi("POST", "/api/wallet/withdraw", { amount, bankInfo });
        await refreshWallet();
        alert(data.message);
    } catch (e) { alert("⚠️ " + e.message); }
});

/* Thanh toán & Đặt xe (trả toàn bộ đơn) */
document.getElementById("btnBookNow").addEventListener("click", async () => {
    const bike = bikesData.find(b => b.id === selectedBikeId) || bikesData[0];
    const bookingId = Math.floor(1000 + Math.random() * 9000); // tạm: mã đơn thật sẽ do module Đặt xe cấp
    try {
        await walletApi("POST", "/api/wallet/pay", {
            bookingId,
            totalAmount: currentBookingTotal,
            depositAmount: 300000,
            paymentType: "FULL",
            ownerId: bike.ownerId   // id tài khoản chủ xe, cần module Xe cung cấp
        });
        await refreshWallet();

        const orderId = bookingCodeOf(bookingId);
        const orderSelect = document.getElementById("hoOrderSelect");
        const opt = document.createElement("option");
        opt.value = orderId;
        opt.dataset.bike = bike.name;
        opt.textContent = `📋 #${orderId} — ${bike.name}`;
        orderSelect.appendChild(opt);
        orderSelect.value = orderId;

        switchTab("tab2");
    } catch (e) { alert(e.message); }
});

/* Admin: duyệt yêu cầu hoàn tiền đang chờ của đơn #BK0001 */
document.getElementById("btnRefundDeposit").addEventListener("click", async function () {
    try {
        const pending = await walletApi("GET", "/api/admin/refunds?status=PENDING");
        const req = pending.find(r => r.bookingCode === "BK0001");
        if (!req) { alert("Chưa có yêu cầu hoàn tiền nào đang chờ cho đơn #BK0001"); return; }
        await walletApi("POST", `/api/admin/refunds/${req.id}/approve`);

        const badge = document.getElementById("disputeBadge");
        badge.textContent = "Đã hoàn tiền";
        badge.className = "badge-success";
        this.textContent = "Đã hoàn tất";
        this.className = "btn-disabled-sm";
        this.disabled = true;
    } catch (e) { alert("⚠️ " + e.message); }
});

/* Chủ xe: cập nhật "Tổng chuyến hoàn tất" và "Doanh thu ròng chủ xe" khi mở tab4 */
document.querySelector('.nav-tab[data-target="tab4"]').addEventListener("click", async () => {
    try {
        const e = await walletApi("GET", "/api/owner/earnings");
        document.querySelector("#tab4 .stat-val-dark").textContent = `${e.completedTrips} chuyến`;
        document.querySelector("#tab4 .stat-val-green").innerHTML =
            `${e.netRevenue.toLocaleString("vi-VN")}<u>đ</u>`;
    } catch (err) { /* không phải chủ xe hoặc chưa đăng nhập thì giữ số mẫu */ }
});

refreshWallet();
