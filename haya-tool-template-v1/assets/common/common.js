// ==========================================
// 全ツール共通のJavaScript
// ※ここにツール固有の計算・診断・変換処理は書かないでください。
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    if (typeof HAYA_CONFIG === 'undefined') {
        console.warn("HAYA_CONFIG is not defined. Please check config.js");
        return;
    }

    // --- 1. リクエストボタン制御 ---
    const requestBtn = document.getElementById('common-request-btn');
    if (requestBtn) {
        requestBtn.addEventListener('click', () => {
            const url = HAYA_CONFIG.REQUEST_FORM_URL;
            if (!url || url === "https://forms.gle/XXXXX" || url.trim() === "") {
                alert("リクエストフォームは現在準備中です。");
            } else {
                window.open(url, "_blank", "noopener,noreferrer");
            }
        });
    }

    // --- 2. 有料サービス (Premium) ボタン制御 ---
    const premiumBtn = document.getElementById('common-premium-btn');
    if (premiumBtn) {
        premiumBtn.addEventListener('click', (e) => {
            const url = HAYA_CONFIG.PREMIUM_CHECKOUT_URL;
            if (!url || url === "https://buy.stripe.com/XXXXX" || url.trim() === "") {
                e.preventDefault();
                alert("決済ページは現在準備中です。");
            } else {
                premiumBtn.href = url;
            }
        });
    }

    // --- 3. 設定値の動的挿入 (DOM全体) ---
    // data-config 属性を持つ要素に対して、config.js の値を自動挿入します。
    // 例: <span data-config="CONTACT_EMAIL"></span>
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
