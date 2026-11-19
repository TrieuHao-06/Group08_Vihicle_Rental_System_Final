var bikesData = [
    {
        id: 1,
        brand: "Honda",
        name: "Honda Vision 2024",
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
        type: "Xe tay ga",
        cc: "125cc",
        fuel: "Xăng",
        hourPrice: 55000,
        dayPrice: 300000
    }
]

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

var selectedBikeId = 1
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

function formatVND(num) {
    var kq = num.toLocaleString("vi-VN") + "đ"
    return kq
}

function timXeTheoId(id) {
    var i = 0
    for (i = 0; i < bikesData.length; i++) {
        if (bikesData[i].id == id) {
            return bikesData[i]
        }
    }
    return bikesData[0]
}

function switchTab(targetId) {
    var panels = document.querySelectorAll(".tab-panel")
    var i = 0
    for (i = 0; i < panels.length; i++) {
        panels[i].classList.remove("active")
    }
    var panel = document.getElementById(targetId)
    if (panel != null) {
        panel.classList.add("active")
    }

    var navBtns = document.querySelectorAll(".nav-tab")
    var j = 0
    for (j = 0; j < navBtns.length; j++) {
        if (navBtns[j].getAttribute("data-target") == targetId) {
            navBtns[j].classList.add("active")
        } else {
            navBtns[j].classList.remove("active")
        }
    }
    console.log("chuyen sang tab: " + targetId)
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
        if (btnAcc != null) {
            btnAcc.classList.remove("hidden")
        }
        if (btnLogin != null) {
            btnLogin.textContent = "Tài khoản"
            btnLogin.setAttribute("aria-label", "Vào trang tài khoản của " + currentUserName)
        }
        if (userLbl != null) {
            userLbl.textContent = "Tài khoản: " + currentUserName
        }
        if (roleLbl != null) {
            roleLbl.textContent = "Vai trò: " + currentUserRole
        }
        if (barIn != null) {
            barIn.classList.remove("hidden")
        }
        if (barOut != null) {
            barOut.classList.add("hidden")
        }
        if (fileIn != null) {
            fileIn.classList.remove("hidden")
        }
        if (fileOut != null) {
            fileOut.classList.add("hidden")
        }
        if (userTxt != null) {
            userTxt.textContent = currentUserName
        }
        if (ekycName != null) {
            ekycName.value = currentUserName
        }
    } else {
        if (btnAcc != null) {
            btnAcc.classList.add("hidden")
        }
        if (btnLogin != null) {
            btnLogin.textContent = "Đăng nhập"
            btnLogin.setAttribute("aria-label", "Mở trang đăng nhập")
        }
        if (dropdown != null) {
            dropdown.classList.add("hidden")
        }
        if (barIn != null) {
            barIn.classList.add("hidden")
        }
        if (barOut != null) {
            barOut.classList.remove("hidden")
        }
        if (fileIn != null) {
            fileIn.classList.add("hidden")
        }
        if (fileOut != null) {
            fileOut.classList.remove("hidden")
        }
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
            if (dd.classList.contains("hidden")) {
                dd.classList.remove("hidden")
            } else {
                dd.classList.add("hidden")
            }
        }
    }
})

var btnDropdownToAccount = document.getElementById("btnDropdownToAccount")
if (btnDropdownToAccount != null) {
    btnDropdownToAccount.addEventListener("click", function () {
        switchTab("tab3")
        var dd = document.getElementById("userDropdown")
        if (dd != null) {
            dd.classList.add("hidden")
        }
    })
}

document.getElementById("btnDropdownLogout").addEventListener("click", function () {
    isLoggedIn = false
    updateAuthUI()
    var dd = document.getElementById("userDropdown")
    if (dd != null) {
        dd.classList.add("hidden")
    }
    console.log("da dang xuat")
})

document.addEventListener("click", function (e) {
    var wrap = document.getElementById("userMenuWrap")
    var dd = document.getElementById("userDropdown")
    if (wrap != null && dd != null) {
        if (!wrap.contains(e.target)) {
            dd.classList.add("hidden")
        }
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

    var filtered = []
    for (var i = 0; i < bikesData.length; i++) {
        var b = bikesData[i]
        var okBrand = false
        if (brandVal == "all" || b.brand == brandVal) {
            okBrand = true
        }
        var okType = false
        if (typeVal == "all" || b.type == typeVal) {
            okType = true
        }
        var okCc = false
        if (ccVal == "all" || b.cc == ccVal) {
            okCc = true
        }
        var okFuel = false
        if (fuelVal == "all" || b.fuel == fuelVal) {
            okFuel = true
        }
        if (okBrand && okType && okCc && okFuel) {
            filtered.push(b)
        }
    }

    var grid = document.getElementById("bikeGrid")
    var htmlStr = ""
    for (var j = 0; j < filtered.length; j++) {
        var xe = filtered[j]
        var btnCls = "btn-select-bike"
        var btnText = "Chọn xe này"
        if (xe.id == selectedBikeId) {
            btnCls = "btn-select-bike selected"
            btnText = "Đang chọn xe này"
        }

        htmlStr = htmlStr + '<div class="bike-card">'
        htmlStr = htmlStr + '<div class="bike-banner">'
        htmlStr = htmlStr + '<div class="bike-banner-top">'
        htmlStr = htmlStr + '<span class="badge-brand">' + xe.brand + '</span>'
        htmlStr = htmlStr + '</div>'
        htmlStr = htmlStr + '<div class="bike-banner-center">'
        htmlStr = htmlStr + '<div class="bike-banner-title">' + xe.name + '</div>'
        htmlStr = htmlStr + '</div>'
        htmlStr = htmlStr + '</div>'
        htmlStr = htmlStr + '<div class="bike-card-title">' + xe.name + '</div>'
        htmlStr = htmlStr + '<div class="bike-specs-pill">'
        htmlStr = htmlStr + '<span>' + xe.type + '</span>'
        htmlStr = htmlStr + '<span>' + xe.cc + '</span>'
        htmlStr = htmlStr + '<span>' + xe.fuel + '</span>'
        htmlStr = htmlStr + '</div>'
        htmlStr = htmlStr + '<div class="bike-price-row">'
        htmlStr = htmlStr + '<div class="price-col">'
        htmlStr = htmlStr + '<span class="price-caption">Theo giờ</span>'
        htmlStr = htmlStr + '<span class="price-hour">' + xe.hourPrice.toLocaleString("vi-VN") + '<u>đ</u>/h</span>'
        htmlStr = htmlStr + '</div>'
        htmlStr = htmlStr + '<div class="price-col right">'
        htmlStr = htmlStr + '<span class="price-caption">Theo ngày</span>'
        htmlStr = htmlStr + '<span class="price-day">' + xe.dayPrice.toLocaleString("vi-VN") + '<u>đ</u>/ngày</span>'
        htmlStr = htmlStr + '</div>'
        htmlStr = htmlStr + '</div>'
        htmlStr = htmlStr + '<button class="' + btnCls + '" data-id="' + xe.id + '">' + btnText + '</button>'
        htmlStr = htmlStr + '</div>'
    }

    grid.innerHTML = htmlStr

    var selBtns = grid.querySelectorAll(".btn-select-bike")
    for (var k = 0; k < selBtns.length; k++) {
        selBtns[k].addEventListener("click", function () {
            selectedBikeId = Number(this.getAttribute("data-id"))
            console.log("chon xe id: " + selectedBikeId)
            renderBikes()
            updateBookingSummary()
        })
    }
}

function updateBookingSummary() {
    var bike = timXeTheoId(selectedBikeId)
    document.getElementById("detailBikeName").textContent = bike.name
    document.getElementById("detailBikeSpecs").textContent = bike.brand + " • " + bike.type + " • " + bike.cc + " • " + bike.fuel + " • Quận 1, TP.HCM"

    document.getElementById("pkgHourText").textContent = (bike.hourPrice / 1000) + "K / giờ"
    document.getElementById("pkgDayText").textContent = (bike.dayPrice / 1000) + "K / ngày"

    var rawDur = Number(document.getElementById("rentDuration").value)
    var duration = 1
    if (rawDur > 1) {
        duration = rawDur
    }
    var voucherPct = Number(document.getElementById("voucherSelect").value)
    if (isNaN(voucherPct)) {
        voucherPct = 0
    }
    var shipFee = Number(document.getElementById("pickupMethod").value)
    if (isNaN(shipFee)) {
        shipFee = 0
    }

    var unitPrice = bike.hourPrice
    var unitName = "Theo giờ"
    var unitSuffix = "giờ"
    var durTitle = "Số giờ thuê"
    if (rentMode == "day") {
        unitPrice = bike.dayPrice
        unitName = "Theo ngày"
        unitSuffix = "ngày"
        durTitle = "Số ngày thuê"
    }

    var baseCost = unitPrice * duration
    var discount = Math.round((baseCost * voucherPct) / 100)
    var deposit = 300000
    var total = baseCost + shipFee - discount + deposit
    currentBookingTotal = total

    document.getElementById("durationLabel").textContent = durTitle
    document.getElementById("sumBaseLabel").textContent = "Gói cước thuê: " + unitName + " × " + duration + " " + unitSuffix
    document.getElementById("sumBaseVal").textContent = formatVND(baseCost)

    if (shipFee == 0) {
        document.getElementById("sumShipLabel").textContent = "Phí giao xe: Tự lấy tại điểm"
    } else {
        document.getElementById("sumShipLabel").textContent = "Phí giao xe: Giao tận nơi"
    }
    document.getElementById("sumShipVal").textContent = formatVND(shipFee)
    document.getElementById("sumDiscountVal").textContent = "-" + formatVND(discount)
    document.getElementById("sumTotalVal").textContent = formatVND(total)
}

var filterIds = ["filterBrand", "filterType", "filterCc", "filterFuel"]
for (var f = 0; f < filterIds.length; f++) {
    document.getElementById(filterIds[f]).addEventListener("change", renderBikes)
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

document.getElementById("btnBookNow").addEventListener("click", function () {
    demLanBam = demLanBam + 1
    if (walletBalance < currentBookingTotal) {
        alert("Số dư trong tài khoản cá nhân (" + formatVND(walletBalance) + ") không đủ để thanh toán " + formatVND(currentBookingTotal) + "! Vui lòng nạp thêm tiền vào tài khoản.")
        return
    }

    walletBalance = walletBalance - currentBookingTotal
    updateWalletUI()

    var bike = timXeTheoId(selectedBikeId)

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

    var renterSel = document.getElementById("hoOrderInput")
    if (renterSel != null && renterSel.options.length > 0) {
        var txt1 = "#BK0001 — " + bike.name + " • Chờ Check-in"
        renterSel.options[0].value = txt1
        renterSel.options[0].text = txt1
        renterSel.selectedIndex = 0
    }
    var ownerSel = document.getElementById("hoOwnerOrderInput")
    if (ownerSel != null && ownerSel.options.length > 0) {
        var txt2 = "#BK0001 — " + bike.name + " • Chờ Chủ xe xác nhận"
        ownerSel.options[0].value = txt2
        ownerSel.options[0].text = txt2
        ownerSel.selectedIndex = 0
    }

    switchTab("tab2")
})

function updateHandoverPanels() {
    var roleRadios = document.querySelectorAll('input[name="roleType"]')
    var chosenRole = "Khách thuê"
    for (var i = 0; i < roleRadios.length; i++) {
        if (roleRadios[i].checked == true) {
            chosenRole = roleRadios[i].value
        }
    }
    var pRenter = document.getElementById("panelRenter")
    var pOwner = document.getElementById("panelOwner")
    if (chosenRole == "Chủ xe") {
        pRenter.classList.add("hidden")
        pOwner.classList.remove("hidden")
    } else {
        pRenter.classList.remove("hidden")
        pOwner.classList.add("hidden")
    }
    console.log("chon ben giao nhan: " + chosenRole)
}

var allRoleRadios = document.querySelectorAll('input[name="roleType"]')
for (var rr = 0; rr < allRoleRadios.length; rr++) {
    allRoleRadios[rr].addEventListener("change", updateHandoverPanels)
}

document.getElementById("btnExecHandover").addEventListener("click", function () {
    var txRadio = document.querySelector('input[name="txType"]:checked')
    var roleRadio = document.querySelector('input[name="roleType"]:checked')
    var txType = "Check-in"
    if (txRadio != null) {
        txType = txRadio.value
    }
    var roleVal = "Khách thuê"
    if (roleRadio != null) {
        roleVal = roleRadio.value
    }

    var odo = 8420
    var fuel = "90"
    var note = "Đủ 2 mũ, nguyên vẹn"
    var imgName = "anh_giao_nhan.jpg"

    if (roleVal == "Chủ xe") {
        odo = Number(document.getElementById("hoOwnerOdoInput").value) || 8420
        fuel = document.getElementById("hoOwnerFuelInput").value || "90"
        note = document.getElementById("hoOwnerNoteInput").value || "Chủ xe đã xác nhận"
        imgName = document.getElementById("hoOwnerImgInput").value || "anh_chuxe.jpg"
    } else {
        odo = Number(document.getElementById("hoOdoInput").value) || 8420
        fuel = document.getElementById("hoFuelInput").value || "90"
        note = document.getElementById("hoNoteInput").value || "Đủ 2 mũ, nguyên vẹn"
        imgName = document.getElementById("hoImgInput").value || "anh_khach.jpg"
    }

    var list = document.getElementById("handoverHistoryList")
    var row = document.createElement("div")
    row.className = "table-row-5"
    row.innerHTML = '<span><span class="badge-info-sm">' + txType + '</span></span>' +
        '<strong>#BK0001 • ' + roleVal + '</strong>' +
        '<span>' + odo.toLocaleString("vi-VN") + ' km</span>' +
        '<span>' + fuel + '%</span>' +
        '<span class="text-muted">' + note + '</span>'
    list.prepend(row)

    var storage = document.getElementById("storageList")
    if (storage != null) {
        var cleanName = imgName.replace("Chọn tệp — ", "")
        var card = document.createElement("div")
        card.className = "storage-card"
        card.innerHTML = '<div class="storage-thumb">Ảnh ' + txType + '</div>' +
            '<div class="storage-filename">' + cleanName + '</div>' +
            '<div class="storage-meta">Từ: ' + roleVal + ' • #BK0001</div>' +
            '<span class="badge-warn-sm">Xóa sau 4 ngày</span>'
        storage.prepend(card)
    }
})

document.getElementById("btnToggleIncident").addEventListener("click", function () {
    var box = document.getElementById("incidentBox")
    if (box.classList.contains("hidden")) {
        box.classList.remove("hidden")
    } else {
        box.classList.add("hidden")
    }
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
        for (var x = 0; x < starBtns.length; x++) {
            starBtns[x].classList.remove("active")
        }
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
    updateAuthUI()
})

document.getElementById("btnGoLoginFromTab3").addEventListener("click", function () {
    switchTab("tab6")
})

var btnSubmitLogin = document.getElementById("btnSubmitLogin")
if (btnSubmitLogin != null) {
    btnSubmitLogin.addEventListener("click", function () {
        var rawUser = document.getElementById("loginUsername").value
        var username = rawUser.trim()
        if (username == "") {
            username = "Trương Công Hào"
        }

        isLoggedIn = true
        currentUserName = username

        updateAuthUI()
        switchTab("tab3")
        console.log("dang nhap thanh cong: " + currentUserName)
    })
}

var loginPassInput = document.getElementById("loginPassword")
if (loginPassInput != null) {
    loginPassInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            if (btnSubmitLogin != null) {
                btnSubmitLogin.click()
            }
        }
    })
}

var loginUserInput = document.getElementById("loginUsername")
if (loginUserInput != null) {
    loginUserInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            if (btnSubmitLogin != null) {
                btnSubmitLogin.click()
            }
        }
    })
}

var btnRegister = document.getElementById("btnRegister")
if (btnRegister != null) {
    btnRegister.addEventListener("click", function () {
        alert("Chức năng Đăng ký tài khoản: Hệ thống đang mở đăng ký thử nghiệm, vui lòng liên hệ bộ phận hỗ trợ hoặc đăng nhập với tài khoản có sẵn!")
    })
}

var btnForgotPassword = document.getElementById("btnForgotPassword")
if (btnForgotPassword != null) {
    btnForgotPassword.addEventListener("click", function () {
        alert("Chức năng Quên mật khẩu: Vui lòng kiểm tra email hoặc liên hệ Quản trị viên để được cấp lại mật khẩu!")
    })
}

function updateWalletUI() {
    var balanceEl = document.getElementById("walletBalanceText")
    if (balanceEl != null) {
        balanceEl.innerHTML = walletBalance.toLocaleString("vi-VN") + "<u>đ</u>"
    }
    var payOpt = document.getElementById("payMethodWalletOpt")
    if (payOpt != null) {
        payOpt.textContent = "Tiền trong tài khoản cá nhân — " + formatVND(walletBalance)
    }
}

document.getElementById("btnDeposit").addEventListener("click", function () {
    var amt = Number(document.getElementById("walletAmountInput").value) || 0
    if (amt <= 0) {
        return
    }
    walletBalance = walletBalance + amt
    updateWalletUI()

    var txList = document.getElementById("walletTxList")
    var row = document.createElement("div")
    row.className = "wallet-table-row"
    var codeNum = Math.floor(102 + Math.random() * 890)
    row.innerHTML = '<strong>#TX' + codeNum + '</strong>' +
        '<span>Nạp tiền vào ví nội bộ</span>' +
        '<strong class="text-green">+' + formatVND(amt) + '</strong>' +
        '<span><span class="badge-success">Hoàn tất</span></span>'
    txList.prepend(row)
})

document.getElementById("btnWithdraw").addEventListener("click", function () {
    var amt = Number(document.getElementById("walletAmountInput").value) || 0
    if (amt <= 0 || amt > walletBalance) {
        return
    }
    walletBalance = walletBalance - amt
    updateWalletUI()

    var txList = document.getElementById("walletTxList")
    var row = document.createElement("div")
    row.className = "wallet-table-row"
    var codeNum = Math.floor(102 + Math.random() * 890)
    row.innerHTML = '<strong>#TX' + codeNum + '</strong>' +
        '<span>Rút tiền về tài khoản ngân hàng</span>' +
        '<strong>-' + formatVND(amt) + '</strong>' +
        '<span><span class="badge-success">Hoàn tất</span></span>'
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
        if (modelVal == "") {
            modelVal = document.getElementById("ownBrand").value + " 2024"
        }
        var ownerList = document.getElementById("ownerBikeList")
        var newRow = document.createElement("div")
        newRow.className = "owner-table-row"
        newRow.innerHTML = '<strong>' + modelVal + '</strong>' +
            '<span>06/11 - 10/11</span>' +
            '<span><span class="badge-success">Đang trống</span></span>' +
            '<button class="btn-secondary-sm toggle-schedule-btn">Khóa lịch</button>'
        ownerList.prepend(newRow)
        var newBtn = newRow.querySelector(".toggle-schedule-btn")
        bindScheduleToggle(newBtn)
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
        var pillCls = "pill-status-expired"
        if (v.type == "active") {
            pillCls = "pill-status-active"
        } else if (v.type == "warn") {
            pillCls = "pill-status-warn"
        }

        var delHtml = ""
        if (isVoucherEditMode == true) {
            delHtml = '<button class="btn-delete-circle" data-idx="' + i + '">X</button>'
        }

        out = out + '<div class="voucher-row">'
        out = out + '<strong>' + v.code + '</strong>'
        out = out + '<span>' + v.uses + '</span>'
        out = out + '<span>' + v.discount + '</span>'
        out = out + '<span><span class="' + pillCls + '">' + v.status + '</span></span>'
        out = out + '<span>' + v.exp + '</span>'
        out = out + '<span>' + delHtml + '</span>'
        out = out + '</div>'
    }
    container.innerHTML = out

    var delBtns = container.querySelectorAll(".btn-delete-circle")
    for (var d = 0; d < delBtns.length; d++) {
        delBtns[d].addEventListener("click", function () {
            var idx = Number(this.getAttribute("data-idx"))
            vouchersData.splice(idx, 1)
            renderVouchers()
        })
    }
}

document.getElementById("btnToggleVoucherEdit").addEventListener("click", function () {
    if (isVoucherEditMode == true) {
        isVoucherEditMode = false
    } else {
        isVoucherEditMode = true
    }
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
        for (var q = 0; q < pctBtns.length; q++) {
            pctBtns[q].classList.remove("active")
        }
        this.classList.add("active")
        selectedModalPct = this.getAttribute("data-pct")
    })
}

document.getElementById("btnSaveVoucher").addEventListener("click", function () {
    var code = document.getElementById("newVoucherCode").value.trim()
    if (code == "") {
        code = "CONBO02"
    }
    var uses = Number(document.getElementById("newVoucherUses").value)
    if (isNaN(uses) || uses <= 0) {
        uses = 100
    }
    var exp = document.getElementById("newVoucherExp").value.trim()
    if (exp == "") {
        exp = "29/01/2027"
    }

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
        str = str + '<div class="account-row">'
        str = str + '<strong>' + acc.id + '</strong>'
        str = str + '<span>' + acc.username + '</span>'
        str = str + '<span>' + acc.phone + '</span>'
        str = str + '<span>' + acc.email + '</span>'
        str = str + '<span>' + acc.pass + '</span>'
        str = str + '<span><button class="acct-pill ' + st.cls + '" data-idx="' + i + '">' + st.label + '</button></span>'
        str = str + '</div>'
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
updateAuthUI()
updateHandoverPanels()
renderBikes()
updateBookingSummary()
updateWalletUI()
renderVouchers()
renderAccounts()
console.log("khoi tao xong web thue xe may")
