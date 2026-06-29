// Clean, Cozy & Minimalist Barbershop Scheduler Hub - Login & Registration Page Logic
let isRegisterMode = false;

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
    if (saved) {
        window.location.href = "workspace.html";
        return;
    }

    document.getElementById("auth-form")?.addEventListener("submit", handleAuth);
    document.getElementById("auth-mode-toggle")?.addEventListener("click", toggleAuthMode);
});

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById("field-fullname-group")?.classList.toggle("hidden", !isRegisterMode);
    document.getElementById("field-salon-group")?.classList.toggle("hidden", !isRegisterMode);
    document.getElementById("auth-title").textContent = isRegisterMode ? "عضویت آرایشگر جدید" : "ورود به کنترل‌پنل آرایشگران";
    document.getElementById("auth-subtitle").textContent = isRegisterMode ? "حساب کاری خود را بسازید و آدرس سالن را مشخص کنید." : "جهت ثبت و ویرایش نوبت‌دهی مشتریان، ابتدا وارد حساب خود شوید.";
    document.getElementById("auth-submit-btn").querySelector("span").textContent = isRegisterMode ? "ثبت نام و ایجاد سالن" : "ورود به سیستم نوبت‌دهی";
    document.getElementById("auth-mode-toggle").querySelector("span").textContent = isRegisterMode ? "قبلاً ثبت‌نام کرده‌اید؟ ورود به حساب" : "هنوز حساب ندارید؟ ثبت سالن جدید";
}

async function handleAuth(e) {
    e.preventDefault();
    const payload = {
        username: document.getElementById("auth-username").value.trim(),
        password: document.getElementById("auth-password").value.trim()
    };
    if (isRegisterMode) {
        payload.fullName = document.getElementById("auth-fullname").value.trim();
        payload.salonName = document.getElementById("auth-salon").value.trim();
    }
    const endpoint = isRegisterMode ? "/api/appointments/auth/register" : "/api/appointments/auth/login";
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || "اطلاعات وارد شده نامعتبر است");
        }
        const currentBarber = await res.json();
        localStorage.setItem("current_barber_session", JSON.stringify(currentBarber));
        window.location.href = "workspace.html";
    } catch (err) {
        showToast(err.message, "error");
    }
}
