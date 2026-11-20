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
var currentUserId = null
var currentUserName = ""
var currentUserRole = "Khách thuê"

// Khôi phục phiên làm việc đã lưu từ localStorage nếu có
try {
    var savedSession = localStorage.getItem("group08_session")
    if (savedSession) {
        var sessObj = JSON.parse(savedSession)
        if (sessObj && sessObj.user_id && sessObj.full_name) {
            isLoggedIn = true
            currentUserId = sessObj.user_id
            currentUserName = sessObj.full_name
            var rMap = { ADMIN: "Quản trị viên", OWNER: "Chủ xe", RENTER: "Khách thuê" }
            currentUserRole = rMap[sessObj.role] || "Khách thuê"
        }
    }
} catch (e) {}
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
    if (targetId === "tab5" && currentAppRoleMode === "USER") {
        alert("🔒 KHU VỰC QUẢN TRỊ ĐANG BỊ KHÓA!\nBạn đang ở chế độ Khách thuê (User) nên không thể truy cập vào trang Quản trị.\n\nVui lòng bấm nút 'Chế độ: Khách thuê (User)' trên góc phải thanh điều hướng để chuyển sang Quản trị viên (Admin) trước khi truy cập.")
        return
    }

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

    // Đồng bộ dữ liệu mỗi khi chuyển tab
    if (targetId === "tab1") {
        fetchBikesFromBackend()
    } else if (targetId === "tab2") {
        renderRenterOrders()
        renderOwnerOrders()
        if (typeof checkSelectedHandoverLockState === "function") checkSelectedHandoverLockState()
    } else if (targetId === "tab3") {
        loadWalletData()
    } else if (targetId === "tab4") {
        fetchOwnerVehicles()
    } else if (targetId === "tab5") {
        if (typeof updateRoleModeUI === "function") updateRoleModeUI()
        loadAdminPendingVehicles()
        loadAdminPendingDeposits()
        if (typeof loadDailyRevenueReport === "function") loadDailyRevenueReport()
        loadVouchersFromBackend()
        loadAccountsFromBackend()
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

async function handleLogout() {
    try {
        await fetch("/api/auth/logout", { method: "POST" })
    } catch (e) {}
    try { localStorage.removeItem("group08_session") } catch (e) {}
    isLoggedIn = false
    currentUserId = null
    currentUserName = ""
    currentUserRole = "Khách thuê"
    selectedBikeId = null
    var dd = document.getElementById("userDropdown")
    if (dd != null) dd.classList.add("hidden")
    updateAuthUI()
    renderBikes()
    alert("Đã đăng xuất thành công!")
    switchTab("tab1") // Chuyển về tab trang chủ đặt xe
}

var btnDropdownLogout = document.getElementById("btnDropdownLogout")
if (btnDropdownLogout != null) {
    btnDropdownLogout.addEventListener("click", handleLogout)
}

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

// =========================================================================
// QUẢN LÝ CHẾ ĐỘ VAI TRÒ (USER <-> ADMIN)
// =========================================================================
var currentAppRoleMode = localStorage.getItem("group08_app_role_mode") || "USER" // "USER" hoặc "ADMIN"

function updateRoleModeUI() {
    var toggleBtn = document.getElementById("btnRoleToggle")
    var badgeIcon = document.getElementById("roleBadgeIcon")
    var badgeText = document.getElementById("roleBadgeText")
    var navTabAdmin = document.getElementById("navTabAdmin")
    var adminDivider = document.getElementById("adminNavDivider")
    var adminBtn = document.getElementById("btnTopAdmin")
    var tab5Panel = document.getElementById("tab5")

    if (currentAppRoleMode === "ADMIN") {
        if (badgeIcon) badgeIcon.textContent = "🛡️"
        if (badgeText) badgeText.textContent = "Quản trị viên (Admin)"
        if (toggleBtn) {
            toggleBtn.style.borderColor = "#0d74e7"
            toggleBtn.style.color = "#0d74e7"
            toggleBtn.style.background = "#eff6ff"
        }
        if (navTabAdmin) {
            navTabAdmin.innerHTML = "⚡ Quản trị"
            navTabAdmin.classList.remove("locked")
            navTabAdmin.title = "Khu vực Quản trị viên (Đang mở khóa)"
        }
        if (adminDivider) adminDivider.style.display = "inline-block"
        if (adminBtn) {
            adminBtn.innerHTML = "⚡ Admin"
            adminBtn.style.display = "none"
        }
        var lockedNotice = document.getElementById("adminLockedOverlay")
        if (lockedNotice) lockedNotice.classList.add("hidden")
        if (tab5Panel) {
            var allAdminInputs = tab5Panel.querySelectorAll("button, input, select")
            for (var i = 0; i < allAdminInputs.length; i++) {
                if (allAdminInputs[i].getAttribute("data-was-disabled") !== "1") {
                    allAdminInputs[i].disabled = false
                }
            }
        }
    } else {
        if (badgeIcon) badgeIcon.textContent = "👤"
        if (badgeText) badgeText.textContent = "Khách thuê (User)"
        if (toggleBtn) {
            toggleBtn.style.borderColor = "#cbd5e1"
            toggleBtn.style.color = "#475569"
            toggleBtn.style.background = "#fff"
        }
        if (navTabAdmin) {
            navTabAdmin.innerHTML = "🔒 Quản trị"
            navTabAdmin.classList.add("locked")
            navTabAdmin.title = "Khu vực Quản trị viên (Bị khóa ở chế độ User - hãy bấm nút đổi vai trò sang Admin để mở)"
        }
        if (adminDivider) adminDivider.style.display = "inline-block"
        if (adminBtn) {
            adminBtn.innerHTML = "🔒 Admin"
            adminBtn.style.display = "none"
        }
        if (tab5Panel) {
            var lockedNotice = document.getElementById("adminLockedOverlay")
            if (!lockedNotice) {
                lockedNotice = document.createElement("div")
                lockedNotice.id = "adminLockedOverlay"
                lockedNotice.style.margin = "16px 0"
                lockedNotice.style.padding = "14px 18px"
                lockedNotice.style.borderRadius = "8px"
                lockedNotice.style.background = "#fef2f2"
                lockedNotice.style.border = "1px solid #f87171"
                lockedNotice.style.color = "#991b1b"
                lockedNotice.style.fontWeight = "500"
                lockedNotice.innerHTML = "🔒 <strong>KHU VỰC ADMIN ĐANG BỊ KHÓA:</strong> Bạn đang ở chế độ <strong>Khách thuê (User)</strong>. Các thao tác duyệt xe, duyệt nạp tiền, quản lý voucher và cấu hình hệ thống đã bị khóa. Vui lòng bấm nút <strong>'Chế độ: Khách thuê (User)'</strong> trên góc phải thanh điều hướng để chuyển sang vai trò <strong>Quản trị viên (Admin)</strong> để tương tác."
                tab5Panel.insertBefore(lockedNotice, tab5Panel.firstChild)
            } else {
                lockedNotice.classList.remove("hidden")
            }
            // Khóa các nút hành động trong Tab 5
            var allAdminBtns = tab5Panel.querySelectorAll("button:not(.btn-role-toggle)")
            for (var b = 0; b < allAdminBtns.length; b++) {
                if (allAdminBtns[b].disabled) {
                    allAdminBtns[b].setAttribute("data-was-disabled", "1")
                } else {
                    allAdminBtns[b].disabled = true
                }
            }
        }
    }
}

var btnRoleToggle = document.getElementById("btnRoleToggle")
if (btnRoleToggle != null) {
    btnRoleToggle.addEventListener("click", function () {
        if (currentAppRoleMode === "USER") {
            currentAppRoleMode = "ADMIN"
            localStorage.setItem("group08_app_role_mode", currentAppRoleMode)
            updateRoleModeUI()
            switchTab("tab5")
        } else {
            currentAppRoleMode = "USER"
            localStorage.setItem("group08_app_role_mode", currentAppRoleMode)
            updateRoleModeUI()
            if (document.getElementById("tab5") && document.getElementById("tab5").classList.contains("active")) {
                switchTab("tab1")
            }
        }
    })
}

var btnTopAdmin = document.getElementById("btnTopAdmin")
if (btnTopAdmin != null) {
    btnTopAdmin.addEventListener("click", function () {
        if (currentAppRoleMode === "USER") {
            alert("🔒 CHẾ ĐỘ NGƯỜI DÙNG (USER) ĐANG BẬT!\nPhần Quản trị viên (Admin) đang bị khóa. Hãy bấm nút 'Chế độ: Khách thuê (User)' trên thanh tiêu đề để chuyển sang quyền Quản trị viên trước khi vào thao tác.")
            switchTab("tab5")
            updateRoleModeUI()
            return
        }
        switchTab("tab5")
        updateRoleModeUI()
    })
}

// Khởi tạo trạng thái vai trò ban đầu
updateRoleModeUI()

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
            if (!isLoggedIn) {
                alert("🔒 Bạn cần đăng nhập tài khoản trước khi chọn và đặt xe!")
                switchTab("tab6")
                return
            }
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
    var vSelect = document.getElementById("voucherSelect")
    var voucherPct = 0
    if (vSelect && vSelect.selectedIndex >= 0) {
        var opt = vSelect.options[vSelect.selectedIndex]
        voucherPct = Number(opt.getAttribute("data-pct")) || (isNaN(Number(opt.value)) ? 0 : Number(opt.value)) || 0
    }
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
        if (o.status === "Đã trả xe" || o.status === "completed") {
            html += '<button class="btn-disabled-sm" disabled style="background:#f1f5f9; color:#94a3b8; border:1px solid #cbd5e1; cursor:not-allowed; padding: 6px 12px; border-radius: 6px; font-size: 12px;" title="Chuyến đi đã hoàn tất trả xe và khóa giao nhận">🔒 Đã khóa (Đã trả xe)</button>'
        } else {
            html += '<button class="btn-primary-sm go-handover-btn" data-id="' + o.id + '">Giao nhận xe</button>'
        }
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

// TẢI DANH SÁCH ĐƠN XE ĐÃ ĐẶT TỪ CSDL MYSQL
async function fetchMyBookingsFromBackend() {
    if (!isLoggedIn || !currentUserId) return;
    try {
        var res = await fetch("/api/bookings/my-bookings?renter_id=" + currentUserId);
        if (!res.ok) return;
        var list = await res.json();
        if (Array.isArray(list)) {
            bookedOrders = list;
            renderBookedBikes();
            renderRenterOrders();
            renderOwnerOrders();
        }
    } catch (e) {
        console.warn("Lỗi tải danh sách xe đã đặt:", e.message);
    }
}

// XỬ LÝ NÚT THANH TOÁN & ĐẶT XE Ở TAB 1 (KẾT NỐI API CSDL)
document.getElementById("btnBookNow").addEventListener("click", async function () {
    if (!isLoggedIn || !currentUserId) {
        alert("🔒 Bạn cần đăng nhập tài khoản trước khi tiến hành đặt xe!");
        switchTab("tab6");
        return;
    }
    if (selectedBikeId == null) {
        alert("Vui lòng chọn một xe máy trước khi thanh toán!");
        return;
    }

    var bike = timXeTheoId(selectedBikeId);
    var rawDur = Number(document.getElementById("rentDuration").value);
    var duration = (rawDur > 1) ? rawDur : 1;
    var pTime = (document.getElementById("pickup-datetime").value || "2026-11-04T08:00");
    var rTime = (document.getElementById("return-datetime").value || "2026-11-05T08:00");
    var vSelect = document.getElementById("voucherSelect");
    var vCode = vSelect ? vSelect.value : "";
    var pMethod = document.getElementById("pickupMethod") ? document.getElementById("pickupMethod").value : "self";
    var delAddress = (bike && bike.area) ? bike.area : "Quận 1, TP.HCM";
    var delFee = (pMethod === "door") ? 30000 : 0;

    var btn = document.getElementById("btnBookNow");
    try {
        btn.disabled = true;
        btn.textContent = "Đang xử lý đặt xe...";

        var res = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                renter_id: currentUserId,
                vehicle_id: selectedBikeId,
                rental_type: (rentMode === "day") ? "daily" : "hourly",
                delivery_method: (pMethod === "door") ? "delivery_to_door" : "self_pickup",
                delivery_address: delAddress,
                delivery_fee: delFee,
                start_date: pTime.replace("T", " ") + (pTime.length === 16 ? ":00" : ""),
                end_date: rTime.replace("T", " ") + (rTime.length === 16 ? ":00" : ""),
                voucher_code: (vCode !== "none" && vCode) ? vCode : null,
                total_amount: currentBookingTotal,
                deposit_amount: bike.deposit || 300000
            })
        });
        var data = await res.json().catch(function() { return {}; });

        if (!res.ok) {
            alert("❌ Đặt xe thất bại: " + (data.message || data.error || "Vui lòng thử lại!"));
            return;
        }

        alert("✅ " + (data.message || "Đặt xe thành công!"));
        await loadWalletData();
        await fetchMyBookingsFromBackend();
        switchTab("tab7");
    } catch (e) {
        alert("❌ Lỗi kết nối máy chủ: " + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "Thanh toán & Đặt xe";
    }
});

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
        checkSelectedHandoverLockState()
        return
    }

    var html = ""
    for (var i = 0; i < bookedOrders.length; i++) {
        var o = bookedOrders[i]
        var isLocked = (o.status === "Đã trả xe" || o.status === "completed")
        var label = "#" + o.id + " — " + o.bikeName + " • " + (isLocked ? "[ĐÃ TRẢ XE - KHÓA]" : o.status)
        html += '<option value="' + label + '" data-odo="' + o.odo + '" data-fuel="' + o.fuel + '" data-locked="' + (isLocked ? '1' : '0') + '" data-status="' + o.status + '">' + label + '</option>'
    }
    renterSel.innerHTML = html

    var curOpt = renterSel.options[renterSel.selectedIndex]
    if (curOpt && curOpt.getAttribute("data-odo")) {
        document.getElementById("hoOdoInput").value = Number(curOpt.getAttribute("data-odo"))
        document.getElementById("hoFuelInput").value = Number(curOpt.getAttribute("data-fuel"))
    }
    updateCompareBoxMetrics()
    checkSelectedHandoverLockState()
}

function checkSelectedHandoverLockState() {
    var rSel = document.getElementById("hoOrderInput")
    var btn = document.getElementById("btnExecHandover")
    if (!rSel || !btn) return

    var opt = rSel.options[rSel.selectedIndex]
    var isLocked = opt ? (opt.getAttribute("data-locked") === "1") : false
    var banner = document.getElementById("compareResultBanner")

    if (isLocked) {
        btn.disabled = true
        btn.style.opacity = "0.5"
        btn.style.cursor = "not-allowed"
        btn.textContent = "🔒 Đã hoàn tất trả xe (Khóa giao nhận)"
        if (banner) {
            banner.className = "compare-result-banner waiting"
            banner.innerHTML = "🔒 <strong>XE NÀY ĐÃ HOÀN TẤT CHECK-OUT (ĐÃ TRẢ XE) VÀ ĐÃ BỊ KHÓA!</strong> Không thể thực hiện thêm thao tác nào cho đơn này. Vui lòng theo quy trình: Đặt xe mới -> Check-in nhận xe từ đầu!"
        }
    } else {
        btn.disabled = false
        btn.style.opacity = "1"
        btn.style.cursor = "pointer"
        btn.textContent = "Ghi nhận & Đối chiếu 2 chiều"
    }
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

    // 1. Kiểm tra nếu đơn đã check-out (completed/Đã trả xe) -> KHÓA THAO TÁC
    var matchedOrder = null
    for (var b = 0; b < bookedOrders.length; b++) {
        if (bookedOrders[b].bikeName === bikeName || ("#" + bookedOrders[b].id) === orderCode) {
            matchedOrder = bookedOrders[b]
            break
        }
    }
    if (matchedOrder && (matchedOrder.status === "Đã trả xe" || matchedOrder.status === "completed")) {
        alert("🔒 ĐƠN NÀY ĐÃ HOÀN TẤT CHECK-OUT (ĐÃ TRẢ XE) VÀ ĐÃ BỊ KHÓA!\nKhông thể thao tác thêm trên chuyến này. Quý khách vui lòng theo quy trình: Đặt xe mới -> Check-in từ đầu.")
        checkSelectedHandoverLockState()
        return
    }

    // 2. YÊU CẦU: BẮT BUỘC PHẢI CHECK-IN MỚI ĐƯỢC CHECK-OUT
    if (txType === "Check-out") {
        if (matchedOrder && matchedOrder.status !== "Đang thuê" && matchedOrder.status !== "active") {
            alert("⚠️ BẮT BUỘC PHẢI CHECK-IN MỚI ĐƯỢC CHECK-OUT!\nĐơn đặt xe " + (orderCode || bikeName) + " chưa được Check-in nhận xe (trạng thái: " + (matchedOrder ? matchedOrder.status : "Chờ nhận xe") + "). Bạn phải hoàn tất thủ tục Check-in trước khi trả xe!")
            return
        }
    }

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

    // Gửi biên bản lên máy chủ CSDL
    try {
        fetch("/api/handover/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bookingCode: orderCode,
                transactionType: txType,
                role: roleVal,
                odometer: (roleVal === "Khách thuê") ? rOdo : oOdo,
                fuelLevel: (roleVal === "Khách thuê") ? rFuel : oFuel,
                imageUrl: (roleVal === "Khách thuê") ? rImg : oImg,
                note: (roleVal === "Khách thuê") ? rNote : oNote
            })
        }).catch(function(e) { console.warn("Lỗi đồng bộ biên bản lên CSDL:", e.message) })
    } catch (e) {}

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
            alert("📤 ĐÃ GHI NHẬN BIÊN BẢN TỪ KHÁCH THUÊ VÀ ĐỒNG BỘ CSDL!\n• Xe: " + labelDisplay + "\n• Odo: " + rSub.odo + " km | Xăng: " + rSub.fuel + "%\n👉 Vui lòng chuyển sang vai trò 'Chủ xe' để đối chiếu.")
        } else {
            elBadgeOwner.textContent = "Đã gửi"; elBadgeOwner.className = "badge-success"
            elStatusOwner.textContent = "Đã gửi lúc " + oSub.time + " (Odo: " + oSub.odo.toLocaleString("vi-VN") + " km | Xăng: " + oSub.fuel + "%)"
            colOwner.className = "compare-col submitted"
            elBadgeRenter.textContent = "Chưa gửi"; elBadgeRenter.className = "badge-warn-sm"
            elStatusRenter.textContent = "Đang chờ Khách thuê gửi biên bản..."
            elBadgeStatus.textContent = "⏳ Chờ Khách thuê"; elBadgeStatus.className = "compare-badge waiting"
            elBanner.className = "compare-result-banner waiting"
            elBanner.innerHTML = "⏳ <strong>Đã tiếp nhận biên bản " + txType + " từ Chủ xe.</strong> Vui lòng chuyển sang vai trò <strong>'Người thuê'</strong> để gửi thông số đối chiếu 2 chiều."
            alert("📤 ĐÃ GHI NHẬN BIÊN BẢN TỪ CHỦ XE VÀ ĐỒNG BỘ CSDL!\n• Xe: " + labelDisplay + "\n• Odo: " + oSub.odo + " km | Xăng: " + oSub.fuel + "%\n👉 Vui lòng chuyển sang vai trò 'Người thuê' để đối chiếu.")
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
        var gross = matchedOrder ? matchedOrder.totalPrice : 440000;
        var deposit = 300000;
        var rentalFee = Math.max(0, gross - deposit);
        var netRevenue = Math.round(rentalFee * 0.9); // (Tổng thu - Cọc xe) * 90%

        for (var op = 0; op < bookedOrders.length; op++) {
            if (bookedOrders[op].bikeName === bikeName || ("#" + bookedOrders[op].id) === orderCode) {
                bookedOrders[op].status = (txType === "Check-in") ? "Đang thuê" : "Đã trả xe"
                break
            }
        }
        renderBookedBikes()
        renderRenterOrders()
        renderOwnerOrders()

        if (txType === "Check-out") {
            alert("🎉 ĐỐI CHIẾU THÀNH CÔNG — HOÀN TẤT CHECK-OUT (TRẢ XE)!\n" +
                  "• Xe: " + labelDisplay + "\n" +
                  "• Trạng thái: ĐÃ TRẢ XE & KHÓA THAO TÁC.\n" +
                  "• CÔNG THỨC DOANH THU: (Tổng thu " + formatVND(gross) + " - Cọc xe " + formatVND(deposit) + ") × 90%\n" +
                  "👉 DOANH THU THỰC NHẬN CỦA CHỦ XE: +" + formatVND(netRevenue) + " (Hoa hồng nền tảng 10%: " + formatVND(rentalFee - netRevenue) + ").\n" +
                  "Xe đã sẵn sàng cho quy trình mới: Khách có thể đặt xe và check-in lại từ đầu.");
            if (typeof loadDailyRevenueReport === "function") loadDailyRevenueReport();
        } else {
            alert("🎉 ĐỐI CHIẾU THÀNH CÔNG — HOÀN TẤT CHECK-IN!\nXe: " + labelDisplay + "\nKhách đã nhận xe thành công. Đơn chuyển sang trạng thái 'Đang thuê'. Giờ đây bạn đã có thể thực hiện Check-out khi trả xe.");
        }
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
    btnSendIncident.addEventListener("click", async function () {
        var orderInputVal = document.getElementById("hoOrderInput") ? document.getElementById("hoOrderInput").value : ""
        var code = extractOrderCode(orderInputVal) || "BK0001"
        try {
            var res = await fetch("/api/handover/incidents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingCode: code,
                    transactionType: "Check-out",
                    role: "Khách thuê",
                    description: "Trầy xước phần đuôi xe khi bàn giao",
                    estimatedCost: 200000
                })
            })
            var data = await res.json().catch(function() { return {} })
            alert("✅ " + (data.message || "Đã gửi báo cáo sự cố thành công lên hệ thống CSDL!"))
            document.getElementById("incidentBox").classList.add("hidden")
        } catch (e) {
            alert("❌ Lỗi kết nối gửi sự cố: " + e.message)
        }
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
    btnSendReview.addEventListener("click", async function () {
        var orderInputVal = document.getElementById("hoOrderInput") ? document.getElementById("hoOrderInput").value : ""
        var code = extractOrderCode(orderInputVal) || "BK0001"
        var activeStar = document.querySelector("#starRow .star-btn.active")
        var starVal = activeStar ? (activeStar.textContent.match(/⭐/g) || [1,2,3,4,5]).length : 5

        try {
            var res = await fetch("/api/handover/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingCode: code,
                    renterId: currentUserId || 8,
                    rating: starVal,
                    comment: "Xe chạy rất êm và bền bỉ, nhận trả xe đúng giờ!"
                })
            })
            var data = await res.json().catch(function() { return {} })
            if (res.ok) {
                alert("⭐ " + (data.message || "Cảm ơn bạn đã gửi đánh giá vào CSDL!"))
            } else {
                alert("⚠️ " + (data.message || "Không thể gửi đánh giá!"))
            }
        } catch (e) {
            alert("❌ Lỗi kết nối gửi đánh giá: " + e.message)
        }
    })
}

var btnLogout = document.getElementById("btnLogout")
if (btnLogout != null) {
    btnLogout.addEventListener("click", handleLogout)
}

function openChangePasswordModal() {
    var idfInput = document.getElementById("changePassIdentifier")
    var loginUser = document.getElementById("loginUsername")
    if (idfInput != null) {
        var defaultIdf = ""
        try {
            var sess = JSON.parse(localStorage.getItem("group08_session") || "{}")
            defaultIdf = sess.email || sess.phone || ""
        } catch(e) {}
        if (!defaultIdf && loginUser) defaultIdf = loginUser.value.trim()
        if (!defaultIdf) defaultIdf = "tranvanhien@gmail.com"
        idfInput.value = defaultIdf
    }
    document.getElementById("oldPasswordInput").value = ""
    document.getElementById("newPasswordInput").value = ""
    document.getElementById("confirmNewPasswordInput").value = ""
    document.getElementById("passwordModal").classList.remove("hidden")
}

// Mở modal Đổi mật khẩu từ tab Tài khoản & Ví (khi đã đăng nhập hoặc chưa đăng nhập)
var btnChangePass = document.getElementById("btnChangePass")
if (btnChangePass != null) {
    btnChangePass.addEventListener("click", openChangePasswordModal)
}

var btnChangePassLoggedOut = document.getElementById("btnChangePassLoggedOut")
if (btnChangePassLoggedOut != null) {
    btnChangePassLoggedOut.addEventListener("click", openChangePasswordModal)
}

// Đóng modal Đổi mật khẩu
var btnCancelChangePass = document.getElementById("btnCancelChangePass")
if (btnCancelChangePass != null) {
    btnCancelChangePass.addEventListener("click", function () {
        document.getElementById("passwordModal").classList.add("hidden")
    })
}

// Xác nhận đổi mật khẩu liên kết CSDL
var btnSubmitChangePass = document.getElementById("btnSubmitChangePass")
if (btnSubmitChangePass != null) {
    btnSubmitChangePass.addEventListener("click", async function () {
        var identifier = (document.getElementById("changePassIdentifier") ? document.getElementById("changePassIdentifier").value.trim() : "")
        var oldPass = document.getElementById("oldPasswordInput").value
        var newPass = document.getElementById("newPasswordInput").value
        var confirmPass = document.getElementById("confirmNewPasswordInput").value

        if (!identifier || !oldPass || !newPass || !confirmPass) {
            alert("Vui lòng nhập đầy đủ tất cả các trường (Email/SĐT, Mật khẩu cũ và Mật khẩu mới)!")
            return
        }
        if (newPass.length < 8) {
            alert("Mật khẩu mới phải có tối thiểu 8 ký tự!")
            return
        }
        if (newPass === oldPass) {
            alert("Mật khẩu mới không được trùng với mật khẩu cũ!")
            return
        }
        if (newPass !== confirmPass) {
            alert("Mật khẩu xác nhận không khớp!")
            return
        }

        try {
            var res = await fetch("/api/user/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: currentUserId,
                    identifier: identifier,
                    old_password: oldPass,
                    new_password: newPass
                })
            })
            var text = await res.text()
            var data = {}
            try { data = JSON.parse(text) } catch(e) {}

            if (!res.ok) {
                var errMsg = data.message || (res.status === 404 ? "Server chưa được nạp mã đổi mật khẩu mới (Vui lòng chạy 'npm.cmd start' lại trên terminal)!" : ("Lỗi HTTP " + res.status))
                alert("❌ Đổi mật khẩu thất bại: " + errMsg)
                return
            }

            alert("🎉 Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật vào hệ thống.")
            document.getElementById("passwordModal").classList.add("hidden")

            // Đồng bộ mật khẩu mới vào ô đăng nhập và chuyển sang tab đăng nhập
            var loginPassEl = document.getElementById("loginPassword")
            if (loginPassEl != null) loginPassEl.value = newPass
            var loginUserEl = document.getElementById("loginUsername")
            if (loginUserEl != null && identifier) loginUserEl.value = identifier
            switchTab("tab6")
        } catch (err) {
            alert("❌ Lỗi kết nối tới máy chủ: " + err.message)
        }
    })
}

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
            currentUserId = data.user_id
            currentUserName = data.full_name
            var rMap = { ADMIN: "Quản trị viên", OWNER: "Chủ xe", RENTER: "Khách thuê" }
            currentUserRole = rMap[data.role] || "Khách thuê"

            try {
                localStorage.setItem("group08_session", JSON.stringify({
                    user_id: data.user_id,
                    full_name: data.full_name,
                    email: data.email,
                    phone: data.phone,
                    role: data.role,
                    kyc_status: data.kyc_status
                }))
            } catch (e) {}

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
        switchTab("tabRegister")
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
        openChangePasswordModal()
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

// Xử lý nạp tiền: Người dùng gửi yêu cầu nạp tiền QR lên Admin chờ phê duyệt
document.getElementById("btnConfirmDeposit").addEventListener("click", async function () {
    var amt = pendingDepositAmount
    if (amt <= 0) return

    if (!isLoggedIn || !currentUserId) {
        alert("🔒 Bạn cần đăng nhập tài khoản trước khi thực hiện nạp tiền!")
        document.getElementById("qrDepositModal").classList.add("hidden")
        switchTab("tab6")
        return
    }

    var btn = document.getElementById("btnConfirmDeposit")
    try {
        btn.disabled = true
        btn.textContent = "Đang gửi yêu cầu..."

        var res = await fetch("/api/wallet/deposit-request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: currentUserId, amount: amt })
        })
        var data = await res.json().catch(function () { return {} })

        if (!res.ok) {
            alert("❌ " + (data.message || "Gửi yêu cầu nạp tiền thất bại!"))
            return
        }

        alert("✅ Yêu cầu nạp " + formatVND(amt) + " đã gửi lên hệ thống!\nVui lòng chờ Admin kiểm tra và duyệt để tiền được cộng vào tài khoản ví của bạn.")
        pendingDepositAmount = 0
        document.getElementById("qrDepositModal").classList.add("hidden")
        loadWalletData()
    } catch (err) {
        alert("❌ Không thể kết nối tới máy chủ Backend: " + err.message)
    } finally {
        btn.disabled = false
        btn.textContent = "Xác nhận đã chuyển"
    }
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

document.getElementById("btnWithdraw").addEventListener("click", async function () {
    var amt = Number(document.getElementById("walletAmountInput").value) || 0
    if (amt <= 0) {
        alert("Vui lòng nhập số tiền rút hợp lệ!")
        return
    }
    if (!isLoggedIn || !currentUserId) {
        alert("🔒 Bạn cần đăng nhập tài khoản trước khi thực hiện rút tiền!")
        switchTab("tab6")
        return
    }
    if (amt > walletBalance) {
        alert("Số tiền rút vượt quá số dư khả dụng (" + formatVND(walletBalance) + ")!")
        return
    }

    var bank = prompt("Nhập thông tin tài khoản ngân hàng nhận tiền:", "VCB - 0123456789 - " + currentUserName)
    if (!bank) return

    try {
        var res = await fetch("/api/wallet/withdraw", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: currentUserId, amount: amt, bank_info: bank })
        })
        var data = await res.json().catch(function() { return {} })
        if (res.ok) {
            alert("✅ " + (data.message || "Đã gửi yêu cầu rút tiền thành công!"))
            loadWalletData()
        } else {
            alert("⚠️ " + (data.message || "Rút tiền thất bại!"))
        }
    } catch (e) {
        alert("❌ Lỗi kết nối máy chủ: " + e.message)
    }
})

// Cập nhật và gửi duyệt hồ sơ eKYC lên CSDL
var btnUpdateEkyc = document.getElementById("btnUpdateEkyc")
if (btnUpdateEkyc != null) {
    btnUpdateEkyc.addEventListener("click", async function () {
        if (!isLoggedIn || !currentUserId) {
            alert("🔒 Vui lòng đăng nhập trước khi gửi hồ sơ eKYC!")
            switchTab("tab6")
            return
        }

        var cccdInputs = document.querySelectorAll("#tab3 input.input-soft")
        var cccdVal = (cccdInputs.length > 1 && cccdInputs[1].value.trim()) ? cccdInputs[1].value.trim() : "089206001234"

        try {
            var res = await fetch("/api/user/kyc", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: currentUserId,
                    type: "CCCD",
                    document_no: cccdVal,
                    image_url: "uploads/kyc/cccd_user" + currentUserId + ".jpg"
                })
            })
            var data = await res.json().catch(function() { return {} })
            if (res.ok) {
                alert("✅ " + (data.message || "Đã nộp hồ sơ eKYC lên hệ thống CSDL thành công!"))
            } else {
                alert("⚠️ " + (data.message || "Gửi eKYC thất bại!"))
            }
        } catch (e) {
            alert("❌ Lỗi kết nối: " + e.message)
        }
    })
}

// Tải thông tin ví và lịch sử biến động từ CSDL
async function loadWalletData() {
    if (!isLoggedIn || !currentUserId) return
    try {
        var res = await fetch("/api/wallet?user_id=" + currentUserId)
        if (!res.ok) return
        var data = await res.json()
        walletBalance = Number(data.balance) || 0
        updateWalletUI()

        var txList = document.getElementById("walletTxList")
        if (txList && Array.isArray(data.transactions) && data.transactions.length > 0) {
            var html = ""
            for (var i = 0; i < data.transactions.length; i++) {
                var tx = data.transactions[i]
                var sign = (tx.amount >= 0 ? "+" : "")
                var amtColor = (tx.amount >= 0 ? "text-green" : "")
                var badgeHtml = ""

                if (tx.status === "completed") {
                    badgeHtml = '<span class="badge-success">Hoàn tất</span>'
                } else if (tx.status === "pending") {
                    badgeHtml = '<span class="badge-warn-sm">Chờ duyệt</span>'
                } else if (tx.status === "rejected") {
                    badgeHtml = '<span class="badge-warn-sm" style="background: #fee2e2; color: #ef4444;">Bị từ chối</span>'
                } else {
                    badgeHtml = '<span class="badge-info-sm">' + tx.status + '</span>'
                }

                html += '<div class="wallet-table-row">'
                html += '<strong>#TX' + tx.transaction_id + '</strong>'
                html += '<span>' + (tx.description || "Giao dịch ví") + ' (' + tx.created_at + ')</span>'
                html += '<strong class="' + amtColor + '">' + sign + formatVND(tx.amount) + '</strong>'
                html += '<span>' + badgeHtml + '</span>'
                html += '</div>'
            }
            txList.innerHTML = html
        }
    } catch (e) {
        console.warn("Lỗi tải thông tin ví:", e.message)
    }
}

// Tải danh sách xe từ CSDL (chỉ lấy các xe đã được Admin duyệt)
async function fetchBikesFromBackend() {
    try {
        var res = await fetch("/api/vehicles")
        if (!res.ok) return
        var list = await res.json()
        if (Array.isArray(list) && list.length > 0) {
            var areas = getPickupAreaList()
            bikesData = list.map(function (v, idx) {
                return {
                    id: v.id,
                    brand: v.brand,
                    name: v.name || (v.brand + " " + v.model),
                    type: v.type || "Xe tay ga",
                    cc: v.cc || "110cc",
                    fuel: v.fuel || "Xăng",
                    hourPrice: Number(v.hourPrice) || 30000,
                    dayPrice: Number(v.dayPrice) || 180000,
                    deposit: Number(v.deposit) || 300000,
                    area: areas[idx % areas.length],
                    owner: v.owner || "Chủ xe",
                    license_plate: v.license_plate
                }
            })
            renderBikes()
            updateBookingSummary()
        }
    } catch (e) {
        console.warn("Không tải được xe từ CSDL:", e.message)
    }
}

function bindScheduleToggle(btn) {
    btn.addEventListener("click", function () {
        var row = this.closest(".owner-table-row")
        var badge = row.querySelector("span span")
        if (badge && badge.textContent === "Đang trống") {
            badge.textContent = "Đang cho thuê"
            badge.className = "badge-warn-sm"
            this.textContent = "Mở trống"
        } else if (badge) {
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

// Tải danh sách xe của chính chủ xe đăng nhập
async function fetchOwnerVehicles() {
    var ownerList = document.getElementById("ownerBikeList")
    if (!ownerList) return
    if (!isLoggedIn || !currentUserId) {
        ownerList.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b; font-size: 13px;">🔒 Vui lòng đăng nhập để xem danh sách xe ký gửi của bạn.</div>'
        return
    }
    try {
        var res = await fetch("/api/owner/my-vehicles?user_id=" + currentUserId)
        if (!res.ok) return
        var list = await res.json()
        if (!Array.isArray(list) || list.length === 0) {
            ownerList.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b; font-size: 13px;">Bạn chưa có xe ký gửi nào. Điền form bên cạnh để gửi yêu cầu thêm xe!</div>'
            return
        }

        var html = ""
        for (var i = 0; i < list.length; i++) {
            var v = list[i]
            var appStatus = v.approval_status || "pending"
            var badgeHtml = ""
            var btnHtml = ""

            if (appStatus === "approved") {
                badgeHtml = '<span class="badge-success">Đã duyệt</span>'
                var isAvail = (v.availability_status === "available")
                btnHtml = '<button class="btn-secondary-sm toggle-schedule-btn">' + (isAvail ? "Khóa lịch" : "Mở trống") + '</button>'
            } else if (appStatus === "rejected") {
                badgeHtml = '<span class="badge-warn-sm" style="background: #fee2e2; color: #ef4444;">Bị từ chối</span>'
                btnHtml = '<button class="btn-disabled-sm" disabled>Bị từ chối</button>'
            } else {
                badgeHtml = '<span class="badge-warn-sm">Chờ duyệt</span>'
                btnHtml = '<button class="btn-disabled-sm" disabled>Đang đợi duyệt</button>'
            }

            html += '<div class="owner-table-row">'
            html += '<strong>' + v.name + '</strong>'
            html += '<span>' + v.license_plate + '</span>'
            html += '<span>' + badgeHtml + '</span>'
            html += btnHtml
            html += '</div>'
        }
        ownerList.innerHTML = html

        var btns = ownerList.querySelectorAll(".toggle-schedule-btn")
        for (var b = 0; b < btns.length; b++) {
            bindScheduleToggle(btns[b])
        }
    } catch (e) {
        console.warn("Lỗi load danh sách xe chủ:", e.message)
    }
}

// Người dùng gửi hồ sơ ký gửi xe mới lên Admin
var btnSubmitConsign = document.getElementById("btnSubmitConsign")
if (btnSubmitConsign != null) {
    btnSubmitConsign.addEventListener("click", async function () {
        if (!isLoggedIn || !currentUserId) {
            alert("🔒 Bạn cần đăng nhập tài khoản trước khi gửi yêu cầu ký gửi xe!")
            switchTab("tab6")
            return
        }

        var brand = (document.getElementById("ownBrand") ? document.getElementById("ownBrand").value.trim() : "")
        var model = (document.getElementById("ownModel") ? document.getElementById("ownModel").value.trim() : "")
        var type = (document.getElementById("ownType") ? document.getElementById("ownType").value.trim() : "Xe tay ga")
        var cc = (document.getElementById("ownCc") ? document.getElementById("ownCc").value.trim() : "110cc")
        var fuel = (document.getElementById("ownFuel") ? document.getElementById("ownFuel").value.trim() : "Xăng")
        var hourPrice = (document.getElementById("ownHourPrice") ? document.getElementById("ownHourPrice").value.trim() : "")
        var dayPrice = (document.getElementById("ownDayPrice") ? document.getElementById("ownDayPrice").value.trim() : "")
        var plate = (document.getElementById("ownPlate") ? document.getElementById("ownPlate").value.trim() : "")

        if (!brand || !model || !plate || !hourPrice || !dayPrice) {
            alert("❌ Vui lòng nhập đầy đủ thông tin: Hãng xe, Tên mẫu xe, Giá thuê theo giờ, Giá theo ngày và Biển số xe!")
            return
        }

        try {
            btnSubmitConsign.disabled = true
            btnSubmitConsign.textContent = "Đang gửi hồ sơ lên Admin..."

            var res = await fetch("/api/vehicles/consign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: currentUserId,
                    brand: brand,
                    model: model,
                    vehicle_type: type || "Xe tay ga",
                    engine_cc: cc || "110cc",
                    fuel_type: fuel || "Xăng",
                    hour_price: Number(hourPrice),
                    day_price: Number(dayPrice),
                    license_plate: plate
                })
            })
            var data = await res.json().catch(function () { return {} })

            if (!res.ok) {
                alert("❌ " + (data.message || "Gửi yêu cầu ký gửi thất bại!"))
                return
            }

            alert("🎉 " + data.message)
            // Làm trống toàn bộ form sau khi gửi thành công
            if (document.getElementById("ownBrand")) document.getElementById("ownBrand").value = ""
            if (document.getElementById("ownModel")) document.getElementById("ownModel").value = ""
            if (document.getElementById("ownType")) document.getElementById("ownType").value = ""
            if (document.getElementById("ownCc")) document.getElementById("ownCc").value = ""
            if (document.getElementById("ownFuel")) document.getElementById("ownFuel").value = ""
            if (document.getElementById("ownHourPrice")) document.getElementById("ownHourPrice").value = ""
            if (document.getElementById("ownDayPrice")) document.getElementById("ownDayPrice").value = ""
            if (document.getElementById("ownPlate")) document.getElementById("ownPlate").value = ""

            fetchOwnerVehicles()
        } catch (err) {
            alert("❌ Lỗi kết nối hệ thống: " + err.message)
        } finally {
            btnSubmitConsign.disabled = false
            btnSubmitConsign.textContent = "Gửi hồ sơ ký gửi xe lên Admin"
        }
    })
}

// ==========================================
// ADMIN: DUYỆT XE KÝ GỬI & DUYỆT NẠP TIỀN QR
// ==========================================
async function loadAdminPendingVehicles() {
    var container = document.getElementById("adminPendingVehicleList")
    if (!container) return
    try {
        var res = await fetch("/api/admin/vehicles/pending")
        if (!res.ok) return
        var list = await res.json()
        if (!Array.isArray(list) || list.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b; font-size: 13px;">✅ Hiện không có xe nào đang chờ duyệt.</div>'
            return
        }

        var html = ""
        for (var i = 0; i < list.length; i++) {
            var v = list[i]
            html += '<div class="admin-approve-row">'
            html += '<strong>Xe ký gửi: ' + v.brand + ' ' + v.model + '</strong>'
            html += '<span>Biển số: <strong>' + v.license_plate + '</strong> • ' + (v.vehicle_type || 'Xe tay ga') + ' • ' + (v.engine_cc || '110cc') + ' • Giá: ' + formatVND(v.price_per_day) + '/ngày • Chủ xe: ' + v.owner_name + ' (' + v.owner_phone + ')</span>'
            html += '<span><span class="badge-warn-sm">Chờ duyệt</span></span>'
            html += '<div style="display: flex; gap: 6px;">'
            html += '<button class="btn-primary-sm" onclick="handleApproveVehicle(' + v.vehicle_id + ')">Duyệt lên sàn</button>'
            html += '<button class="btn-secondary-sm" style="background: #fee2e2; color: #ef4444; border: none;" onclick="handleRejectVehicle(' + v.vehicle_id + ')">Từ chối</button>'
            html += '</div>'
            html += '</div>'
        }
        container.innerHTML = html
    } catch (e) {
        console.warn("Lỗi load danh sách xe chờ duyệt:", e.message)
    }
}

window.handleApproveVehicle = async function (vehicleId) {
    if (!confirm("Bạn có chắc chắn muốn duyệt xe này lên sàn cho khách thuê?")) return
    try {
        var res = await fetch("/api/admin/vehicles/" + vehicleId + "/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ admin_id: currentUserId || 6 })
        })
        var data = await res.json().catch(function () { return {} })
        if (!res.ok) {
            alert("❌ " + (data.message || data.error || "Duyệt xe thất bại!"))
            return
        }
        alert("🎉 " + (data.message || "Đã duyệt xe thành công!"))
        loadAdminPendingVehicles()
        fetchBikesFromBackend()
    } catch (err) {
        alert("❌ Lỗi duyệt xe: " + err.message)
    }
}

window.handleApproveAllVehicles = async function () {
    if (!confirm("Bạn có chắc chắn muốn duyệt TẤT CẢ các xe máy đang chờ duyệt lên sàn?")) return
    try {
        var res = await fetch("/api/admin/vehicles/approve-all", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ admin_id: currentUserId || 6 })
        })
        var data = await res.json().catch(function () { return {} })
        if (!res.ok) {
            alert("❌ " + (data.message || data.error || "Duyệt tất cả thất bại!"))
            return
        }
        alert("🎉 " + (data.message || "Đã duyệt tất cả xe thành công!"))
        loadAdminPendingVehicles()
        fetchBikesFromBackend()
    } catch (err) {
        alert("❌ Lỗi duyệt tất cả xe: " + err.message)
    }
}

window.handleRejectVehicle = async function (vehicleId) {
    if (!confirm("Bạn có chắc chắn muốn từ chối hồ sơ xe này?")) return
    try {
        var res = await fetch("/api/admin/vehicles/" + vehicleId + "/reject", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        })
        var data = await res.json().catch(function () { return {} })
        if (!res.ok) {
            alert("❌ " + (data.message || "Từ chối xe thất bại!"))
            return
        }
        alert("Đã từ chối xe ký gửi.")
        loadAdminPendingVehicles()
    } catch (err) {
        alert("❌ Lỗi từ chối xe: " + err.message)
    }
}

async function loadAdminPendingDeposits() {
    var container = document.getElementById("adminPendingDepositList")
    if (!container) return
    try {
        var res = await fetch("/api/admin/deposits/pending")
        if (!res.ok) return
        var list = await res.json()
        if (!Array.isArray(list) || list.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b; font-size: 13px;">✅ Hiện không có yêu cầu nạp tiền nào đang chờ duyệt.</div>'
            return
        }

        var html = ""
        for (var i = 0; i < list.length; i++) {
            var d = list[i]
            html += '<div class="admin-approve-row">'
            html += '<strong>Nạp tiền #TX' + d.transaction_id + '</strong>'
            html += '<span>Số tiền: <strong class="text-green">+' + formatVND(d.amount) + '</strong> • Người nạp: <strong>' + d.full_name + '</strong> (SĐT: ' + (d.phone || d.email) + ') • Lúc: ' + d.created_at + '</span>'
            html += '<span><span class="badge-warn-sm">Chờ duyệt</span></span>'
            html += '<div style="display: flex; gap: 6px;">'
            html += '<button class="btn-primary-sm" onclick="handleApproveDeposit(' + d.transaction_id + ')">Duyệt nạp tiền</button>'
            html += '<button class="btn-secondary-sm" style="background: #fee2e2; color: #ef4444; border: none;" onclick="handleRejectDeposit(' + d.transaction_id + ')">Từ chối</button>'
            html += '</div>'
            html += '</div>'
        }
        container.innerHTML = html
    } catch (e) {
        console.warn("Lỗi load danh sách nạp tiền chờ duyệt:", e.message)
    }
}

window.handleApproveDeposit = async function (txId) {
    if (!confirm("Bạn có chắc chắn đã nhận được tiền và muốn duyệt cộng tiền cho giao dịch #" + txId + "?")) return
    try {
        var res = await fetch("/api/admin/deposits/" + txId + "/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        })
        var data = await res.json().catch(function () { return {} })
        if (!res.ok) {
            alert("❌ " + (data.message || "Duyệt thất bại!"))
            return
        }
        alert("🎉 " + data.message)
        loadAdminPendingDeposits()
        loadWalletData()
    } catch (err) {
        alert("❌ Lỗi duyệt nạp tiền: " + err.message)
    }
}

window.handleRejectDeposit = async function (txId) {
    if (!confirm("Bạn có chắc chắn muốn từ chối yêu cầu nạp tiền #" + txId + "?")) return
    try {
        var res = await fetch("/api/admin/deposits/" + txId + "/reject", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        })
        var data = await res.json().catch(function () { return {} })
        if (!res.ok) {
            alert("❌ " + (data.message || "Từ chối thất bại!"))
            return
        }
        alert("Đã từ chối yêu cầu nạp tiền.")
        loadAdminPendingDeposits()
    } catch (err) {
        alert("❌ Lỗi từ chối nạp tiền: " + err.message)
    }
}

var btnRefreshAdminVehicles = document.getElementById("btnRefreshAdminVehicles")
if (btnRefreshAdminVehicles) btnRefreshAdminVehicles.addEventListener("click", loadAdminPendingVehicles)

var btnRefreshAdminDeposits = document.getElementById("btnRefreshAdminDeposits")
if (btnRefreshAdminDeposits) btnRefreshAdminDeposits.addEventListener("click", loadAdminPendingDeposits)

var btnRefundDeposit = document.getElementById("btnRefundDeposit")
if (btnRefundDeposit) {
    btnRefundDeposit.addEventListener("click", async function () {
        if (!confirm("Bạn có chắc chắn muốn duyệt hoàn trả tiền cọc cho đơn #BK0001?")) return
        try {
            var res = await fetch("/api/admin/refunds/1/approve", { method: "POST" })
            var data = await res.json().catch(function() { return {} })
            var badge = document.getElementById("disputeBadge")
            if (badge) {
                badge.textContent = "Đã hoàn cọc"
                badge.className = "badge-success"
            }
            this.textContent = "Đã hoàn tất"
            this.className = "btn-disabled-sm"
            this.disabled = true
            alert("✅ " + (data.message || "Đã duyệt hoàn cọc về ví của khách thành công!"))
            loadWalletData()
        } catch (e) {
            alert("❌ Lỗi kết nối: " + e.message)
        }
    })
}

// TẢI VOUCHER TỪ CSDL MYSQL
async function loadVouchersFromBackend() {
    try {
        var res = await fetch("/api/vouchers")
        if (!res.ok) return
        var list = await res.json()
        if (Array.isArray(list) && list.length > 0) {
            vouchersData = list
            renderVouchers()
            updateVoucherSelectDropdown()
        }
    } catch (e) {
        console.warn("Lỗi tải voucher từ CSDL:", e.message)
    }
}

function updateVoucherSelectDropdown() {
    var vSelect = document.getElementById("voucherSelect")
    if (!vSelect || vouchersData.length === 0) return
    var curVal = vSelect.value
    var html = '<option value="none" data-pct="0">Không áp dụng mã</option>'
    for (var i = 0; i < vouchersData.length; i++) {
        var v = vouchersData[i]
        if (v.type !== "expired") {
            var pctNum = Number(v.discount_percent) || Number(String(v.discount).replace(/[^0-9]/g, '')) || 0
            html += '<option value="' + v.code + '" data-pct="' + pctNum + '">' + v.code + ' (' + v.discount + ')</option>'
        }
    }
    vSelect.innerHTML = html
    if (curVal) vSelect.value = curVal
}

function renderVouchers() {
    var container = document.getElementById("voucherListContainer")
    if (!container) return
    var out = ""
    for (var i = 0; i < vouchersData.length; i++) {
        var v = vouchersData[i]
        var pillCls = (v.type == "active") ? "pill-status-active" : ((v.type == "warn") ? "pill-status-warn" : "pill-status-expired")
        var delHtml = (isVoucherEditMode == true) ? '<button class="btn-delete-circle" data-id="' + (v.voucher_id || '') + '" data-idx="' + i + '">X</button>' : ""

        out += '<div class="voucher-row">'
        out += '<strong>' + v.code + '</strong><span>' + v.uses + '</span><span>' + v.discount + '</span>'
        out += '<span><span class="' + pillCls + '">' + v.status + '</span></span><span>' + v.exp + '</span><span>' + delHtml + '</span>'
        out += '</div>'
    }
    container.innerHTML = out

    var delBtns = container.querySelectorAll(".btn-delete-circle")
    for (var d = 0; d < delBtns.length; d++) {
        delBtns[d].addEventListener("click", async function () {
            var vId = this.getAttribute("data-id")
            if (vId) {
                if (!confirm("Bạn có chắc chắn muốn xóa voucher này khỏi CSDL?")) return
                try {
                    await fetch("/api/vouchers/" + vId, { method: "DELETE" })
                    loadVouchersFromBackend()
                } catch (e) {
                    console.warn("Lỗi xóa voucher:", e.message)
                }
            } else {
                vouchersData.splice(Number(this.getAttribute("data-idx")), 1)
                renderVouchers()
            }
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

document.getElementById("btnSaveVoucher").addEventListener("click", async function () {
    var code = document.getElementById("newVoucherCode").value.trim()
    if (!code) {
        alert("⚠️ Vui lòng nhập mã voucher!")
        return
    }
    var uses = Number(document.getElementById("newVoucherUses").value)
    if (isNaN(uses) || uses <= 0) uses = 100
    var exp = document.getElementById("newVoucherExp").value.trim() || "2027-12-31"
    var pct = Number(selectedModalPct.replace("%", "")) || 10

    try {
        var res = await fetch("/api/vouchers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: code.toUpperCase(),
                discount_percent: pct,
                usage_limit: uses,
                end_date: exp
            })
        })
        var data = await res.json().catch(function() { return {} })
        if (res.ok) {
            alert("✅ " + (data.message || "Tạo voucher thành công!"))
            await loadVouchersFromBackend()
            document.getElementById("voucherModal").classList.add("hidden")
            document.getElementById("newVoucherCode").value = ""
        } else {
            alert("⚠️ " + (data.message || "Tạo voucher thất bại!"))
        }
    } catch (e) {
        alert("❌ Lỗi kết nối: " + e.message)
    }
})

// =========================================================================
// BÁO CÁO DOANH THU & BIỂU ĐỒ CỘT THEO NGÀY
// =========================================================================
async function loadDailyRevenueReport() {
    var chartContainer = document.getElementById("revenueBarChart")
    var tableContainer = document.getElementById("dailyRevenueList")
    if (!chartContainer || !tableContainer) return

    try {
        var res = await fetch("/api/admin/reports/daily-revenue")
        var data = []
        if (res.ok) {
            data = await res.json()
        }
        renderDailyRevenueUI(data)
    } catch (e) {
        console.warn("Lỗi tải báo cáo doanh thu:", e.message)
        renderDailyRevenueUI([])
    }
}

function renderDailyRevenueUI(data) {
    var chartContainer = document.getElementById("revenueBarChart")
    var tableContainer = document.getElementById("dailyRevenueList")
    if (!chartContainer || !tableContainer) return

    if (!Array.isArray(data) || data.length === 0) {
        chartContainer.innerHTML = '<div style="margin: auto; color: #94a3b8; font-size: 13px; text-align: center; padding: 30px;">Chưa có dữ liệu kết toán đơn thuê. Sau khi khách thực hiện Check-out trả xe, biểu đồ và doanh thu sẽ tự động xuất hiện tại đây.</div>'
        tableContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: #94a3b8; font-size: 13px;">Hiện chưa có lịch sử doanh thu theo ngày nào được hoàn tất.</div>'
        return
    }

    var chartData = data.slice().reverse()
    var maxRevenue = Math.max.apply(Math, chartData.map(function(d) { return Number(d.net_revenue) || 0 }))
    if (maxRevenue <= 0) maxRevenue = 1000000

    var chartHtml = ""
    for (var i = 0; i < chartData.length; i++) {
        var item = chartData[i]
        var net = Number(item.net_revenue) || 0
        var gross = Number(item.gross_total) || 0
        var deposit = Number(item.deposit_total) || 0
        var heightPct = Math.max(16, Math.round((net / maxRevenue) * 120))

        var netFormatted = (net >= 1000000) ? (net / 1000000).toFixed(1) + "M" : (net / 1000).toFixed(0) + "k"

        chartHtml += '<div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; flex: 1; min-width: 50px; height: 160px; position: relative;">'
        chartHtml += '<div style="font-size: 11px; font-weight: 700; color: #0d74e7; margin-bottom: 6px;">' + netFormatted + '</div>'
        chartHtml += '<div title="Ngày: ' + item.date_formatted + '&#10;Tổng thu: ' + gross.toLocaleString('vi-VN') + ' đ&#10;Cọc xe: ' + deposit.toLocaleString('vi-VN') + ' đ&#10;Thực nhận 90%: ' + net.toLocaleString('vi-VN') + ' đ" style="width: 34px; height: ' + heightPct + 'px; background: linear-gradient(180deg, #38bdf8 0%, #0284c7 100%); border-radius: 6px 6px 0 0; transition: height 0.3s ease; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.2);"></div>'
        chartHtml += '<div style="font-size: 11px; color: #64748b; margin-top: 8px; font-weight: 500;">' + item.date_formatted.split('/').slice(0, 2).join('/') + '</div>'
        chartHtml += '</div>'
    }
    chartContainer.innerHTML = chartHtml

    var tableHtml = ""
    for (var j = 0; j < data.length; j++) {
        var row = data[j]
        var gTotal = Number(row.gross_total) || 0
        var depTotal = Number(row.deposit_total) || 0
        var nRev = Number(row.net_revenue) || 0
        var pRev = Number(row.platform_revenue) || 0

        tableHtml += '<div style="display: grid; grid-template-columns: 1.5fr 1fr 1.5fr 1.5fr 1.5fr 1.2fr; align-items: center; padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;">'
        tableHtml += '<span style="font-weight: 600; color: #0f172a;">📅 ' + row.date_formatted + '</span>'
        tableHtml += '<span><span style="background: #e0f2fe; color: #0284c7; padding: 3px 8px; border-radius: 999px; font-weight: 600; font-size: 12px;">' + row.total_orders + ' đơn</span></span>'
        tableHtml += '<span style="font-weight: 500;">' + gTotal.toLocaleString('vi-VN') + ' đ</span>'
        tableHtml += '<span style="color: #64748b;">' + depTotal.toLocaleString('vi-VN') + ' đ</span>'
        tableHtml += '<span style="color: #16a34a; font-weight: 700;">+' + nRev.toLocaleString('vi-VN') + ' đ</span>'
        tableHtml += '<span style="color: #d97706; font-weight: 600;">' + pRev.toLocaleString('vi-VN') + ' đ</span>'
        tableHtml += '</div>'
    }
    tableContainer.innerHTML = tableHtml
}

var btnRefRev = document.getElementById("btnRefreshDailyRevenue")
if (btnRefRev) {
    btnRefRev.addEventListener("click", function() {
        loadDailyRevenueReport()
    })
}

// TẢI DANH SÁCH TÀI KHOẢN TỪ BẢNG USERS CSDL
async function loadAccountsFromBackend() {
    try {
        var res = await fetch("/api/admin/users")
        if (!res.ok) return
        var list = await res.json()
        if (Array.isArray(list) && list.length > 0) {
            accountsData = list.map(function(u) {
                var sIdx = 0
                if (u.status === "locked_15") sIdx = 1
                else if (u.status === "locked_30") sIdx = 2
                else if (u.status === "banned" || u.status === "inactive") sIdx = 3
                return {
                    id: String(u.id).padStart(8, "0"),
                    userId: u.id,
                    username: u.username || u.fullName,
                    phone: u.phone,
                    email: u.email,
                    pass: "**************",
                    status: u.status,
                    statusIndex: sIdx,
                    role: u.role
                }
            })
            renderAccounts()
        }
    } catch (e) {
        console.warn("Lỗi tải tài khoản người dùng:", e.message)
    }
}

function renderAccounts() {
    var container = document.getElementById("accountListContainer")
    if (!container) return
    var str = ""
    for (var i = 0; i < accountsData.length; i++) {
        var acc = accountsData[i]
        var st = accountStates[acc.statusIndex] || accountStates[0]
        str += '<div class="account-row">'
        str += '<strong>' + acc.id + '</strong><span>' + acc.username + '</span><span>' + acc.phone + '</span>'
        str += '<span>' + acc.email + '</span><span>' + acc.pass + '</span>'
        str += '<span><button class="acct-pill ' + st.cls + '" data-idx="' + i + '" data-userid="' + (acc.userId || '') + '">' + st.label + '</button></span>'
        str += '</div>'
    }
    container.innerHTML = str

    var acctBtns = container.querySelectorAll(".acct-pill")
    for (var a = 0; a < acctBtns.length; a++) {
        acctBtns[a].addEventListener("click", async function () {
            var idx = Number(this.getAttribute("data-idx"))
            var acc = accountsData[idx]
            var nextIdx = (acc.statusIndex + 1) % accountStates.length
            var statusMap = ["active", "locked_15", "locked_30", "banned"]
            var nextStatus = statusMap[nextIdx]

            if (acc.userId) {
                try {
                    await fetch("/api/admin/users/" + acc.userId + "/status", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: nextStatus, reason: "Admin thay đổi trạng thái tài khoản" })
                    })
                    loadAccountsFromBackend()
                } catch (e) {
                    console.warn("Lỗi cập nhật trạng thái tài khoản:", e.message)
                }
            } else {
                acc.statusIndex = nextIdx
                renderAccounts()
            }
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

fetchBikesFromBackend()
loadVouchersFromBackend()
loadAccountsFromBackend()
if (isLoggedIn) {
    loadWalletData()
    fetchOwnerVehicles()
    fetchMyBookingsFromBackend()
}
loadAdminPendingVehicles()
loadAdminPendingDeposits()
loadDailyRevenueReport()
