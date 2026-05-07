let deferredInstallPrompt = null;

function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
        return;
    }

    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js").catch((error) => {
            console.error("Service worker registration failed:", error);
        });
    });
}

function isIosDevice() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandaloneMode() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function createInstallPrompt({ title, body, actionLabel, onAction }) {
    if (document.getElementById("pwa-install-prompt") || isStandaloneMode()) {
        return;
    }

    const prompt = document.createElement("div");
    prompt.id = "pwa-install-prompt";
    prompt.innerHTML = `
        <div class="pwa-install-copy">
            <strong>${title}</strong>
            <span>${body}</span>
        </div>
        <div class="pwa-install-actions">
            <button type="button" class="pwa-install-button">${actionLabel}</button>
            <button type="button" class="pwa-dismiss-button" aria-label="Dismiss install prompt">Later</button>
        </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
        #pwa-install-prompt {
            position: fixed;
            right: 18px;
            bottom: 18px;
            z-index: 9999;
            width: min(360px, calc(100vw - 32px));
            padding: 16px;
            border-radius: 20px;
            border: 1px solid rgba(101, 236, 255, 0.24);
            background: rgba(8, 18, 35, 0.92);
            backdrop-filter: blur(18px);
            box-shadow: 0 22px 48px rgba(0, 0, 0, 0.28);
            color: #f4f8ff;
            font-family: "Space Grotesk", "Segoe UI", sans-serif;
        }
        #pwa-install-prompt .pwa-install-copy strong {
            display: block;
            margin-bottom: 6px;
            font-size: 1rem;
        }
        #pwa-install-prompt .pwa-install-copy span {
            display: block;
            color: rgba(225, 235, 255, 0.8);
            line-height: 1.6;
            font-size: 0.92rem;
        }
        #pwa-install-prompt .pwa-install-actions {
            display: flex;
            gap: 10px;
            margin-top: 14px;
        }
        #pwa-install-prompt button {
            border: none;
            border-radius: 14px;
            min-height: 44px;
            padding: 0 16px;
            cursor: pointer;
            font-weight: 700;
        }
        #pwa-install-prompt .pwa-install-button {
            background: linear-gradient(135deg, #61e8ff, #7d9cff, #9762ff);
            color: #04111f;
            flex: 1;
        }
        #pwa-install-prompt .pwa-dismiss-button {
            background: rgba(255, 255, 255, 0.08);
            color: #f4f8ff;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(prompt);

    prompt.querySelector(".pwa-install-button").addEventListener("click", onAction);
    prompt.querySelector(".pwa-dismiss-button").addEventListener("click", () => prompt.remove());
}

function setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;

        createInstallPrompt({
            title: "Install SvarnaFiNexa",
            body: "Add the app to your desktop or home screen for a cleaner, full-screen experience.",
            actionLabel: "Install",
            onAction: async () => {
                if (!deferredInstallPrompt) {
                    return;
                }

                deferredInstallPrompt.prompt();
                await deferredInstallPrompt.userChoice;
                deferredInstallPrompt = null;
                document.getElementById("pwa-install-prompt")?.remove();
            }
        });
    });

    window.addEventListener("appinstalled", () => {
        deferredInstallPrompt = null;
        document.getElementById("pwa-install-prompt")?.remove();
    });

    if (isIosDevice() && !isStandaloneMode()) {
        window.addEventListener("load", () => {
            createInstallPrompt({
                title: "Install on iPhone or iPad",
                body: "Tap Share in Safari, then choose Add to Home Screen to install SvarnaFiNexa.",
                actionLabel: "Got it",
                onAction: () => document.getElementById("pwa-install-prompt")?.remove()
            });
        });
    }
}

registerServiceWorker();
setupInstallPrompt();
