const APP_CONTACT_STORAGE_KEY = "srishtiWealthContact";
const APP_THEME_STORAGE_KEY = "srishtiWealthTheme";
const DEFAULT_SUPABASE_PUBLIC_CONFIG = {
    url: "https://wvdqaepetsifprpsdiwf.supabase.co",
    storageBucket: "user-files"
};
const APP_CONTACT_REMOTE_PATH = "public/app-contact.json";
const DEFAULT_APP_CONTACT = {
    email: "support@srishtiwealth.in",
    phone: ""
};

let appContactCache = null;

function getPublicSupabaseConfig() {
    const runtimeConfig = window.__APP_CONFIG__ || {};
    return {
        url: runtimeConfig.supabaseUrl || window.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_PUBLIC_CONFIG.url,
        storageBucket: runtimeConfig.supabaseStorageBucket || window.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || DEFAULT_SUPABASE_PUBLIC_CONFIG.storageBucket
    };
}

function getRemoteContactConfigUrl() {
    const { url, storageBucket } = getPublicSupabaseConfig();
    if (!url || !storageBucket) {
        return null;
    }

    return `${url}/storage/v1/object/public/${storageBucket}/${APP_CONTACT_REMOTE_PATH}`;
}

function normalizeContactDetails(contactDetails = {}) {
    return {
        email: typeof contactDetails.email === "string" && contactDetails.email.trim()
            ? contactDetails.email.trim()
            : DEFAULT_APP_CONTACT.email,
        phone: typeof contactDetails.phone === "string" && contactDetails.phone.trim()
            ? contactDetails.phone.trim()
            : DEFAULT_APP_CONTACT.phone
    };
}

function getAppContactDetails() {
    if (appContactCache) {
        return { ...appContactCache };
    }

    try {
        const storedValue = localStorage.getItem(APP_CONTACT_STORAGE_KEY);
        if (!storedValue) {
            appContactCache = { ...DEFAULT_APP_CONTACT };
            return { ...appContactCache };
        }

        appContactCache = normalizeContactDetails(JSON.parse(storedValue));
        return { ...appContactCache };
    } catch (error) {
        console.error("Unable to read app contact details:", error);
        appContactCache = { ...DEFAULT_APP_CONTACT };
        return { ...appContactCache };
    }
}

function persistLocalContactDetails(contactDetails) {
    const nextValue = normalizeContactDetails(contactDetails);

    localStorage.setItem(APP_CONTACT_STORAGE_KEY, JSON.stringify(nextValue));
    appContactCache = { ...nextValue };
    return nextValue;
}

async function loadRemoteContactDetails() {
    const remoteUrl = getRemoteContactConfigUrl();
    if (!remoteUrl) {
        return getAppContactDetails();
    }

    try {
        const response = await fetch(`${remoteUrl}?ts=${Date.now()}`, {
            cache: "no-store"
        });

        if (!response.ok) {
            return getAppContactDetails();
        }

        const payload = await response.json();
        const nextValue = normalizeContactDetails(payload);
        persistLocalContactDetails(nextValue);
        return nextValue;
    } catch (error) {
        console.warn("Unable to load remote contact details:", error);
        return getAppContactDetails();
    }
}

async function saveAppContactDetails(contactDetails) {
    const nextValue = persistLocalContactDetails(contactDetails);

    if (window.supabaseClient && typeof window.supabaseClient.storage?.from === "function") {
        try {
            const { storageBucket } = getPublicSupabaseConfig();
            const file = new Blob([JSON.stringify(nextValue, null, 2)], {
                type: "application/json"
            });

            const { error } = await window.supabaseClient.storage
                .from(storageBucket)
                .upload(APP_CONTACT_REMOTE_PATH, file, {
                    cacheControl: "0",
                    upsert: true,
                    contentType: "application/json"
                });

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error("Unable to persist remote contact details:", error);
            throw error;
        }
    }

    applyContactBindings();
    return nextValue;
}

function applyContactBindings(root = document) {
    const contactDetails = getAppContactDetails();
    const phoneText = contactDetails.phone || "Admin-managed support number";

    root.querySelectorAll("[data-contact-email]").forEach((node) => {
        if (node.tagName === "A") {
            node.href = `mailto:${contactDetails.email}`;
        }
        node.textContent = contactDetails.email;
    });

    root.querySelectorAll("[data-contact-phone]").forEach((node) => {
        if (node.tagName === "A") {
            const phoneHref = contactDetails.phone.replace(/\s+/g, "");
            node.href = phoneHref ? `tel:${phoneHref}` : "#";
        }
        node.textContent = phoneText;
    });

    root.querySelectorAll("[data-support-form]").forEach((form) => {
        form.action = `mailto:${contactDetails.email}`;
    });
}

function getPreferredTheme() {
    return "light";
}

function applyPreferredTheme() {
    document.documentElement.dataset.theme = "light";
    return document.documentElement.dataset.theme;
}

function setPreferredTheme() {
    const nextTheme = "light";
    localStorage.setItem(APP_THEME_STORAGE_KEY, nextTheme);
    applyPreferredTheme();
    window.dispatchEvent(new CustomEvent("srishti:themechange", {
        detail: { theme: nextTheme }
    }));
    return nextTheme;
}

function togglePreferredTheme() {
    return setPreferredTheme();
}

applyPreferredTheme();

document.addEventListener("DOMContentLoaded", () => {
    applyPreferredTheme();
    applyContactBindings();
    loadRemoteContactDetails().then(() => applyContactBindings());
});
