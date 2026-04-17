// settings.js - Settings and Password Management

function openSettingsModal() {
    document.getElementById("settingsModal").classList.add("show");
    document.getElementById("settingsStep1").style.display = "block";
    document.getElementById("settingsStep2").style.display = "none";
    document.getElementById("settingsStep3").style.display = "none";
    document.getElementById("currentPassword").value = "";
    document.getElementById("otpMessage").innerHTML = "";
    document.getElementById("passwordMessage").innerHTML = "";
    clearOTPInputs();
}

function closeSettingsModal() {
    document.getElementById("settingsModal").classList.remove("show");
}

async function loadUserSettings() {
    const currentUser = getCurrentUser();
    const settingsContent = document.getElementById("settings-content");

    if (!currentUser || !settingsContent) {
        return;
    }

    const userData = typeof getUserByEmail === "function"
        ? await getUserByEmail(currentUser.email)
        : null;

    if (!userData) {
        settingsContent.innerHTML = `
            <div class="card">
                <h3>Profile Information</h3>
                <p class="settings-value">Unable to load your account details right now.</p>
            </div>
        `;
        return;
    }

    const contactDetails = typeof getAppContactDetails === "function"
        ? getAppContactDetails()
        : { email: "support@siriinvest.com", phone: "+91 98765 43210" };

    const isDarkTheme = typeof getPreferredTheme === "function"
        ? getPreferredTheme() === "dark"
        : true;

    settingsContent.innerHTML = `
        <div class="card">
            <h3>Profile Information</h3>
            <div class="settings-grid">
                <div class="settings-row">
                    <div>
                        <strong>Full Name</strong>
                        <p class="settings-value">${userData.name}</p>
                    </div>
                </div>
                <div class="settings-row">
                    <div>
                        <strong>Email Address</strong>
                        <p class="settings-value">${userData.email}</p>
                    </div>
                </div>
                <div class="settings-row">
                    <div>
                        <strong>Member Since</strong>
                        <p class="settings-value">${new Date(userData.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                </div>
                <div class="settings-row">
                    <div>
                        <strong>Account Type</strong>
                        <p class="settings-value">${userData.isAdmin ? "Administrator" : "Regular User"}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>Security Settings</h3>
            <div class="settings-actions">
                <button class="btn btn-secondary" onclick="openSettingsModal()">Change Password</button>
            </div>
        </div>

        <div class="card">
            <h3>Appearance</h3>
            <div class="settings-row">
                <div>
                    <strong>Dark Theme</strong>
                    <p class="settings-value">Switch between the neon dark mode and a brighter glass light mode.</p>
                </div>
                <input class="settings-toggle" type="checkbox" ${isDarkTheme ? "checked" : ""} onchange="handleThemeToggle(this.checked)" />
            </div>
        </div>

        <div class="card">
            <h3>Support Contact Details</h3>
            <div class="settings-grid">
                <div class="settings-row">
                    <div>
                        <strong>Support Email</strong>
                        <p class="settings-value">${contactDetails.email}</p>
                    </div>
                </div>
                <div class="settings-row">
                    <div>
                        <strong>Support Phone</strong>
                        <p class="settings-value">${contactDetails.phone}</p>
                    </div>
                </div>
            </div>
            ${userData.isAdmin ? `
                <div class="settings-form" style="margin-top:16px;">
                    <input id="admin-contact-email" type="email" value="${contactDetails.email}" placeholder="Support email" />
                    <input id="admin-contact-phone" type="text" value="${contactDetails.phone}" placeholder="Support phone" />
                    <div class="settings-actions">
                        <button class="btn btn-primary" onclick="saveAdminContactSettings()">Save Contact Details</button>
                    </div>
                </div>
            ` : ""}
        </div>
    `;
}

function handleThemeToggle(isDarkTheme) {
    if (typeof togglePreferredTheme === "function") {
        togglePreferredTheme(isDarkTheme);
    }
}

function saveAdminContactSettings() {
    const emailInput = document.getElementById("admin-contact-email");
    const phoneInput = document.getElementById("admin-contact-phone");

    if (!emailInput || !phoneInput) {
        return;
    }

    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!email || !email.includes("@")) {
        alert("Please enter a valid support email");
        return;
    }

    if (!phone) {
        alert("Please enter a valid support phone number");
        return;
    }

    if (typeof saveAppContactDetails === "function") {
        saveAppContactDetails({ email, phone });
    }

    loadUserSettings();
    alert("Contact details updated successfully");
}

async function verifyCurrentPassword() {
    const currentPassword = document.getElementById("currentPassword").value;
    const currentUser = getCurrentUser();

    if (!currentPassword) {
        alert("Please enter current password");
        return;
    }

    const userData = currentUser && typeof getUserByEmail === "function"
        ? await getUserByEmail(currentUser.email, true)
        : null;

    if (!userData) {
        alert("Unable to load your account details");
        return;
    }

    if (currentPassword !== userData.password) {
        alert("Current password is incorrect");
        return;
    }

    const otp = generateOTP();
    storeOTP(currentUser.email, otp);
    sendOTPEmail(currentUser.email, otp);

    document.getElementById("settingsStep1").style.display = "none";
    document.getElementById("settingsStep2").style.display = "block";
    alert("OTP sent to your email");
}

function moveToNextOTP(input, nextId) {
    if (input.value.length >= 1 && nextId) {
        document.getElementById(nextId).focus();
    }
}

function verifySettingsOTP() {
    const otpDigits = [
        document.getElementById("otp1").value,
        document.getElementById("otp2").value,
        document.getElementById("otp3").value,
        document.getElementById("otp4").value,
        document.getElementById("otp5").value,
        document.getElementById("otp6").value
    ];

    const otp = otpDigits.join("");
    const user = getCurrentUser();

    if (otp.length !== 6) {
        document.getElementById("otpMessage").innerHTML = '<p class="error-msg">Please enter all 6 digits</p>';
        return;
    }

    if (!verifyOTPCode(user.email, otp)) {
        document.getElementById("otpMessage").innerHTML = '<p class="error-msg">OTP is incorrect or expired</p>';
        return;
    }

    document.getElementById("otpMessage").innerHTML = '<p class="success-msg">OTP verified successfully</p>';
    setTimeout(() => {
        document.getElementById("settingsStep2").style.display = "none";
        document.getElementById("settingsStep3").style.display = "block";
    }, 1000);
}

async function updateSettingsPassword() {
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmNewPassword").value;
    const currentUser = getCurrentUser();

    if (!newPassword || !confirmPassword) {
        alert("Please fill all fields");
        return;
    }

    if (newPassword.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    const wasUpdated = typeof updateUserPassword === "function"
        ? await updateUserPassword(currentUser.email, newPassword)
        : false;

    if (!wasUpdated) {
        alert("Unable to update password");
        return;
    }

    document.getElementById("passwordMessage").innerHTML = '<p class="success-msg">Password changed successfully</p>';
    setTimeout(() => {
        closeSettingsModal();
    }, 2000);
}

function clearOTPInputs() {
    for (let i = 1; i <= 6; i++) {
        const elem = document.getElementById(`otp${i}`);
        if (elem) {
            elem.value = "";
        }
    }
}
