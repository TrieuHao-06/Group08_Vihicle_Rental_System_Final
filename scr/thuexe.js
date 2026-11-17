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
    const locEl = document.getElementById("rentalLocation");
    const loc = locEl ? locEl.value : "Quận 1, TP.HCM";
    document.getElementById("detailBikeName").textContent = bike.name;
    document.getElementById("detailBikeSpecs").textContent = `${bike.brand} • ${bike.type} • ${bike.cc} • ${bike.fuel} • ${loc}`;
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

const pickupInput = document.getElementById("pickupDateTime");
const returnInput = document.getElementById("returnDateTime");

function syncDurationFromDates() {
    if (!pickupInput || !returnInput) return;
    const start = new Date(pickupInput.value);
    const end = new Date(returnInput.value);
    const diffMs = end - start;

    if (!isNaN(diffMs) && diffMs > 0) {
        if (rentMode === "day") {
            const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
            const durEl = document.getElementById("rentDuration");
            if (durEl) durEl.value = diffDays;
        } else {
            const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
            const durEl = document.getElementById("rentDuration");
            if (durEl) durEl.value = diffHours;
        }
    }
    updateBookingSummary();
}

function syncReturnDateFromDuration() {
    if (!pickupInput || !returnInput) return;
    const start = new Date(pickupInput.value);
    if (isNaN(start.getTime())) return;

    const duration = Math.max(1, Number(document.getElementById("rentDuration").value) || 1);
    const end = new Date(start.getTime());

    if (rentMode === "day") {
        end.setDate(end.getDate() + duration);
    } else {
        end.setHours(end.getHours() + duration);
    }

    const pad = n => String(n).padStart(2, "0");
    const formatted = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
    returnInput.value = formatted;
}

[pickupInput, returnInput].forEach(inp => {
    if (inp) {
        inp.addEventListener("click", () => {
            try {
                if (typeof inp.showPicker === "function") {
                    inp.showPicker();
                }
            } catch (e) {}
        });
        inp.addEventListener("change", syncDurationFromDates);
    }
});

const rentalLocEl = document.getElementById("rentalLocation");
if (rentalLocEl) {
    rentalLocEl.addEventListener("change", updateBookingSummary);
}

["filterBrand", "filterType", "filterCc", "filterFuel"].forEach(id => {
    document.getElementById(id).addEventListener("change", renderBikes);
});

document.getElementById("pkgHourBtn").addEventListener("click", () => {
    rentMode = "hour";
    document.getElementById("pkgHourBtn").classList.add("active");
    document.getElementById("pkgDayBtn").classList.remove("active");
    syncReturnDateFromDuration();
    updateBookingSummary();
});

document.getElementById("pkgDayBtn").addEventListener("click", () => {
    rentMode = "day";
    document.getElementById("pkgDayBtn").classList.add("active");
    document.getElementById("pkgHourBtn").classList.remove("active");
    syncReturnDateFromDuration();
    updateBookingSummary();
});

document.getElementById("rentDuration").addEventListener("input", () => {
    syncReturnDateFromDuration();
    updateBookingSummary();
});

["voucherSelect", "pickupMethod"].forEach(id => {
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

    document.getElementById("hoOrderSelect").value = "BK0001";

    // Add this booking to the handover order dropdown if not exists
    const orderSelect = document.getElementById("hoOrderSelect");
    const bookingId = `BK${String(Math.floor(1000 + Math.random() * 9000))}`;
    const existingOpt = Array.from(orderSelect.options).find(o => o.textContent.includes(bike.name));
    if (!existingOpt) {
        const opt = document.createElement("option");
        opt.value = bookingId;
        opt.dataset.bike = bike.name;
        opt.textContent = `📋 #${bookingId} — ${bike.name}`;
        orderSelect.appendChild(opt);
        orderSelect.value = bookingId;
    }

    switchTab("tab2");
});

/* ========================================
   HANDOVER SYSTEM — Đối chiếu 2 chiều
   ======================================== */

let pendingHandovers = [];
let completedHandovers = [];
let storedImages = [];
let handoverIdCounter = 1;

function getTimestamp() {
    const now = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function getDaysRemaining(createdDate) {
    const now = new Date();
    const diffMs = 3 * 24 * 60 * 60 * 1000 - (now - createdDate);
    if (diffMs <= 0) return 0;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} ngày ${hours}h`;
    return `${hours} giờ`;
}

function renderPendingHandovers() {
    const list = document.getElementById("pendingHandoverList");
    if (pendingHandovers.length === 0) {
        list.innerHTML = '<div class="ho-empty-state">Chưa có biên bản nào đang chờ đối chiếu</div>';
        return;
    }
    list.innerHTML = pendingHandovers.map(h => `
        <div class="table-row-6 pending">
            <strong>#${h.orderId} • ${h.bikeName}</strong>
            <span><span class="badge-info-sm">${h.txType}</span></span>
            <span>${h.role}</span>
            <span>${Number(h.odo).toLocaleString("vi-VN")} km</span>
            <span>${h.fuel}%</span>
            <span><span class="badge-pending">⏳ Chờ ${h.role === "Khách thuê" ? "Chủ xe" : "Khách thuê"}</span></span>
        </div>
    `).join("");
}

function renderCompletedHandovers() {
    const list = document.getElementById("handoverHistoryList");
    if (completedHandovers.length === 0) {
        list.innerHTML = '<div class="ho-empty-state">Chưa có giao dịch nào hoàn tất</div>';
        return;
    }
    list.innerHTML = completedHandovers.map(h => `
        <div class="table-row-6 matched ho-match-animation">
            <span><span class="badge-matched">✅ ${h.txType}</span></span>
            <strong>#${h.orderId} • ${h.bikeName}</strong>
            <span>${Number(h.odo).toLocaleString("vi-VN")} km</span>
            <span>${h.fuel}%</span>
            <span>${h.time}</span>
            <span class="text-muted">${h.note || "—"}</span>
        </div>
    `).join("");
}

function renderStoredImages() {
    const list = document.getElementById("storageList");

    // Remove expired images (> 3 days)
    const now = new Date();
    storedImages = storedImages.filter(img => (now - img.createdAt) < 3 * 24 * 60 * 60 * 1000);

    if (storedImages.length === 0) {
        list.innerHTML = '<div class="ho-empty-state">Chưa có hình ảnh nào được lưu</div>';
        return;
    }
    list.innerHTML = storedImages.map(img => `
        <div class="storage-card">
            <div class="storage-thumb">${img.label}</div>
            <div class="storage-filename">${img.filename}</div>
            <div class="storage-meta">Từ: ${img.role} • #${img.orderId} • ${img.txType}</div>
            <span class="badge-warn-sm">🗑️ Xóa sau ${getDaysRemaining(img.createdAt)}</span>
        </div>
    `).join("");
}

function tryMatchHandover(newEntry) {
    const matchIndex = pendingHandovers.findIndex(h =>
        h.orderId === newEntry.orderId &&
        h.txType === newEntry.txType &&
        h.role !== newEntry.role &&
        Number(h.odo) === Number(newEntry.odo) &&
        Number(h.fuel) === Number(newEntry.fuel)
    );

    if (matchIndex !== -1) {
        const matched = pendingHandovers.splice(matchIndex, 1)[0];
        const completed = {
            txType: newEntry.txType,
            orderId: newEntry.orderId,
            bikeName: newEntry.bikeName,
            odo: newEntry.odo,
            fuel: newEntry.fuel,
            time: getTimestamp(),
            note: `${matched.role}: ${matched.note || "—"} | ${newEntry.role}: ${newEntry.note || "—"}`
        };
        completedHandovers.unshift(completed);
        renderPendingHandovers();
        renderCompletedHandovers();

        const roleName = newEntry.role;
        const otherRole = roleName === "Khách thuê" ? "Chủ xe" : "Khách thuê";
        alert(`✅ ${newEntry.txType} THÀNH CÔNG!\n\nĐơn #${newEntry.orderId} — ${newEntry.bikeName}\nThông số từ ${roleName} và ${otherRole} đã trùng khớp hoàn toàn.\n• Odometer: ${Number(newEntry.odo).toLocaleString("vi-VN")} km\n• Xăng/Pin: ${newEntry.fuel}%`);
        return true;
    }
    return false;
}

document.getElementById("btnExecHandover").addEventListener("click", () => {
    const txType = document.querySelector('input[name="txType"]:checked').value;
    const role = document.querySelector('input[name="roleType"]:checked').value;
    const orderSelect = document.getElementById("hoOrderSelect");
    const orderId = orderSelect.value;
    const bikeName = orderSelect.options[orderSelect.selectedIndex].dataset.bike;
    const odo = document.getElementById("hoOdoInput").value;
    const fuel = document.getElementById("hoFuelInput").value;
    const imgFile = document.getElementById("hoImgInput").value.trim();
    const note = document.getElementById("hoNoteInput").value.trim();

    if (!odo || !fuel) {
        alert("⚠️ Vui lòng nhập đầy đủ Odometer và Mức xăng/Pin!");
        return;
    }

    // Check duplicate: same order + same type + same role already pending
    const duplicate = pendingHandovers.find(h =>
        h.orderId === orderId && h.txType === txType && h.role === role
    );
    if (duplicate) {
        alert(`⚠️ Bạn (${role}) đã gửi biên bản ${txType} cho đơn #${orderId} rồi.\nVui lòng chờ phía còn lại xác nhận.`);
        return;
    }

    const entry = {
        id: handoverIdCounter++,
        txType, role, orderId, bikeName,
        odo: Number(odo),
        fuel: Number(fuel),
        imgFile, note,
        createdAt: new Date()
    };

    // Save image to storage
    if (imgFile) {
        const files = imgFile.split(",").map(f => f.trim()).filter(f => f);
        files.forEach(filename => {
            storedImages.unshift({
                label: `${txType} • ${bikeName}`,
                filename,
                role,
                orderId,
                txType,
                createdAt: new Date()
            });
        });
        renderStoredImages();
    }

    // Try to match with existing pending entry
    const matched = tryMatchHandover(entry);

    if (!matched) {
        pendingHandovers.unshift(entry);
        renderPendingHandovers();

        const otherRole = role === "Khách thuê" ? "Chủ xe" : "Khách thuê";
        alert(`📤 Biên bản ${txType} đã được gửi!\n\nĐơn #${orderId} — ${bikeName}\nVai trò: ${role}\n\n⏳ Đang chờ ${otherRole} gửi biên bản với thông số trùng khớp để xác nhận.`);
    }

    // Clear form
    document.getElementById("hoOdoInput").value = "";
    document.getElementById("hoFuelInput").value = "";
    document.getElementById("hoImgInput").value = "";
    document.getElementById("hoNoteInput").value = "";
});

// Update label based on role selection
document.querySelectorAll('input[name="roleType"]').forEach(radio => {
    radio.addEventListener("change", () => {
        const role = document.querySelector('input[name="roleType"]:checked').value;
        document.getElementById("hoNoteLabel").textContent =
            role === "Khách thuê" ? "Ghi chú của Khách thuê" : "Ghi chú của Chủ xe";
    });
});

document.getElementById("btnToggleIncident").addEventListener("click", () => {
    document.getElementById("incidentBox").classList.toggle("hidden");
});

document.getElementById("btnSendIncident").addEventListener("click", () => {
    const desc = document.getElementById("incidentDesc").value.trim();
    const cost = document.getElementById("incidentCost").value;
    const orderSelect = document.getElementById("hoOrderSelect");
    const orderId = orderSelect.value;
    const bikeName = orderSelect.options[orderSelect.selectedIndex].dataset.bike;

    if (!desc) {
        alert("⚠️ Vui lòng mô tả chi tiết sự cố!");
        return;
    }

    alert(`🚨 Báo cáo sự cố đã gửi!\n\nĐơn #${orderId} — ${bikeName}\nMô tả: ${desc}\nChi phí dự kiến: ${formatVND(Number(cost) || 0)}\n\nAdmin sẽ xem xét hình ảnh lưu trữ trong kho ảnh giao nhận (3 ngày) để đưa ra quyết định xử lý.`);

    document.getElementById("incidentDesc").value = "";
    document.getElementById("incidentBox").classList.add("hidden");
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
