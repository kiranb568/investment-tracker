const APP_CONTACT_STORAGE_KEY = "siriInvestContact";
const APP_THEME_STORAGE_KEY = "siriInvestTheme";
const DEFAULT_APP_CONTACT = {
    email: "support@siriinvest.com",
    phone: "+91 98765 43210"
};

function getAppContactDetails() {
    try {
        const storedValue = localStorage.getItem(APP_CONTACT_STORAGE_KEY);
        if (!storedValue) {
            return { ...DEFAULT_APP_CONTACT };
        }

        return {
            ...DEFAULT_APP_CONTACT,
            ...JSON.parse(storedValue)
        };
    } catch (error) {
        console.error("Unable to read app contact details:", error);
        return { ...DEFAULT_APP_CONTACT };
    }
}

function saveAppContactDetails(contactDetails) {
    const nextValue = {
        ...DEFAULT_APP_CONTACT,
        ...contactDetails
    };

    localStorage.setItem(APP_CONTACT_STORAGE_KEY, JSON.stringify(nextValue));
    applyContactBindings();
    return nextValue;
}

function applyContactBindings(root = document) {
    const contactDetails = getAppContactDetails();

    root.querySelectorAll("[data-contact-email]").forEach((node) => {
        if (node.tagName === "A") {
            node.href = `mailto:${contactDetails.email}`;
        }
        node.textContent = contactDetails.email;
    });

    root.querySelectorAll("[data-contact-phone]").forEach((node) => {
        if (node.tagName === "A") {
            const phoneHref = contactDetails.phone.replace(/\s+/g, "");
            node.href = `tel:${phoneHref}`;
        }
        node.textContent = contactDetails.phone;
    });
}

function getPreferredTheme() {
    return localStorage.getItem(APP_THEME_STORAGE_KEY) || "dark";
}

function applyPreferredTheme(theme = getPreferredTheme()) {
    document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
    return document.documentElement.dataset.theme;
}

function setPreferredTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    localStorage.setItem(APP_THEME_STORAGE_KEY, nextTheme);
    applyPreferredTheme(nextTheme);
    return nextTheme;
}

function togglePreferredTheme(forceDarkMode) {
    const nextTheme = typeof forceDarkMode === "boolean"
        ? (forceDarkMode ? "dark" : "light")
        : (getPreferredTheme() === "dark" ? "light" : "dark");

    return setPreferredTheme(nextTheme);
}

applyPreferredTheme();

document.addEventListener("DOMContentLoaded", () => {
    applyPreferredTheme();
    applyContactBindings();
});
