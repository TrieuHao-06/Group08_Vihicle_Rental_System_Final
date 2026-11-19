const vehicles = [
    {
        id: 1,
        brand: "Honda",
        name: "Honda Vision 2024",
        seats: "Xe tay ga",
        trans: "110cc",
        fuel: "Xăng",
        owner: "Trương Công Hào",
        discount: "Giảm 10%",
        prices: { "Theo giờ": 25000, "Theo ngày": 140000 }
    },
    {
        id: 2,
        brand: "Honda",
        name: "Honda AirBlade 160 2024",
        seats: "Xe tay ga",
        trans: "155cc - 160cc",
        fuel: "Xăng",
        owner: "Trương Công Hào",
        discount: "Giảm 15%",
        prices: { "Theo giờ": 35000, "Theo ngày": 180000 }
    },
    {
        id: 3,
        brand: "Yamaha",
        name: "Yamaha Exciter 155 VVA",
        seats: "Xe côn tay",
        trans: "155cc - 160cc",
        fuel: "Xăng",
        owner: "Nguyễn Minh Tuấn",
        discount: "Xe mới",
        prices: { "Theo giờ": 40000, "Theo ngày": 200000 }
    },
    {
        id: 4,
        brand: "VinFast",
        name: "VinFast Evo200 2024",
        seats: "Xe máy điện",
        trans: "Pin LFP",
        fuel: "Điện",
        owner: "Nguyễn Minh Tuấn",
        discount: "Giảm 8%",
        prices: { "Theo giờ": 22000, "Theo ngày": 130000 }
    },
    {
        id: 5,
        brand: "Honda",
        name: "Honda Wave Alpha 2023",
        seats: "Xe số",
        trans: "110cc",
        fuel: "Xăng",
        owner: "Trương Công Hào",
        discount: "Tiết kiệm",
        prices: { "Theo giờ": 18000, "Theo ngày": 100000 }
    },
    {
        id: 6,
        brand: "Piaggio",
        name: "Vespa Sprint S 125",
        seats: "Xe tay ga",
        trans: "125cc",
        fuel: "Xăng",
        owner: "Lê Hoàng Nam",
        discount: "Cao cấp",
        prices: { "Theo giờ": 55000, "Theo ngày": 300000 }
    }
];

const promoCodes = {
    "BONBON10": 10,
    "BONBON50": 50
};

const bookings = [
    {
        code: "#BK0001",
        vehicleId: 1,
        vehicleName: "Honda Vision 2024",
        renterName: "Trương Công Hào",
        ownerName: "Trương Công Hào",
        status: "BOOKED"
    }
];

const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;
let systemPhotos = [
    {
        id: 1,
        uploaderRole: "Khách thuê",
        bookingCode: "#BK0001",
        fileName: "anh_nhan_xe_vision.jpg",
        dataUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><rect width="100%" height="100%" fill="#EFF6FF"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#2563EB" font-family="sans-serif" font-size="14" font-weight="bold">Ảnh mẫu Honda Vision</text></svg>`),
        createdAt: Date.now() - (1 * 24 * 60 * 60 * 1000),
        expiresAt: Date.now() + (3 * 24 * 60 * 60 * 1000)
    }
];

let selectedCar = vehicles[0];
let currentPlan = "Theo ngày";
let walletBalance = 2500000;
let isKycVerified = true;
let selectedRating = 5;

let isLoggedIn = false;
let currentUserName = "Trương Công Hào";
let currentRole = "RENTER";

function formatMoney(num) {
    return num.toLocaleString("vi-VN") + "₫";
}

function shortMoney(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(".0", "") + "M";
    return Math.round(num / 1000) + "K";
}

function populateVoucherComboBox() {
    const select = document.getElementById("promoCode");
    if (!select) return;
    const currentVal = select.value || "BONBON10";
    select.innerHTML = `<option value="NONE">-- Không sử dụng Voucher --</option>`;
    Object.keys(promoCodes).forEach(code => {
        const opt = document.createElement("option");
        opt.value = code;
        opt.innerText = `${code} — Giảm ${promoCodes[code]}%`;
        select.appendChild(opt);
    });
    if (promoCodes[currentVal]) {
        select.value = currentVal;
    }
}

function renderVehicles() {
    const brand = document.getElementById("filterBrand").value;
    const seats = document.getElementById("filterSeats").value;
    const trans = document.getElementById("filterTrans").value;
    const fuel = document.getElementById("filterFuel").value;
    const listEl = document.getElementById("vehicleList");
    listEl.innerHTML = "";

    const filtered = vehicles.filter(car => {
        return (brand === "ALL" || car.brand === brand) &&
            (seats === "ALL" || car.seats === seats) &&
            (trans === "ALL" || car.trans === trans) &&
            (fuel === "ALL" || car.fuel === fuel);
    });

    if (filtered.length === 0) {
        listEl.innerHTML = `<p class="sub-text">Không có mẫu xe máy nào khớp với bộ lọc hiện tại.</p>`;
        return;
    }

    filtered.forEach(car => {
        const badgeHtml = car.discount
            ? `<span class="badge badge-orange">${car.discount}</span>`
            : `<span class="badge badge-blue">${car.fuel}</span>`;
        const isCurrent = selectedCar && selectedCar.id === car.id;

        const card = document.createElement("div");
        card.className = "vehicle-card" + (isCurrent ? " selected-card" : "");
        card.innerHTML = `
      <div>
        <div class="vehicle-thumb">
          <span class="thumb-brand-tag">${car.brand}</span>
          <div class="thumb-promo-ribbon">${badgeHtml}</div>
          <span style="font-size:16px; font-weight:700; color:#0F172A;">${car.name}</span>
          <span style="font-size:12px; color:#64748B; margin-top:4px;">Chủ xe: ${car.owner}</span>
        </div>
        <div class="vehicle-body">
          <h3 style="margin:0; font-size:15px;">${car.name}</h3>
          <div class="spec-grid">
            <span>${car.seats}</span>
            <span>${car.trans}</span>
            <span>${car.fuel}</span>
          </div>
          <div class="price-box">
            <div>
              <span class="sub-text" style="font-size:11px; display:block;">Theo giờ</span>
              <div class="price-tag">${formatMoney(car.prices["Theo giờ"])}<small style="font-size:11px; font-weight:600;">/h</small></div>
            </div>
            <div style="text-align:right;">
              <span class="sub-text" style="font-size:11px; display:block;">Theo ngày</span>
              <strong style="font-size:14px; color:#0F172A;">${formatMoney(car.prices["Theo ngày"])}/ngày</strong>
            </div>
          </div>
          <button class="btn ${isCurrent ? 'btn-secondary' : 'btn-primary'}" style="width:100%; margin-top:14px;" onclick="chooseCar(${car.id})">
            ${isCurrent ? 'Đang chọn xe này' : 'Chọn xe này'}
          </button>
        </div>
      </div>
    `;
        listEl.appendChild(card);
    });
}

function chooseCar(carId) {
    const found = vehicles.find(c => c.id === carId);
    if (!found) return;
    selectedCar = found;
    renderVehicles();
    updateCarDetailView();
    updateBookingSummary();
}

function updateSelectedLocation() {
    updateCarDetailView();
}

function updateCarDetailView() {
    const loc = document.getElementById("searchLocation").value;
    document.getElementById("selectedCarName").innerText = selectedCar.name;
    document.getElementById("selectedCarDiscount").innerText = selectedCar.discount || "Tiêu chuẩn";
    document.getElementById("selectedCarSpecs").innerText = `${selectedCar.brand} • ${selectedCar.seats} • ${selectedCar.trans} • ${selectedCar.fuel} • ${loc}`;
    document.getElementById("selectedCarOwnerText").innerText = `Chủ xe: ${selectedCar.owner}`;

    document.getElementById("priceHourLabel").innerText = `${shortMoney(selectedCar.prices["Theo giờ"])} / giờ`;
    document.getElementById("priceDayLabel").innerText = `${shortMoney(selectedCar.prices["Theo ngày"])} / ngày`;
}

function selectPlan(planKey) {
    currentPlan = planKey;
    document.querySelectorAll(".plan-option").forEach(el => el.classList.remove("selected"));
    const qtyLabel = document.getElementById("durationQtyLabel");
    const qtyInput = document.getElementById("rentalDurationQty");

    if (planKey === "Theo giờ") {
        document.getElementById("planHour").classList.add("selected");
        qtyLabel.innerText = "Số giờ thuê";
        if (parseInt(qtyInput.value) === 1) qtyInput.value = 4;
    } else {
        document.getElementById("planDay").classList.add("selected");
        qtyLabel.innerText = "Số ngày thuê";
        if (parseInt(qtyInput.value) === 4) qtyInput.value = 1;
    }
    updateBookingSummary();
}

function toggleDeliveryKmInput() {
    const method = document.getElementById("deliveryMethod").value;
    const kmBox = document.getElementById("deliveryKmBox");
    kmBox.style.display = method === "DELIVERY" ? "block" : "none";
}

function updateBookingSummary() {
    const qty = Math.max(1, parseInt(document.getElementById("rentalDurationQty").value) || 1);
    const unitPrice = selectedCar.prices[currentPlan];
    const rentPrice = unitPrice * qty;

    const deliveryMethod = document.getElementById("deliveryMethod").value;
    const km = Math.max(0, parseFloat(document.getElementById("deliveryDistanceKm").value) || 0);
    let deliveryFee = 0;
    let formulaText = "Tự lấy tại điểm";

    if (deliveryMethod === "DELIVERY") {
        deliveryFee = Math.round(km * 4000 + 10000);
        formulaText = `${km} km × 4.000₫ + 10.000₫ phí`;
    }

    const code = document.getElementById("promoCode").value;
    const percent = promoCodes[code] || 0;
    const discount = Math.round((rentPrice * percent) / 100);
    const deposit = 300000;
    const total = rentPrice + deliveryFee - discount + deposit;

    const promoNotice = document.getElementById("promoNotice");
    if (percent > 0) {
        promoNotice.innerText = `Đã áp dụng mã ${code} — Giảm ${percent}%`;
        promoNotice.style.color = "#059669";
    } else {
        promoNotice.innerText = "Không áp dụng mã giảm giá.";
        promoNotice.style.color = "#64748B";
    }

    const unitLabel = currentPlan === "Theo giờ" ? "giờ" : "ngày";
    document.getElementById("planLabel").innerText = `${currentPlan} × ${qty} ${unitLabel}`;
    document.getElementById("rentPriceText").innerText = formatMoney(rentPrice);
    document.getElementById("deliveryFormulaText").innerText = formulaText;
    document.getElementById("deliveryFeeText").innerText = formatMoney(deliveryFee);
    document.getElementById("discountText").innerText = "-" + formatMoney(discount);
    document.getElementById("totalPayText").innerText = formatMoney(total);
}

function confirmPayment() {
    const resultEl = document.getElementById("paymentResult");
    if (!isLoggedIn) {
        resultEl.innerText = "Vui lòng nhấn nút Đăng nhập trên góc phải trước khi đặt xe.";
        resultEl.style.color = "#DC2626";
        openLoginModal();
        return;
    }

    if (!isKycVerified) {
        resultEl.innerText = "Cảnh báo: Hồ sơ eKYC của bạn đang chờ Admin xác thực trước khi đặt xe.";
        resultEl.style.color = "#D97706";
        return;
    }

    const qty = Math.max(1, parseInt(document.getElementById("rentalDurationQty").value) || 1);
    const rentPrice = selectedCar.prices[currentPlan] * qty;
    const deliveryMethod = document.getElementById("deliveryMethod").value;
    const km = Math.max(0, parseFloat(document.getElementById("deliveryDistanceKm").value) || 0);
    const deliveryFee = deliveryMethod === "DELIVERY" ? Math.round(km * 4000 + 10000) : 0;
    const code = document.getElementById("promoCode").value;
    const percent = promoCodes[code] || 0;
    const total = rentPrice + deliveryFee - Math.round((rentPrice * percent) / 100) + 300000;

    if (walletBalance < total) {
        resultEl.innerText = "Số dư Ví nội bộ không đủ. Vui lòng vào tab Tài khoản & Ví để nạp thêm.";
        resultEl.style.color = "#DC2626";
        return;
    }

    walletBalance -= total;
    updateWalletUI();

    const newBookingCode = `#BK000${bookings.length + 1}`;
    bookings.unshift({
        code: newBookingCode,
        vehicleId: selectedCar.id,
        vehicleName: selectedCar.name,
        renterName: currentUserName,
        ownerName: selectedCar.owner,
        status: "BOOKED"
    });

    document.getElementById("bookingCodeLabel").innerText = newBookingCode;
    addTransactionRow(`Thanh toán đơn ${newBookingCode} — ${selectedCar.name}`, -total);
    renderHandoverSelectors();

    resultEl.innerText = `Thanh toán thành công ${formatMoney(total)}! Đơn ${newBookingCode} sẵn sàng Check-in.`;
    resultEl.style.color = "#059669";
}

function renderHandoverSelectors() {
    const renterSelect = document.getElementById("renterBookingSelect");
    const ownerSelect = document.getElementById("ownerVehicleSelect");
    if (!renterSelect || !ownerSelect) return;

    const renterBookings = bookings.filter(b => b.renterName === currentUserName || currentRole === "ADMIN");
    renterSelect.innerHTML = "";
    if (renterBookings.length === 0) {
        renterSelect.innerHTML = `<option value="">-- Chưa có đơn đặt xe --</option>`;
    } else {
        renterBookings.forEach(b => {
            const stateLabel = b.status === "BOOKED"
                ? "Chờ Check-in"
                : b.status === "CHECKED_IN"
                    ? "Đã Check-in"
                    : "Đã Check-out";
            const opt = document.createElement("option");
            opt.value = b.code;
            opt.innerText = `${b.code} — ${b.vehicleName} • ${stateLabel}`;
            renterSelect.appendChild(opt);
        });
    }

    const ownerVehicles = vehicles.filter(v => v.owner === currentUserName || currentRole === "ADMIN");
    ownerSelect.innerHTML = "";
    if (ownerVehicles.length === 0) {
        ownerSelect.innerHTML = `<option value="">-- Chưa có xe ký gửi --</option>`;
    } else {
        ownerVehicles.forEach(v => {
            const opt = document.createElement("option");
            opt.value = v.id;
            opt.innerText = `Xe #${v.id} — ${v.name} • Chủ xe: ${v.owner}`;
            ownerSelect.appendChild(opt);
        });
    }

    updateHandoverModeUI();
}

function updateHandoverModeUI() {
    const activeBooking = bookings[0];
    const badge = document.getElementById("currentTripStateBadge");
    if (activeBooking && badge) {
        if (activeBooking.status === "BOOKED") {
            badge.innerText = `${activeBooking.code}: Chờ Check-in`;
            badge.className = "badge badge-orange";
        } else if (activeBooking.status === "CHECKED_IN") {
            badge.innerText = `${activeBooking.code}: Đã Check-in`;
            badge.className = "badge badge-blue";
        } else {
            badge.innerText = `${activeBooking.code}: Đã Check-out`;
            badge.className = "badge badge-green";
        }
    }

    const noticeEl = document.getElementById("handoverRolePermissionNotice");
    if (!noticeEl) return;

    if (!isLoggedIn) {
        noticeEl.innerText = "Chưa đăng nhập. Vui lòng đăng nhập để mở quyền Khách thuê hoặc Chủ xe.";
    } else if (currentRole === "RENTER") {
        noticeEl.innerText = `Khách thuê: ${currentUserName} — Chỉ Check-in/Check-out xe đã đặt.`;
    } else if (currentRole === "OWNER") {
        noticeEl.innerText = `Chủ xe: ${currentUserName} — Chỉ Check-in/Check-out xe thuộc sở hữu.`;
    } else {
        noticeEl.innerText = `Quản trị viên: ${currentUserName} — Toàn quyền đối chiếu 2 bên.`;
    }
}

function submitHandover() {
    const msgEl = document.getElementById("handoverMsg");
    if (!isLoggedIn) {
        msgEl.innerText = "Lỗi: Vui lòng đăng nhập trước khi thực hiện Check-in / Check-out.";
        msgEl.style.color = "#DC2626";
        return;
    }

    const type = document.getElementById("handoverType").value;
    const bookingCode = document.getElementById("renterBookingSelect").value;
    const ownerVehicleId = parseInt(document.getElementById("ownerVehicleSelect").value) || 0;

    const booking = bookings.find(b => b.code === bookingCode);
    if (!booking) {
        msgEl.innerText = "Lỗi phân quyền: Không tìm thấy đơn đặt xe hợp lệ của Khách thuê.";
        msgEl.style.color = "#DC2626";
        return;
    }

    if (booking.vehicleId !== ownerVehicleId) {
        msgEl.innerText = `Không khớp xe: Đơn ${booking.code} của Khách đặt xe "${booking.vehicleName}", nhưng phía Chủ xe đang chọn xe khác!`;
        msgEl.style.color = "#DC2626";
        return;
    }

    if (type === "CHECKIN" && booking.status !== "BOOKED") {
        msgEl.innerText = `Lỗi quy trình: Đơn ${booking.code} đã Check-in lấy xe rồi, không thể Check-in lại!`;
        msgEl.style.color = "#D97706";
        return;
    }

    if (type === "CHECKOUT" && booking.status !== "CHECKED_IN") {
        msgEl.innerText = `Chặn thao tác: Khách phải thực hiện Check-in nhận xe thành công trước khi Check-out trả xe!`;
        msgEl.style.color = "#DC2626";
        return;
    }

    const renterOdo = parseInt(document.getElementById("renterOdoInput").value);
    const ownerOdo = parseInt(document.getElementById("ownerOdoInput").value);
    const renterFuel = parseInt(document.getElementById("renterFuelInput").value);
    const ownerFuel = parseInt(document.getElementById("ownerFuelInput").value);
    const renterNote = document.getElementById("renterNote").value.trim();
    const ownerNote = document.getElementById("ownerNote").value.trim();

    if (isNaN(renterOdo) || isNaN(ownerOdo) || isNaN(renterFuel) || isNaN(ownerFuel)) {
        msgEl.innerText = "Vui lòng nhập đầy đủ số Odometer và Mức xăng/Pin ở cả 2 phía.";
        msgEl.style.color = "#DC2626";
        return;
    }

    if (renterOdo !== ownerOdo || renterFuel !== ownerFuel) {
        msgEl.innerText = `Dữ liệu 2 bên không trùng khớp: Khách khai báo ${renterOdo} km, ${renterFuel}% ≠ Chủ xe khai báo ${ownerOdo} km, ${ownerFuel}%.`;
        msgEl.style.color = "#DC2626";
        return;
    }
    const actionLabel = type === "CHECKIN" ? "Check-in" : "Check-out";
    const badgeClass = type === "CHECKIN" ? "badge-blue" : "badge-green";

    if (type === "CHECKIN") {
        booking.status = "CHECKED_IN";
        document.getElementById("handoverType").value = "CHECKOUT";
    } else {
        booking.status = "CHECKED_OUT";
    }

    const tbody = document.getElementById("handoverHistoryTable");
    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td><span class="badge ${badgeClass}">${actionLabel}</span></td>
    <td><strong>${booking.code}</strong> • ${booking.vehicleName}</td>
    <td>${renterOdo.toLocaleString("vi-VN")} km</td>
    <td>${renterFuel}%</td>
    <td>Khách: "${renterNote}" | Chủ: "${ownerNote}"</td>
  `;
    tbody.prepend(tr);

    renderHandoverSelectors();
    msgEl.innerText = `✔ Đối chiếu dữ liệu 2 bên trùng khớp 100%! Đã thực thi ${actionLabel} cho đơn ${booking.code} lúc ${new Date().toLocaleTimeString("vi-VN")}.`;
    msgEl.style.color = "#059669";
}

function purgeExpiredPhotos() {
    const now = Date.now();
    systemPhotos = systemPhotos.filter(photo => photo.expiresAt > now);
}

function handlePhotoUpload(inputEl, uploaderRole) {
    if (!inputEl.files || inputEl.files.length === 0) return;
    purgeExpiredPhotos();

    const bookingCode = document.getElementById("renterBookingSelect").value || "#BK0001";
    Array.from(inputEl.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const now = Date.now();
            systemPhotos.unshift({
                id: now + Math.random(),
                uploaderRole: uploaderRole,
                bookingCode: bookingCode,
                fileName: file.name,
                dataUrl: e.target.result,
                createdAt: now,
                expiresAt: now + FOUR_DAYS_MS
            });
            renderSavedPhotos();
        };
        reader.readAsDataURL(file);
    });
}

function renderSavedPhotos() {
    purgeExpiredPhotos();
    const gallery = document.getElementById("savedPhotosGallery");
    if (!gallery) return;
    gallery.innerHTML = "";

    if (systemPhotos.length === 0) {
        gallery.innerHTML = `<p class="sub-text">Chưa có hình ảnh nào hoặc ảnh quá 4 ngày đã tự động xóa.</p>`;
        return;
    }

    systemPhotos.forEach(p => {
        const remainingDays = Math.max(1, Math.ceil((p.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
        const div = document.createElement("div");
        div.className = "photo-item";
        div.innerHTML = `
      <img src="${p.dataUrl}" alt="${p.fileName}">
      <div style="font-weight:700; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.fileName}</div>
      <div class="sub-text" style="font-size:11px;">Từ: <strong>${p.uploaderRole}</strong> • ${p.bookingCode}</div>
      <div style="margin-top:4px;"><span class="badge badge-orange">Xóa sau ${remainingDays} ngày</span></div>
    `;
        gallery.appendChild(div);
    });
}

function toggleIncidentBox() {
    const box = document.getElementById("incidentBox");
    box.style.display = box.style.display === "none" ? "block" : "none";
}

function reportIncident() {
    const desc = document.getElementById("incidentDesc").value.trim();
    const cost = parseInt(document.getElementById("incidentCost").value) || 0;
    if (!desc) return;

    const adminTable = document.getElementById("adminApprovalTable");
    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td><strong>Sự cố / Hư hỏng</strong></td>
    <td>Đơn #BK0001 • ${desc} • Khấu trừ: ${formatMoney(cost)}</td>
    <td><span class="badge badge-red">Tranh chấp</span></td>
    <td><button class="btn btn-primary" onclick="resolveDisputeRow(this)">Xác nhận xử lý</button></td>
  `;
    adminTable.prepend(tr);
    document.getElementById("incidentMsg").innerText = "Đã chuyển hồ sơ sự cố sang tab Công cụ quản lý của Admin.";
}

function selectStar(stars, btn) {
    selectedRating = stars;
    document.querySelectorAll(".star-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
}

function submitReview() {
    const comment = document.getElementById("reviewComment").value;
    document.getElementById("reviewMsg").innerText = `Đã ghi nhận đánh giá ${selectedRating} sao: "${comment}"`;
}

function openLoginModal() {
    document.getElementById("modalTitle").innerText = "Đăng nhập hệ thống";
    document.getElementById("loginFormBox").style.display = "block";
    document.getElementById("changePassFormBox").style.display = "none";
    document.getElementById("authModal").style.display = "flex";
}

function openChangePasswordModal() {
    if (!isLoggedIn) {
        openLoginModal();
        return;
    }
    document.getElementById("modalTitle").innerText = "Đổi mật khẩu tài khoản";
    document.getElementById("loginFormBox").style.display = "none";
    document.getElementById("changePassFormBox").style.display = "block";
    document.getElementById("authModal").style.display = "flex";
}

function closeAuthModal() {
    document.getElementById("authModal").style.display = "none";
}

function confirmLogin() {
    const nameInput = document.getElementById("loginUsernameInput").value.trim() || "Trương Công Hào";
    const roleSelect = document.getElementById("loginRoleSelect").value;
    currentUserName = nameInput;
    currentRole = roleSelect;
    isLoggedIn = true;

    closeAuthModal();
    syncAuthHeaderAndNav();
    renderHandoverSelectors();

    const notice = document.getElementById("authActionNotice");
    if (notice) {
        notice.innerText = `Đã đăng nhập thành công với tên "${currentUserName}".`;
    }
}

function confirmChangePassword() {
    const newPass = document.getElementById("newPassInput").value;
    const confirmPass = document.getElementById("confirmPassInput").value;
    const notice = document.getElementById("authActionNotice");

    if (!newPass || newPass !== confirmPass) {
        alert("Mật khẩu mới và xác nhận mật khẩu không khớp!");
        return;
    }
    closeAuthModal();
    if (notice) {
        notice.innerText = `Đã đổi mật khẩu thành công lúc ${new Date().toLocaleTimeString("vi-VN")}.`;
    }
}

function changeUserRole(newRole) {
    currentRole = newRole;
    syncAuthHeaderAndNav();
    renderHandoverSelectors();
}

function syncAuthHeaderAndNav() {
    const loginBtn = document.getElementById("headerLoginBtn");
    const headerBadge = document.getElementById("headerAuthBadge");
    const roleSwitcher = document.getElementById("roleSwitcher");
    const navAdminTab = document.getElementById("navAdminTab");
    const stateText = document.getElementById("authAccountState");
    const btnOpenLoginInWallet = document.getElementById("btnOpenLoginInWallet");
    const btnChangePassword = document.getElementById("btnChangePassword");
    const btnLogout = document.getElementById("btnLogout");

    if (!isLoggedIn) {
        loginBtn.style.display = "inline-block";
        headerBadge.style.display = "none";
        roleSwitcher.style.display = "none";
        navAdminTab.style.display = "none";

        stateText.innerText = "Chưa đăng nhập";
        stateText.style.color = "#64748B";
        btnOpenLoginInWallet.style.display = "inline-block";
        btnChangePassword.disabled = true;
        btnLogout.disabled = true;

        if (document.getElementById("admin").classList.contains("active")) {
            switchTab("renter", document.querySelector(".nav-btn[data-tab='renter']"));
        }
        return;
    }

    loginBtn.style.display = "none";
    headerBadge.style.display = "inline-block";
    roleSwitcher.style.display = "inline-block";
    roleSwitcher.value = currentRole;

    btnOpenLoginInWallet.style.display = "none";
    btnChangePassword.disabled = false;
    btnLogout.disabled = false;

    if (currentRole === "ADMIN") {
        headerBadge.innerText = `${currentUserName} • Admin`;
        headerBadge.className = "badge badge-red";
        navAdminTab.style.display = "inline-block";
        stateText.innerText = `${currentUserName} — Quản trị viên`;
        stateText.style.color = "#DC2626";
    } else {
        const subRoleText = currentRole === "OWNER" ? "Chủ xe" : "Khách thuê";
        headerBadge.innerText = `${currentUserName} • ${subRoleText}`;
        headerBadge.className = "badge badge-green";
        navAdminTab.style.display = "none";
        stateText.innerText = `${currentUserName} — ${subRoleText}`;
        stateText.style.color = "#059669";

        if (document.getElementById("admin").classList.contains("active")) {
            switchTab("renter", document.querySelector(".nav-btn[data-tab='renter']"));
        }
    }
}

function handleAuthAction(action) {
    if (action === "LOGOUT") {
        isLoggedIn = false;
        syncAuthHeaderAndNav();
        renderHandoverSelectors();
        const notice = document.getElementById("authActionNotice");
        if (notice) notice.innerText = "Đã đăng xuất khỏi hệ thống.";
    }
}

function submitKycDocument() {
    const name = document.getElementById("kycName").value.trim();
    const cccd = document.getElementById("kycCccd").value.trim();
    const phone = document.getElementById("kycPhone").value.trim();
    const email = document.getElementById("kycEmail").value.trim();

    if (!name || !cccd || !phone || !email) return;

    isKycVerified = false;
    const kycBadge = document.getElementById("kycStatusBadge");
    const checkoutBadge = document.getElementById("checkoutKycBadge");
    const adminBadge = document.getElementById("adminKycRowBadge");
    const adminBtn = document.getElementById("adminKycBtn");
    const adminDetail = document.getElementById("adminKycDetailCell");

    if (adminDetail) {
        adminDetail.innerText = `${name} • CCCD: ${cccd} • SĐT: ${phone} • Email: ${email}`;
    }

    kycBadge.innerText = "Chờ Admin xác thực";
    kycBadge.className = "badge badge-orange";

    checkoutBadge.innerText = "Chờ duyệt eKYC";
    checkoutBadge.className = "badge badge-orange";

    adminBadge.innerText = "Chờ duyệt";
    adminBadge.className = "badge badge-orange";
    adminBtn.disabled = false;
    adminBtn.innerText = "Phê duyệt eKYC";
}

function adminVerifyKyc() {
    isKycVerified = true;
    document.getElementById("kycStatusBadge").innerText = "Đã được Admin duyệt";
    document.getElementById("kycStatusBadge").className = "badge badge-green";

    document.getElementById("checkoutKycBadge").innerText = "Đã xác thực";
    document.getElementById("checkoutKycBadge").className = "badge badge-green";

    document.getElementById("adminKycRowBadge").innerText = "Đã xác thực";
    document.getElementById("adminKycRowBadge").className = "badge badge-green";

    const adminBtn = document.getElementById("adminKycBtn");
    adminBtn.disabled = true;
    adminBtn.innerText = "Đã duyệt eKYC";
}

function updateWalletUI() {
    document.getElementById("walletBalance").innerText = formatMoney(walletBalance);
    const walletOption = document.querySelector("#paymentGateway option[value='WALLET']");
    if (walletOption) {
        walletOption.innerText = `Ví nội bộ — ${formatMoney(walletBalance)}`;
    }
}

function addTransactionRow(label, signedAmount) {
    const tbody = document.getElementById("txTable");
    const tr = document.createElement("tr");
    const isPositive = signedAmount >= 0;
    const color = isPositive ? "#059669" : "#0F172A";
    const prefix = isPositive ? "+" : "-";
    tr.innerHTML = `
    <td><strong>#TX${Math.floor(Math.random() * 899 + 100)}</strong></td>
    <td>${label}</td>
    <td style="color:${color}; font-weight:700;">${prefix}${formatMoney(Math.abs(signedAmount))}</td>
    <td><span class="badge badge-green">Hoàn tất</span></td>
  `;
    tbody.prepend(tr);
}

function openQrDevelopingPage(amount) {
    const qrText = "Chức năng còn đang phát triển";
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrText)}`;
    const qrWin = window.open("", "_blank");
    if (!qrWin) {
        alert("Chức năng còn đang phát triển (Vui lòng cho phép mở tab mới để xem mã QR).");
        return;
    }
    qrWin.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Cổng Nạp Tiền QR — RENT A BIKE</title>
        <style>
          body {
            margin: 0;
            font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #F1F5F9;
            color: #0F172A;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .qr-card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            border: none;
            border-radius: 24px;
            padding: 36px;
            max-width: 420px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          }
          .badge {
            display: inline-block;
            background: #FFFBEB;
            color: #D97706;
            font-size: 12px;
            font-weight: 700;
            padding: 6px 14px;
            border-radius: 9999px;
            margin-bottom: 16px;
          }
          h2 {
            font-size: 18px;
            margin: 0 0 8px;
          }
          p {
            font-size: 13px;
            color: #64748B;
            margin: 0 0 22px;
          }
          .qr-box {
            display: inline-block;
            padding: 18px;
            border: none;
            border-radius: 20px;
            background: #FFFFFF;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
            margin-bottom: 18px;
          }
          .qr-msg {
            font-size: 14px;
            font-weight: 700;
            color: #0F7AE5;
            background: #F8FAFC;
            padding: 12px 16px;
            border-radius: 12px;
            margin-bottom: 18px;
          }
          button {
            background: #0F7AE5;
            color: #FFFFFF;
            border: none;
            padding: 12px 24px;
            border-radius: 9999px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(15, 122, 229, 0.25);
          }
        </style>
      </head>
      <body>
        <div class="qr-card">
          <span class="badge">CỔNG THANH TOÁN QR</span>
          <h2>Quét mã QR để nạp ${amount.toLocaleString("vi-VN")}₫</h2>
          <p>Sử dụng ứng dụng Ngân hàng hoặc Ví điện tử để quét mã QR bên dưới:</p>
          <div class="qr-box">
            <img src="${qrApiUrl}" width="220" height="220" alt="QR Code">
          </div>
          <div class="qr-msg">Nội dung mã QR: "${qrText}"</div>
          <button onclick="window.close()">Đóng trang này</button>
        </div>
      </body>
      </html>
    `);
    qrWin.document.close();
}

function processWallet(type) {
    const amount = Math.max(10000, parseInt(document.getElementById("walletAmount").value) || 500000);

    if (type === "DEPOSIT") {
        walletBalance += amount;
        addTransactionRow("Nạp tiền qua QR", amount);
        updateWalletUI();
        openQrDevelopingPage(amount);
    } else {
        if (amount > walletBalance) {
            addTransactionRow("Yêu cầu rút tiền vượt số dư", 0);
            alert("Số dư khả dụng nhỏ hơn số tiền muốn rút!");
            return;
        }
        walletBalance -= amount;
        addTransactionRow("Rút tiền về ngân hàng", -amount);
        updateWalletUI();
    }
}

function submitConsignVehicle() {
    const brand = document.getElementById("newCarBrand").value;
    const model = document.getElementById("newCarModel").value.trim();
    const seats = document.getElementById("newCarSeats").value;
    const trans = document.getElementById("newCarTrans").value;
    const fuel = document.getElementById("newCarFuel").value;
    const priceHour = parseInt(document.getElementById("newCarPriceHour").value) || 30000;
    const priceDay = parseInt(document.getElementById("newCarPriceDay").value) || 180000;

    if (!model) return;

    const tbody = document.getElementById("adminApprovalTable");
    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td><strong>Duyệt xe ký gửi</strong></td>
    <td>${model} • ${seats} • ${trans} • ${fuel} • ${shortMoney(priceHour)}/giờ • ${shortMoney(priceDay)}/ngày</td>
    <td><span class="badge badge-orange">Chờ duyệt</span></td>
    <td><button class="btn btn-primary" onclick="approvePendingCar('${brand}', '${model}', '${seats}', '${trans}', '${fuel}', ${priceHour}, ${priceDay}, this)">Duyệt lên sàn</button></td>
  `;
    tbody.prepend(tr);
    document.getElementById("newCarModel").value = "";
    document.getElementById("consignMsg").innerText = "Đã gửi thông tin xe máy xuống tab Công cụ quản lý của Admin chờ duyệt.";
}

function approvePendingCar(brand, name, seats, trans, fuel, priceHour, priceDay, btn) {
    vehicles.push({
        id: vehicles.length + 1,
        brand: brand,
        name: name,
        seats: seats,
        trans: trans,
        fuel: fuel,
        owner: currentUserName,
        discount: "Mới lên sàn",
        prices: {
            "Theo giờ": priceHour,
            "Theo ngày": priceDay
        }
    });
    renderVehicles();
    renderHandoverSelectors();

    const row = btn.closest("tr");
    row.children[2].innerHTML = `<span class="badge badge-green">Đã lên sàn</span>`;
    btn.disabled = true;
    btn.innerText = "Đã duyệt";
}

function adminRefundDeposit(btn) {
    walletBalance += 300000;
    updateWalletUI();
    addTransactionRow("Hoàn cọc đơn #BK0001 từ Admin", 300000);

    const row = btn.closest("tr");
    row.children[2].innerHTML = `<span class="badge badge-green">Đã hoàn cọc</span>`;
    btn.disabled = true;
    btn.innerText = "Đã hoàn 300K";
}

function resolveDisputeRow(btn) {
    const row = btn.closest("tr");
    row.children[2].innerHTML = `<span class="badge badge-green">Đã xử lý</span>`;
    btn.disabled = true;
    btn.innerText = "Xong";
}

function toggleScheduleStatus(btn) {
    const row = btn.closest("tr");
    const badgeCell = row.children[2];
    if (badgeCell.innerText.includes("Đang trống")) {
        badgeCell.innerHTML = `<span class="badge badge-red">Đã khóa lịch</span>`;
        btn.innerText = "Mở trống";
    } else {
        badgeCell.innerHTML = `<span class="badge badge-green">Đang trống</span>`;
        btn.innerText = "Khóa lịch";
    }
}

function renderPromoTable() {
    const tbody = document.getElementById("promoTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    Object.keys(promoCodes).forEach(code => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td><strong>${code}</strong></td>
      <td>Giảm ${promoCodes[code]}%</td>
      <td><span class="badge badge-green">Đang hoạt động</span></td>
    `;
        tbody.appendChild(tr);
    });
    populateVoucherComboBox();
}

function addPromoCode() {
    const code = document.getElementById("newPromoCode").value.trim().toUpperCase();
    const percent = parseInt(document.getElementById("newPromoPercent").value) || 0;
    if (!code || percent <= 0 || percent > 90) return;

    promoCodes[code] = percent;
    renderPromoTable();
    updateBookingSummary();
    document.getElementById("newPromoCode").value = "";
}

function switchTab(tabId, btn) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
}

function quickSwitchTab(tabId) {
    const targetBtn = document.querySelector(`.nav-btn[data-tab='${tabId}']`);
    switchTab(tabId, targetBtn);
}

populateVoucherComboBox();
renderVehicles();
updateCarDetailView();
updateBookingSummary();
renderPromoTable();
syncAuthHeaderAndNav();
renderHandoverSelectors();
renderSavedPhotos();
