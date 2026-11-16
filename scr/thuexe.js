const bikesData = [
    {
        id: 1,
        brand: "Honda",
        name: "Honda Vision 2024",
        owner: "Trương Công Hào",
        badge: "Giảm 10%",
        type: "Xe tay ga",
        cc: "110cc",
        fuel: "Xăng",
        hourPrice: 25000,
        dayPrice: 140000
    },
    {
        id: 2,
        brand: "Honda",
        name: "Honda AirBlade 160 2024",
        owner: "Trương Công Hào",
        badge: "Giảm 15%",
        type: "Xe tay ga",
        cc: "155cc - 160cc",
        fuel: "Xăng",
        hourPrice: 35000,
        dayPrice: 180000
    },
    {
        id: 3,
        brand: "Yamaha",
        name: "Yamaha Exciter 155 VVA",
        owner: "Nguyễn Minh Tuấn",
        badge: "Xe mới",
        type: "Xe côn tay",
        cc: "155cc - 160cc",
        fuel: "Xăng",
        hourPrice: 40000,
        dayPrice: 200000
    },
    {
        id: 4,
        brand: "VinFast",
        name: "VinFast Evo200 2024",
        owner: "Nguyễn Minh Tuấn",
        badge: "Giảm 8%",
        type: "Xe máy điện",
        cc: "Pin LFP",
        fuel: "Điện",
        hourPrice: 22000,
        dayPrice: 130000
    },
    {
        id: 5,
        brand: "Honda",
        name: "Honda Wave Alpha 2023",
        owner: "Trương Công Hào",
        badge: "Tiết kiệm",
        type: "Xe số",
        cc: "110cc",
        fuel: "Xăng",
        hourPrice: 18000,
        dayPrice: 100000
    },
    {
        id: 6,
        brand: "Piaggio",
        name: "Vespa Sprint S 125",
        owner: "Lê Hoàng Nam",
        badge: "Cao cấp",
        type: "Xe tay ga",
        cc: "125cc",
        fuel: "Xăng",
        hourPrice: 55000,
        dayPrice: 300000
    }
];

let vouchersData = [
    { code: "CONBO01", uses: 127, discount: "Giảm 10%", status: "Đang hoạt động", type: "active", exp: "29/01/2027" },
    { code: "CONHEO01", uses: 272, discount: "Giảm 30%", status: "Gần hết", type: "warn", exp: "19/01/2027" },
    { code: "CONCHO01", uses: 300, discount: "Giảm 15%", status: "Hết hạn", type: "expired", exp: "14/11/2026" }
];

const accountsData = [
    { id: "00011783", username: "HaoTruong", phone: "0866******", email: "v*********@gmail.com", pass: "**************", statusIndex: 0 },
    { id: "00006067", username: "ᴛʀúᴍ ᴄắɴ ᴛʀộᴍ", phone: "0382******", email: "q*********@hotmail.com", pass: "**************", statusIndex: 0 },
    { id: "00015278", username: "Donal J.Trump", phone: "0999******", email: "v*********@gmail.com", pass: "**************", statusIndex: 1 },
    { id: "00013089", username: "John Ternus", phone: "0382******", email: "q*********@hotmail.com", pass: "**************", statusIndex: 0 },
    { id: "00011581", username: "ɴʜɪღᴄôɴɢღᴛúᴀ", phone: "0866******", email: "v*********@outlook.com", pass: "**************", statusIndex: 2 },
    { id: "00004007", username: "Quỳnh✿P O✿Yêu", phone: "0382******", email: "k*********@crypto.com", pass: "**************", statusIndex: 3 }
];

const accountStates = [
    { label: "Bình thường", cls: "acct-normal" },
    { label: "Bị khóa 15 ngày", cls: "acct-lock15" },
    { label: "Bị khóa 30 ngày", cls: "acct-lock30" },
    { label: "Bị khóa vĩnh viễn", cls: "acct-ban" }
];

let selectedBikeId = 1;
let rentMode = "day";
let walletBalance = 2500000;
let currentBookingTotal = 426000;
let isVoucherEditMode = false;
let selectedModalPct = "10%";

function formatVND(num) {
    return num.toLocaleString("vi-VN") + "đ";
}

function switchTab(targetId) {
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    const panel = document.getElementById(targetId);
    if (panel) panel.classList.add("active");

    document.querySelectorAll(".nav-tab").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.target === targetId);
    });
}

document.querySelectorAll(".nav-tab").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.target));
});

document.getElementById("brandLogo").addEventListener("click", () => switchTab("tab1"));
document.getElementById("btnTopLogin").addEventListener("click", () => switchTab("tab6"));
const btnTopAccount = document.getElementById("btnTopAccount");
if (btnTopAccount) {
    btnTopAccount.addEventListener("click", () => switchTab("tab3"));
}
const btnTopAdmin = document.getElementById("btnTopAdmin");
if (btnTopAdmin) {
    btnTopAdmin.addEventListener("click", () => switchTab("tab5"));
}

function renderBikes() {
    const brandVal = document.getElementById("filterBrand").value;
    const typeVal = document.getElementById("filterType").value;
    const ccVal = document.getElementById("filterCc").value;
    const fuelVal = document.getElementById("filterFuel").value;

    const filtered = bikesData.filter(b => {
        return (brandVal === "all" || b.brand === brandVal) &&
            (typeVal === "all" || b.type === typeVal) &&
            (ccVal === "all" || b.cc === ccVal) &&
            (fuelVal === "all" || b.fuel === fuelVal);
    });

    const grid = document.getElementById("bikeGrid");
    grid.innerHTML = filtered.map(b => {
        const isSel = b.id === selectedBikeId;
        return `
      <div class="bike-card">
        <div class="bike-banner">
          <div class="bike-banner-top">
            <span class="badge-brand">${b.brand}</span>
            <span class="badge-promo">${b.badge}</span>
          </div>
          <div class="bike-banner-center">
            <div class="bike-banner-title">${b.name}</div>
            <div class="bike-banner-owner">Chủ xe: ${b.owner}</div>
          </div>
        </div>
        <div class="bike-card-title">${b.name}</div>
        <div class="bike-specs-pill">
          <span>${b.type}</span>
          <span>${b.cc}</span>
          <span>${b.fuel}</span>
        </div>
        <div class="bike-price-row">
          <div class="price-col">
            <span class="price-caption">Theo giờ</span>
            <span class="price-hour">${b.hourPrice.toLocaleString("vi-VN")}<u>đ</u>/h</span>
          </div>
          <div class="price-col right">
            <span class="price-caption">Theo ngày</span>
            <span class="price-day">${b.dayPrice.toLocaleString("vi-VN")}<u>đ</u>/ngày</span>
          </div>
        </div>
        <button class="btn-select-bike ${isSel ? "selected" : ""}" data-id="${b.id}">
          ${isSel ? "Đang chọn xe này" : "Chọn xe này"}
        </button>
      </div>
    `;
    }).join("");

    grid.querySelectorAll(".btn-select-bike").forEach(btn => {
        btn.addEventListener("click", () => {
            selectedBikeId = Number(btn.dataset.id);
            renderBikes();
            updateBookingSummary();
        });
    });
}

function updateBookingSummary() {
    const bike = bikesData.find(b => b.id === selectedBikeId) || bikesData[0];
    document.getElementById("detailBikeName").textContent = bike.name;
    document.getElementById("detailBikeSpecs").textContent = `${bike.brand} • ${bike.type} • ${bike.cc} • ${bike.fuel} • Quận 1, TP.HCM`;
    document.getElementById("detailBikeOwner").textContent = `Chủ xe: ${bike.owner}`;
    document.getElementById("detailBikeBadge").textContent = bike.badge;

    document.getElementById("pkgHourText").textContent = `${bike.hourPrice / 1000}K / giờ`;
    document.getElementById("pkgDayText").textContent = `${bike.dayPrice / 1000}K / ngày`;

    const duration = Math.max(1, Number(document.getElementById("rentDuration").value) || 1);
    const voucherPct = Number(document.getElementById("voucherSelect").value) || 0;
    const shipFee = Number(document.getElementById("pickupMethod").value) || 0;

    const unitPrice = rentMode === "day" ? bike.dayPrice : bike.hourPrice;
    const unitName = rentMode === "day" ? "Theo ngày" : "Theo giờ";
    const unitSuffix = rentMode === "day" ? "ngày" : "giờ";

    const baseCost = unitPrice * duration;
    const discount = Math.round((baseCost * voucherPct) / 100);
    const deposit = 300000;
    const total = baseCost + shipFee - discount + deposit;
    currentBookingTotal = total;

    document.getElementById("durationLabel").textContent = rentMode === "day" ? "Số ngày thuê" : "Số giờ thuê";
    document.getElementById("sumBaseLabel").textContent = `Gói cước thuê: ${unitName} × ${duration} ${unitSuffix}`;
    document.getElementById("sumBaseVal").textContent = formatVND(baseCost);
    document.getElementById("sumShipLabel").textContent = shipFee === 0 ? "Phí giao xe: Tự lấy tại điểm" : "Phí giao xe: Giao tận nơi";
    document.getElementById("sumShipVal").textContent = formatVND(shipFee);
    document.getElementById("sumDiscountVal").textContent = `-${formatVND(discount)}`;
    document.getElementById("sumTotalVal").textContent = formatVND(total);
}

["filterBrand", "filterType", "filterCc", "filterFuel"].forEach(id => {
    document.getElementById(id).addEventListener("change", renderBikes);
});

document.getElementById("pkgHourBtn").addEventListener("click", () => {
    rentMode = "hour";
    document.getElementById("pkgHourBtn").classList.add("active");
    document.getElementById("pkgDayBtn").classList.remove("active");
    updateBookingSummary();
});

document.getElementById("pkgDayBtn").addEventListener("click", () => {
    rentMode = "day";
    document.getElementById("pkgDayBtn").classList.add("active");
    document.getElementById("pkgHourBtn").classList.remove("active");
    updateBookingSummary();
});

["rentDuration", "voucherSelect", "pickupMethod"].forEach(id => {
    document.getElementById(id).addEventListener("input", updateBookingSummary);
});

document.getElementById("btnBookNow").addEventListener("click", () => {
    if (walletBalance < currentBookingTotal) {
        alert(`Số dư trong tài khoản cá nhân (${formatVND(walletBalance)}) không đủ để thanh toán ${formatVND(currentBookingTotal)}! Vui lòng nạp thêm tiền vào tài khoản.`);
        return;
    }

    walletBalance -= currentBookingTotal;
    updateWalletUI();

    const bike = bikesData.find(b => b.id === selectedBikeId) || bikesData[0];

    const txList = document.getElementById("walletTxList");
    if (txList) {
        const row = document.createElement("div");
        row.className = "wallet-table-row";
        row.innerHTML = `
        <strong>#TX${Math.floor(102 + Math.random() * 890)}</strong>
        <span>Thanh toán thuê xe ${bike.name}</span>
        <strong style="color: #ef4444;">-${formatVND(currentBookingTotal)}</strong>
        <span><span class="badge-success">Hoàn tất</span></span>
      `;
        txList.prepend(row);
    }

    document.getElementById("hoOrderInput").value = `#BK0001 — ${bike.name} • Chờ Check-in`;
    switchTab("tab2");
});

document.getElementById("btnExecHandover").addEventListener("click", () => {
    const txType = document.querySelector('input[name="txType"]:checked').value;
    const odo = Number(document.getElementById("hoOdoInput").value) || 8420;
    const fuel = document.getElementById("hoFuelInput").value || "90";
    const note = document.getElementById("hoNoteInput").value || "Đủ 2 mũ, nguyên vẹn";

    const list = document.getElementById("handoverHistoryList");
    const row = document.createElement("div");
    row.className = "table-row-5";
    row.innerHTML = `
    <span><span class="badge-info-sm">${txType}</span></span>
    <strong>#BK0001 • Vision 2024</strong>
    <span>${odo.toLocaleString("vi-VN")} km</span>
    <span>${fuel}%</span>
    <span class="text-muted">${note}</span>
  `;
    list.prepend(row);
});

document.getElementById("btnToggleIncident").addEventListener("click", () => {
    document.getElementById("incidentBox").classList.toggle("hidden");
});

document.querySelectorAll("#starRow .star-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#starRow .star-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

document.getElementById("btnLogout").addEventListener("click", () => {
    document.getElementById("sessionBarLoggedIn").classList.add("hidden");
    document.getElementById("sessionBarLoggedOut").classList.remove("hidden");
    document.getElementById("ekycFileLoggedIn").classList.add("hidden");
    document.getElementById("ekycFileLoggedOut").classList.remove("hidden");
});

document.getElementById("btnGoLoginFromTab3").addEventListener("click", () => {
    switchTab("tab6");
});

document.getElementById("btnSubmitLogin").addEventListener("click", () => {
    const username = document.getElementById("loginUsername").value.trim() || "Trương Công Hào";

    document.getElementById("sessionBarLoggedIn").classList.remove("hidden");
    document.getElementById("sessionBarLoggedOut").classList.add("hidden");
    document.getElementById("ekycFileLoggedIn").classList.remove("hidden");
    document.getElementById("ekycFileLoggedOut").classList.add("hidden");

    const lowerUser = username.toLowerCase();
    if (lowerUser === "admin" || lowerUser.includes("admin")) {
        document.getElementById("sessionUserText").textContent = `${username} — Quản trị viên`;
        switchTab("tab5");
    } else if (lowerUser.includes("owner") || lowerUser.includes("chuxe") || lowerUser.includes("chủ xe")) {
        document.getElementById("sessionUserText").textContent = `${username} — Chủ xe`;
        switchTab("tab4");
    } else {
        document.getElementById("sessionUserText").textContent = `${username} — Khách thuê`;
        switchTab("tab3");
    }
});

const btnRegister = document.getElementById("btnRegister");
if (btnRegister) {
    btnRegister.addEventListener("click", () => {
        alert("Chức năng Đăng ký tài khoản: Hệ thống đang mở đăng ký thử nghiệm, vui lòng liên hệ bộ phận hỗ trợ hoặc đăng nhập với tài khoản có sẵn!");
    });
}

const btnForgotPassword = document.getElementById("btnForgotPassword");
if (btnForgotPassword) {
    btnForgotPassword.addEventListener("click", () => {
        alert("Chức năng Quên mật khẩu: Vui lòng kiểm tra email hoặc liên hệ Quản trị viên để được cấp lại mật khẩu!");
    });
}

function updateWalletUI() {
    const balanceEl = document.getElementById("walletBalanceText");
    if (balanceEl) {
        balanceEl.innerHTML = `${walletBalance.toLocaleString("vi-VN")}<u>đ</u>`;
    }
    const payOpt = document.getElementById("payMethodWalletOpt");
    if (payOpt) {
        payOpt.textContent = `Tiền trong tài khoản cá nhân — ${formatVND(walletBalance)}`;
    }
}

document.getElementById("btnDeposit").addEventListener("click", () => {
    const amt = Number(document.getElementById("walletAmountInput").value) || 0;
    if (amt <= 0) return;
    walletBalance += amt;
    updateWalletUI();

    const txList = document.getElementById("walletTxList");
    const row = document.createElement("div");
    row.className = "wallet-table-row";
    row.innerHTML = `
    <strong>#TX${Math.floor(102 + Math.random() * 890)}</strong>
    <span>Nạp tiền vào ví nội bộ</span>
    <strong class="text-green">+${formatVND(amt)}</strong>
    <span><span class="badge-success">Hoàn tất</span></span>
  `;
    txList.prepend(row);
});

document.getElementById("btnWithdraw").addEventListener("click", () => {
    const amt = Number(document.getElementById("walletAmountInput").value) || 0;
    if (amt <= 0 || amt > walletBalance) return;
    walletBalance -= amt;
    updateWalletUI();

    const txList = document.getElementById("walletTxList");
    const row = document.createElement("div");
    row.className = "wallet-table-row";
    row.innerHTML = `
    <strong>#TX${Math.floor(102 + Math.random() * 890)}</strong>
    <span>Rút tiền về tài khoản ngân hàng</span>
    <strong>-${formatVND(amt)}</strong>
    <span><span class="badge-success">Hoàn tất</span></span>
  `;
    txList.prepend(row);
});

document.querySelectorAll(".toggle-schedule-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const row = btn.closest(".owner-table-row");
        const badge = row.querySelector("span span");
        if (badge.textContent === "Đang trống") {
            badge.textContent = "Đang cho thuê";
            badge.className = "badge-warn-sm";
            btn.textContent = "Mở trống";
        } else {
            badge.textContent = "Đang trống";
            badge.className = "badge-success";
            btn.textContent = "Khóa lịch";
        }
    });
});

document.getElementById("btnApproveConsign").addEventListener("click", function () {
    const badge = document.getElementById("consignBadge");
    badge.textContent = "Đã duyệt";
    badge.className = "badge-success";
    this.textContent = "Đã lên sàn";
    this.className = "btn-disabled-sm";
    this.disabled = true;
});

document.getElementById("btnRefundDeposit").addEventListener("click", function () {
    const badge = document.getElementById("disputeBadge");
    badge.textContent = "Đã hoàn cọc";
    badge.className = "badge-success";
    this.textContent = "Đã hoàn tất";
    this.className = "btn-disabled-sm";
    this.disabled = true;
});

function renderVouchers() {
    const container = document.getElementById("voucherListContainer");
    container.innerHTML = vouchersData.map((v, idx) => {
        const pillCls = v.type === "active"
            ? "pill-status-active"
            : v.type === "warn"
                ? "pill-status-warn"
                : "pill-status-expired";

        return `
      <div class="voucher-row">
        <strong>${v.code}</strong>
        <span>${v.uses}</span>
        <span>${v.discount}</span>
        <span><span class="${pillCls}">${v.status}</span></span>
        <span>${v.exp}</span>
        <span>
          ${isVoucherEditMode ? `<button class="btn-delete-circle" data-idx="${idx}">X</button>` : ""}
        </span>
      </div>
    `;
    }).join("");

    container.querySelectorAll(".btn-delete-circle").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = Number(btn.dataset.idx);
            vouchersData.splice(idx, 1);
            renderVouchers();
        });
    });
}

document.getElementById("btnToggleVoucherEdit").addEventListener("click", () => {
    isVoucherEditMode = !isVoucherEditMode;
    renderVouchers();
});

document.getElementById("btnOpenVoucherModal").addEventListener("click", () => {
    document.getElementById("voucherModal").classList.remove("hidden");
});

document.getElementById("btnCloseVoucherModal").addEventListener("click", () => {
    document.getElementById("voucherModal").classList.add("hidden");
});

document.querySelectorAll("#percentSelector .pct-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#percentSelector .pct-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedModalPct = btn.dataset.pct;
    });
});

document.getElementById("btnSaveVoucher").addEventListener("click", () => {
    const code = document.getElementById("newVoucherCode").value.trim() || "CONBO02";
    const uses = Number(document.getElementById("newVoucherUses").value) || 100;
    const exp = document.getElementById("newVoucherExp").value.trim() || "29/01/2027";

    vouchersData.unshift({
        code: code.toUpperCase(),
        uses,
        discount: `Giảm ${selectedModalPct}`,
        status: "Đang hoạt động",
        type: "active",
        exp
    });

    renderVouchers();
    document.getElementById("voucherModal").classList.add("hidden");
    document.getElementById("newVoucherCode").value = "";
});

function renderAccounts() {
    const container = document.getElementById("accountListContainer");
    container.innerHTML = accountsData.map((acc, idx) => {
        const st = accountStates[acc.statusIndex];
        return `
      <div class="account-row">
        <strong>${acc.id}</strong>
        <span>${acc.username}</span>
        <span>${acc.phone}</span>
        <span>${acc.email}</span>
        <span>${acc.pass}</span>
        <span>
          <button class="acct-pill ${st.cls}" data-idx="${idx}">${st.label}</button>
        </span>
      </div>
    `;
    }).join("");

    container.querySelectorAll(".acct-pill").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = Number(btn.dataset.idx);
            accountsData[idx].statusIndex = (accountsData[idx].statusIndex + 1) % accountStates.length;
            renderAccounts();
        });
    });
}

renderBikes();
updateBookingSummary();
updateWalletUI();
renderVouchers();
renderAccounts();
