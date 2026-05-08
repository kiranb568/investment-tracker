let deferredInstallPrompt = null;
let installPromptDismissed = false;

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

function createOverlay({ id, title, body, actionLabel, onAction, dismissLabel = "Later", withLogo = true, actionClassName = "pwa-install-button" }) {
    if (document.getElementById(id) || isStandaloneMode()) {
        return;
    }

    const prompt = document.createElement("div");
    prompt.id = id;
    prompt.innerHTML = `
        ${withLogo ? '<img class="pwa-overlay-logo" src="srishti-wealth-logo.png" alt="Srishti Wealth logo">' : ""}
        <div class="pwa-install-copy">
            <strong>${title}</strong>
            <span>${body}</span>
        </div>
        <div class="pwa-install-actions">
            <button type="button" class="${actionClassName}">${actionLabel}</button>
            <button type="button" class="pwa-dismiss-button" aria-label="Dismiss prompt">${dismissLabel}</button>
        </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
        #pwa-install-prompt, #pwa-update-prompt {
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
        .pwa-overlay-logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
            display: block;
            margin-bottom: 12px;
            filter: drop-shadow(0 0 24px rgba(255, 190, 80, 0.26));
        }
        #pwa-install-prompt .pwa-install-copy strong, #pwa-update-prompt .pwa-install-copy strong {
            display: block;
            margin-bottom: 6px;
            font-size: 1rem;
        }
        #pwa-install-prompt .pwa-install-copy span, #pwa-update-prompt .pwa-install-copy span {
            display: block;
            color: rgba(225, 235, 255, 0.8);
            line-height: 1.6;
            font-size: 0.92rem;
        }
        #pwa-install-prompt .pwa-install-actions, #pwa-update-prompt .pwa-install-actions {
            display: flex;
            gap: 10px;
            margin-top: 14px;
        }
        #pwa-install-prompt button, #pwa-update-prompt button {
            border: none;
            border-radius: 14px;
            min-height: 44px;
            padding: 0 16px;
            cursor: pointer;
            font-weight: 700;
        }
        #pwa-install-prompt .pwa-install-button, #pwa-update-prompt .pwa-update-button {
            background: linear-gradient(135deg, #61e8ff, #7d9cff, #9762ff);
            color: #04111f;
            flex: 1;
        }
        #pwa-install-prompt .pwa-dismiss-button, #pwa-update-prompt .pwa-dismiss-button {
            background: rgba(255, 255, 255, 0.08);
            color: #f4f8ff;
        }
        .pwa-install-fab {
            position: fixed;
            left: 18px;
            bottom: 18px;
            z-index: 9998;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            min-height: 52px;
            padding: 0 18px;
            border-radius: 999px;
            border: 1px solid rgba(101, 236, 255, 0.24);
            background: rgba(8, 18, 35, 0.92);
            box-shadow: 0 22px 48px rgba(0, 0, 0, 0.28);
            color: #f4f8ff;
            font-family: "Space Grotesk", "Segoe UI", sans-serif;
            font-weight: 700;
            cursor: pointer;
            backdrop-filter: blur(18px);
        }
        .pwa-install-fab img {
            width: 26px;
            height: 26px;
            object-fit: contain;
        }
    `;

    if (!document.getElementById("pwa-shared-style")) {
        style.id = "pwa-shared-style";
        document.head.appendChild(style);
    }
    document.body.appendChild(prompt);

    prompt.querySelector(`.${actionClassName}`).addEventListener("click", onAction);
    prompt.querySelector(".pwa-dismiss-button").addEventListener("click", () => prompt.remove());
}

function showSplashScreen() {
    if (document.getElementById("pwa-splash") || isStandaloneMode()) {
        return;
    }

    const splash = document.createElement("div");
    splash.id = "pwa-splash";
    splash.innerHTML = `
        <img src="srishti-wealth-logo.png" alt="Srishti Wealth logo">
        <strong>Srishti Wealth</strong>
        <span>Loading your investment command center...</span>
    `;

    const style = document.createElement("style");
    style.id = "pwa-splash-style";
    style.textContent = `
        #pwa-splash {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            background:
                radial-gradient(circle at top, rgba(97, 232, 255, 0.16), transparent 28%),
                linear-gradient(180deg, #040914 0%, #091323 100%);
            color: #f4f8ff;
            font-family: "Space Grotesk", "Segoe UI", sans-serif;
            transition: opacity 0.45s ease, visibility 0.45s ease;
        }
        #pwa-splash img {
            width: 124px;
            height: 124px;
            object-fit: contain;
            filter: drop-shadow(0 0 34px rgba(255, 190, 80, 0.28));
        }
        #pwa-splash strong {
            font-size: 1.35rem;
        }
        #pwa-splash span {
            color: rgba(225, 235, 255, 0.78);
        }
        #pwa-splash.is-hidden {
            opacity: 0;
            visibility: hidden;
        }
    `;

    if (!document.getElementById("pwa-splash-style")) {
        document.head.appendChild(style);
    }
    document.body.appendChild(splash);

    window.addEventListener("load", () => {
        setTimeout(() => {
            splash.classList.add("is-hidden");
            setTimeout(() => splash.remove(), 500);
        }, 700);
    });
}

function ensureInstallFab(label, onClick) {
    if (document.getElementById("pwa-install-fab") || isStandaloneMode()) {
        return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.id = "pwa-install-fab";
    button.className = "pwa-install-fab";
    button.innerHTML = `<img src="srishti-wealth-logo.png" alt=""><span>${label}</span>`;
    button.addEventListener("click", onClick);
    document.body.appendChild(button);
}

function monitorServiceWorkerUpdates() {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
    });

    navigator.serviceWorker.getRegistration().then((registration) => {
        if (!registration) {
            return;
        }

        function showUpdatePrompt(worker) {
            if (!worker) {
                return;
            }

            createOverlay({
                id: "pwa-update-prompt",
                title: "Update ready",
                body: "A newer Srishti Wealth version is available. Refresh now to load the latest experience.",
                actionLabel: "Refresh",
                actionClassName: "pwa-update-button",
                onAction: () => {
                    worker.postMessage({ type: "SKIP_WAITING" });
                }
            });
        }

        if (registration.waiting) {
            showUpdatePrompt(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (!newWorker) {
                return;
            }

            newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    showUpdatePrompt(newWorker);
                }
            });
        });
    });
}

function setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;

        ensureInstallFab("Install App", () => {
            document.getElementById("pwa-install-prompt")?.remove();
            installPromptDismissed = false;
            event.preventDefault();
            window.dispatchEvent(new Event("pwa:show-install"));
        });

        createOverlay({
            id: "pwa-install-prompt",
            title: "Install Srishti Wealth",
            body: "Install the app on Windows or Android for a desktop-style experience. On iPhone and iPad, add it from Safari to your Home Screen.",
            actionLabel: "Install",
            onAction: async () => {
                if (!deferredInstallPrompt) {
                    return;
                }

                deferredInstallPrompt.prompt();
                await deferredInstallPrompt.userChoice;
                deferredInstallPrompt = null;
                document.getElementById("pwa-install-prompt")?.remove();
                document.getElementById("pwa-install-fab")?.remove();
            }
        });
    });

    window.addEventListener("pwa:show-install", () => {
        if (installPromptDismissed) {
            installPromptDismissed = false;
        }

        if (deferredInstallPrompt && !document.getElementById("pwa-install-prompt")) {
            createOverlay({
                id: "pwa-install-prompt",
                title: "Install Srishti Wealth",
                body: "Add the app on Windows or Android for quick access, dedicated windows, and an app-like workflow.",
                actionLabel: "Install",
                onAction: async () => {
                    deferredInstallPrompt.prompt();
                    await deferredInstallPrompt.userChoice;
                    deferredInstallPrompt = null;
                    document.getElementById("pwa-install-prompt")?.remove();
                    document.getElementById("pwa-install-fab")?.remove();
                }
            });
        }
    });

    window.addEventListener("appinstalled", () => {
        deferredInstallPrompt = null;
        document.getElementById("pwa-install-prompt")?.remove();
        document.getElementById("pwa-install-fab")?.remove();
    });

    if (isIosDevice() && !isStandaloneMode()) {
        window.addEventListener("load", () => {
            ensureInstallFab("Install on iPhone", () => {
                window.dispatchEvent(new Event("pwa:show-ios-install"));
            });

            createOverlay({
                id: "pwa-install-prompt",
                title: "Install on iPhone or iPad",
                body: "Tap Share in Safari, then choose Add to Home Screen to install Srishti Wealth.",
                actionLabel: "Got it",
                onAction: () => document.getElementById("pwa-install-prompt")?.remove()
            });
        });

        window.addEventListener("pwa:show-ios-install", () => {
            if (!document.getElementById("pwa-install-prompt")) {
                createOverlay({
                    id: "pwa-install-prompt",
                    title: "Install on iPhone or iPad",
                    body: "Tap Share in Safari, then choose Add to Home Screen to install Srishti Wealth.",
                    actionLabel: "Got it",
                    onAction: () => document.getElementById("pwa-install-prompt")?.remove()
                });
            }
        });
    }
}

registerServiceWorker();
setupInstallPrompt();
monitorServiceWorkerUpdates();
