// Clean, Cozy & Minimalist Barbershop Scheduler Hub - Core Workspace Dashboard Page Logic
const DEFAULT_SERVICES = [
    { id: 1, nameFa: "اصلاح مو (کلاسیک)", price: 150000, durationMin: 45 },
    { id: 2, nameFa: "اصلاح ریش و خط دور", price: 80000, durationMin: 30 },
    { id: 3, nameFa: "پکیج داماد / VIP", price: 500000, durationMin: 120 },
    { id: 4, nameFa: "پاکسازی پوست و اسکراب", price: 120000, durationMin: 40 },
    { id: 5, nameFa: "رنگ مو / دکلره", price: 250000, durationMin: 90 },
];

const OPERATING_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
    "19:00", "19:30", "20:00", "20:30", "21:00"
];

let currentBarber = null;
let services = [];
let appointments = [];
let selectedDate = new Date().toISOString().split("T")[0];

function normalizeService(s) {
    if (!s) return null;
    return {
        id: s.id !== undefined ? String(s.id) : String(s.Id),
        barberId: s.barberId !== undefined ? s.barberId : s.BarberId,
        nameFa: s.nameFa !== undefined ? s.nameFa : s.NameFa,
        price: s.price !== undefined ? Number(s.price) : Number(s.Price),
        durationMin: s.durationMin !== undefined ? Number(s.durationMin) : Number(s.DurationMin)
    };
}

function normalizeAppointment(a) {
    if (!a) return null;
    let rawDate = a.date !== undefined ? a.date : a.Date;
    let cleanDate = rawDate ? rawDate.split(/[T ]/)[0].trim() : "";
    return {
        id: a.id !== undefined ? String(a.id) : String(a.Id),
        barberId: a.barberId !== undefined ? a.barberId : a.BarberId,
        clientName: a.clientName !== undefined ? a.clientName : a.ClientName,
        clientPhone: a.clientPhone !== undefined ? a.clientPhone : a.ClientPhone,
        date: cleanDate,
        timeSlot: a.timeSlot !== undefined ? a.timeSlot : a.TimeSlot,
        serviceId: a.serviceId !== undefined ? String(a.serviceId) : String(a.ServiceId),
        notes: a.notes !== undefined ? a.notes : a.Notes
    };
}

// Global Toast System
function showToast(message, type = "success") {
    const alertBox = document.getElementById("alert-box");
    const alertText = document.getElementById("alert-text");
    if (!alertBox || !alertText) return;
    alertText.textContent = message;
    alertBox.style.borderColor = type === "error" ? "var(--red-color)" : "var(--border-color)";
    alertBox.style.color = type === "error" ? "var(--red-color)" : "var(--accent-color)";
    alertBox.style.background = type === "error" ? "var(--red-bg)" : "var(--accent-light)";
    alertBox.classList.remove("alert-hidden");
    setTimeout(() => alertBox.classList.add("alert-hidden"), 4000);
}

// Check Session on Boot
document.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem("current_barber_session");
    if (!saved) {
        window.location.href = "index.html";
        return;
    }
    currentBarber = JSON.parse(saved);

    document.getElementById("active-barber-label").textContent = `${currentBarber.fullName} (${currentBarber.salonName || "سالن شخصی"})`;
    document.getElementById("current-live-date").textContent = new Date().toLocaleDateString("fa-IR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    document.getElementById("btn-auth-logout")?.addEventListener("click", handleLogout);
    document.getElementById("appointment-form")?.addEventListener("submit", handleBook);

    const picker = document.getElementById("custom-date-picker");
    if (picker) {
        picker.value = selectedDate;
        picker.addEventListener("change", (e) => {
            selectedDate = e.target.value;
            generateDays();
            fetchFreshData();
        });
    }

    generateDays();
    fetchFreshData();
});

function handleLogout() {
    localStorage.removeItem("current_barber_session");
    currentBarber = null;
    window.location.href = "index.html";
}

function generateDays() {
    const swiper = document.getElementById("date-swiper-wrapper");
    if (!swiper) return;
    swiper.innerHTML = "";

    const picker = document.getElementById("custom-date-picker");
    if (picker && picker.value !== selectedDate) {
        picker.value = selectedDate;
    }

    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];

        let label = d.toLocaleDateString("fa-IR", { weekday: "long" });
        if (i === 0) label = "امروز";
        if (i === 1) label = "فردا";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `date-btn ${dateStr === selectedDate ? 'active' : ''}`;
        btn.onclick = () => {
            selectedDate = dateStr;
            if (picker) picker.value = selectedDate;
            document.querySelectorAll(".date-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            fetchFreshData();
        };
        btn.innerHTML = `<div class="day-name">${label}</div><div class="day-number">${d.getDate()}</div>`;
        swiper.appendChild(btn);
    }
}

async function fetchFreshData() {
    try {
        const svcRes = await fetch(`/api/appointments/services?barberId=${currentBarber.id}`);
        if (svcRes.ok) {
            const raw = await svcRes.json();
            services = (raw || []).map(normalizeService);
        }
    } catch (e) {
        services = DEFAULT_SERVICES.map(s => normalizeService({ ...s, barberId: currentBarber.id }));
    }

    try {
        const apptsRes = await fetch(`/api/appointments?barberId=${currentBarber.id}&date=${selectedDate}`);
        if (apptsRes.ok) {
            const raw = await apptsRes.json();
            appointments = (raw || []).map(normalizeAppointment);
        }
    } catch (e) {
        appointments = [];
    }

    renderUI();
}

function renderUI() {
    // 1. Selector for Services
    const serviceSelect = document.getElementById("service-id");
    if (serviceSelect) {
        serviceSelect.innerHTML = `<option value="">-- انتخاب سرویس --</option>`;
        services.forEach(s => {
            serviceSelect.innerHTML += `<option value="${s.id}">${s.nameFa} — ${s.price.toLocaleString()} تومان</option>`;
        });
    }

    // 2. Sidebar Services List
    const serviceList = document.getElementById("services-list-sidebar");
    if (serviceList) {
        serviceList.innerHTML = "";
        services.forEach(s => {
            serviceList.innerHTML += `
               <div class="service-compact-row">
                   <div class="service-compact-details">
                       <span class="service-compact-name">${s.nameFa}</span>
                       <span class="service-compact-price">${s.price.toLocaleString()} تومان (${s.durationMin} د)</span>
                   </div>
                   <div class="service-compact-actions">
                       <button class="btn-service-mini" onclick="editServiceInline('${s.id}', '${s.nameFa}', ${s.price}, ${s.durationMin})">✏️</button>
                       <button class="btn-service-mini delete" onclick="deleteServiceInline('${s.id}')">❌</button>
                   </div>
               </div>
            `;
        });
    }

    // 3. Render Timeline and update stat calculations
    const container = document.getElementById("timeline-slots-container");
    const formSlots = document.getElementById("time-slot");
    document.getElementById("selected-date-badge").textContent = selectedDate === new Date().toISOString().split("T")[0] ? "امروز" : selectedDate;

    if (container) {
        container.innerHTML = "";
        if (formSlots) formSlots.innerHTML = `<option value="">-- یک ساعت آزاد انتخاب کنید --</option>`;

        let bookedCount = 0;
        let income = 0;

        OPERATING_SLOTS.forEach(slot => {
            const app = appointments.find(a => a.timeSlot === slot);
            if (app) {
                bookedCount++;
                const serviceInfo = services.find(s => s.id === app.serviceId) || { nameFa: "خدمات", price: 0 };
                income += serviceInfo.price;

                container.innerHTML += `
                    <div class="time-slot-row">
                        <div class="slot-time-box">
                            <span class="slot-clock-text">${slot}</span>
                            <span class="slot-status-occupied">رزرو شده</span>
                        </div>
                        <div class="slot-client-info">
                            <span class="slot-client-name">${app.clientName}</span>
                            <span class="slot-client-phone font-mono text-left">${app.clientPhone}</span>
                            <span class="slot-service-tag">${serviceInfo.nameFa}</span>
                        </div>
                        <button class="btn-slot-cancel" onclick="cancelAppointment('${app.id}')">لغو نوبت</button>
                    </div>
                `;
            } else {
                if (formSlots) formSlots.innerHTML += `<option value="${slot}">${slot}</option>`;
                container.innerHTML += `
                    <div class="time-slot-row">
                        <div class="slot-time-box">
                            <span class="slot-clock-text">${slot}</span>
                            <span class="slot-status-free">آزاد</span>
                        </div>
                        <button class="slot-btn-reserve" onclick="selectTimeSlot('${slot}')">رزرو این ساعت</button>
                    </div>
                `;
            }
        });

        document.getElementById("stat-total-count").innerHTML = `${bookedCount} <span class="stat-unit">نوبت</span>`;
        document.getElementById("stat-total-income").innerHTML = `${income.toLocaleString()} <span class="stat-unit">تومان</span>`;
        document.getElementById("stat-free-slots").innerHTML = `${OPERATING_SLOTS.length - bookedCount} <span class="stat-unit">ساعت آزاد</span>`;
    }
}

window.selectTimeSlot = function (slot) {
    const picker = document.getElementById("time-slot");
    if (picker) {
        picker.value = slot;
        picker.scrollIntoView({ behavior: "smooth" });
    }
};

async function handleBook(e) {
    e.preventDefault();
    const serviceIdVal = document.getElementById("service-id").value;
    const payload = {
        barberId: currentBarber.id,
        clientName: document.getElementById("client-name").value.trim(),
        clientPhone: document.getElementById("client-phone").value.trim(),
        date: selectedDate + "T00:00:00",
        timeSlot: document.getElementById("time-slot").value,
        serviceId: isNaN(serviceIdVal) ? serviceIdVal : parseInt(serviceIdVal, 10),
        notes: document.getElementById("notes").value.trim()
    };

    try {
        const res = await fetch("/api/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || "خطا در ثبت نوبت");
        }
        showToast("نوبت با موفقیت در دیتابیس ثبت شد.");
        document.getElementById("client-name").value = "";
        document.getElementById("client-phone").value = "";
        document.getElementById("notes").value = "";
        fetchFreshData();
    } catch (err) {
        showToast(err.message, "error");
    }
}

window.cancelAppointment = async function (id) {
    if (!confirm("آیا از لغو این نوبت اطمینان دارید؟")) return;
    try {
        const res = await fetch(`/api/appointments/${id}?barberId=${currentBarber.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("ثبت نوبت لغو نشد");
        showToast("نوبت مراجع با موفقیت لغو شد.");
        fetchFreshData();
    } catch (err) {
        showToast(err.message, "error");
    }
};

window.toggleAddServiceForm = function () {
    const f = document.getElementById("service-management-form-container");
    if (f) {
        f.classList.remove("hidden");
        document.getElementById("service-form-title").textContent = "افزودن خدمت جدید";
        document.getElementById("mgmt-service-id").value = "";
        document.getElementById("mgmt-service-name").value = "";
        document.getElementById("mgmt-service-price").value = "";
        document.getElementById("mgmt-service-duration").value = "";
    }
};

window.cancelServiceForm = function () {
    document.getElementById("service-management-form-container")?.classList.add("hidden");
};

window.editServiceInline = function (id, name, price, duration) {
    const f = document.getElementById("service-management-form-container");
    if (f) {
        f.classList.remove("hidden");
        document.getElementById("service-form-title").textContent = "ویرایش خدمت";
        document.getElementById("mgmt-service-id").value = id;
        document.getElementById("mgmt-service-name").value = name;
        document.getElementById("mgmt-service-price").value = price;
        document.getElementById("mgmt-service-duration").value = duration;
    }
};

window.saveCustomService = async function () {
    const sId = document.getElementById("mgmt-service-id").value;
    const name = document.getElementById("mgmt-service-name").value.trim();
    const priceStr = document.getElementById("mgmt-service-price").value;
    const durationStr = document.getElementById("mgmt-service-duration").value;

    if (!name || !priceStr || !durationStr) {
        showToast("لطفاً همه‌ی فیلدهای خدمت را دقیق پر کنید", "error");
        return;
    }

    const payload = {
        id: sId && !isNaN(sId) ? parseInt(sId, 10) : 0,
        barberId: currentBarber.id,
        nameFa: name,
        nameEn: name,
        price: Number(priceStr),
        durationMin: Number(durationStr)
    };

    try {
        let resUrl = "/api/appointments/services";
        let method = "POST";
        if (sId) {
            resUrl += `/${sId}`;
            method = "PUT";
        }

        const response = await fetch(resUrl, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || "ارتباط با سرور برقرار نشد");
        }

        showToast("تغییرات با موفقیت ذخیره گردید.");
        cancelServiceForm();
        fetchFreshData();
    } catch (err) {
        showToast(err.message, "error");
    }
};

window.deleteServiceInline = async function (serviceId) {
    if (!confirm("آیا مایل به حذف این خدمت هستید؟")) return;
    try {
        const response = await fetch(`/api/appointments/services/${serviceId}?barberId=${currentBarber.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("حذف انجام نشد");
        showToast("خدمت با موفقیت حذف شد.");
        fetchFreshData();
    } catch (err) {
        showToast(err.message, "error");
    }
};
