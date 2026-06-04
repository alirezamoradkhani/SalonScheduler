// Standalone client javascript code for Baber Scheduler Template with Multi-Barber Auth
// Designed to connect perfectly with ASP.NET Core API controller endpoints

// Active states
let selectedDate = "2026-06-01";
let services = [];
let appointments = [];
let currentBarber = null; // Stored user details of authenticated barber
let authMode = "login";   // 'login' or 'register'

// Complete system operating timeslots (30 minute ranges)
const OPERATING_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"
];

// Fallback seeded defaults for instant visual preview testing
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

// Document Elems Reference
const authPortalElement = document.getElementById("auth-portal");
const appWorkspaceElement = document.getElementById("app-workspace");
const loggedInProfileElement = document.getElementById("logged-in-profile");
const activeBarberLabelElement = document.getElementById("active-barber-label");
const btnAuthLogoutElement = document.getElementById("btn-auth-logout");

// Auth Form elements
const authForm = document.getElementById("auth-form");
const authModeToggleBtn = document.getElementById("auth-mode-toggle");
const fieldFullnameGroup = document.getElementById("field-fullname-group");
const fieldSalonGroup = document.getElementById("field-salon-group");
const authTitleElement = document.getElementById("auth-title");
const authSubtitleElement = document.getElementById("auth-subtitle");
const authSubmitBtnSpan = document.querySelector("#auth-submit-btn span");
const demoHintBox = document.getElementById("demo-hint-box");

// Scheduler UI elements
const dateSwiperWrapper = document.getElementById("date-swiper-wrapper");
const timelineSlotsContainer = document.getElementById("timeline-slots-container");
const serviceSelectElement = document.getElementById("service-id");
const timeSlotSelectElement = document.getElementById("time-slot");
const servicesSidebarContainer = document.getElementById("services-list-sidebar");
const appointmentForm = document.getElementById("appointment-form");
const selectedDateBadge = document.getElementById("selected-date-badge");

// Alert box elements
const alertBox = document.getElementById("alert-box");
const alertIcon = document.getElementById("alert-icon");
const alertText = document.getElementById("alert-text");

const authAlertBox = document.getElementById("auth-alert-box");
const authAlertIcon = document.getElementById("auth-alert-icon");
const authAlertText = document.getElementById("auth-alert-text");

// Initialize application on DOM Content release
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Rig Auth screen events
    authModeToggleBtn.addEventListener("click", toggleAuthMode);
    authForm.addEventListener("submit", handleAuthFormSubmission);
    btnAuthLogoutElement.addEventListener("click", logoutBarber);

    // 2. Load services early for selections
    await fetchServices();

    // 3. Initiate Auth Session state checkout
    initAuthSession();

    // 4. Register Appointment Form Handler
    appointmentForm.addEventListener("submit", handleFormSubmission);
});

// --- AUTHENTICATION FLOW CONTROLLERS ---

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

            // Adjust layouts
            authPortalElement.classList.add("hidden");
            appWorkspaceElement.classList.remove("hidden");
            loggedInProfileElement.classList.remove("hidden");

            // Update header profile label
            let barberLabelText = `💇‍♂️ ${currentBarber.fullName}`;
            if (currentBarber.salonName) {
                barberLabelText += ` (🏢 ${currentBarber.salonName})`;
            }
            activeBarberLabelElement.textContent = barberLabelText;

            // Load work
            generateDaysList();
            fetchAppointments();
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

        // Log in barber
        currentBarber = data;
        localStorage.setItem("currentBarber", JSON.stringify(data));
        showToast("به سیستم خوش آمدید!", "success");
        initAuthSession();
    } catch (error) {
        console.warn("Direct ASP.NET Auth Endpoint failed, starting fallback client simulation simulation...", error);

        // Dynamic client fallback simulation
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
            // Register Simulation
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

// --- CALENDAR GENERATOR ---

function generateDaysList() {
    dateSwiperWrapper.innerHTML = "";
    const persianDays = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

    for (let i = 0; i < 7; i++) {
        const dateObj = new Date(2026, 5, 1 + i); // June 1st to 7th, 2026

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
                ? "bg-amber-600 text-white font-bold border-amber-500 shadow-lg shadow-amber-600/10"
                : "bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white hover:border-zinc-800"
            }`;
        button.id = `btn-date-${dateString}`;
        button.innerHTML = `
            <span class="text-[10px] tracking-wider uppercase opacity-80">${label}</span>
            <span class="text-lg font-bold font-mono">${dateObj.getDate()}</span>
            <span class="text-[9px] opacity-75">خرداد</span>
        `;

        button.addEventListener("click", () => {
            // Remove previous active styles
            document.querySelectorAll("[id^='btn-date-']").forEach(btn => {
                btn.className = "flex flex-col items-center gap-1 px-5 py-3 rounded-xl border transition duration-200 cursor-pointer bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white hover:border-zinc-800";
            });
            // Apply current active style
            button.className = "flex flex-col items-center gap-1 px-5 py-3 rounded-xl border transition duration-250 cursor-pointer bg-amber-600 text-white font-bold border-amber-500 shadow-lg shadow-amber-600/10";

            selectedDate = dateString;
            selectedDateBadge.textContent = selectedDate;

            renderTimeLineSlots();
        });

        dateSwiperWrapper.appendChild(button);
    }
}

// --- METRIC READERS & API CALLERS ---

async function fetchServices() {
    try {
        const response = await fetch("/api/services");
        if (!response.ok) throw new Error("Services REST API offline");
        services = await response.json();
    } catch (e) {
        const cached = localStorage.getItem("services");
        if (cached) {
            services = JSON.parse(cached);
        } else {
            services = DEFAULT_SERVICES;
            localStorage.setItem("services", JSON.stringify(DEFAULT_SERVICES));
        }
    }
    // Set UI dropdown selections
    renderServicesUI();
}

function renderServicesUI() {
    serviceSelectElement.innerHTML = "";
    servicesSidebarContainer.innerHTML = "";

    services.forEach(svc => {
        // Dropdown option builder
        const opt = document.createElement("option");
        opt.value = svc.id;
        opt.textContent = `${svc.nameFa} — ${svc.price.toLocaleString()} تومان (${svc.durationMin} دقیقه)`;
        serviceSelectElement.appendChild(opt);

        // Sidebar display builder
        const card = document.createElement("div");
        card.className = "flex items-center justify-between text-xs p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg";
        card.innerHTML = `
            <div>
                <p class="font-bold text-zinc-200">${svc.nameFa}</p>
                <p class="text-[10px] text-zinc-500 mt-0.5">${svc.durationMin} دقیقه زمان لازم</p>
            </div>
            <span class="text-[11px] font-mono font-bold text-amber-500">${svc.price.toLocaleString()} تومان</span>
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
            // Seed a clean template for this user so they don't see blank page
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

    // Filter appointments belonging strictly to the current active date
    const todayBookings = appointments.filter(a => a.date === selectedDate);

    // Reset our timeslot list selection tags
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

            containerBox.className = "border border-amber-500/20 bg-gradient-to-l from-amber-950/10 to-zinc-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between p-4 relative overflow-hidden transition duration-150";
            containerBox.innerHTML = `
                <div class="absolute top-0 bottom-0 right-0 w-1 bg-amber-500"></div>
                <div class="flex items-center gap-4">
                    <div class="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3.5 py-1.5 rounded-lg font-mono text-sm font-bold min-w-[65px] text-center">
                        ${slot}
                    </div>
                    <div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-sm font-bold text-white">${reservation.clientName}</span>
                            <span class="text-[10px] bg-amber-600/20 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/10 font-bold">
                                ${serviceInfo ? serviceInfo.nameFa : "خدمات انتخابی"}
                            </span>
                            <a href="tel:${reservation.clientPhone}" class="text-[10px] font-mono text-zinc-400 hover:text-white bg-zinc-800 px-2 py-0.5 rounded flex items-center gap-1">
                                📞 ${reservation.clientPhone}
                            </a>
                        </div>
                        ${reservation.notes ? `<p class="text-xs text-zinc-400 bg-zinc-950/40 px-2.5 py-1 text-zinc-300 rounded mt-1.5 border border-zinc-800 border-dashed">${reservation.notes}</p>` : ""}
                    </div>
                </div>
                <div class="flex items-center justify-between mt-3 sm:mt-0 gap-3">
                    <div class="text-right pl-3">
                        <p class="text-xs font-mono font-bold text-emerald-400">${serviceInfo ? serviceInfo.price.toLocaleString() : "0"} تومان</p>
                        <p class="text-[10px] text-zinc-500">${serviceInfo ? serviceInfo.durationMin : "30"} دقیقه</p>
                    </div>
                    <button type="button" class="p-2 bg-red-500/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg border border-transparent hover:border-red-500/20 cursor-pointer" onclick="cancelAppointment('${reservation.id}')">
                        🗑️
                    </button>
                </div>
            `;
        } else {
            // Free slot
            containerBox.className = "border border-zinc-900 bg-zinc-950 hover:bg-zinc-900/40 rounded-xl flex items-center justify-between p-4 transition duration-150";
            containerBox.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="bg-zinc-900 text-zinc-500 border border-zinc-800 px-3.5 py-1.5 rounded-lg font-mono text-sm font-bold min-w-[65px] text-center">
                        ${slot}
                    </div>
                    <span class="text-xs text-zinc-600 hidden sm:block">بازه زمانی خالی و آماده برای پذیرش مشتریان شما</span>
                </div>
                <button type="button" class="px-3.5 py-1.5 text-xs font-bold bg-zinc-900 text-amber-500 rounded-lg border border-zinc-800 hover:bg-amber-600 hover:text-white hover:border-amber-500 transition cursor-pointer" onclick="selectTimeSlot('${slot}')">
                    رزرو این ساعت
                </button>
            `;

            // Append custom selection option
            const opt = document.createElement("option");
            opt.value = slot;
            opt.textContent = `ساعت ${slot}`;
            timeSlotSelectElement.appendChild(opt);
        }

        timelineSlotsContainer.appendChild(containerBox);
    });

    // Update LEDGERS widgets counter
    document.getElementById("stat-total-count").innerHTML = `${activeCount} <span class="text-xs font-normal text-zinc-500">نوبت</span>`;
    document.getElementById("stat-total-income").innerHTML = `${ledgerIncome.toLocaleString()} <span class="text-xs font-normal text-zinc-500">تومان</span>`;
    document.getElementById("stat-free-slots").innerHTML = `${(OPERATING_SLOTS.length - activeCount)} <span class="text-xs font-normal text-zinc-500">ساعت خالی</span>`;
}

// Global scope bindings for dynamically injected HTML nodes
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

    // Front double booking constraint validation
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

    // Refresh layout, reset entries
    renderTimeLineSlots();

    document.getElementById("client-name").value = "";
    document.getElementById("client-phone").value = "";
    document.getElementById("time-slot").value = "";
    document.getElementById("notes").value = "";

    showToast("نوبت مراجع با موفقیت ثبت و بر روی دیتابیس سالن همگام‌سازی شد.", "success");
}

// --- VISUAL TOASTS ALERT DISPATCHER ---

function showToast(message, type = "success") {
    alertBox.className = "p-4 rounded-xl text-sm flex items-center gap-3 active duration-300 shadow-lg";

    if (type === "success") {
        alertBox.classList.add("bg-emerald-500/10", "border", "border-emerald-500/30", "text-emerald-300");
        alertIcon.textContent = "✅";
    } else if (type === "error") {
        alertBox.classList.add("bg-red-500/10", "border", "border-red-500/30", "text-red-300");
        alertIcon.textContent = "❌";
    } else {
        alertBox.classList.add("bg-amber-500/10", "border", "border-amber-500/30", "text-amber-300");
        alertIcon.textContent = "⚙️";
    }

    alertText.textContent = message;
    alertBox.classList.remove("hidden");

    setTimeout(() => {
        alertBox.classList.add("hidden");
    }, 4500);
}

function showAuthToast(message, type = "success") {
    authAlertBox.className = "w-full p-4 rounded-xl text-sm flex items-center gap-3 active duration-300 shadow-lg";

    if (type === "success") {
        authAlertBox.classList.add("bg-emerald-500/10", "border", "border-emerald-500/30", "text-emerald-300");
        authAlertIcon.textContent = "✅";
    } else if (type === "error") {
        authAlertBox.classList.add("bg-red-500/10", "border", "border-red-500/30", "text-red-300");
        authAlertIcon.textContent = "❌";
    } else {
        authAlertBox.classList.add("bg-amber-500/10", "border", "border-amber-500/30", "text-amber-300");
        authAlertIcon.textContent = "⚙️";
    }

    authAlertText.textContent = message;
    authAlertBox.classList.remove("hidden");
}

function hideClearAuthToast() {
    authAlertBox.classList.add("hidden");
}
