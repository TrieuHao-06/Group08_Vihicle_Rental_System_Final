var vehicles = [
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
]

var promoCodes = {
    "BONBON10": 10,
    "BONBON50": 50
};

var bookings = [
    {
        code: "#BK0001",
        vehicleId: 1,
        vehicleName: "Honda Vision 2024",
        renterName: "Trương Công Hào",
        ownerName: "Trương Công Hào",
        status: "BOOKED"
    }
];

var FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;
var systemPhotos = [
    {
        id: 1,
        uploaderRole: "Khách thuê",
        bookingCode: "#BK0001",
        fileName: "anh_nhan_xe_vision.jpg",
        dataUrl: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><rect width="100%" height="100%" fill="#EFF6FF"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#2563EB" font-family="sans-serif" font-size="14" font-weight="bold">Ảnh mẫu Honda Vision</text></svg>'),
        createdAt: Date.now() - (1 * 24 * 60 * 60 * 1000),
        expiresAt: Date.now() + (3 * 24 * 60 * 60 * 1000)
    }
];

var selectedCar = vehicles[0]
var currentPlan = "Theo ngày"
var walletBalance = 2500000
var isKycVerified = true
var selectedRating = 5

var isLoggedIn = false
var currentUserName = "Trương Công Hào"
var currentRole = "RENTER"
var demTam = 0
var bienKhongDung = ""

function formatMoney(num) {
    var kq = num.toLocaleString("vi-VN") + "₫"
    return kq
}

function shortMoney(num) {
    if (num >= 1000000) {
        var m = (num / 1000000).toFixed(1)
        m = m.replace(".0", "")
        return m + "M"
    } else {
        var k = Math.round(num / 1000)
        return k + "K"
    }
}

function populateVoucherComboBox() {
    var select = document.getElementById("promoCode")
    if (select == null) {
        return
    }
    var currentVal = select.value
    if (currentVal == "" || currentVal == null) {
        currentVal = "BONBON10"
    }
    select.innerHTML = '<option value="NONE">-- Không sử dụng Voucher --</option>'
    var keys = Object.keys(promoCodes)
    for (var i = 0; i < keys.length; i++) {
        var code = keys[i]
        var opt = document.createElement("option")
        opt.value = code
        opt.innerText = code + " — Giảm " + promoCodes[code] + "%"
        select.appendChild(opt)
    }
    if (promoCodes[currentVal]) {
        select.value = currentVal
    }
}

function renderVehicles() {
    var brand = document.getElementById("filterBrand").value
    var seats = document.getElementById("filterSeats").value
    var trans = document.getElementById("filterTrans").value
    var fuel = document.getElementById("filterFuel").value
    var listEl = document.getElementById("vehicleList")
    listEl.innerHTML = ""

    var filtered = []
    for (var i = 0; i < vehicles.length; i++) {
        var car = vehicles[i]
        var ok1 = (brand == "ALL" || car.brand == brand)
        var ok2 = (seats == "ALL" || car.seats == seats)
        var ok3 = (trans == "ALL" || car.trans == trans)
        var ok4 = (fuel == "ALL" || car.fuel == fuel)
        if (ok1 && ok2 && ok3 && ok4) {
            filtered.push(car)
        }
    }

    if (filtered.length == 0) {
        listEl.innerHTML = '<p class="sub-text">Không có mẫu xe máy nào khớp với bộ lọc hiện tại.</p>'
        return
    }

    for (var j = 0; j < filtered.length; j++) {
        var xe = filtered[j]
        var isCurrent = false
        if (selectedCar != null && selectedCar.id == xe.id) {
            isCurrent = true
        }

        var btnClass = "btn-primary"
        var btnText = "Chọn xe này"
        if (isCurrent == true) {
            btnClass = "btn-secondary"
            btnText = "Đang chọn xe này"
        }

        var card = document.createElement("div")
        if (isCurrent == true) {
            card.className = "vehicle-card selected-card"
        } else {
            card.className = "vehicle-card"
        }

        var html = ""
        html = html + '<div>'
        html = html + '<div class="vehicle-thumb">'
        html = html + '<span class="thumb-brand-tag">' + xe.brand + '</span>'
        html = html + '<span style="font-size:16px; font-weight:700; color:#0F172A;">' + xe.name + '</span>'
        html = html + '</div>'
        html = html + '<div class="vehicle-body">'
        html = html + '<h3 style="margin:0; font-size:15px;">' + xe.name + '</h3>'
        html = html + '<div class="spec-grid">'
        html = html + '<span>' + xe.seats + '</span>'
        html = html + '<span>' + xe.trans + '</span>'
        html = html + '<span>' + xe.fuel + '</span>'
        html = html + '</div>'
        html = html + '<div class="price-box">'
        html = html + '<div>'
        html = html + '<span class="sub-text" style="font-size:11px; display:block;">Theo giờ</span>'
        html = html + '<div class="price-tag">' + formatMoney(xe.prices["Theo giờ"]) + '<small style="font-size:11px; font-weight:600;">/h</small></div>'
        html = html + '</div>'
        html = html + '<div style="text-align:right;">'
        html = html + '<span class="sub-text" style="font-size:11px; display:block;">Theo ngày</span>'
        html = html + '<strong style="font-size:14px; color:#0F172A;">' + formatMoney(xe.prices["Theo ngày"]) + '/ngày</strong>'
        html = html + '</div>'
        html = html + '</div>'
        html = html + '<button class="btn ' + btnClass + '" style="width:100%; margin-top:14px;" onclick="chooseCar(' + xe.id + ')">' + btnText + '</button>'
        html = html + '</div>'
        html = html + '</div>'

        card.innerHTML = html
        listEl.appendChild(card)
    }
}

function chooseCar(carId) {
    var found = null
    for (var i = 0; i < vehicles.length; i++) {
        if (vehicles[i].id == carId) {
            found = vehicles[i]
            break
        }
    }
    if (found == null) {
        return
    }
    selectedCar = found
    console.log("chon xe", selectedCar.name)
    renderVehicles()
    updateCarDetailView()
    updateBookingSummary()
}

function updateSelectedLocation() {
    updateCarDetailView()
}

function updateCarDetailView() {
    var loc = document.getElementById("searchLocation").value
    document.getElementById("selectedCarName").innerText = selectedCar.name
    document.getElementById("selectedCarSpecs").innerText = selectedCar.brand + " • " + selectedCar.seats + " • " + selectedCar.trans + " • " + selectedCar.fuel + " • " + loc

    document.getElementById("priceHourLabel").innerText = shortMoney(selectedCar.prices["Theo giờ"]) + " / giờ"
    document.getElementById("priceDayLabel").innerText = shortMoney(selectedCar.prices["Theo ngày"]) + " / ngày"
}

function selectPlan(planKey) {
    currentPlan = planKey
    var allPlans = document.querySelectorAll(".plan-option")
    for (var i = 0; i < allPlans.length; i++) {
        allPlans[i].classList.remove("selected")
    }
    var qtyLabel = document.getElementById("durationQtyLabel")
    var qtyInput = document.getElementById("rentalDurationQty")

    if (planKey == "Theo giờ") {
        document.getElementById("planHour").classList.add("selected")
        qtyLabel.innerText = "Số giờ thuê"
        if (parseInt(qtyInput.value) == 1) {
            qtyInput.value = 4
        }
    } else {
        document.getElementById("planDay").classList.add("selected")
        qtyLabel.innerText = "Số ngày thuê"
        if (parseInt(qtyInput.value) == 4) {
            qtyInput.value = 1
        }
    }
    updateBookingSummary()
}

function toggleDeliveryKmInput() {
    var method = document.getElementById("deliveryMethod").value
    var kmBox = document.getElementById("deliveryKmBox")
    if (method == "DELIVERY") {
        kmBox.style.display = "block"
    } else {
        kmBox.style.display = "none"
    }
}

function updateBookingSummary() {
    var qty = parseInt(document.getElementById("rentalDurationQty").value)
    if (isNaN(qty) || qty < 1) {
        qty = 1
    }
    var unitPrice = selectedCar.prices[currentPlan]
    var rentPrice = unitPrice * qty

    var deliveryMethod = document.getElementById("deliveryMethod").value
    var km = parseFloat(document.getElementById("deliveryDistanceKm").value)
    if (isNaN(km) || km < 0) {
        km = 0
    }
    var deliveryFee = 0
    var formulaText = "Tự lấy tại điểm"

    if (deliveryMethod == "DELIVERY") {
        deliveryFee = Math.round(km * 4000 + 10000)
        formulaText = km + " km × 4.000₫ + 10.000₫ phí"
    }

    var code = document.getElementById("promoCode").value
    var percent = promoCodes[code]
    if (!percent) {
        percent = 0
    }
    var discount = Math.round((rentPrice * percent) / 100)
    var deposit = 300000
    var total = rentPrice + deliveryFee - discount + deposit

    var promoNotice = document.getElementById("promoNotice")
    if (percent > 0) {
        promoNotice.innerText = "Đã áp dụng mã " + code + " — Giảm " + percent + "%"
        promoNotice.style.color = "#059669"
    } else {
        promoNotice.innerText = "Không áp dụng mã giảm giá."
        promoNotice.style.color = "#64748B"
    }

    var unitLabel = "ngày"
    if (currentPlan == "Theo giờ") {
        unitLabel = "giờ"
    }
    document.getElementById("planLabel").innerText = currentPlan + " × " + qty + " " + unitLabel
    document.getElementById("rentPriceText").innerText = formatMoney(rentPrice)
    document.getElementById("deliveryFormulaText").innerText = formulaText
    document.getElementById("deliveryFeeText").innerText = formatMoney(deliveryFee)
    document.getElementById("discountText").innerText = "-" + formatMoney(discount)
    document.getElementById("totalPayText").innerText = formatMoney(total)
}

function confirmPayment() {
    var resultEl = document.getElementById("paymentResult")
    if (isLoggedIn == false) {
        resultEl.innerText = "Vui lòng nhấn nút Đăng nhập trên góc phải trước khi đặt xe."
        resultEl.style.color = "#DC2626"
        openLoginModal()
        return
    }

    if (isKycVerified == false) {
        resultEl.innerText = "Cảnh báo: Hồ sơ eKYC của bạn đang chờ Admin xác thực trước khi đặt xe."
        resultEl.style.color = "#D97706"
        return
    }

    var qty = parseInt(document.getElementById("rentalDurationQty").value)
    if (isNaN(qty) || qty < 1) {
        qty = 1
    }
    var rentPrice = selectedCar.prices[currentPlan] * qty
    var deliveryMethod = document.getElementById("deliveryMethod").value
    var km = parseFloat(document.getElementById("deliveryDistanceKm").value)
    if (isNaN(km) || km < 0) {
        km = 0
    }
    var deliveryFee = 0
    if (deliveryMethod == "DELIVERY") {
        deliveryFee = Math.round(km * 4000 + 10000)
    }
    var code = document.getElementById("promoCode").value
    var percent = promoCodes[code] || 0
    var giamGia = Math.round((rentPrice * percent) / 100)
    var total = rentPrice + deliveryFee - giamGia + 300000

    if (walletBalance < total) {
        resultEl.innerText = "Số dư Ví nội bộ không đủ. Vui lòng vào tab Tài khoản & Ví để nạp thêm."
        resultEl.style.color = "#DC2626"
        return
    }

    walletBalance = walletBalance - total
    updateWalletUI()

    var soDon = bookings.length + 1
    var newBookingCode = "#BK000" + soDon
    bookings.unshift({
        code: newBookingCode,
        vehicleId: selectedCar.id,
        vehicleName: selectedCar.name,
        renterName: currentUserName,
        ownerName: selectedCar.owner,
        status: "BOOKED"
    })

    document.getElementById("bookingCodeLabel").innerText = newBookingCode
    addTransactionRow("Thanh toán đơn " + newBookingCode + " — " + selectedCar.name, -total)
    renderHandoverSelectors()

    resultEl.innerText = "Thanh toán thành công " + formatMoney(total) + "! Đơn " + newBookingCode + " sẵn sàng Check-in."
    resultEl.style.color = "#059669"
}

function renderHandoverSelectors() {
    var renterSelect = document.getElementById("renterBookingSelect")
    var ownerSelect = document.getElementById("ownerVehicleSelect")
    if (renterSelect == null || ownerSelect == null) {
        return
    }

    var renterBookings = []
    for (var i = 0; i < bookings.length; i++) {
        if (bookings[i].renterName == currentUserName || currentRole == "ADMIN") {
            renterBookings.push(bookings[i])
        }
    }

    renterSelect.innerHTML = ""
    if (renterBookings.length == 0) {
        renterSelect.innerHTML = '<option value="">-- Chưa có đơn đặt xe --</option>'
    } else {
        for (var j = 0; j < renterBookings.length; j++) {
            var b = renterBookings[j]
            var stateLabel = "Đã Check-out"
            if (b.status == "BOOKED") {
                stateLabel = "Chờ Check-in"
            } else if (b.status == "CHECKED_IN") {
                stateLabel = "Đã Check-in"
            }
            var opt = document.createElement("option")
            opt.value = b.code
            opt.innerText = b.code + " — " + b.vehicleName + " • " + stateLabel
            renterSelect.appendChild(opt)
        }
    }

    var ownerVehicles = []
    for (var k = 0; k < vehicles.length; k++) {
        if (vehicles[k].owner == currentUserName || currentRole == "ADMIN") {
            ownerVehicles.push(vehicles[k])
        }
    }

    ownerSelect.innerHTML = ""
    if (ownerVehicles.length == 0) {
        ownerSelect.innerHTML = '<option value="">-- Chưa có xe ký gửi --</option>'
    } else {
        for (var m = 0; m < ownerVehicles.length; m++) {
            var v = ownerVehicles[m]
            var opt2 = document.createElement("option")
            opt2.value = v.id
            opt2.innerText = "Xe #" + v.id + " — " + v.name + " • Chủ xe: " + v.owner
            ownerSelect.appendChild(opt2)
        }
    }

    updateHandoverModeUI()
}

function switchHandoverParty(party) {
    var renterBox = document.getElementById("renterPartyBox")
    var ownerBox = document.getElementById("ownerPartyBox")
    if (renterBox == null || ownerBox == null) {
        return
    }

    if (party == "OWNER") {
        renterBox.style.display = "none"
        ownerBox.style.display = "block"
    } else {
        renterBox.style.display = "block"
        ownerBox.style.display = "none"
    }
}

function getSelectedHandoverType() {
    var radios = document.getElementsByName("handoverType")
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked == true) {
            return radios[i].value
        }
    }
    return "CHECKIN"
}

function setSelectedHandoverType(val) {
    var radios = document.getElementsByName("handoverType")
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].value == val) {
            radios[i].checked = true
        }
    }
}

function updateHandoverModeUI() {
    var activeBooking = bookings[0]
    var badge = document.getElementById("currentTripStateBadge")
    if (activeBooking != null && badge != null) {
        if (activeBooking.status == "BOOKED") {
            badge.innerText = activeBooking.code + ": Chờ Check-in"
            badge.className = "badge badge-orange"
        } else if (activeBooking.status == "CHECKED_IN") {
            badge.innerText = activeBooking.code + ": Đã Check-in"
            badge.className = "badge badge-blue"
        } else {
            badge.innerText = activeBooking.code + ": Đã Check-out"
            badge.className = "badge badge-green"
        }
    }
}

function submitHandover() {
    var msgEl = document.getElementById("handoverMsg")
    if (isLoggedIn == false) {
        msgEl.innerText = "Lỗi: Vui lòng đăng nhập trước khi thực hiện Check-in / Check-out."
        msgEl.style.color = "#DC2626"
        return
    }

    var type = getSelectedHandoverType()
    var bookingCode = document.getElementById("renterBookingSelect").value
    var ownerVehicleId = parseInt(document.getElementById("ownerVehicleSelect").value)
    if (isNaN(ownerVehicleId)) {
        ownerVehicleId = 0
    }

    var booking = null
    for (var i = 0; i < bookings.length; i++) {
        if (bookings[i].code == bookingCode) {
            booking = bookings[i]
            break
        }
    }

    if (booking == null) {
        msgEl.innerText = "Lỗi phân quyền: Không tìm thấy đơn đặt xe hợp lệ của Khách thuê."
        msgEl.style.color = "#DC2626"
        return
    }

    if (booking.vehicleId != ownerVehicleId) {
        msgEl.innerText = 'Không khớp xe: Đơn ' + booking.code + ' của Khách đặt xe "' + booking.vehicleName + '", nhưng phía Chủ xe đang chọn xe khác!'
        msgEl.style.color = "#DC2626"
        return
    }

    if (type == "CHECKIN" && booking.status != "BOOKED") {
        msgEl.innerText = "Lỗi quy trình: Đơn " + booking.code + " đã Check-in lấy xe rồi, không thể Check-in lại!"
        msgEl.style.color = "#D97706"
        return
    }

    if (type == "CHECKOUT" && booking.status != "CHECKED_IN") {
        msgEl.innerText = "Chặn thao tác: Khách phải thực hiện Check-in nhận xe thành công trước khi Check-out trả xe!"
        msgEl.style.color = "#DC2626"
        return
    }

    var renterOdo = parseInt(document.getElementById("renterOdoInput").value)
    var ownerOdo = parseInt(document.getElementById("ownerOdoInput").value)
    var renterFuel = parseInt(document.getElementById("renterFuelInput").value)
    var ownerFuel = parseInt(document.getElementById("ownerFuelInput").value)
    var renterNote = document.getElementById("renterNote").value.trim()
    var ownerNote = document.getElementById("ownerNote").value.trim()

    if (isNaN(renterOdo) || isNaN(ownerOdo) || isNaN(renterFuel) || isNaN(ownerFuel)) {
        msgEl.innerText = "Vui lòng nhập đầy đủ số Odometer và Mức xăng/Pin ở cả 2 phía."
        msgEl.style.color = "#DC2626"
        return
    }

    if (renterOdo != ownerOdo || renterFuel != ownerFuel) {
        msgEl.innerText = "Dữ liệu 2 bên không trùng khớp: Khách khai báo " + renterOdo + " km, " + renterFuel + "% ≠ Chủ xe khai báo " + ownerOdo + " km, " + ownerFuel + "%."
        msgEl.style.color = "#DC2626"
        return
    }

    var actionLabel = "Check-out"
    var badgeClass = "badge-green"
    if (type == "CHECKIN") {
        actionLabel = "Check-in"
        badgeClass = "badge-blue"
    }

    if (type == "CHECKIN") {
        booking.status = "CHECKED_IN"
        setSelectedHandoverType("CHECKOUT")
    } else {
        booking.status = "CHECKED_OUT"
    }

    var tbody = document.getElementById("handoverHistoryTable")
    var tr = document.createElement("tr")
    var rowHtml = ""
    rowHtml = rowHtml + '<td><span class="badge ' + badgeClass + '">' + actionLabel + '</span></td>'
    rowHtml = rowHtml + '<td><strong>' + booking.code + '</strong> • ' + booking.vehicleName + '</td>'
    rowHtml = rowHtml + '<td>' + renterOdo.toLocaleString("vi-VN") + ' km</td>'
    rowHtml = rowHtml + '<td>' + renterFuel + '%</td>'
    rowHtml = rowHtml + '<td>Khách: "' + renterNote + '" | Chủ: "' + ownerNote + '"</td>'
    tr.innerHTML = rowHtml
    tbody.prepend(tr)

    renderHandoverSelectors()
    msgEl.innerText = "✔ Đối chiếu dữ liệu 2 bên trùng khớp 100%! Đã thực thi " + actionLabel + " cho đơn " + booking.code + " lúc " + new Date().toLocaleTimeString("vi-VN") + "."
    msgEl.style.color = "#059669"
}

function purgeExpiredPhotos() {
    var now = Date.now()
    var danhSachMoi = []
    for (var i = 0; i < systemPhotos.length; i++) {
        if (systemPhotos[i].expiresAt > now) {
            danhSachMoi.push(systemPhotos[i])
        }
    }
    systemPhotos = danhSachMoi
}

function handlePhotoUpload(inputEl, uploaderRole) {
    if (!inputEl.files || inputEl.files.length == 0) {
        return
    }
    purgeExpiredPhotos()

    var bookingCode = document.getElementById("renterBookingSelect").value
    if (bookingCode == "") {
        bookingCode = "#BK0001"
    }
    for (var i = 0; i < inputEl.files.length; i++) {
        (function (file) {
            var reader = new FileReader()
            reader.onload = function (e) {
                var now = Date.now()
                systemPhotos.unshift({
                    id: now + Math.random(),
                    uploaderRole: uploaderRole,
                    bookingCode: bookingCode,
                    fileName: file.name,
                    dataUrl: e.target.result,
                    createdAt: now,
                    expiresAt: now + FOUR_DAYS_MS
                })
                renderSavedPhotos()
            }
            reader.readAsDataURL(file)
        })(inputEl.files[i])
    }
}

function renderSavedPhotos() {
    purgeExpiredPhotos()
    var gallery = document.getElementById("savedPhotosGallery")
    if (gallery == null) {
        return
    }
    gallery.innerHTML = ""

    if (systemPhotos.length == 0) {
        gallery.innerHTML = '<p class="sub-text">Chưa có hình ảnh nào hoặc ảnh quá 4 ngày đã tự động xóa.</p>'
        return
    }

    for (var i = 0; i < systemPhotos.length; i++) {
        var p = systemPhotos[i]
        var remainingDays = Math.ceil((p.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
        if (remainingDays < 1) {
            remainingDays = 1
        }
        var div = document.createElement("div")
        div.className = "photo-item"
        div.innerHTML = '<img src="' + p.dataUrl + '" alt="' + p.fileName + '">' +
            '<div style="font-weight:700; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + p.fileName + '</div>' +
            '<div class="sub-text" style="font-size:11px;">Từ: <strong>' + p.uploaderRole + '</strong> • ' + p.bookingCode + '</div>' +
            '<div style="margin-top:4px;"><span class="badge badge-orange">Xóa sau ' + remainingDays + ' ngày</span></div>'
        gallery.appendChild(div)
    }
}

function toggleIncidentBox() {
    var box = document.getElementById("incidentBox")
    if (box.style.display == "none") {
        box.style.display = "block"
    } else {
        box.style.display = "none"
    }
}

function reportIncident() {
    var desc = document.getElementById("incidentDesc").value.trim()
    var cost = parseInt(document.getElementById("incidentCost").value)
    if (isNaN(cost)) {
        cost = 0
    }
    if (desc == "") {
        return
    }

    var adminTable = document.getElementById("adminApprovalTable")
    var tr = document.createElement("tr")
    tr.innerHTML = '<td><strong>Sự cố / Hư hỏng</strong></td>' +
        '<td>Đơn #BK0001 • ' + desc + ' • Khấu trừ: ' + formatMoney(cost) + '</td>' +
        '<td><span class="badge badge-red">Tranh chấp</span></td>' +
        '<td><button class="btn btn-primary" onclick="resolveDisputeRow(this)">Xác nhận xử lý</button></td>'
    adminTable.prepend(tr)
    document.getElementById("incidentMsg").innerText = "Đã chuyển hồ sơ sự cố sang tab Công cụ quản lý của Admin."
}

function selectStar(stars, btn) {
    selectedRating = stars
    var allBtn = document.querySelectorAll(".star-btn")
    for (var i = 0; i < allBtn.length; i++) {
        allBtn[i].classList.remove("active")
    }
    btn.classList.add("active")
}

function submitReview() {
    var comment = document.getElementById("reviewComment").value
    document.getElementById("reviewMsg").innerText = 'Đã ghi nhận đánh giá ' + selectedRating + ' sao: "' + comment + '"'
}

function openLoginModal() {
    document.getElementById("modalTitle").innerText = "Đăng nhập hệ thống"
    document.getElementById("loginFormBox").style.display = "block"
    document.getElementById("changePassFormBox").style.display = "none"
    document.getElementById("authModal").style.display = "flex"
}

function openChangePasswordModal() {
    if (isLoggedIn == false) {
        openLoginModal()
        return
    }
    document.getElementById("modalTitle").innerText = "Đổi mật khẩu tài khoản"
    document.getElementById("loginFormBox").style.display = "none"
    document.getElementById("changePassFormBox").style.display = "block"
    document.getElementById("authModal").style.display = "flex"
}

function closeAuthModal() {
    document.getElementById("authModal").style.display = "none"
}

function confirmLogin() {
    var nameInput = document.getElementById("loginUsernameInput").value.trim()
    if (nameInput == "") {
        nameInput = "Trương Công Hào"
    }
    var roleSelect = document.getElementById("loginRoleSelect").value
    currentUserName = nameInput
    currentRole = roleSelect
    isLoggedIn = true
    console.log("dang nhap ok", currentUserName)

    closeAuthModal()
    syncAuthHeaderAndNav()
    renderHandoverSelectors()

    var notice = document.getElementById("authActionNotice")
    if (notice != null) {
        notice.innerText = 'Đã đăng nhập thành công với tên "' + currentUserName + '".'
    }
}

function confirmChangePassword() {
    var newPass = document.getElementById("newPassInput").value
    var confirmPass = document.getElementById("confirmPassInput").value
    var notice = document.getElementById("authActionNotice")

    if (newPass == "" || newPass != confirmPass) {
        alert("Mật khẩu mới và xác nhận mật khẩu không khớp!")
        return
    }
    closeAuthModal()
    if (notice != null) {
        notice.innerText = "Đã đổi mật khẩu thành công lúc " + new Date().toLocaleTimeString("vi-VN") + "."
    }
}

function changeUserRole(newRole) {
    currentRole = newRole
    syncAuthHeaderAndNav()
    renderHandoverSelectors()
}

function handleHeaderAuthClick() {
    if (isLoggedIn == false) {
        openLoginModal()
        return
    }
    var dropdown = document.getElementById("userDropdown")
    if (dropdown.style.display == "block") {
        dropdown.style.display = "none"
    } else {
        dropdown.style.display = "block"
    }
}

document.addEventListener("click", function (event) {
    var wrap = document.getElementById("userMenuWrap")
    var dropdown = document.getElementById("userDropdown")
    if (wrap != null && dropdown != null) {
        if (!wrap.contains(event.target)) {
            dropdown.style.display = "none"
        }
    }
})

function syncAuthHeaderAndNav() {
    var loginBtn = document.getElementById("headerLoginBtn")
    var accountBtn = document.getElementById("headerAccountBtn")
    var userDropdown = document.getElementById("userDropdown")
    var userRoleLabel = document.getElementById("userRoleLabel")
    var roleSwitcher = document.getElementById("roleSwitcher")
    var navAdminTab = document.getElementById("navAdminTab")
    var stateText = document.getElementById("authAccountState")
    var btnOpenLoginInWallet = document.getElementById("btnOpenLoginInWallet")
    var btnChangePassword = document.getElementById("btnChangePassword")
    var btnLogout = document.getElementById("btnLogout")

    if (isLoggedIn == false) {
        loginBtn.innerText = "Đăng nhập"
        loginBtn.style.display = "inline-flex"
        accountBtn.style.display = "none"
        userDropdown.style.display = "none"
        navAdminTab.style.display = "none"

        stateText.innerText = "Chưa đăng nhập"
        stateText.style.color = "#64748B"
        btnOpenLoginInWallet.style.display = "inline-block"
        btnChangePassword.disabled = true
        btnLogout.disabled = true

        if (document.getElementById("admin").classList.contains("active")) {
            switchTab("renter", document.querySelector(".nav-btn[data-tab='renter']"))
        }
        return
    }

    loginBtn.innerText = currentUserName
    loginBtn.style.display = "inline-flex"
    accountBtn.style.display = "inline-flex"
    roleSwitcher.value = currentRole

    btnOpenLoginInWallet.style.display = "none"
    btnChangePassword.disabled = false
    btnLogout.disabled = false

    if (currentRole == "ADMIN") {
        userRoleLabel.innerText = "Vai trò: Quản trị viên"
        navAdminTab.style.display = "inline-block"
        stateText.innerText = currentUserName + " — Quản trị viên"
        stateText.style.color = "#DC2626"
    } else {
        var subRoleText = "Khách thuê"
        if (currentRole == "OWNER") {
            subRoleText = "Chủ xe"
        }
        userRoleLabel.innerText = "Vai trò: " + subRoleText
        navAdminTab.style.display = "none"
        stateText.innerText = currentUserName + " — " + subRoleText
        stateText.style.color = "#059669"

        if (document.getElementById("admin").classList.contains("active")) {
            switchTab("renter", document.querySelector(".nav-btn[data-tab='renter']"))
        }
    }
}

function handleAuthAction(action) {
    if (action == "LOGOUT") {
        isLoggedIn = false
        document.getElementById("userDropdown").style.display = "none"
        syncAuthHeaderAndNav()
        renderHandoverSelectors()
        var notice = document.getElementById("authActionNotice")
        if (notice != null) {
            notice.innerText = "Đã đăng xuất khỏi hệ thống."
        }
    }
}

function submitKycDocument() {
    var name = document.getElementById("kycName").value.trim()
    var cccd = document.getElementById("kycCccd").value.trim()
    var phone = document.getElementById("kycPhone").value.trim()
    var email = document.getElementById("kycEmail").value.trim()

    if (name == "" || cccd == "" || phone == "" || email == "") {
        return
    }

    isKycVerified = false
    var kycBadge = document.getElementById("kycStatusBadge")
    var adminBadge = document.getElementById("adminKycRowBadge")
    var adminBtn = document.getElementById("adminKycBtn")
    var adminDetail = document.getElementById("adminKycDetailCell")

    if (adminDetail != null) {
        adminDetail.innerText = name + " • CCCD: " + cccd + " • SĐT: " + phone + " • Email: " + email
    }

    kycBadge.innerText = "Chờ Admin xác thực"
    kycBadge.className = "badge badge-orange"

    adminBadge.innerText = "Chờ duyệt"
    adminBadge.className = "badge badge-orange"
    adminBtn.disabled = false
    adminBtn.innerText = "Phê duyệt eKYC"
}

function adminVerifyKyc() {
    isKycVerified = true
    document.getElementById("kycStatusBadge").innerText = "Đã được Admin duyệt"
    document.getElementById("kycStatusBadge").className = "badge badge-green"

    document.getElementById("adminKycRowBadge").innerText = "Đã xác thực"
    document.getElementById("adminKycRowBadge").className = "badge badge-green"

    var adminBtn = document.getElementById("adminKycBtn")
    adminBtn.disabled = true
    adminBtn.innerText = "Đã duyệt eKYC"
}

function updateWalletUI() {
    document.getElementById("walletBalance").innerText = formatMoney(walletBalance)
    var walletOption = document.querySelector("#paymentGateway option[value='WALLET']")
    if (walletOption != null) {
        walletOption.innerText = "Ví nội bộ — " + formatMoney(walletBalance)
    }
}

function addTransactionRow(label, signedAmount) {
    var tbody = document.getElementById("txTable")
    var tr = document.createElement("tr")
    var color = "#0F172A"
    var prefix = "-"
    if (signedAmount >= 0) {
        color = "#059669"
        prefix = "+"
    }
    var maGd = Math.floor(Math.random() * 899 + 100)
    tr.innerHTML = '<td><strong>#TX' + maGd + '</strong></td>' +
        '<td>' + label + '</td>' +
        '<td style="color:' + color + '; font-weight:700;">' + prefix + formatMoney(Math.abs(signedAmount)) + '</td>' +
        '<td><span class="badge badge-green">Hoàn tất</span></td>'
    tbody.prepend(tr)
}

function openQrDevelopingPage(amount) {
    var qrText = "Chức năng còn đang phát triển"
    var qrApiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=" + encodeURIComponent(qrText)
    var qrWin = window.open("", "_blank")
    if (!qrWin) {
        alert("Chức năng còn đang phát triển (Vui lòng cho phép mở tab mới để xem mã QR).")
        return
    }
    var trangQr = '<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Cổng Nạp Tiền QR — RENT A BIKE</title>' +
        '<style>' +
        'body { margin: 0; font-family: "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif; font-weight: 400; letter-spacing: -0.022em; background: #F1F5F9; color: #0F172A; display: flex; align-items: center; justify-content: center; min-height: 100vh; }' +
        '.qr-card { background: rgba(255, 255, 255, 0.9); border: none; border-radius: 24px; padding: 36px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06); }' +
        '.badge { display: inline-block; background: #FFFBEB; color: #D97706; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 9999px; margin-bottom: 16px; }' +
        'h2 { font-size: 18px; margin: 0 0 8px; }' +
        'p { font-size: 13px; color: #64748B; margin: 0 0 22px; }' +
        '.qr-box { display: inline-block; padding: 18px; border: none; border-radius: 20px; background: #FFFFFF; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); margin-bottom: 18px; }' +
        '.qr-msg { font-size: 14px; font-weight: 700; color: #0F7AE5; background: #F8FAFC; padding: 12px 16px; border-radius: 12px; margin-bottom: 18px; }' +
        'button { background: #0F7AE5; color: #FFFFFF; border: none; padding: 12px 24px; border-radius: 9999px; font-weight: 600; cursor: pointer; }' +
        '</style></head><body>' +
        '<div class="qr-card">' +
        '<span class="badge">CỔNG THANH TOÁN QR</span>' +
        '<h2>Quét mã QR để nạp ' + amount.toLocaleString("vi-VN") + '₫</h2>' +
        '<p>Sử dụng ứng dụng Ngân hàng hoặc Ví điện tử để quét mã QR bên dưới:</p>' +
        '<div class="qr-box"><img src="' + qrApiUrl + '" width="220" height="220" alt="QR Code"></div>' +
        '<div class="qr-msg">Nội dung mã QR: "' + qrText + '"</div>' +
        '<button onclick="window.close()">Đóng trang này</button>' +
        '</div></body></html>'
    qrWin.document.write(trangQr)
    qrWin.document.close()
}

function processWallet(type) {
    var amount = parseInt(document.getElementById("walletAmount").value)
    if (isNaN(amount)) {
        amount = 500000
    }
    if (amount < 10000) {
        amount = 10000
    }

    if (type == "DEPOSIT") {
        walletBalance = walletBalance + amount
        addTransactionRow("Nạp tiền qua QR", amount)
        updateWalletUI()
        openQrDevelopingPage(amount)
    } else {
        if (amount > walletBalance) {
            addTransactionRow("Yêu cầu rút tiền vượt số dư", 0)
            alert("Số dư khả dụng nhỏ hơn số tiền muốn rút!")
            return
        }
        walletBalance = walletBalance - amount
        addTransactionRow("Rút tiền về ngân hàng", -amount)
        updateWalletUI()
    }
}

function submitConsignVehicle() {
    var brand = document.getElementById("newCarBrand").value
    var model = document.getElementById("newCarModel").value.trim()
    var seats = document.getElementById("newCarSeats").value
    var trans = document.getElementById("newCarTrans").value
    var fuel = document.getElementById("newCarFuel").value
    var priceHour = parseInt(document.getElementById("newCarPriceHour").value)
    if (isNaN(priceHour)) {
        priceHour = 30000
    }
    var priceDay = parseInt(document.getElementById("newCarPriceDay").value)
    if (isNaN(priceDay)) {
        priceDay = 180000
    }

    if (model == "") {
        return
    }

    var tbody = document.getElementById("adminApprovalTable")
    var tr = document.createElement("tr")
    tr.innerHTML = '<td><strong>Duyệt xe ký gửi</strong></td>' +
        '<td>' + model + ' • ' + seats + ' • ' + trans + ' • ' + fuel + ' • ' + shortMoney(priceHour) + '/giờ • ' + shortMoney(priceDay) + '/ngày</td>' +
        '<td><span class="badge badge-orange">Chờ duyệt</span></td>' +
        '<td><button class="btn btn-primary" onclick="approvePendingCar(\'' + brand + '\', \'' + model + '\', \'' + seats + '\', \'' + trans + '\', \'' + fuel + '\', ' + priceHour + ', ' + priceDay + ', this)">Duyệt lên sàn</button></td>'
    tbody.prepend(tr)
    document.getElementById("newCarModel").value = ""
    document.getElementById("consignMsg").innerText = "Đã gửi thông tin xe máy xuống tab Công cụ quản lý của Admin chờ duyệt."
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
    })
    renderVehicles()
    renderHandoverSelectors()

    var row = btn.closest("tr")
    row.children[2].innerHTML = '<span class="badge badge-green">Đã lên sàn</span>'
    btn.disabled = true
    btn.innerText = "Đã duyệt"
}

function adminRefundDeposit(btn) {
    walletBalance = walletBalance + 300000
    updateWalletUI()
    addTransactionRow("Hoàn cọc đơn #BK0001 từ Admin", 300000)

    var row = btn.closest("tr")
    row.children[2].innerHTML = '<span class="badge badge-green">Đã hoàn cọc</span>'
    btn.disabled = true
    btn.innerText = "Đã hoàn 300K"
}

function resolveDisputeRow(btn) {
    var row = btn.closest("tr")
    row.children[2].innerHTML = '<span class="badge badge-green">Đã xử lý</span>'
    btn.disabled = true
    btn.innerText = "Xong"
}

function toggleScheduleStatus(btn) {
    var row = btn.closest("tr")
    var badgeCell = row.children[2]
    if (badgeCell.innerText.indexOf("Đang trống") != -1) {
        badgeCell.innerHTML = '<span class="badge badge-red">Đã khóa lịch</span>'
        btn.innerText = "Mở trống"
    } else {
        badgeCell.innerHTML = '<span class="badge badge-green">Đang trống</span>'
        btn.innerText = "Khóa lịch"
    }
}

function renderPromoTable() {
    var tbody = document.getElementById("promoTableBody")
    if (tbody == null) {
        return
    }
    tbody.innerHTML = ""
    var keys = Object.keys(promoCodes)
    for (var i = 0; i < keys.length; i++) {
        var code = keys[i]
        var tr = document.createElement("tr")
        tr.innerHTML = '<td><strong>' + code + '</strong></td>' +
            '<td>Giảm ' + promoCodes[code] + '%</td>' +
            '<td><span class="badge badge-green">Đang hoạt động</span></td>'
        tbody.appendChild(tr)
    }
    populateVoucherComboBox()
}

function addPromoCode() {
    var code = document.getElementById("newPromoCode").value.trim().toUpperCase()
    var percent = parseInt(document.getElementById("newPromoPercent").value)
    if (isNaN(percent)) {
        percent = 0
    }
    if (code == "" || percent <= 0 || percent > 90) {
        return
    }

    promoCodes[code] = percent
    renderPromoTable()
    updateBookingSummary()
    document.getElementById("newPromoCode").value = ""
}

function switchTab(tabId, btn) {
    var allSec = document.querySelectorAll(".section")
    for (var i = 0; i < allSec.length; i++) {
        allSec[i].classList.remove("active")
    }
    document.getElementById(tabId).classList.add("active")

    var allNav = document.querySelectorAll(".nav-btn")
    for (var j = 0; j < allNav.length; j++) {
        allNav[j].classList.remove("active")
    }
    if (btn != null) {
        btn.classList.add("active")
    }
}

function quickSwitchTab(tabId) {
    var targetBtn = document.querySelector(".nav-btn[data-tab='" + tabId + "']")
    switchTab(tabId, targetBtn)
}

populateVoucherComboBox()
renderVehicles()
updateCarDetailView()
updateBookingSummary()
renderPromoTable()
syncAuthHeaderAndNav()
renderHandoverSelectors()
renderSavedPhotos()
