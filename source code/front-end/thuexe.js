var bikesData = [
    {
        id: 1,
        brand: "Honda",
        name: "Honda Vision 2024",
        type: "Xe tay ga",
        cc: "110cc",
        fuel: "Xăng",
        hourPrice: 25000,
        dayPrice: 140000,
        area: "Quận 1",
        owner: "Trương Công Hào"
    },
    {
        id: 2,
        brand: "Honda",
        name: "Honda AirBlade 160 2024",
        type: "Xe tay ga",
        cc: "155cc - 160cc",
        fuel: "Xăng",
        hourPrice: 35000,
        dayPrice: 180000,
        area: "Quận 3",
        owner: "Trương Công Hào"
    },
    {
        id: 3,
        brand: "Yamaha",
        name: "Yamaha Exciter 155 VVA",
        type: "Xe côn tay",
        cc: "155cc - 160cc",
        fuel: "Xăng",
        hourPrice: 40000,
        dayPrice: 200000,
        area: "Quận Bình Thạnh",
        owner: "Nguyễn Minh Tuấn"
    },
    {
        id: 4,
        brand: "VinFast",
        name: "VinFast Evo200 2024",
        type: "Xe máy điện",
        cc: "Pin LFP",
        fuel: "Điện",
        hourPrice: 22000,
        dayPrice: 130000,
        area: "TP. Thủ Đức",
        owner: "Nguyễn Minh Tuấn"
    },
    {
        id: 5,
        brand: "Honda",
        name: "Honda Wave Alpha 2023",
        type: "Xe số",
        cc: "110cc",
        fuel: "Xăng",
        hourPrice: 18000,
        dayPrice: 100000,
        area: "Quận 5",
        owner: "Trương Công Hào"
    },
    {
        id: 6,
        brand: "Piaggio",
        name: "Vespa Sprint S 125",
        type: "Xe tay ga",
        cc: "125cc",
        fuel: "Xăng",
        hourPrice: 55000,
        dayPrice: 300000,
        area: "Quận 7",
        owner: "Lê Hoàng Nam"
    }
]

// Danh sách "Xe đã đặt" — Bắt đầu rỗng, chỉ có dữ liệu khi khách bấm "Thanh toán & Đặt xe" ở Tab 1
var bookedOrders = []

var vouchersData = [
    { code: "CONBO01", uses: 127, discount: "Giảm 10%", status: "Đang hoạt động", type: "active", exp: "29/01/2027" },
    { code: "CONHEO01", uses: 272, discount: "Giảm 30%", status: "Gần hết", type: "warn", exp: "19/01/2027" },
    { code: "CONCHO01", uses: 300, discount: "Giảm 15%", status: "Hết hạn", type: "expired", exp: "14/11/2026" }
]

var accountsData = [
    { id: "00011783", username: "HaoTruong", phone: "0866******", email: "v*********@gmail.com", pass: "**************", statusIndex: 0 },
    { id: "00006067", username: "ᴛʀúᴍ ᴄắɴ ᴛʀộᴍ", phone: "0382******", email: "q*********@hotmail.com", pass: "**************", statusIndex: 0 },
    { id: "00015278", username: "Donal J.Trump", phone: "0999******", email: "v*********@gmail.com", pass: "**************", statusIndex: 1 },
    { id: "00013089", username: "John Ternus", phone: "0382******", email: "q*********@hotmail.com", pass: "**************", statusIndex: 0 },
    { id: "00011581", username: "ɴʜɪღᴄôɴɢღᴛúᴀ", phone: "0866******", email: "v*********@outlook.com", pass: "**************", statusIndex: 2 },
    { id: "00004007", username: "Quỳnh✿P O✿Yêu", phone: "0382******", email: "k*********@crypto.com", pass: "**************", statusIndex: 3 }
]

var accountStates = [
    { label: "Bình thường", cls: "acct-normal" },
    { label: "Bị khóa 15 ngày", cls: "acct-lock15" },
    { label: "Bị khóa 30 ngày", cls: "acct-lock30" },
    { label: "Bị khóa vĩnh viễn", cls: "acct-ban" }
]

var selectedBikeId = null
var rentMode = "day"
var walletBalance = 2500000
var currentBookingTotal = 426000
var isVoucherEditMode = false
var selectedModalPct = "10%"
var isLoggedIn = false
var currentUserName = "Trương Công Hào"
var currentUserRole = "Khách thuê"
var tempBien = 0
var demLanBam = 0
var renterUploadedName = ""
var renterImgDataUrl = ""
var ownerUploadedName = ""
var ownerImgDataUrl = ""
var pendingDepositAmount = 0

function formatVND(num) {
    return num.toLocaleString("vi-VN") + "đ"
}

function setupHandoverImage(inputId, nameId, previewId, role) {
    var input = document.getElementById(inputId)
    var nameEl = document.getElementById(nameId)
    var preview = document.getElementById(previewId)
    if (!input) return

    input.addEventListener("change", function () {
        var file = input.files && input.files[0]
        if (!file) return
        if (nameEl) nameEl.textContent = file.name

        var reader = new FileReader()
        reader.onload = function (event) {
            var dataUrl = event.target.result
            if (role === "renter") {
                renterUploadedName = file.name
                renterImgDataUrl = dataUrl
            } else {
                ownerUploadedName = file.name
                ownerImgDataUrl = dataUrl
            }
            if (preview) {
                preview.src = dataUrl
                preview.classList.remove("hidden")
            }
        }
        reader.readAsDataURL(file)
    })
}

setupHandoverImage("hoImgFile", "hoImgFileName", "hoImgPreview", "renter")
setupHandoverImage("hoOwnerImgFile", "hoOwnerImgFileName", "hoOwnerImgPreview", "owner")

function timXeTheoId(id) {
    if (id == null) return null
    for (var i = 0; i < bikesData.length; i++) {
        if (bikesData[i].id == id) return bikesData[i]
    }
    return null
}

function getPickupAreaList() {
    var select = document.getElementById("pickup-area")
    var list = []
    if (select != null) {
        var opts = select.options
        for (var i = 0; i < opts.length; i++) {
            var val = opts[i].value
            var text = opts[i].textContent.trim()
            if (val !== "toan_bo" && text !== "Tất cả khu vực") {
                list.push(text)
            }
        }
    }
    if (list.length === 0) {
        list = ["Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 7", "Quận Phú Nhuận", "Quận Bình Thạnh", "Quận Gò Vấp", "TP. Thủ Đức"]
    }
    return list
}

function initBikeAreas() {
    var areas = getPickupAreaList()
    var shuffled = areas.slice().sort(function () { return 0.5 - Math.random() })
    for (var i = 0; i < bikesData.length; i++) {
        bikesData[i].area = shuffled[i % shuffled.length]
    }
}

function switchTab(targetId) {
    var panels = document.querySelectorAll(".tab-panel")
    for (var i = 0; i < panels.length; i++) {
        panels[i].classList.remove("active")
    }
    var panel = document.getElementById(targetId)
    if (panel != null) {
        panel.classList.add("active")
    }

    var navBtns = document.querySelectorAll(".nav-tab")
    for (var j = 0; j < navBtns.length; j++) {
        if (navBtns[j].getAttribute("data-target") == targetId) {
            navBtns[j].classList.add("active")
        } else {
            navBtns[j].classList.remove("active")
        }
    }

    // Đồng bộ dữ liệu mỗi khi chuyển sang tab Giao nhận xe hoặc Xe đã đặt
    if (targetId === "tab2") {
        renderRenterOrders()
        renderOwnerOrders()
    } else if (targetId === "tab7") {
        renderBookedBikes()
    }
}

function updateAuthUI() {
    var btnLogin = document.getElementById("btnTopLogin")
    var btnAcc = document.getElementById("btnTopAccount")
    var dropdown = document.getElementById("userDropdown")
    var userLbl = document.getElementById("dropdownUserLabel")
    var roleLbl = document.getElementById("dropdownRoleLabel")
    var barIn = document.getElementById("sessionBarLoggedIn")
    var barOut = document.getElementById("sessionBarLoggedOut")
    var fileIn = document.getElementById("ekycFileLoggedIn")
    var fileOut = document.getElementById("ekycFileLoggedOut")
    var userTxt = document.getElementById("sessionUserText")
    var ekycName = document.getElementById("ekycFullName")

    if (isLoggedIn == true) {
        if (btnAcc != null) btnAcc.classList.remove("hidden")
        if (btnLogin != null) {
            btnLogin.textContent = "Tài khoản"
            btnLogin.setAttribute("aria-label", "Vào trang tài khoản của " + currentUserName)
        }
        if (userLbl != null) userLbl.textContent = "Tài khoản: " + currentUserName
        if (roleLbl != null) roleLbl.textContent = "Vai trò: " + currentUserRole
        if (barIn != null) barIn.classList.remove("hidden")
        if (barOut != null) barOut.classList.add("hidden")
        if (fileIn != null) fileIn.classList.remove("hidden")
        if (fileOut != null) fileOut.classList.add("hidden")
        if (userTxt != null) userTxt.textContent = currentUserName
        if (ekycName != null) ekycName.value = currentUserName
    } else {
        if (btnAcc != null) btnAcc.classList.add("hidden")
        if (btnLogin != null) {
            btnLogin.textContent = "Đăng nhập"
            btnLogin.setAttribute("aria-label", "Mở trang đăng nhập")
        }
        if (dropdown != null) dropdown.classList.add("hidden")
        if (barIn != null) barIn.classList.add("hidden")
        if (barOut != null) barOut.classList.remove("hidden")
        if (fileIn != null) fileIn.classList.add("hidden")
        if (fileOut != null) fileOut.classList.remove("hidden")
    }
}

var allNavTabs = document.querySelectorAll(".nav-tab")
for (var n = 0; n < allNavTabs.length; n++) {
    allNavTabs[n].addEventListener("click", function () {
        var target = this.getAttribute("data-target")
        switchTab(target)
    })
}

document.getElementById("brandLogo").addEventListener("click", function () {
    switchTab("tab1")
})

document.getElementById("btnTopLogin").addEventListener("click", function (e) {
    e.stopPropagation()
    if (isLoggedIn == false) {
        switchTab("tab6")
    } else {
        var dd = document.getElementById("userDropdown")
        if (dd != null) {
            dd.classList.toggle("hidden")
        }
    }
})

var btnDropdownToAccount = document.getElementById("btnDropdownToAccount")
if (btnDropdownToAccount != null) {
    btnDropdownToAccount.addEventListener("click", function () {
        switchTab("tab3")
        var dd = document.getElementById("userDropdown")
        if (dd != null) dd.classList.add("hidden")
    })
}

document.getElementById("btnDropdownLogout").addEventListener("click", function () {
    isLoggedIn = false
    updateAuthUI()
    var dd = document.getElementById("userDropdown")
    if (dd != null) dd.classList.add("hidden")
})

document.addEventListener("click", function (e) {
    var wrap = document.getElementById("userMenuWrap")
    var dd = document.getElementById("userDropdown")
    if (wrap != null && dd != null && !wrap.contains(e.target)) {
        dd.classList.add("hidden")
    }
})

var btnTopAccount = document.getElementById("btnTopAccount")
if (btnTopAccount != null) {
    btnTopAccount.addEventListener("click", function () {
        switchTab("tab3")
    })
}

var btnTopAdmin = document.getElementById("btnTopAdmin")
if (btnTopAdmin != null) {
    btnTopAdmin.addEventListener("click", function () {
        switchTab("tab5")
    })
}

function renderBikes() {
    var brandVal = document.getElementById("filterBrand").value
    var typeVal = document.getElementById("filterType").value
    var ccVal = document.getElementById("filterCc").value
    var fuelVal = document.getElementById("filterFuel").value

    var areaSelect = document.getElementById("pickup-area")
    var areaVal = "toan_bo"
    var areaText = ""
    if (areaSelect != null) {
        areaVal = areaSelect.value
        if (areaSelect.selectedIndex >= 0) {
            areaText = areaSelect.options[areaSelect.selectedIndex].textContent.trim()
        }
    }

    var filtered = []
    for (var i = 0; i < bikesData.length; i++) {
        var b = bikesData[i]
        var okBrand = (brandVal == "all" || b.brand == brandVal)
        var okType = (typeVal == "all" || b.type == typeVal)
        var okCc = (ccVal == "all" || b.cc == ccVal)
        var okFuel = (fuelVal == "all" || b.fuel == fuelVal)
        var okArea = (areaVal == "toan_bo" || b.area == areaText)

        if (okBrand && okType && okCc && okFuel && okArea) {
            filtered.push(b)
        }
    }

    var grid = document.getElementById("bikeGrid")
    var htmlStr = ""
    if (filtered.length === 0) {
        htmlStr = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b; font-size: 13.5px;">Không tìm thấy xe phù hợp tại khu vực này. Vui lòng chọn khu vực khác hoặc Tất cả khu vực.</div>'
    }
    for (var j = 0; j < filtered.length; j++) {
        var xe = filtered[j]
        var btnCls = (xe.id == selectedBikeId) ? "btn-select-bike selected" : "btn-select-bike"
        var btnText = (xe.id == selectedBikeId) ? "Đang chọn xe này" : "Chọn xe này"

        htmlStr += '<div class="bike-card" data-id="' + xe.id + '" style="cursor: pointer;">'
        htmlStr += '<div class="bike-banner">'
        htmlStr += '<div class="bike-banner-top"><span class="badge-brand">' + xe.brand + '</span></div>'
        htmlStr += '<div class="bike-banner-center"><div class="bike-banner-title">' + xe.name + '</div></div>'
        htmlStr += '</div>'
        htmlStr += '<div class="bike-card-title">' + xe.name + '</div>'
        htmlStr += '<div class="bike-specs-pill"><span>' + xe.type + '</span><span>' + xe.cc + '</span><span>' + xe.fuel + '</span></div>'
        htmlStr += '<div class="bike-price-row">'
        htmlStr += '<div class="price-col"><span class="price-caption">Theo giờ</span><span class="price-hour">' + xe.hourPrice.toLocaleString("vi-VN") + '<u>đ</u>/h</span></div>'
        htmlStr += '<div class="price-col center"><span class="price-caption">Khu vực</span><span class="price-area">' + (xe.area || "Quận 1") + '</span></div>'
        htmlStr += '<div class="price-col right"><span class="price-caption">Theo ngày</span><span class="price-day">' + xe.dayPrice.toLocaleString("vi-VN") + '<u>đ</u>/ngày</span></div>'
        htmlStr += '</div>'
        htmlStr += '<button class="' + btnCls + '" data-id="' + xe.id + '">' + btnText + '</button>'
        htmlStr += '</div>'
    }

    grid.innerHTML = htmlStr

    var cards = grid.querySelectorAll(".bike-card")
    for (var k = 0; k < cards.length; k++) {
        cards[k].addEventListener("click", function () {
            selectedBikeId = Number(this.getAttribute("data-id"))
            renderBikes()
            updateBookingSummary()
            var detailSec = document.getElementById("bookingDetailSection")
            if (detailSec != null) {
                detailSec.scrollIntoView({ behavior: "smooth", block: "start" })
            }
        })
    }
}

function updateBookingSummary() {
    var detailSec = document.getElementById("bookingDetailSection")
    if (selectedBikeId == null) {
        if (detailSec != null) detailSec.classList.add("hidden")
        return
    }

    if (detailSec != null) detailSec.classList.remove("hidden")

    var bike = timXeTheoId(selectedBikeId)
    if (!bike) return

    document.getElementById("detailBikeName").textContent = bike.name
    var bikeArea = bike.area || "Quận 1"
    document.getElementById("detailBikeSpecs").textContent = bike.brand + " • " + bike.type + " • " + bike.cc + " • " + bike.fuel + " • " + bikeArea + ", TP.HCM"

    document.getElementById("pkgHourText").textContent = (bike.hourPrice / 1000) + "K / giờ"
    document.getElementById("pkgDayText").textContent = (bike.dayPrice / 1000) + "K / ngày"

    var rawDur = Number(document.getElementById("rentDuration").value)
    var duration = (rawDur > 1) ? rawDur : 1
    var voucherPct = Number(document.getElementById("voucherSelect").value) || 0
    var shipFee = Number(document.getElementById("pickupMethod").value) || 0

    var unitPrice = (rentMode == "day") ? bike.dayPrice : bike.hourPrice
    var unitName = (rentMode == "day") ? "Theo ngày" : "Theo giờ"
    var unitSuffix = (rentMode == "day") ? "ngày" : "giờ"
    var durTitle = (rentMode == "day") ? "Số ngày thuê" : "Số giờ thuê"

    var baseCost = unitPrice * duration
    var discount = Math.round((baseCost * voucherPct) / 100)
    var deposit = 300000
    var total = baseCost + shipFee - discount + deposit
    currentBookingTotal = total

    document.getElementById("durationLabel").textContent = durTitle
    document.getElementById("sumBaseLabel").textContent = "Gói cước thuê: " + unitName + " × " + duration + " " + unitSuffix
    document.getElementById("sumBaseVal").textContent = formatVND(baseCost)
    document.getElementById("sumShipLabel").textContent = (shipFee == 0) ? "Phí giao xe: Tự lấy tại điểm" : "Phí giao xe: Giao tận nơi"
    document.getElementById("sumShipVal").textContent = formatVND(shipFee)
    document.getElementById("sumDiscountVal").textContent = "-" + formatVND(discount)
    document.getElementById("sumTotalVal").textContent = formatVND(total)
}

var filterIds = ["filterBrand", "filterType", "filterCc", "filterFuel", "pickup-area"]
for (var f = 0; f < filterIds.length; f++) {
    var elem = document.getElementById(filterIds[f])
    if (elem != null) elem.addEventListener("change", renderBikes)
}

document.getElementById("pkgHourBtn").addEventListener("click", function () {
    rentMode = "hour"
    document.getElementById("pkgHourBtn").classList.add("active")
    document.getElementById("pkgDayBtn").classList.remove("active")
    updateBookingSummary()
})

document.getElementById("pkgDayBtn").addEventListener("click", function () {
    rentMode = "day"
    document.getElementById("pkgDayBtn").classList.add("active")
    document.getElementById("pkgHourBtn").classList.remove("active")
    updateBookingSummary()
})

var sumInputIds = ["rentDuration", "voucherSelect", "pickupMethod"]
for (var s = 0; s < sumInputIds.length; s++) {
    document.getElementById(sumInputIds[s]).addEventListener("input", updateBookingSummary)
    document.getElementById(sumInputIds[s]).addEventListener("change", updateBookingSummary)
}

// RENDER TAB 7: DANH SÁCH XE ĐÃ ĐẶT
function renderBookedBikes() {
    var container = document.getElementById("bookedBikesContainer")
    if (!container) return

    if (bookedOrders.length === 0) {
        container.innerHTML = '<div class="empty-booked-box">Bạn chưa đặt chiếc xe nào. Hãy sang tab <strong>Đặt xe</strong> để chọn và thanh toán xe nhé!</div>'
        return
    }

    var html = ""
    for (var i = 0; i < bookedOrders.length; i++) {
        var o = bookedOrders[i]
        var badgeCls = "badge-warn-sm"
        if (o.status === "Đang thuê") badgeCls = "badge-info-sm"
        else if (o.status === "Đã trả xe") badgeCls = "badge-success"

        html += '<div class="booked-table-row">'
        html += '<strong>#' + o.id + '</strong>'
        html += '<div><strong>' + o.bikeName + '</strong><div style="font-size: 11px; color: #64748b;">Khu vực: ' + o.area + '</div></div>'
        html += '<div><span>' + o.packageText + '</span><div style="font-size: 11px; color: #64748b;">' + o.pickupTime + ' → ' + o.returnTime + '</div></div>'
        html += '<strong style="color: #0d74e7;">' + formatVND(o.totalPrice) + '</strong>'
        html += '<span><span class="' + badgeCls + '">' + o.status + '</span></span>'
        html += '<button class="btn-primary-sm go-handover-btn" data-id="' + o.id + '">Giao nhận xe</button>'
        html += '</div>'
    }
    container.innerHTML = html

    var btns = container.querySelectorAll(".go-handover-btn")
    for (var b = 0; b < btns.length; b++) {
        btns[b].addEventListener("click", function () {
            var ordId = this.getAttribute("data-id")
            switchTab("tab2")
            var rSel = document.getElementById("hoOrderInput")
            if (rSel) {
                for (var k = 0; k < rSel.options.length; k++) {
                    if (rSel.options[k].value.indexOf("#" + ordId) !== -1) {
                        rSel.selectedIndex = k
                        rSel.dispatchEvent(new Event("change"))
                        break
                    }
                }
            }
        })
    }
}

// XỬ LÝ NÚT THANH TOÁN & ĐẶT XE Ở TAB 1
document.getElementById("btnBookNow").addEventListener("click", function () {
    if (selectedBikeId == null) {
        alert("Vui lòng chọn một xe máy trước khi thanh toán!")
        return
    }
    demLanBam = demLanBam + 1
    if (walletBalance < currentBookingTotal) {
        alert("Số dư trong tài khoản cá nhân (" + formatVND(walletBalance) + ") không đủ để thanh toán " + formatVND(currentBookingTotal) + "! Vui lòng nạp thêm tiền vào tài khoản.")
        return
    }

    walletBalance = walletBalance - currentBookingTotal
    updateWalletUI()

    var bike = timXeTheoId(selectedBikeId)

    // Ghi lịch sử giao dịch ví
    var txList = document.getElementById("walletTxList")
    if (txList != null) {
        var row = document.createElement("div")
        row.className = "wallet-table-row"
        var maGd = Math.floor(102 + Math.random() * 890)
        row.innerHTML = '<strong>#TX' + maGd + '</strong>' +
            '<span>Thanh toán thuê xe ' + bike.name + '</span>' +
            '<strong style="color: #ef4444;">-' + formatVND(currentBookingTotal) + '</strong>' +
            '<span><span class="badge-success">Hoàn tất</span></span>'
        txList.prepend(row)
    }

    // Lấy thông tin gói thuê và thời gian
    var rawDur = Number(document.getElementById("rentDuration").value)
    var duration = (rawDur > 1) ? rawDur : 1
    var pkgText = (rentMode === "day") ? ("Thuê theo ngày (" + duration + " ngày)") : ("Thuê theo giờ (" + duration + " giờ)")
    var pTime = (document.getElementById("pickup-datetime").value || "2026-11-04T08:00").replace("T", " ")
    var rTime = (document.getElementById("return-datetime").value || "2026-11-05T08:00").replace("T", " ")

    // Thêm đơn mới vào mảng bookedOrders (Tab Xe đã đặt)
    var newOrderId = "BK" + String(bookedOrders.length + 1).padStart(4, "0")
    bookedOrders.unshift({
        id: newOrderId,
        bikeId: bike.id,
        bikeName: bike.name,
        area: bike.area || "Quận 1",
        packageText: pkgText,
        pickupTime: pTime,
        returnTime: rTime,
        totalPrice: currentBookingTotal,
        status: "Chờ Check-in",
        odo: 8420,
        fuel: 90
    })

    // Cập nhật giao diện Xe đã đặt & Dropdown Giao nhận xe
    renderBookedBikes()
    renderRenterOrders()
    renderOwnerOrders()

    alert("✅ Đặt xe thành công! Đơn #" + newOrderId + " (" + bike.name + ") đã được lưu vào mục 'Xe đã đặt'.")
    switchTab("tab7")
})

// ================= LOGIC GIAO NHẬN XE 2 CHIỀU =================
var handoverSessions = {}

function extractOrderCode(val) {
    if (!val) return ""
    var m = val.match(/#BK\d+/)
    return m ? m[0] : ""
}

function extractBikeName(val) {
    if (!val) return ""
    var parts = val.split("—")
    if (parts.length > 1) {
        return parts[1].split("•")[0].trim()
    }
    return val.split("•")[0].trim()
}

function parseNum(val, def) {
    if (val === null || val === undefined) return def || 0
    var cleaned = String(val).replace(/[^0-9.]/g, "")
    var n = Number(cleaned)
    return isNaN(n) ? (def || 0) : n
}

// 1. Lấy danh sách xe từ mục "Xe của bạn" (#ownerBikeList ở Tab 4)
function getOwnerBikesFromTab4() {
    var list = []
    var rows = document.querySelectorAll("#ownerBikeList .owner-table-row")
    for (var i = 0; i < rows.length; i++) {
        var nameEl = rows[i].querySelector("strong")
        var dateEl = rows[i].querySelectorAll("span")[0]
        var statusEl = rows[i].querySelector("span span")
        if (nameEl) {
            list.push({
                name: nameEl.textContent.trim(),
                dateRange: dateEl ? dateEl.textContent.trim() : "",
                status: statusEl ? statusEl.textContent.trim() : "Đang trống"
            })
        }
    }
    return list
}

// 2. Render dropdown cho NGƯỜI THUÊ — CHỈ LẤY TỪ MỤC "XE ĐÃ ĐẶT" (bookedOrders)
function renderRenterOrders() {
    var renterSel = document.getElementById("hoOrderInput")
    if (!renterSel) return

    if (bookedOrders.length === 0) {
        renterSel.innerHTML = '<option value="">-- Chưa có xe nào trong mục Xe đã đặt --</option>'
        return
    }

    var html = ""
    for (var i = 0; i < bookedOrders.length; i++) {
        var o = bookedOrders[i]
        var val = "#" + o.id + " — " + o.bikeName + " • " + o.status
        html += '<option value="' + val + '" data-odo="' + o.odo + '" data-fuel="' + o.fuel + '">' + val + '</option>'
    }
    renterSel.innerHTML = html

    var curOpt = renterSel.options[renterSel.selectedIndex]
    if (curOpt && curOpt.getAttribute("data-odo")) {
        document.getElementById("hoOdoInput").value = Number(curOpt.getAttribute("data-odo"))
        document.getElementById("hoFuelInput").value = Number(curOpt.getAttribute("data-fuel"))
    }
    updateCompareBoxMetrics()
}

// 3. Render dropdown cho CHỦ XE — CHỈ LẤY DATA TỪ MỤC "XE CỦA BẠN" (#ownerBikeList)
function renderOwnerOrders() {
    var ownerSel = document.getElementById("hoOwnerOrderInput")
    if (!ownerSel) return

    var myBikes = getOwnerBikesFromTab4()
    if (myBikes.length === 0) {
        ownerSel.innerHTML = '<option value="">-- Bạn chưa có xe nào trong mục Xe của bạn --</option>'
        return
    }

    var html = ""
    for (var i = 0; i < myBikes.length; i++) {
        var mb = myBikes[i]
        // Kiểm tra xem xe này có đơn nào khách vừa đặt trong bookedOrders không để ghép mã đơn
        var matchedOrder = null
        for (var j = 0; j < bookedOrders.length; j++) {
            if (bookedOrders[j].bikeName === mb.name) {
                matchedOrder = bookedOrders[j]
                break
            }
        }

        if (matchedOrder) {
            var valWithOrder = "#" + matchedOrder.id + " — " + mb.name + " • " + matchedOrder.status
            html += '<option value="' + valWithOrder + '" data-odo="' + matchedOrder.odo + '" data-fuel="' + matchedOrder.fuel + '">' + valWithOrder + '</option>'
        } else {
            var valBikeOnly = mb.name + " • Lịch: " + mb.dateRange + " (" + mb.status + ")"
            html += '<option value="' + valBikeOnly + '" data-odo="8420" data-fuel="90">' + valBikeOnly + '</option>'
        }
    }
    ownerSel.innerHTML = html

    var curOpt = ownerSel.options[ownerSel.selectedIndex]
    if (curOpt && curOpt.getAttribute("data-odo")) {
        document.getElementById("hoOwnerOdoInput").value = Number(curOpt.getAttribute("data-odo"))
        document.getElementById("hoOwnerFuelInput").value = Number(curOpt.getAttribute("data-fuel"))
    }
    updateCompareBoxMetrics()
}

function updateCompareBoxMetrics() {
    var rOdo = parseNum(document.getElementById("hoOdoInput").value, 8420)
    var rFuel = parseNum(document.getElementById("hoFuelInput").value, 90)
    var oOdo = parseNum(document.getElementById("hoOwnerOdoInput").value, 8420)
    var oFuel = parseNum(document.getElementById("hoOwnerFuelInput").value, 90)

    document.getElementById("valCompareRenterOdo").textContent = rOdo.toLocaleString("vi-VN") + " km"
    document.getElementById("valCompareRenterFuel").textContent = rFuel + "%"
    document.getElementById("valCompareOwnerOdo").textContent = oOdo.toLocaleString("vi-VN") + " km"
    document.getElementById("valCompareOwnerFuel").textContent = oFuel + "%"
}

var compareInputIds = ["hoOdoInput", "hoFuelInput", "hoOwnerOdoInput", "hoOwnerFuelInput"]
for (var ci = 0; ci < compareInputIds.length; ci++) {
    var cElem = document.getElementById(compareInputIds[ci])
    if (cElem) {
        cElem.addEventListener("input", updateCompareBoxMetrics)
        cElem.addEventListener("change", updateCompareBoxMetrics)
    }
}

document.getElementById("hoOrderInput").addEventListener("change", function () {
    var opt = this.options[this.selectedIndex]
    if (opt && opt.getAttribute("data-odo")) {
        document.getElementById("hoOdoInput").value = Number(opt.getAttribute("data-odo"))
        document.getElementById("hoFuelInput").value = Number(opt.getAttribute("data-fuel"))
        updateCompareBoxMetrics()
    }
})

document.getElementById("hoOwnerOrderInput").addEventListener("change", function () {
    var opt = this.options[this.selectedIndex]
    if (opt && opt.getAttribute("data-odo")) {
        document.getElementById("hoOwnerOdoInput").value = Number(opt.getAttribute("data-odo"))
        document.getElementById("hoOwnerFuelInput").value = Number(opt.getAttribute("data-fuel"))
        updateCompareBoxMetrics()
    }
})

function updateHandoverPanels() {
    var roleRadios = document.querySelectorAll('input[name="roleType"]')
    var chosenRole = "Khách thuê"
    for (var i = 0; i < roleRadios.length; i++) {
        if (roleRadios[i].checked == true) chosenRole = roleRadios[i].value
    }
    var pRenter = document.getElementById("panelRenter")
    var pOwner = document.getElementById("panelOwner")
    var colRenter = document.getElementById("colCompareRenter")
    var colOwner = document.getElementById("colCompareOwner")

    if (chosenRole == "Chủ xe") {
        pRenter.classList.add("hidden")
        pOwner.classList.remove("hidden")
        colRenter.classList.remove("active-role")
        colOwner.classList.add("active-role")
        renderOwnerOrders()
    } else {
        pRenter.classList.remove("hidden")
        pOwner.classList.add("hidden")
        colRenter.classList.add("active-role")
        colOwner.classList.remove("active-role")
        renderRenterOrders()
    }
    updateCompareBoxMetrics()
}

var allRoleRadios = document.querySelectorAll('input[name="roleType"]')
for (var rr = 0; rr < allRoleRadios.length; rr++) {
    allRoleRadios[rr].addEventListener("change", updateHandoverPanels)
}

function addPhotoToStorage(txType, roleVal, orderLabel, imgName, imgUrl) {
    var storage = document.getElementById("storageList")
    if (storage != null && imgName) {
        var cleanName = imgName.replace("Chọn tệp — ", "").trim()
        var card = document.createElement("div")
        card.className = "storage-card"
        var thumbHtml = imgUrl
            ? '<img src="' + imgUrl + '" class="storage-thumb-img" alt="Ảnh giao nhận">'
            : '<div class="storage-thumb">Ảnh ' + txType + '</div>'
        card.innerHTML = thumbHtml +
            '<div class="storage-filename">' + cleanName + '</div>' +
            '<div class="storage-meta">Từ: ' + roleVal + ' • ' + orderLabel + '</div>' +
            '<span class="badge-warn-sm">Xóa sau 3 ngày</span>'
        storage.prepend(card)
    }
}

document.getElementById("btnExecHandover").addEventListener("click", function () {
    var txRadio = document.querySelector('input[name="txType"]:checked')
    var roleRadio = document.querySelector('input[name="roleType"]:checked')
    var txType = txRadio ? txRadio.value : "Check-in"
    var roleVal = roleRadio ? roleRadio.value : "Khách thuê"

    var orderInputVal = ""
    if (roleVal === "Chủ xe") {
        orderInputVal = document.getElementById("hoOwnerOrderInput").value
        if (!orderInputVal) {
            alert("⚠️ Bạn chưa có xe nào trong danh mục 'Xe của bạn' để thực hiện giao nhận!")
            return
        }
    } else {
        orderInputVal = document.getElementById("hoOrderInput").value
        if (!orderInputVal) {
            alert("⚠️ Bạn chưa đặt xe nào! Vui lòng vào mục 'Đặt xe' để đặt xe trước khi thực hiện giao nhận.")
            return
        }
    }

    var orderCode = extractOrderCode(orderInputVal)
    var bikeName = extractBikeName(orderInputVal)
    // Dùng tên xe làm khóa đối chiếu chung nếu chủ xe chọn xe chưa gắn mã #BK
    var sessionKey = (orderCode ? orderCode : bikeName) + "_" + txType

    var rOdo = parseNum(document.getElementById("hoOdoInput").value, 8420)
    var rFuel = parseNum(document.getElementById("hoFuelInput").value, 90)
    var rNote = document.getElementById("hoNoteInput").value.trim() || "Khách nhận đủ mũ, xe tốt"
    var rImg = renterUploadedName || "anh_nhan_xe.jpg"

    var oOdo = parseNum(document.getElementById("hoOwnerOdoInput").value, 8420)
    var oFuel = parseNum(document.getElementById("hoOwnerFuelInput").value, 90)
    var oNote = document.getElementById("hoOwnerNoteInput").value.trim() || "Chủ xe đã xác nhận"
    var oImg = ownerUploadedName || "anh_chuxe.jpg"

    if (!handoverSessions[sessionKey]) {
        handoverSessions[sessionKey] = { renter: null, owner: null, bikeName: bikeName, orderCode: orderCode }
    }

    var nowTime = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    var labelDisplay = orderCode ? (orderCode + " (" + bikeName + ")") : bikeName

    if (roleVal === "Khách thuê") {
        handoverSessions[sessionKey].renter = { odo: rOdo, fuel: rFuel, note: rNote, img: rImg, time: nowTime }
        addPhotoToStorage(txType, "Khách thuê", labelDisplay, rImg, renterImgDataUrl)
    } else {
        handoverSessions[sessionKey].owner = { odo: oOdo, fuel: oFuel, note: oNote, img: oImg, time: nowTime }
        addPhotoToStorage(txType, "Chủ xe", labelDisplay, oImg, ownerImgDataUrl)
    }

    var rSub = handoverSessions[sessionKey].renter
    var oSub = handoverSessions[sessionKey].owner

    var elBadgeStatus = document.getElementById("compareBadgeStatus")
    var elBanner = document.getElementById("compareResultBanner")
    var elBadgeRenter = document.getElementById("badgeRenterStatus")
    var elBadgeOwner = document.getElementById("badgeOwnerStatus")
    var elStatusRenter = document.getElementById("statusCompareRenter")
    var elStatusOwner = document.getElementById("statusCompareOwner")
    var colRenter = document.getElementById("colCompareRenter")
    var colOwner = document.getElementById("colCompareOwner")

    // Mới có 1 bên gửi
    if (!rSub || !oSub) {
        if (rSub && !oSub) {
            elBadgeRenter.textContent = "Đã gửi"; elBadgeRenter.className = "badge-success"
            elStatusRenter.textContent = "Đã gửi lúc " + rSub.time + " (Odo: " + rSub.odo.toLocaleString("vi-VN") + " km | Xăng: " + rSub.fuel + "%)"
            colRenter.className = "compare-col submitted"
            elBadgeOwner.textContent = "Chưa gửi"; elBadgeOwner.className = "badge-warn-sm"
            elStatusOwner.textContent = "Đang chờ Chủ xe gửi biên bản..."
            elBadgeStatus.textContent = "⏳ Chờ Chủ xe"; elBadgeStatus.className = "compare-badge waiting"
            elBanner.className = "compare-result-banner waiting"
            elBanner.innerHTML = "⏳ <strong>Đã tiếp nhận biên bản " + txType + " từ Khách thuê.</strong> Vui lòng chuyển sang vai trò <strong>'Chủ xe'</strong> để gửi thông số đối chiếu 2 chiều."
            alert("📤 ĐÃ GHI NHẬN BIÊN BẢN TỪ KHÁCH THUÊ!\n• Xe: " + labelDisplay + "\n• Odo: " + rSub.odo + " km | Xăng: " + rSub.fuel + "%\n👉 Vui lòng chuyển sang vai trò 'Chủ xe' để đối chiếu.")
        } else {
            elBadgeOwner.textContent = "Đã gửi"; elBadgeOwner.className = "badge-success"
            elStatusOwner.textContent = "Đã gửi lúc " + oSub.time + " (Odo: " + oSub.odo.toLocaleString("vi-VN") + " km | Xăng: " + oSub.fuel + "%)"
            colOwner.className = "compare-col submitted"
            elBadgeRenter.textContent = "Chưa gửi"; elBadgeRenter.className = "badge-warn-sm"
            elStatusRenter.textContent = "Đang chờ Khách thuê gửi biên bản..."
            elBadgeStatus.textContent = "⏳ Chờ Khách thuê"; elBadgeStatus.className = "compare-badge waiting"
            elBanner.className = "compare-result-banner waiting"
            elBanner.innerHTML = "⏳ <strong>Đã tiếp nhận biên bản " + txType + " từ Chủ xe.</strong> Vui lòng chuyển sang vai trò <strong>'Người thuê'</strong> để gửi thông số đối chiếu 2 chiều."
            alert("📤 ĐÃ GHI NHẬN BIÊN BẢN TỪ CHỦ XE!\n• Xe: " + labelDisplay + "\n• Odo: " + oSub.odo + " km | Xăng: " + oSub.fuel + "%\n👉 Vui lòng chuyển sang vai trò 'Người thuê' để đối chiếu.")
        }
        return
    }

    // Cả 2 bên đã gửi -> So sánh
    var isOdoMatch = (rSub.odo === oSub.odo)
    var isFuelMatch = (rSub.fuel === oSub.fuel)

    if (isOdoMatch && isFuelMatch) {
        colRenter.className = "compare-col matched"
        colOwner.className = "compare-col matched"
        elBadgeRenter.textContent = "✓ Đã khớp"; elBadgeRenter.className = "badge-success"
        elBadgeOwner.textContent = "✓ Đã khớp"; elBadgeOwner.className = "badge-success"
        elStatusRenter.textContent = "Đã khớp (Odo: " + rSub.odo.toLocaleString("vi-VN") + " km | Xăng: " + rSub.fuel + "%)"
        elStatusOwner.textContent = "Đã khớp (Odo: " + oSub.odo.toLocaleString("vi-VN") + " km | Xăng: " + oSub.fuel + "%)"
        elBadgeStatus.textContent = "✅ Hoàn tất thành công"; elBadgeStatus.className = "compare-badge matched"
        elBanner.className = "compare-result-banner success"
        elBanner.innerHTML = "🎉 <strong>ĐỐI CHIẾU THÀNH CÔNG — HOÀN TẤT " + txType.toUpperCase() + "!</strong> Cả 2 bên tương đồng về Odometer (" + rSub.odo.toLocaleString("vi-VN") + " km) và Nhiên liệu (" + rSub.fuel + "%)."

        var list = document.getElementById("handoverHistoryList")
        if (list) {
            var row = document.createElement("div")
            row.className = "table-row-5"
            row.innerHTML = '<span><span class="badge-success">' + txType + '</span></span>' +
                '<strong>' + labelDisplay + '</strong>' +
                '<span>' + rSub.odo.toLocaleString("vi-VN") + ' km</span>' +
                '<span>' + rSub.fuel + '%</span>' +
                '<span class="text-muted">✓ Đã khớp 2 chiều (' + rSub.time + ')</span>'
            list.prepend(row)
        }

        // Cập nhật trạng thái trong bookedOrders (Tab Xe đã đặt)
        for (var op = 0; op < bookedOrders.length; op++) {
            if (bookedOrders[op].bikeName === bikeName || ("#" + bookedOrders[op].id) === orderCode) {
                bookedOrders[op].status = (txType === "Check-in") ? "Đang thuê" : "Đã trả xe"
                break
            }
        }
        renderBookedBikes()
        renderRenterOrders()
        renderOwnerOrders()

        alert("🎉 ĐỐI CHIẾU THÀNH CÔNG — HOÀN TẤT " + txType.toUpperCase() + "!\nXe: " + labelDisplay + "\nOdo & Nhiên liệu trùng khớp 100%.")
        handoverSessions[sessionKey] = null
    } else {
        colRenter.className = "compare-col mismatched"
        colOwner.className = "compare-col mismatched"
        elBadgeRenter.textContent = "Chưa khớp"; elBadgeRenter.className = "badge-warn-sm"
        elBadgeOwner.textContent = "Chưa khớp"; elBadgeOwner.className = "badge-warn-sm"
        elBadgeStatus.textContent = "❌ Không tương đồng"; elBadgeStatus.className = "compare-badge mismatched"
        elBanner.className = "compare-result-banner error"
        elBanner.innerHTML = "❌ <strong>CHƯA THỂ HOÀN TẤT " + txType.toUpperCase() + "!</strong> Thông số Odometer hoặc Nhiên liệu giữa Khách thuê và Chủ xe đang bị lệch."
        alert("❌ ĐỐI CHIẾU THẤT BẠI! Thông số Odometer hoặc Nhiên liệu giữa Khách thuê và Chủ xe không tương đồng.")
    }
})

document.getElementById("btnToggleIncident").addEventListener("click", function () {
    document.getElementById("incidentBox").classList.toggle("hidden")
})

var btnSendIncident = document.getElementById("btnSendIncident")
if (btnSendIncident != null) {
    btnSendIncident.addEventListener("click", function () {
        alert("Đã gửi báo cáo sự cố thành công lên hệ thống!")
    })
}

var starBtns = document.querySelectorAll("#starRow .star-btn")
for (var st = 0; st < starBtns.length; st++) {
    starBtns[st].addEventListener("click", function () {
        for (var x = 0; x < starBtns.length; x++) starBtns[x].classList.remove("active")
        this.classList.add("active")
    })
}

var btnSendReview = document.getElementById("btnSendReview")
if (btnSendReview != null) {
    btnSendReview.addEventListener("click", function () {
        alert("Cảm ơn bạn đã gửi đánh giá!")
    })
}

document.getElementById("btnLogout").addEventListener("click", function () {
    isLoggedIn = false
    currentUserName = ""
    updateAuthUI()
    switchTab("tab6")
})

document.getElementById("btnGoLoginFromTab3").addEventListener("click", function () {
    switchTab("tab6")
})

var btnSubmitLogin = document.getElementById("btnSubmitLogin")
if (btnSubmitLogin != null) {
    btnSubmitLogin.addEventListener("click", async function () {
        var identifier = document.getElementById("loginUsername").value.trim()
        var password = document.getElementById("loginPassword").value

        if (!identifier || !password) {
            alert("Vui lòng nhập Email/Số điện thoại và Mật khẩu!")
            return
        }

        try {
            var res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: identifier, password: password })
            })
            var data = await res.json().catch(function () { return {} })

            if (!res.ok) {
                alert("❌ " + (data.message || "Đăng nhập thất bại!"))
                return
            }

            alert("🎉 Đăng nhập thành công! Xin chào " + data.full_name)
            isLoggedIn = true
            currentUserName = data.full_name
            updateAuthUI()

            if (data.role === "ADMIN") {
                switchTab("tab5")
            } else {
                switchTab("tab3")
            }
        } catch (err) {
            alert("❌ Không thể kết nối tới máy chủ Backend: " + err.message)
        }
    })
}

var loginPassInput = document.getElementById("loginPassword")
if (loginPassInput != null) {
    loginPassInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && btnSubmitLogin != null) btnSubmitLogin.click()
    })
}

var loginUserInput = document.getElementById("loginUsername")
if (loginUserInput != null) {
    loginUserInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && btnSubmitLogin != null) btnSubmitLogin.click()
    })
}

var btnRegister = document.getElementById("btnRegister")
if (btnRegister != null) {
    btnRegister.addEventListener("click", function () {
        switchTab("tab7")
    })
}

var btnBackToLogin = document.getElementById("btnBackToLogin")
if (btnBackToLogin != null) {
    btnBackToLogin.addEventListener("click", function () {
        switchTab("tab6")
    })
}

var btnSubmitRegister = document.getElementById("btnSubmitRegister")
if (btnSubmitRegister != null) {
    btnSubmitRegister.addEventListener("click", async function () {
        var fullName = document.getElementById("registerFullName").value.trim()
        var email = document.getElementById("registerEmail").value.trim()
        var phone = document.getElementById("registerPhone").value.trim()
        var password = document.getElementById("registerPassword").value
        var confirmPassword = document.getElementById("registerConfirmPassword").value

        if (!fullName || !email || !phone || !password) {
            alert("Vui lòng nhập đầy đủ thông tin!")
            return
        }
        if (password.length < 8) {
            alert("Mật khẩu phải có ít nhất 8 ký tự!")
            return
        }
        if (password !== confirmPassword) {
            alert("Mật khẩu xác nhận không khớp!")
            return
        }

        try {
            var res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ full_name: fullName, email: email, phone: phone, password: password })
            })
            var data = await res.json().catch(function () { return {} })
            if (!res.ok) {
                alert(data.message || ("Đăng ký thất bại (HTTP " + res.status + ")!"))
                return
            }

            alert("Đăng ký thành công! Vui lòng đăng nhập.")
            document.getElementById("loginUsername").value = email
            document.getElementById("loginPassword").value = ""
            switchTab("tab6")
        } catch (err) {
            alert("Không kết nối được tới server: " + err.message)
        }
    })
}

var btnForgotPassword = document.getElementById("btnForgotPassword")
if (btnForgotPassword != null) {
    btnForgotPassword.addEventListener("click", function () {
        alert("Chức năng Quên mật khẩu: Vui lòng liên hệ Quản trị viên để được cấp lại mật khẩu!")
    })
}

function updateWalletUI() {
    var balanceEl = document.getElementById("walletBalanceText")
    if (balanceEl != null) balanceEl.innerHTML = walletBalance.toLocaleString("vi-VN") + "<u>đ</u>"
    var payOpt = document.getElementById("payMethodWalletOpt")
    if (payOpt != null) payOpt.textContent = "Tiền trong tài khoản cá nhân — " + formatVND(walletBalance)
}

document.getElementById("btnDeposit").addEventListener("click", function () {
    var amt = Number(document.getElementById("walletAmountInput").value) || 0
    if (amt <= 0) return
    pendingDepositAmount = amt

    var qrTitle = document.getElementById("qrModalTitle")
    if (qrTitle) qrTitle.textContent = "Quét mã QR để nạp " + formatVND(amt)
    document.getElementById("qrDepositModal").classList.remove("hidden")
})

document.getElementById("btnConfirmDeposit").addEventListener("click", function () {
    var amt = pendingDepositAmount
    if (amt <= 0) return

    walletBalance += amt
    updateWalletUI()

    var txList = document.getElementById("walletTxList")
    var row = document.createElement("div")
    row.className = "wallet-table-row"
    var codeNum = Math.floor(102 + Math.random() * 890)
    row.innerHTML = '<strong>#TX' + codeNum + '</strong><span>Nạp tiền vào ví nội bộ</span><strong class="text-green">+' + formatVND(amt) + '</strong><span><span class="badge-success">Hoàn tất</span></span>'
    txList.prepend(row)

    pendingDepositAmount = 0
    document.getElementById("qrDepositModal").classList.add("hidden")
})

document.getElementById("btnCloseQrModal").addEventListener("click", function () {
    pendingDepositAmount = 0
    document.getElementById("qrDepositModal").classList.add("hidden")
})

var qrModalBackdrop = document.getElementById("qrDepositModal")
if (qrModalBackdrop != null) qrModalBackdrop.addEventListener("click", function (event) {
    if (event.target === qrModalBackdrop) {
        pendingDepositAmount = 0
        qrModalBackdrop.classList.add("hidden")
    }
})

document.getElementById("btnWithdraw").addEventListener("click", function () {
    var amt = Number(document.getElementById("walletAmountInput").value) || 0
    if (amt <= 0 || amt > walletBalance) return
    walletBalance -= amt
    updateWalletUI()

    var txList = document.getElementById("walletTxList")
    var row = document.createElement("div")
    row.className = "wallet-table-row"
    var codeNum = Math.floor(102 + Math.random() * 890)
    row.innerHTML = '<strong>#TX' + codeNum + '</strong><span>Rút tiền về tài khoản ngân hàng</span><strong>-' + formatVND(amt) + '</strong><span><span class="badge-success">Hoàn tất</span></span>'
    txList.prepend(row)
})

function bindScheduleToggle(btn) {
    btn.addEventListener("click", function () {
        var row = this.closest(".owner-table-row")
        var badge = row.querySelector("span span")
        if (badge.textContent == "Đang trống") {
            badge.textContent = "Đang cho thuê"
            badge.className = "badge-warn-sm"
            this.textContent = "Mở trống"
        } else {
            badge.textContent = "Đang trống"
            badge.className = "badge-success"
            this.textContent = "Khóa lịch"
        }
        renderOwnerOrders()
    })
}

var toggleBtns = document.querySelectorAll(".toggle-schedule-btn")
for (var t = 0; t < toggleBtns.length; t++) {
    bindScheduleToggle(toggleBtns[t])
}

var btnSubmitConsign = document.getElementById("btnSubmitConsign")
if (btnSubmitConsign != null) {
    btnSubmitConsign.addEventListener("click", function () {
        var modelVal = document.getElementById("ownModel").value.trim()
        if (modelVal == "") modelVal = document.getElementById("ownBrand").value + " 2024"
        var ownerList = document.getElementById("ownerBikeList")
        var newRow = document.createElement("div")
        newRow.className = "owner-table-row"
        newRow.innerHTML = '<strong>' + modelVal + '</strong><span>06/11 - 10/11</span><span><span class="badge-success">Đang trống</span></span><button class="btn-secondary-sm toggle-schedule-btn">Khóa lịch</button>'
        ownerList.prepend(newRow)
        bindScheduleToggle(newRow.querySelector(".toggle-schedule-btn"))
        renderOwnerOrders()
        alert("Đã gửi hồ sơ ký gửi xe " + modelVal + " lên Admin!")
    })
}

document.getElementById("btnApproveConsign").addEventListener("click", function () {
    var badge = document.getElementById("consignBadge")
    badge.textContent = "Đã duyệt"
    badge.className = "badge-success"
    this.textContent = "Đã lên sàn"
    this.className = "btn-disabled-sm"
    this.disabled = true
})

document.getElementById("btnRefundDeposit").addEventListener("click", function () {
    var badge = document.getElementById("disputeBadge")
    badge.textContent = "Đã hoàn cọc"
    badge.className = "badge-success"
    this.textContent = "Đã hoàn tất"
    this.className = "btn-disabled-sm"
    this.disabled = true
})

function renderVouchers() {
    var container = document.getElementById("voucherListContainer")
    var out = ""
    for (var i = 0; i < vouchersData.length; i++) {
        var v = vouchersData[i]
        var pillCls = (v.type == "active") ? "pill-status-active" : ((v.type == "warn") ? "pill-status-warn" : "pill-status-expired")
        var delHtml = (isVoucherEditMode == true) ? '<button class="btn-delete-circle" data-idx="' + i + '">X</button>' : ""

        out += '<div class="voucher-row">'
        out += '<strong>' + v.code + '</strong><span>' + v.uses + '</span><span>' + v.discount + '</span>'
        out += '<span><span class="' + pillCls + '">' + v.status + '</span></span><span>' + v.exp + '</span><span>' + delHtml + '</span>'
        out += '</div>'
    }
    container.innerHTML = out

    var delBtns = container.querySelectorAll(".btn-delete-circle")
    for (var d = 0; d < delBtns.length; d++) {
        delBtns[d].addEventListener("click", function () {
            vouchersData.splice(Number(this.getAttribute("data-idx")), 1)
            renderVouchers()
        })
    }
}

document.getElementById("btnToggleVoucherEdit").addEventListener("click", function () {
    isVoucherEditMode = !isVoucherEditMode
    renderVouchers()
})

document.getElementById("btnOpenVoucherModal").addEventListener("click", function () {
    document.getElementById("voucherModal").classList.remove("hidden")
})

document.getElementById("btnCloseVoucherModal").addEventListener("click", function () {
    document.getElementById("voucherModal").classList.add("hidden")
})

var pctBtns = document.querySelectorAll("#percentSelector .pct-btn")
for (var p = 0; p < pctBtns.length; p++) {
    pctBtns[p].addEventListener("click", function () {
        for (var q = 0; q < pctBtns.length; q++) pctBtns[q].classList.remove("active")
        this.classList.add("active")
        selectedModalPct = this.getAttribute("data-pct")
    })
}

document.getElementById("btnSaveVoucher").addEventListener("click", function () {
    var code = document.getElementById("newVoucherCode").value.trim() || "CONBO02"
    var uses = Number(document.getElementById("newVoucherUses").value)
    if (isNaN(uses) || uses <= 0) uses = 100
    var exp = document.getElementById("newVoucherExp").value.trim() || "29/01/2027"

    vouchersData.unshift({
        code: code.toUpperCase(),
        uses: uses,
        discount: "Giảm " + selectedModalPct,
        status: "Đang hoạt động",
        type: "active",
        exp: exp
    })

    renderVouchers()
    document.getElementById("voucherModal").classList.add("hidden")
    document.getElementById("newVoucherCode").value = ""
})

function renderAccounts() {
    var container = document.getElementById("accountListContainer")
    var str = ""
    for (var i = 0; i < accountsData.length; i++) {
        var acc = accountsData[i]
        var st = accountStates[acc.statusIndex]
        str += '<div class="account-row">'
        str += '<strong>' + acc.id + '</strong><span>' + acc.username + '</span><span>' + acc.phone + '</span>'
        str += '<span>' + acc.email + '</span><span>' + acc.pass + '</span>'
        str += '<span><button class="acct-pill ' + st.cls + '" data-idx="' + i + '">' + st.label + '</button></span>'
        str += '</div>'
    }
    container.innerHTML = str

    var acctBtns = container.querySelectorAll(".acct-pill")
    for (var a = 0; a < acctBtns.length; a++) {
        acctBtns[a].addEventListener("click", function () {
            var idx = Number(this.getAttribute("data-idx"))
            accountsData[idx].statusIndex = (accountsData[idx].statusIndex + 1) % accountStates.length
            renderAccounts()
        })
    }
}

tempBien = 1
initBikeAreas()
updateAuthUI()
renderBookedBikes()
updateHandoverPanels()
renderBikes()
updateBookingSummary()
updateWalletUI()
renderVouchers()
renderAccounts()
