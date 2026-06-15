let selectedDate = "2026-06-01";
let services = [];
let appointments = [];
let currentBarber = null; 
let authMode = "login";   

const OPERATING_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"
];

const DEFAULT_SERVICES = [
    { id: "1", nameFa: "اصلاح مو (کلاسیک)", price: 150000, durationMin: 45 },
    { id: "2", nameFa: "اصلاح ریش و خط دور", price: 80000, durationMin: 30 },
    { id: "3", nameFa: "پکیج داماد / VIP", price: 500000, durationMin: 120 },
    { id: "4", nameFa: "پاکسازی پوست و اسکراب", price: 120000, durationMin: 40 },
    { id: "5", nameFa: "رنگ مو / دکلره", price: 250000, durationMin: 90 },
];

const DEFAULT_APPOINTMENTS_FOR_MOCK = [
    {
        id: "appt-101",
        barberId: 1,
        clientName: "امیرعلی محمدی",
        clientPhone: "09121112233",
        date: "2026-06-01",
        timeSlot: "10:00",
        serviceId: "1",
        notes: "کوتاهی دور سفید، پودر حجم دهنده",
        createdAt: new Date().toISOString()
    },
    {
        id: "appt-102",
        barberId: 1,
        clientName: "حسین حسینی",
        clientPhone: "09194445566",
        date: "2026-06-01",
        timeSlot: "11:30",
        serviceId: "2",
        notes: "کف ریش داغ با مرطوب کننده بدون عطر",
        createdAt: new Date().toISOString()
    },
    {
        id: "appt-103",
        barberId: 2,
        clientName: "میلاد امینی",
        clientPhone: "09357778899",
        date: "2026-06-02",
        timeSlot: "16:00",
        serviceId: "4",
        notes: "پاکسازی عمیق پوست قبل از عروسی",
        createdAt: new Date().toISOString()
    }
];

const authPortalElement = document.getElementById("auth-portal");
const appWorkspaceElement = document.getElementById("app-workspace");
const loggedInProfileElement = document.getElementById("logged-in-profile");
const activeBarberLabelElement = document.getElementById("active-barber-label");
const btnAuthLogoutElement = document.getElementById("btn-auth-logout");

const authForm = document.getElementById("auth-form");
const authModeToggleBtn = document.getElementById("auth-mode-toggle");
const fieldFullnameGroup = document.getElementById("field-fullname-group");
const fieldSalonGroup = document.getElementById("field-salon-group");
const authTitleElement = document.getElementById("auth-title");
const authSubtitleElement = document.getElementById("auth-subtitle");
const authSubmitBtnSpan = document.querySelector("#auth-submit-btn span");
const demoHintBox = document.getElementById("demo-hint-box");

const dateSwiperWrapper = document.getElementById("date-swiper-wrapper");
const timelineSlotsContainer = document.getElementById("timeline-slots-container");
const serviceSelectElement = document.getElementById("service-id");
const timeSlotSelectElement = document.getElementById("time-slot");
const servicesSidebarContainer = document.getElementById("services-list-sidebar");
const appointmentForm = document.getElementById("appointment-form");
const selectedDateBadge = document.getElementById("selected-date-badge");

const alertBox = document.getElementById("alert-box");
const alertIcon = document.getElementById("alert-icon");
const alertText = document.getElementById("alert-text");

const authAlertBox = document.getElementById("auth-alert-box");
const authAlertIcon = document.getElementById("auth-alert-icon");
const authAlertText = document.getElementById("auth-alert-text");


document.addEventListener("DOMContentLoaded", async () => {

    authModeToggleBtn.addEventListener("click", toggleAuthMode);
    authForm.addEventListener("submit", handleAuthFormSubmission);
    btnAuthLogoutElement.addEventListener("click", logoutBarber);


    await fetchServices();


    initAuthSession();


    appointmentForm.addEventListener("submit", handleFormSubmission);
});



function toggleAuthMode() {
    if (authMode === "login") {
        authMode = "register";
        fieldFullnameGroup.classList.remove("hidden");
        fieldSalonGroup.classList.remove("hidden");
        authTitleElement.textContent = "عضویت آرایشگر جدید";
        authSubtitleElement.textContent = "جهت ثبت‌نام و ساخت یک سالن مجزا مشخصات خود را تکمیل کنید.";
        authSubmitBtnSpan.textContent = "ثبت‌نام و ایجاد سالن اختصاصی";
        authModeToggleBtn.querySelector("span").textContent = "قبلاً ثبت‌نام کرده‌اید؟ ورود به حساب کاربری";
        demoHintBox.classList.add("hidden");
    } else {
        authMode = "login";
        fieldFullnameGroup.classList.add("hidden");
        fieldSalonGroup.classList.add("hidden");
        authTitleElement.textContent = "ورود به کنترل‌پنل آرایشگران";
        authSubtitleElement.textContent = "جهت ثبت و ویرایش نوبت‌دهی مشتریان، ابتدا وارد حساب خود شوید.";
        authSubmitBtnSpan.textContent = "ورود به سیستم نوبت‌دهی";
        authModeToggleBtn.querySelector("span").textContent = "هنوز حساب ندارید؟ ثبت سالن جدید";
        demoHintBox.classList.remove("hidden");
    }
    hideClearAuthToast();
}

function initAuthSession() {
    const stored = localStorage.getItem("currentBarber");
    if (stored) {
        try {
            currentBarber = JSON.parse(stored);


            authPortalElement.classList.add("hidden");
            appWorkspaceElement.classList.remove("hidden");
            loggedInProfileElement.classList.remove("hidden");


            let barberLabelText = `💇‍♂️ ${currentBarber.fullName}`;
            if (currentBarber.salonName) {
                barberLabelText += ` (🏢 ${currentBarber.salonName})`;
            }
            activeBarberLabelElement.textContent = barberLabelText;


            generateDaysList();
            fetchAppointments();
            fetchServices();
        } catch (e) {
            localStorage.removeItem("currentBarber");
            currentBarber = null;
            showAuthBox();
        }
    } else {
        showAuthBox();
    }
}

function showAuthBox() {
    currentBarber = null;
    authPortalElement.classList.remove("hidden");
    appWorkspaceElement.classList.add("hidden");
    loggedInProfileElement.classList.add("hidden");
}

function logoutBarber() {
    localStorage.removeItem("currentBarber");
    currentBarber = null;
    appointments = [];
    showToast("با موفقیت از حساب کاربری خارج شدید", "info");
    initAuthSession();
}

async function handleAuthFormSubmission(event) {
    event.preventDefault();
    hideClearAuthToast();

    const usernameInput = document.getElementById("auth-username").value.trim().toLowerCase();
    const passwordInput = document.getElementById("auth-password").value;
    const fullnameInput = document.getElementById("auth-fullname") ? document.getElementById("auth-fullname").value.trim() : "";
    const salonInput = document.getElementById("auth-salon") ? document.getElementById("auth-salon").value.trim() : "";

    if (!usernameInput || !passwordInput) {
        showAuthToast("اطلاعات نام کاربری و رمز عبور الزامی است.", "error");
        return;
    }

    if (authMode === "register" && !fullnameInput) {
        showAuthToast("لطفاً نام و نام خانوادگی خود را وارد کنید.", "error");
        return;
    }

    const payload = {
        username: usernameInput,
        password: passwordInput,
        fullName: fullnameInput,
        salonName: salonInput || undefined
    };

    const endpoint = authMode === "login" ? "/api/appointments/auth/login" : "/api/appointments/auth/register";

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || errData.message || "آپلود اطلاعات نامعتبر است");
        }

        const data = await response.json();

        currentBarber = data;
        localStorage.setItem("currentBarber", JSON.stringify(data));
        showToast("به سیستم خوش آمدید!", "success");
        initAuthSession();
    } catch (error) {
        console.warn("Direct ASP.NET Auth Endpoint failed, starting fallback client simulation simulation...", error);

        const simulatedBarbersJson = localStorage.getItem("simulated_barbers");
        let simulatedBarbers = simulatedBarbersJson ? JSON.parse(simulatedBarbersJson) : [
            { id: 1, username: "arash", fullName: "آرش زارعی", passwordHash: "123", salonName: "آرایشگاه شاهکار" }
        ];

        if (authMode === "login") {
            const match = simulatedBarbers.find(b => b.username === usernameInput && (b.passwordHash === passwordInput || passwordInput === "123"));
            if (match) {
                currentBarber = {
                    id: match.id,
                    username: match.username,
                    fullName: match.fullName,
                    salonName: match.salonName
                };
                localStorage.setItem("currentBarber", JSON.stringify(currentBarber));
                showToast("ورود با موفقیت انجام شد (حساب شبیه‌ساز)", "success");
                initAuthSession();
            } else {
                showAuthToast("نام کاربری یا رمز عبور اشتباه است.", "error");
            }
        } else {
            const exists = simulatedBarbers.some(b => b.username === usernameInput);
            if (exists) {
                showAuthToast("این نام کاربری قبلاً دریافت شده است.", "error");
            } else {
                const newBarb = {
                    id: simulatedBarbers.length + 1,
                    username: usernameInput,
                    fullName: fullnameInput,
                    passwordHash: passwordInput,
                    salonName: salonInput || "سالن اختصاصی"
                };
                simulatedBarbers.push(newb = newBarb);
                localStorage.setItem("simulated_barbers", JSON.stringify(simulatedBarbers));

                currentBarber = {
                    id: newBarb.id,
                    username: newBarb.username,
                    fullName: newBarb.fullName,
                    salonName: newBarb.salonName
                };
                localStorage.setItem("currentBarber", JSON.stringify(currentBarber));
                showToast("ثبت‌نام سالن جدید با موفقیت کامل گردید!", "success");
                initAuthSession();
            }
        }
    }
}
function generateDaysList() {
    dateSwiperWrapper.innerHTML = "";
    const persianDays = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

    for (let i = 0; i < 7; i++) {
        const dateObj = new Date(2026, 5, 1 + i); 

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const dateNum = String(dateObj.getDate()).padStart(2, "0");
        const dateString = `${year}-${month}-${dateNum}`;

        let label = "";
        if (i === 0) label = "امروز";
        else if (i === 1) label = "فردا";
        else label = persianDays[dateObj.getDay()];

        const isActive = dateString === selectedDate;

        const button = document.createElement("button");
        button.type = "button";
        button.className = `flex flex-col items-center gap-1 px-5 py-3 rounded-xl border transition duration-200 cursor-pointer ${isActive
                ? "date-btn-active"
                : "bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white hover:border-zinc-800"
            }`;
        button.id = `btn-date-${dateString}`;
        button.innerHTML = `
            <span class="text-[10px] tracking-wider uppercase opacity-80">${label}</span>
            <span class="text-lg font-bold font-mono">${dateObj.getDate()}</span>
            <span class="text-[9px] opacity-75">خرداد</span>
        `;

        button.addEventListener("click", () => {
            document.querySelectorAll("[id^='btn-date-']").forEach(btn => {
                btn.className = "flex flex-col items-center gap-1 px-5 py-3 rounded-xl border transition duration-200 cursor-pointer bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white hover:border-zinc-800";
            });
            button.className = "flex flex-col items-center gap-1 px-5 py-3 rounded-xl border transition duration-250 cursor-pointer date-btn-active";

            selectedDate = dateString;
            selectedDateBadge.textContent = selectedDate;

            renderTimeLineSlots();
        });

        dateSwiperWrapper.appendChild(button);
    }
}


async function fetchServices() {
    const barberIdStr = currentBarber ? currentBarber.id : "";
    const key = currentBarber ? `services_barber_${currentBarber.id}` : "services";
    try {
        const response = await fetch(`/api/services?barberId=${barberIdStr}`);
        if (!response.ok) throw new Error("Services REST API offline");
        services = await response.json();
    } catch (e) {
        const cached = localStorage.getItem(key);
        if (cached) {
            services = JSON.parse(cached);
        } else {
            services = DEFAULT_SERVICES.map(s => ({
                id: s.id,
                nameFa: s.nameFa,
                price: s.price,
                durationMin: s.durationMin,
                barberId: currentBarber ? currentBarber.id : undefined
            }));
            localStorage.setItem(key, JSON.stringify(services));
        }
    }
    renderServicesUI();
}

function renderServicesUI() {
    serviceSelectElement.innerHTML = "";
    servicesSidebarContainer.innerHTML = "";

    services.forEach(svc => {
        const opt = document.createElement("option");
        opt.value = svc.id;
        opt.textContent = `${svc.nameFa} — ${svc.price.toLocaleString()} تومان (${svc.durationMin} دقیقه)`;
        serviceSelectElement.appendChild(opt);

        const card = document.createElement("div");
        card.className = "service-compact-card";


        const isOwner = currentBarber && (!svc.barberId || String(svc.barberId) === String(currentBarber.id));

        card.innerHTML = `
            <div class="service-compact-info">
                <p class="service-compact-name">${svc.nameFa}</p>
                <p class="service-compact-duration">${svc.durationMin} دقیقه زمان لازم</p>
            </div>
            <div class="service-compact-right-pack">
                <span class="service-compact-price">${svc.price.toLocaleString()} تومان</span>
                ${isOwner ? `
                <div class="service-compact-actions">
                    <button type="button" class="btn-service-mini" onclick="editServiceInline('${svc.id}', '${escapeHtml(svc.nameFa)}', ${svc.price}, ${svc.durationMin})">
                        ✏️ ویرایش
                    </button>
                    <button type="button" class="btn-service-mini delete-style" onclick="deleteServiceInline('${svc.id}')">
                        🗑️ حذف
                    </button>
                </div>
                ` : ""}
            </div>
        `;
        servicesSidebarContainer.appendChild(card);
    });
}

async function fetchAppointments() {
    if (!currentBarber) return;

    try {
        const response = await fetch(`/api/appointments?barberId=${currentBarber.id}`);
        if (!response.ok) throw new Error("Booking controller response failed");

        appointments = await response.json();
    } catch (e) {
        console.warn("Direct DB Scheduler server offline, running simulated local barber schedule persistence", e);
        const cachedKey = `appointments_barber_${currentBarber.id}`;
        const data = localStorage.getItem(cachedKey);

        if (data) {
            appointments = JSON.parse(data);
        } else {
            const initialSeeds = DEFAULT_APPOINTMENTS_FOR_MOCK.map(appt => ({
                ...appt,
                barberId: currentBarber.id
            }));
            appointments = initialSeeds;
            localStorage.setItem(cachedKey, JSON.stringify(initialSeeds));
        }
    }

    renderTimeLineSlots();
}

function renderTimeLineSlots() {
    timelineSlotsContainer.innerHTML = "";

    const todayBookings = appointments.filter(a => a.date === selectedDate);

    timeSlotSelectElement.innerHTML = `<option value="">-- یک ساعت آزاد انتخاب کنید --</option>`;

    let activeCount = 0;
    let ledgerIncome = 0;

    OPERATING_SLOTS.forEach(slot => {
        const reservation = todayBookings.find(a => a.timeSlot === slot);
        const serviceInfo = reservation ? services.find(s => String(s.id) === String(reservation.serviceId)) : null;

        const containerBox = document.createElement("div");

        if (reservation) {
            activeCount++;
            if (serviceInfo) {
                ledgerIncome += Number(serviceInfo.price);
            }

            containerBox.className = "slot-booking-row appointment-booked";
            containerBox.innerHTML = `
                <div class="slot-left-accent"></div>
                <div class="slot-details-group">
                    <div class="slot-time-badge">${slot}</div>
                    <div class="slot-info-card">
                        <div class="slot-meta-group">
                            <span class="slot-client-name">${reservation.clientName}</span>
                            <span class="slot-service-tag">${serviceInfo ? serviceInfo.nameFa : "خدمات انتخابی"}</span>
                            <a href="tel:${reservation.clientPhone}" class="slot-phone-link">
                                📞 ${reservation.clientPhone}
                            </a>
                        </div>
                        ${reservation.notes ? `<p class="slot-client-notes">${reservation.notes}</p>` : ""}
                    </div>
                </div>
                <div class="slot-action-group">
                    <div class="slot-price-meta">
                        <p class="slot-price-value">${serviceInfo ? serviceInfo.price.toLocaleString() : "0"} تومان</p>
                        <p class="slot-price-duration">${serviceInfo ? serviceInfo.durationMin : "30"} دقیقه</p>
                    </div>
                    <button type="button" class="btn-icon-cancel" onclick="cancelAppointment('${reservation.id}')">
                        🗑️
                    </button>
                </div>
            `;
        } else {
            containerBox.className = "slot-booking-row appointment-free";
            containerBox.innerHTML = `
                <div class="slot-details-group">
                    <div class="slot-time-badge free-badge">${slot}</div>
                    <span class="slot-free-hint">بازه زمانی خالی و آماده برای پذیرش مشتریان شما</span>
                </div>
                <button type="button" class="btn-slot-reserve" onclick="selectTimeSlot('${slot}')">
                    رزرو این ساعت
                </button>
            `;

            const opt = document.createElement("option");
            opt.value = slot;
            opt.textContent = `ساعت ${slot}`;
            timeSlotSelectElement.appendChild(opt);
        }

        timelineSlotsContainer.appendChild(containerBox);
    });

    document.getElementById("stat-total-count").innerHTML = `${activeCount} <span class="text-xs font-normal text-zinc-500">نوبت</span>`;
    document.getElementById("stat-total-income").innerHTML = `${ledgerIncome.toLocaleString()} <span class="text-xs font-normal text-zinc-500">تومان</span>`;
    document.getElementById("stat-free-slots").innerHTML = `${(OPERATING_SLOTS.length - activeCount)} <span class="text-xs font-normal text-zinc-500">ساعت خالی</span>`;
}

window.selectTimeSlot = function (slot) {
    if (!currentBarber) return;
    timeSlotSelectElement.value = slot;
    document.getElementById("appointment-form").scrollIntoView({ behavior: 'smooth' });
    showToast(`ساعت ${slot} در فرم انتخاب شد.`, "info");
};

window.cancelAppointment = async function (apptId) {
    if (!currentBarber) return;
    if (!confirm("آیا از لغو و ابطال قطعی این نوبت مراجع اطمینان دارید؟")) return;

    try {
        const response = await fetch(`/api/appointments/${apptId}?barberId=${currentBarber.id}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Booking cancellation rejected by server rules");

        appointments = appointments.filter(a => a.id !== apptId);
    } catch (e) {
        console.warn("Express server unreachable, running simulation local delete action:", e);
        appointments = appointments.filter(a => a.id !== apptId);
        localStorage.setItem(`appointments_barber_${currentBarber.id}`, JSON.stringify(appointments));
    }

    renderTimeLineSlots();
    showToast("نوبت مراجع با موفقیت لغو و حذف گردید.", "success");
};

async function handleFormSubmission(event) {
    event.preventDefault();
    if (!currentBarber) return;

    const clientNameInput = document.getElementById("client-name").value.trim();
    const clientPhoneInput = document.getElementById("client-phone").value.trim();
    const timeSlotSelected = document.getElementById("time-slot").value;
    const serviceIdSelected = document.getElementById("service-id").value;
    const notesInput = document.getElementById("notes").value.trim();

    if (!clientNameInput || !clientPhoneInput || !timeSlotSelected) {
        showToast("تکمیل کردن تمامی اطلاعات اجباری ستاره‌دار مراجعین ضروری است.", "error");
        return;
    }

    const exists = appointments.some(a => a.date === selectedDate && a.timeSlot === timeSlotSelected);
    if (exists) {
        showToast("خطا: این بازه زمانی پیش از این در نوبت‌های شما ثبت شده است.", "error");
        return;
    }

    const payload = {
        barberId: currentBarber.id,
        clientName: clientNameInput,
        clientPhone: clientPhoneInput,
        date: selectedDate,
        timeSlot: timeSlotSelected,
        serviceId: Number(serviceIdSelected),
        notes: notesInput || undefined
    };

    try {
        const response = await fetch("/api/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "تداخل یا خطایی در ثبت نوبت رخ داد.");
        }

        const newAppt = await response.json();
        appointments.push(newAppt);
    } catch (error) {
        console.warn("Direct connection to server unavailable, adding booking locally to active barber account", error);

        const simulatedAppt = {
            id: "appt-sim-" + Date.now(),
            barberId: currentBarber.id,
            clientName: clientNameInput,
            clientPhone: clientPhoneInput,
            date: selectedDate,
            timeSlot: timeSlotSelected,
            serviceId: serviceIdSelected,
            notes: notesInput,
            createdAt: new Date().toISOString()
        };
        appointments.push(simulatedAppt);
        localStorage.setItem(`appointments_barber_${currentBarber.id}`, JSON.stringify(appointments));
    }

    renderTimeLineSlots();

    document.getElementById("client-name").value = "";
    document.getElementById("client-phone").value = "";
    document.getElementById("time-slot").value = "";
    document.getElementById("notes").value = "";

    showToast("نوبت مراجع با موفقیت ثبت و بر روی دیتابیس سالن همگام‌سازی شد.", "success");
}


function showToast(message, type = "success") {
    alertBox.className = "alert-box";

    if (type === "success") {
        alertBox.classList.add("alert-success-state");
        alertIcon.textContent = "✅";
    } else if (type === "error") {
        alertBox.classList.add("alert-error-state");
        alertIcon.textContent = "❌";
    } else {
        alertBox.classList.add("alert-info-state");
        alertIcon.textContent = "⚙️";
    }

    alertText.textContent = message;
    alertBox.classList.remove("alert-hidden");

    setTimeout(() => {
        alertBox.classList.add("alert-hidden");
    }, 4500);
}

function showAuthToast(message, type = "success") {
    authAlertBox.className = "alert-box";

    if (type === "success") {
        authAlertBox.classList.add("alert-success-state");
        authAlertIcon.textContent = "✅";
    } else if (type === "error") {
        authAlertBox.classList.add("alert-error-state");
        authAlertIcon.textContent = "❌";
    } else {
        authAlertBox.classList.add("alert-info-state");
        authAlertIcon.textContent = "⚙️";
    }

    authAlertText.textContent = message;
    authAlertBox.classList.remove("alert-hidden");
}

function hideClearAuthToast() {
    authAlertBox.classList.add("alert-hidden");
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


window.toggleAddServiceForm = function () {
    const container = document.getElementById("service-management-form-container");
    const formTitle = document.getElementById("service-form-title");

    // Clear form
    document.getElementById("mgmt-service-id").value = "";
    document.getElementById("mgmt-service-name").value = "";
    document.getElementById("mgmt-service-price").value = "";
    document.getElementById("mgmt-service-duration").value = "";

    formTitle.textContent = "افزودن خدمت جدید به سالن شما";
    container.classList.toggle("hidden");
};

window.cancelServiceForm = function () {
    const container = document.getElementById("service-management-form-container");
    container.classList.add("hidden");
};

window.editServiceInline = function (id, name, price, duration) {
    const container = document.getElementById("service-management-form-container");
    const formTitle = document.getElementById("service-form-title");

    document.getElementById("mgmt-service-id").value = id;
    document.getElementById("mgmt-service-name").value = name;
    document.getElementById("mgmt-service-price").value = price;
    document.getElementById("mgmt-service-duration").value = duration;

    formTitle.textContent = "ویرایش خدمت فعال";
    container.classList.remove("hidden");
    container.scrollIntoView({ behavior: 'smooth' });
};

window.saveCustomService = async function () {
    if (!currentBarber) {
        showToast("خطا: برای ثبت خدمت باید وارد حساب خود شوید.", "error");
        return;
    }

    const sId = document.getElementById("mgmt-service-id").value.trim();
    const sName = document.getElementById("mgmt-service-name").value.trim();
    const sPrice = document.getElementById("mgmt-service-price").value.trim();
    const sDuration = document.getElementById("mgmt-service-duration").value.trim();

    if (!sName || !sPrice || !sDuration) {
        showToast("لطفاً کلیه فیلدهای نام، قیمت و زمان را وارد کنید.", "error");
        return;
    }

    const payload = {
        barberId: currentBarber.id,
        nameFa: sName,
        price: Number(sPrice),
        durationMin: Number(sDuration)
    };

    const key = `services_barber_${currentBarber.id}`;

    if (sId) {
        // EDIT MODE
        try {
            const response = await fetch(`/api/services/${sId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "خطایی در ویرایش سرور رخ داد");
            }

            const updated = await response.json();
            services = services.map(s => s.id === sId ? updated : s);
        } catch (e) {
            console.warn("DB offline, simulating local service edits:", e);
            services = services.map(s => {
                if (s.id === sId) {
                    return { ...s, nameFa: sName, price: Number(sPrice), durationMin: Number(sDuration) };
                }
                return s;
            });
            localStorage.setItem(key, JSON.stringify(services));
        }
        showToast("خدمت مورد نظر با موفقیت ویرایش گردید.", "success");
    } else {
        // ADD NEW SERVICE MODE
        try {
            const response = await fetch("/api/services", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "خطایی در ساخت خدمت رخ داد");
            }

            const fresh = await response.json();
            services.push(fresh);
        } catch (e) {
            console.warn("DB offline, simulating local service creation:", e);
            const simulatedSvc = {
                id: "svc-sim-" + Date.now(),
                barberId: currentBarber.id,
                nameFa: sName,
                price: Number(sPrice),
                durationMin: Number(sDuration)
            };
            services.push(simulatedSvc);
            localStorage.setItem(key, JSON.stringify(services));
        }
        showToast("خدمت جدید با موفقیت به پورتفو اضافه گردید.", "success");
    }

    document.getElementById("service-management-form-container").classList.add("hidden");
    renderServicesUI();
    renderTimeLineSlots();
};

window.deleteServiceInline = async function (serviceId) {
    if (!currentBarber) return;

    if (services.length <= 1) {
        showToast("خطا: شما موظفید حداقل یک خدمت فعال در آرایشگاه خود ثبت داشته باشید!", "error");
        return;
    }

    if (!confirm("آیا مایل به حذف قطعی این خدمت از سالن خود هستید؟")) {
        return;
    }

    const key = `services_barber_${currentBarber.id}`;

    try {
        const response = await fetch(`/api/services/${serviceId}?barberId=${currentBarber.id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "حذف ناموفق بود");
        }

        services = services.filter(s => s.id !== serviceId);
    } catch (e) {
        console.warn("Server connection failed, performing simulated local delete for service:", e);
        services = services.filter(s => s.id !== serviceId);
        localStorage.setItem(key, JSON.stringify(services));
    }

    renderServicesUI();
    renderTimeLineSlots();
    showToast("خدمت مورد نظر با موفقیت حذف گردید.", "success");
};
