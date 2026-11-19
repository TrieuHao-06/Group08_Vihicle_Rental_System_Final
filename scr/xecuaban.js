/* ==========================================================
   TAB "XE CỦA BẠN" (Chủ xe) — phần của Hồng Trung
   Chức năng (theo use case 4.11 + class VehicleOwner):
     1. Đăng ký ký gửi xe / sửa thông tin xe (registerVehicle, updateVehicle)
     2. Danh sách xe của tôi + khóa/mở lịch (setPriceAndAvailability, trackStatus)
     3. Duyệt / từ chối yêu cầu đặt xe (acceptBooking, rejectBooking)
     4. Xem doanh thu + gửi yêu cầu rút tiền (viewEarnings, withdrawEarnings)

   File này chạy độc lập, KHÔNG sửa thuexe.js. Nạp sau thuexe.js trong index.html.
   Dữ liệu lấy từ backend qua /api/owner/... (xem backend/owner/ownerRoutes.js).
   ========================================================== */
(function () {
    "use strict";

    /* ---------- Giá trị trạng thái (khớp cột trong database_schema.sql) ----------
       vehicles.approval_status     : pending | approved | rejected
       vehicles.availability_status : available | rented | locked
       bookings.status              : pending | approved | rejected              */

    /* ---------- Dữ liệu (tải từ server) ---------- */
    let vehicles = [];
    let requests = [];
    let withdrawals = [];
    let earnings = { completedTrips: 0, netRevenue: 0, withdrawable: 0 };
    let editingId = null;
    let busy = false; // chặn bấm nút 2 lần khi đang gọi server

    /* ---------- Gọi API backend (/api/owner/...) ----------
       TODO: hiện chưa có đăng nhập thật nên gửi user_id qua header X-User-Id.
       Khi Văn Hiến xong đăng nhập (session/JWT) thì sửa lại hàm này cho khớp.
       Nếu chưa lưu user_id trong localStorage thì tạm dùng chủ xe số 1 để demo. */
    async function api(path, { method = "GET", body } = {}) {
        const headers = { "X-User-Id": localStorage.getItem("user_id") || "1" };
        if (body && !(body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify(body);
        }
        const res = await fetch("/api/owner" + path, { method, headers, body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Có lỗi xảy ra, vui lòng thử lại.");
        return data;
    }

    async function loadVehicles() { vehicles = await api("/vehicles"); renderVehicles(); }
    async function loadRequests() { requests = await api("/bookings"); renderRequests(); }
    async function loadEarnings() {
        const data = await api("/earnings");
        earnings = data;
        withdrawals = data.withdrawals;
        renderEarnings();
    }

    async function loadAll() {
        try {
            await Promise.all([loadVehicles(), loadRequests(), loadEarnings()]);
        } catch (e) {
            setMsg($("ownFormMsg"), "⚠️ Không tải được dữ liệu: " + e.message, false);
        }
    }

    /* ---------- Hàm tiện ích ---------- */
    const $ = id => document.getElementById(id);
    const pad = n => String(n).padStart(2, "0");
    const money = n => Number(n || 0).toLocaleString("vi-VN") + "đ";

    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    function fmtDate(iso) {
        if (!iso) return "—";
        const [y, m, d] = iso.slice(0, 10).split("-");
        return `${d}/${m}/${y}`;
    }

    function fmtDateTime(iso) {
        const [date, time] = iso.split("T");
        const [, m, d] = date.split("-");
        return `${d}/${m} ${time}`;
    }

    // Chuẩn hóa biển số để so sánh trùng: bỏ khoảng trắng, dấu chấm, gạch ngang
    const normPlate = p => p.toUpperCase().replace(/[\s.\-]/g, "");

    function setMsg(el, text, ok) {
        el.textContent = text || "";
        el.className = "ov-msg" + (text ? (ok ? " ok" : " err") : "");
    }

    /* ==========================================================
       1. FORM ĐĂNG KÝ / SỬA XE
       ========================================================== */
    function readForm() {
        return {
            brand: $("ownBrand").value.trim(),
            model: $("ownModel").value.trim(),
            type: $("ownType").value,
            cc: $("ownCc").value,
            fuel: $("ownFuel").value,
            hourPrice: Number($("ownHourPrice").value),
            dayPrice: Number($("ownDayPrice").value),
            deposit: Number($("ownDeposit").value),
            plate: $("ownPlate").value.trim(),
            availFrom: $("ownAvailFrom").value,
            availTo: $("ownAvailTo").value,
            hasImg: $("ownImg").files.length > 0,
            hasDocs: $("ownDocs").files.length > 0
        };
    }

    function validate(d) {
        if (!d.brand) return "Vui lòng nhập hãng xe.";
        if (!d.model) return "Vui lòng nhập tên mẫu xe & đời xe.";
        if (!d.plate) return "Vui lòng nhập biển số xe.";
        if (!(d.hourPrice > 0)) return "Giá thuê theo giờ phải lớn hơn 0.";
        if (!(d.dayPrice > 0)) return "Giá thuê theo ngày phải lớn hơn 0.";
        if (!(d.deposit >= 0) || $("ownDeposit").value === "") return "Vui lòng nhập tiền đặt cọc (từ 0 trở lên).";
        if (!d.availFrom || !d.availTo) return "Vui lòng chọn khung ngày xe được phép cho thuê.";
        if (d.availTo < d.availFrom) return "Ngày kết thúc không được trước ngày bắt đầu.";

        // Use case 4.11 — luồng phụ: biển số đã có trong hệ thống thì báo lỗi
        const dup = vehicles.find(v => v.id !== editingId && normPlate(v.plate) === normPlate(d.plate));
        if (dup) return `Biển số ${d.plate} đã tồn tại trong hệ thống.`;

        // Yêu cầu chức năng 1.3: phải có ảnh xe + giấy tờ (cà vẹt, đăng kiểm) khi đăng ký mới
        if (!editingId) {
            if (!d.hasImg) return "Vui lòng tải lên ít nhất 1 ảnh xe.";
            if (!d.hasDocs) return "Vui lòng tải lên giấy tờ xe (cà vẹt, đăng kiểm).";
        }
        return null;
    }

    function resetForm() {
        ["ownBrand", "ownModel", "ownHourPrice", "ownDayPrice", "ownDeposit",
            "ownPlate", "ownAvailFrom", "ownAvailTo", "ownImg", "ownDocs"].forEach(id => { $(id).value = ""; });
        $("ownType").selectedIndex = 0;
        $("ownCc").selectedIndex = 0;
        $("ownFuel").selectedIndex = 0;
        editingId = null;
        $("ownFormTitle").textContent = "Đăng ký Ký gửi xe máy của bạn";
        $("btnSubmitConsign").textContent = "Gửi hồ sơ ký gửi xe lên Admin";
        $("btnCancelEdit").classList.add("hidden");
        $("ownFileHint").classList.remove("hidden");
    }

    function startEdit(id) {
        const v = vehicles.find(x => x.id === id);
        if (!v) return;
        editingId = id;
        $("ownBrand").value = v.brand;
        $("ownModel").value = v.model;
        $("ownType").value = v.type;
        $("ownCc").value = v.cc;
        $("ownFuel").value = v.fuel;
        $("ownHourPrice").value = v.hourPrice;
        $("ownDayPrice").value = v.dayPrice;
        $("ownDeposit").value = v.deposit;
        $("ownPlate").value = v.plate;
        $("ownAvailFrom").value = v.availFrom;
        $("ownAvailTo").value = v.availTo;
        $("ownImg").value = "";
        $("ownDocs").value = "";
        $("ownFormTitle").textContent = `Chỉnh sửa xe: ${v.model}`;
        $("btnSubmitConsign").textContent = "Lưu thay đổi";
        $("btnCancelEdit").classList.remove("hidden");
        $("ownFileHint").classList.add("hidden");
        setMsg($("ownFormMsg"), "");
        $("ownFormTitle").scrollIntoView({ behavior: "smooth", block: "center" });
    }

    async function submitVehicle() {
        if (busy) return;
        const d = readForm();
        const err = validate(d);
        if (err) { setMsg($("ownFormMsg"), "⚠️ " + err, false); return; }

        busy = true;
        $("btnSubmitConsign").disabled = true;
        try {
            if (editingId) {
                await api(`/vehicles/${editingId}`, { method: "PUT", body: d });
                resetForm();
                setMsg($("ownFormMsg"), "✅ Đã lưu thay đổi.", true);
            } else {
                // Có upload file nên dùng FormData thay vì JSON
                const fd = new FormData();
                Object.entries(d).forEach(([k, v]) => { if (k !== "hasImg" && k !== "hasDocs") fd.append(k, v); });
                Array.from($("ownImg").files).forEach(f => fd.append("images", f));
                Array.from($("ownDocs").files).forEach(f => fd.append("docs", f));
                await api("/vehicles", { method: "POST", body: fd });
                resetForm();
                setMsg($("ownFormMsg"), "✅ Đã gửi hồ sơ lên Admin. Xe sẽ lên sàn sau khi được duyệt.", true);
            }
            await loadVehicles();
        } catch (e) {
            setMsg($("ownFormMsg"), "⚠️ " + e.message, false);
        } finally {
            busy = false;
            $("btnSubmitConsign").disabled = false;
        }
    }

    /* ==========================================================
       2. DANH SÁCH XE CỦA TÔI
       ========================================================== */
    function approvalBadge(s) {
        if (s === "approved") return '<span class="badge-success">Đã duyệt</span>';
        if (s === "rejected") return '<span class="badge-danger-sm">Bị từ chối</span>';
        return '<span class="badge-info-sm">Chờ Admin duyệt</span>';
    }

    function availabilityBadge(v) {
        if (v.approval !== "approved") return '<span class="muted-label">—</span>';
        if (v.availability === "rented") return '<span class="badge-warn-sm">Đang cho thuê</span>';
        if (v.availability === "locked") return '<span class="badge-grey-sm">Đã khóa lịch</span>';
        return '<span class="badge-success">Đang trống</span>';
    }

    function lockButton(v) {
        if (v.approval !== "approved")
            return '<button class="btn-disabled-sm" disabled>Chờ duyệt</button>';
        if (v.availability === "rented")
            return '<button class="btn-disabled-sm" disabled>Đang có khách</button>';
        if (v.availability === "locked")
            return `<button class="btn-primary-sm" data-action="toggle" data-id="${v.id}">Mở trống</button>`;
        return `<button class="btn-secondary-sm" data-action="toggle" data-id="${v.id}">Khóa lịch</button>`;
    }

    function renderVehicles() {
        const box = $("ownerBikeList");
        if (vehicles.length === 0) {
            box.innerHTML = '<div class="ov-empty">Bạn chưa đăng ký xe nào. Hãy điền form bên trên để ký gửi xe.</div>';
        } else {
            box.innerHTML = vehicles.map(v => `
                <div class="ov-table-row">
                    <div>
                        <strong>${esc(v.model)}</strong>
                        <span class="ov-sub">${esc(v.brand)} • ${esc(v.type)} • ${esc(v.cc)} • ${esc(v.fuel)}</span>
                        <span class="ov-sub">Biển số: ${esc(v.plate)}</span>
                    </div>
                    <div>
                        <strong>${money(v.dayPrice)}/ngày</strong>
                        <span class="ov-sub">${money(v.hourPrice)}/giờ</span>
                        <span class="ov-sub">Cọc: ${money(v.deposit)}</span>
                    </div>
                    <span>${fmtDate(v.availFrom)}<br>→ ${fmtDate(v.availTo)}</span>
                    <span>${approvalBadge(v.approval)}</span>
                    <span>${availabilityBadge(v)}</span>
                    <div class="ov-actions">
                        ${lockButton(v)}
                        <button class="btn-secondary-sm" data-action="edit" data-id="${v.id}">Sửa</button>
                    </div>
                </div>`).join("");
        }
        $("ownVehicleCount").textContent = `(${vehicles.length} xe)`;
        renderRequests(); // tên xe có thể ảnh hưởng bảng yêu cầu
    }

    async function onVehicleAction(e) {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;
        const id = Number(btn.dataset.id);
        if (btn.dataset.action === "edit") { startEdit(id); return; }
        if (btn.dataset.action === "toggle") {
            const v = vehicles.find(x => x.id === id);
            if (!v || v.approval !== "approved" || v.availability === "rented") return;
            try {
                await api(`/vehicles/${id}/availability`, { method: "PATCH" });
            } catch (err) {
                alert("⚠️ " + err.message);
            }
            await loadVehicles().catch(() => { });
        }
    }

    /* ==========================================================
       3. YÊU CẦU ĐẶT XE
       ========================================================== */
    function requestStatusCell(r) {
        if (r.status === "approved") return '<span class="badge-success">Đã chấp nhận</span>';
        if (r.status === "rejected") return '<span class="badge-danger-sm">Đã từ chối</span>';
        if (r.status === "completed") return '<span class="badge-success">Hoàn thành</span>';
        if (r.status !== "pending") return `<span class="badge-grey-sm">${esc(r.status)}</span>`;
        return `<div class="ov-actions">
                    <button class="btn-primary-sm" data-action="accept" data-id="${r.id}">Chấp nhận</button>
                    <button class="btn-danger-sm" data-action="reject" data-id="${r.id}">Từ chối</button>
                </div>`;
    }

    function renderRequests() {
        const box = $("ownerRequestList");
        if (requests.length === 0) {
            box.innerHTML = '<div class="ov-empty">Chưa có yêu cầu đặt xe nào.</div>';
        } else {
            box.innerHTML = requests.map(r => {
                const v = vehicles.find(x => x.id === r.vehicleId);
                return `
                <div class="req-table-row">
                    <strong>#${esc(r.id)}</strong>
                    <span>${v ? esc(v.model) : "—"}</span>
                    <span>${esc(r.renter)}</span>
                    <span>${fmtDateTime(r.start)}<br>→ ${fmtDateTime(r.end)}</span>
                    <strong>${money(r.total)}</strong>
                    <span>${requestStatusCell(r)}</span>
                </div>`;
            }).join("");
        }
        const pending = requests.filter(r => r.status === "pending").length;
        $("ownPendingCount").textContent = pending ? `(${pending} yêu cầu chờ duyệt)` : "";
    }

    async function onRequestAction(e) {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;
        const r = requests.find(x => x.id === btn.dataset.id);
        if (!r || r.status !== "pending") return;
        const v = vehicles.find(x => x.id === r.vehicleId);

        if (btn.dataset.action === "accept") {
            // Kiểm tra nhanh ở FE cho đỡ tốn 1 lượt gọi server (server vẫn kiểm tra lại)
            if (!v || v.approval !== "approved") {
                alert("⚠️ Xe này chưa được Admin duyệt nên không thể nhận đơn.");
                return;
            }
            if (v.availability === "locked") {
                alert("⚠️ Xe đang khóa lịch. Hãy mở trống xe trước khi chấp nhận đơn.");
                return;
            }
            if (!confirm(`Chấp nhận đơn #${r.id} của ${r.renter}?`)) return;
        } else if (btn.dataset.action === "reject") {
            if (!confirm(`Từ chối đơn #${r.id} của ${r.renter}?`)) return;
        } else {
            return;
        }

        try {
            await api(`/bookings/${r.id}/${btn.dataset.action === "accept" ? "approve" : "reject"}`, { method: "POST" });
        } catch (err) {
            alert("⚠️ " + err.message); // ví dụ: trùng lịch với đơn khác
        }
        await loadRequests().catch(() => { });
    }

    /* ==========================================================
       4. DOANH THU & RÚT TIỀN
       ========================================================== */
    function withdrawBadge(status) {
        if (status === "approved") return '<span class="badge-success">Đã duyệt</span>';
        if (status === "rejected") return '<span class="badge-danger-sm">Bị từ chối</span>';
        return '<span class="badge-info-sm">Chờ Admin duyệt</span>';
    }

    function renderEarnings() {
        $("ownTripCount").textContent = `${earnings.completedTrips} chuyến`;
        $("ownNetRevenue").innerHTML = `${Number(earnings.netRevenue).toLocaleString("vi-VN")}<u>đ</u>`;
        $("ownWithdrawable").innerHTML = `${Number(earnings.withdrawable).toLocaleString("vi-VN")}<u>đ</u>`;

        const box = $("ownerWithdrawList");
        box.innerHTML = withdrawals.length === 0
            ? '<div class="ov-empty">Chưa có yêu cầu rút tiền nào.</div>'
            : withdrawals.map(w => `
                <div class="wd-row">
                    <strong>#${esc(w.id)}</strong>
                    <span>${esc(w.bank)}</span>
                    <strong>-${money(w.amount)}</strong>
                    <span>${withdrawBadge(w.status)}</span>
                </div>`).join("");
    }

    async function submitWithdraw() {
        if (busy) return;
        const msg = $("ownWdMsg");
        const amount = Number($("ownWdAmount").value);
        const bank = $("ownWdBank").value.trim();

        if (!(amount > 0)) { setMsg(msg, "⚠️ Vui lòng nhập số tiền cần rút.", false); return; }
        if (!bank) { setMsg(msg, "⚠️ Vui lòng nhập tài khoản ngân hàng nhận tiền.", false); return; }
        if (amount > earnings.withdrawable) {
            setMsg(msg, `⚠️ Số tiền rút vượt quá số dư khả dụng (${money(earnings.withdrawable)}).`, false);
            return;
        }

        busy = true;
        $("btnOwnerWithdraw").disabled = true;
        try {
            await api("/withdrawals", { method: "POST", body: { amount, bankInfo: bank } });
            $("ownWdAmount").value = "";
            setMsg(msg, "✅ Đã gửi yêu cầu rút tiền. Admin sẽ xét duyệt.", true);
            await loadEarnings();
        } catch (e) {
            setMsg(msg, "⚠️ " + e.message, false);
        } finally {
            busy = false;
            $("btnOwnerWithdraw").disabled = false;
        }
    }

    /* ---------- Gắn sự kiện + khởi tạo ---------- */
    $("btnSubmitConsign").addEventListener("click", submitVehicle);
    $("btnCancelEdit").addEventListener("click", () => { resetForm(); setMsg($("ownFormMsg"), ""); });
    $("ownerBikeList").addEventListener("click", onVehicleAction);
    $("ownerRequestList").addEventListener("click", onRequestAction);
    $("btnOwnerWithdraw").addEventListener("click", submitWithdraw);

    loadAll();
})();
