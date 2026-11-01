// ==========================================
// Common JavaScript
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof HAYA_CONFIG === 'undefined') {
        console.warn("HAYA_CONFIG is not defined. Please check config.js");
        return;
    }

    const requestBtn = document.getElementById('common-request-btn');
    if (requestBtn) {
        requestBtn.addEventListener('click', () => {
            const url = HAYA_CONFIG.REQUEST_FORM_URL;
            if (!url || url === "https://forms.gle/XXXXX" || url.trim() === "") {
                alert("The request form is currently being prepared.");
            } else {
                window.open(url, "_blank", "noopener,noreferrer");
            }
        });
    }

    const premiumBtn = document.getElementById('common-premium-btn');
    if (premiumBtn) {
        const url = HAYA_CONFIG.PREMIUM_CHECKOUT_URL;
        const isUrlValid = url && url !== "https://buy.stripe.com/XXXXX" && url.trim() !== "";
        if (isUrlValid) {
            premiumBtn.href = url;
        } else {
            premiumBtn.addEventListener('click', (e) => {
                e.preventDefault();
                alert("Checkout is currently being prepared.");
            });
        }
    }

    const configElements = document.querySelectorAll('[data-config]');
    configElements.forEach(el => {
        const key = el.getAttribute('data-config');
        if (HAYA_CONFIG[key]) {
            if (el.tagName === 'A' && key.includes('URL')) {
                 el.href = HAYA_CONFIG[key];
            } else if (el.tagName === 'A' && key === 'CONTACT_EMAIL') {
                 el.href = 'mailto:' + HAYA_CONFIG[key];
                 el.textContent = HAYA_CONFIG[key];
            } else {
                el.textContent = HAYA_CONFIG[key];
            }
        }
    });
});
