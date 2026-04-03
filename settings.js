// settings.js - Settings and Password Management

function openSettingsModal() {
    document.getElementById('settingsModal').classList.add('show');
    document.getElementById('settingsStep1').style.display = 'block';
    document.getElementById('settingsStep2').style.display = 'none';
    document.getElementById('settingsStep3').style.display = 'none';
    document.getElementById('currentPassword').value = '';
    document.getElementById('otpMessage').innerHTML = '';
    document.getElementById('passwordMessage').innerHTML = '';
    clearOTPInputs();
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('show');
}

async function loadUserSettings() {
    const currentUser = getCurrentUser();
    const settingsContent = document.getElementById('settings-content');

    if (!currentUser || !settingsContent) {
        return;
    }

    const userData = typeof getUserByEmail === 'function'
        ? await getUserByEmail(currentUser.email)
        : null;

    if (!userData) {
        settingsContent.innerHTML = `
            <div class="card">
                <h3>Profile Information</h3>
                <p style="color: #e74c3c; margin: 0;">Unable to load your account details right now.</p>
            </div>
        `;
        return;
    }

    settingsContent.innerHTML = `
        <div class="card">
            <h3>Profile Information</h3>
            <div style="display: grid; gap: 15px;">
                <div>
                    <label style="color: #0f3460; font-weight: 600;">Full Name</label>
                    <p style="color: #666; margin: 5px 0 0 0;">${userData.name}</p>
                </div>
                <div>
                    <label style="color: #0f3460; font-weight: 600;">Email Address</label>
                    <p style="color: #666; margin: 5px 0 0 0;">${userData.email}</p>
                </div>
                <div>
                    <label style="color: #0f3460; font-weight: 600;">Member Since</label>
                    <p style="color: #666; margin: 5px 0 0 0;">${new Date(userData.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                    <label style="color: #0f3460; font-weight: 600;">Account Type</label>
                    <p style="color: #666; margin: 5px 0 0 0;">${userData.isAdmin ? 'Administrator' : 'Regular User'}</p>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>Security Settings</h3>
            <button class="btn btn-secondary" onclick="openSettingsModal()" style="width: 100%;">
                Change Password
            </button>
        </div>

        <div class="card">
            <h3>Application Settings</h3>
            <div style="display: grid; gap: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f5f7fa; border-radius: 8px;">
                    <label style="color: #0f3460; font-weight: 600; margin: 0;">Enable Notifications</label>
                    <input type="checkbox" checked disabled style="cursor: pointer; width: 20px; height: 20px;" />
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f5f7fa; border-radius: 8px;">
                    <label style="color: #0f3460; font-weight: 600; margin: 0;">Dark Mode</label>
                    <input type="checkbox" disabled style="cursor: pointer; width: 20px; height: 20px;" />
                </div>
            </div>
        </div>
    `;
}

async function verifyCurrentPassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const currentUser = getCurrentUser();

    if (!currentPassword) {
        alert('Please enter current password');
        return;
    }

    const userData = currentUser && typeof getUserByEmail === 'function'
        ? await getUserByEmail(currentUser.email, true)
        : null;

    if (!userData) {
        alert('Unable to load your account details');
        return;
    }

    if (currentPassword !== userData.password) {
        alert('Current password is incorrect');
        return;
    }

    const otp = generateOTP();
    storeOTP(currentUser.email, otp);
    sendOTPEmail(currentUser.email, otp);

    document.getElementById('settingsStep1').style.display = 'none';
    document.getElementById('settingsStep2').style.display = 'block';
    alert('OTP sent to your email');
}

function moveToNextOTP(input, nextId) {
    if (input.value.length >= 1 && nextId) {
        document.getElementById(nextId).focus();
    }
}

function verifySettingsOTP() {
    const otpDigits = [
        document.getElementById('otp1').value,
        document.getElementById('otp2').value,
        document.getElementById('otp3').value,
        document.getElementById('otp4').value,
        document.getElementById('otp5').value,
        document.getElementById('otp6').value
    ];

    const otp = otpDigits.join('');
    const user = getCurrentUser();

    if (otp.length !== 6) {
        document.getElementById('otpMessage').innerHTML = '<p class="error-msg">Please enter all 6 digits</p>';
        return;
    }

    if (!verifyOTPCode(user.email, otp)) {
        document.getElementById('otpMessage').innerHTML = '<p class="error-msg">OTP is incorrect or expired</p>';
        return;
    }

    document.getElementById('otpMessage').innerHTML = '<p class="success-msg">OTP verified successfully</p>';
    setTimeout(() => {
        document.getElementById('settingsStep2').style.display = 'none';
        document.getElementById('settingsStep3').style.display = 'block';
    }, 1000);
}

async function updateSettingsPassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    const currentUser = getCurrentUser();

    if (!newPassword || !confirmPassword) {
        alert('Please fill all fields');
        return;
    }

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    const wasUpdated = typeof updateUserPassword === 'function'
        ? await updateUserPassword(currentUser.email, newPassword)
        : false;

    if (!wasUpdated) {
        alert('Unable to update password');
        return;
    }

    document.getElementById('passwordMessage').innerHTML = '<p class="success-msg">Password changed successfully</p>';
    setTimeout(() => {
        closeSettingsModal();
    }, 2000);
}

function clearOTPInputs() {
    for (let i = 1; i <= 6; i++) {
        const elem = document.getElementById(`otp${i}`);
        if (elem) {
            elem.value = '';
        }
    }
}
