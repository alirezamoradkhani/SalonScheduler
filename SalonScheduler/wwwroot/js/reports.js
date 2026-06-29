// Clean, Cozy & Minimalist Barbershop Scheduler Hub - Monthly Reports logic
let currentBarber = null;
let services = [];
let appointments = [];
let selectedMonth = "";

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

document.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem("current_barber_session");
    if (!saved) {
        window.location.href = "index.html";
        return;
    }
    currentBarber = JSON.parse(saved);

    // Initialize default month to current month
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    selectedMonth = `${y}-${m}`;

    const picker = document.getElementById("report-month-picker");
    if (picker) {
        picker.value = selectedMonth;
        picker.addEventListener("change", (e) => {
            selectedMonth = e.target.value;
            renderReport();
        });
    }

    document.getElementById("btn-auth-logout")?.addEventListener("click", () => {
        localStorage.removeItem("current_barber_session");
        window.location.href = "index.html";
    });

    // Populate business summary details
    document.getElementById("summary-barber-name").textContent = currentBarber.fullName;
    document.getElementById("summary-salon-name").textContent = currentBarber.salonName || "کلاسیک";

    fetchAndProcessData();
});

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

async function fetchAndProcessData() {
    try {
        const svcRes = await fetch(`/api/appointments/services?barberId=${currentBarber.id}`);
        if (svcRes.ok) {
            const raw = await svcRes.json();
            services = (raw || []).map(normalizeService);
        }
    } catch (e) {
        services = [];
    }

    try {
        const apptsRes = await fetch(`/api/appointments?barberId=${currentBarber.id}`);
        if (apptsRes.ok) {
            const raw = await apptsRes.json();
            appointments = (raw || []).map(normalizeAppointment);
        }
    } catch (e) {
        appointments = [];
    }

    renderReport();
}

function renderReport() {
    // Filter appointments for the selected month
    const monthlyAppointments = appointments.filter(app => app.date.startsWith(selectedMonth));

    const totalCount = monthlyAppointments.length;
    let totalIncome = 0;
    let totalDurationMinutes = 0;

    const serviceStats = {};
    services.forEach(s => {
        serviceStats[s.id] = { count: 0, name: s.nameFa, income: 0 };
    });

    monthlyAppointments.forEach(app => {
        const s = services.find(sv => sv.id === app.serviceId);
        if (s) {
            totalIncome += s.price;
            totalDurationMinutes += s.durationMin;
            if (!serviceStats[s.id]) {
                serviceStats[s.id] = { count: 0, name: s.nameFa, income: 0 };
            }
            serviceStats[s.id].count += 1;
            serviceStats[s.id].income += s.price;
        } else {
            if (!serviceStats["unknown"]) {
                serviceStats["unknown"] = { count: 0, name: "خدمات متفرقه / تعریف نشده", income: 0 };
            }
            serviceStats["unknown"].count += 1;
        }
    });

    // Sort services by usage count
    const sortedStats = Object.keys(serviceStats)
        .map(id => ({ id, ...serviceStats[id] }))
        .filter(stat => stat.count > 0)
        .sort((a, b) => b.count - a.count);

    // Render Stats values
    document.getElementById("report-total-income").innerHTML = `${totalIncome.toLocaleString()} <span style="font-size: 0.75rem;">تومان</span>`;
    document.getElementById("report-total-count").innerHTML = `${totalCount} <span style="font-size: 0.75rem;">نوبت</span>`;

    // Process duration text
    const hours = Math.floor(totalDurationMinutes / 60);
    const remainingMinutes = totalDurationMinutes % 60;
    let durationText = "بدون فعالیت";
    if (totalCount > 0) {
        durationText = hours > 0
            ? `${hours} ساعت ${remainingMinutes > 0 ? `و ${remainingMinutes} د` : ""}`
            : `${remainingMinutes} دقیقه`;
    }
    document.getElementById("report-total-duration").textContent = durationText;

    // Process summary indicator numbers
    const activeDays = new Set(monthlyAppointments.map(a => a.date)).size;
    document.getElementById("summary-active-days").textContent = `${activeDays} روز کاری`;

    const avgDaily = activeDays > 0 ? Math.round(totalIncome / activeDays) : 0;
    document.getElementById("summary-avg-daily").textContent = `${avgDaily.toLocaleString()} تومان`;

    const avgTicket = totalCount > 0 ? Math.round(totalIncome / totalCount) : 0;
    document.getElementById("summary-avg-ticket").textContent = `${avgTicket.toLocaleString()} تومان`;

    // Update appointments list title with count
    const appointmentsTitle = document.getElementById("report-appointments-title");
    if (appointmentsTitle) {
        appointmentsTitle.textContent = `لیست کامل نوبت‌های این ماه (${totalCount} نوبت)`;
    }

    // Render Popular Services Lists with Beautiful custom progress bars
    const listContainer = document.getElementById("popular-services-list");
    if (listContainer) {
        listContainer.innerHTML = "";
        if (sortedStats.length === 0) {
            listContainer.innerHTML = `<p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; py: 1rem;">هیچ خدمتی ثبت نشده است.</p>`;
        } else {
            sortedStats.forEach((stat, i) => {
                const percentage = totalCount > 0 ? Math.round((stat.count / totalCount) * 100) : 0;
                listContainer.innerHTML += `
                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
                            <span class="bold-text">${i + 1}. ${stat.name}</span>
                            <span style="color: var(--text-muted); font-family: monospace;">${stat.count} نوبت (${percentage}٪)</span>
                        </div>
                        <div style="width: 100%; background: var(--hover-color); height: 8px; border-radius: 9999px; overflow: hidden; border: 1px solid var(--border-color);">
                            <div style="background: var(--accent-color); height: 100%; border-radius: 9999px; width: ${percentage}%; transition: width 0.3s ease;"></div>
                        </div>
                        <div style="text-align: left;">
                            <span style="font-size: 0.65rem; color: var(--green-color); font-weight: bold; font-family: monospace;">
                                ${stat.income.toLocaleString()} تومان درآمد
                            </span>
                        </div>
                    </div>
                `;
            });
        }
    }

    // Render Monthly Appointments Table
    const tableBody = document.getElementById("report-appointments-tbody");
    const emptyMsg = document.getElementById("report-appointments-empty");
    const tableElem = document.getElementById("report-appointments-table");

    if (tableBody) {
        tableBody.innerHTML = "";
        if (monthlyAppointments.length === 0) {
            if (emptyMsg) emptyMsg.style.display = "block";
            if (tableElem) tableElem.style.display = "none";
        } else {
            if (emptyMsg) emptyMsg.style.display = "none";
            if (tableElem) tableElem.style.display = "table";

            // Sort newest first
            const sortedAppointments = [...monthlyAppointments].sort((a, b) => {
                return b.date.localeCompare(a.date) || b.timeSlot.localeCompare(a.timeSlot);
            });

            sortedAppointments.forEach(app => {
                const s = services.find(sv => sv.id === app.serviceId);
                const serviceName = s ? s.nameFa : "خدمات متفرقه";
                const priceText = s ? `${s.price.toLocaleString()} تومان` : "-";

                const tr = document.createElement("tr");
                tr.style.borderBottom = "1px solid var(--hover-color)";
                tr.className = "table-row-hover";
                tr.innerHTML = `
                    <td style="padding: 0.75rem 0.5rem; font-weight: bold;">${app.clientName}</td>
                    <td style="padding: 0.75rem 0.5rem; color: var(--text-muted); font-family: monospace;">${app.clientPhone}</td>
                    <td style="padding: 0.75rem 0.5rem; color: var(--text-muted); font-family: monospace;">${app.date}</td>
                    <td style="padding: 0.75rem 0.5rem; font-family: monospace; color: var(--accent-color); font-weight: bold;">${app.timeSlot}</td>
                    <td style="padding: 0.75rem 0.5rem;">${serviceName}</td>
                    <td style="padding: 0.75rem 0.5rem; text-align: left; font-family: monospace; font-weight: bold; color: var(--green-color);">${priceText}</td>
                `;
                tableBody.appendChild(tr);
            });
        }
    }
}
