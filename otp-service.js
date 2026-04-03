// otp-service.js - OTP Generation, Storage, and Verification

// OTP Storage: { email: { otp: '123456', expiresAt: timestamp } }
const OTP_EXPIRY_MINUTES = 5;

/**
 * Generate a random 6-digit OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP in localStorage with expiry time
 */
function storeOTP(email, otp) {
    const otpStorage = JSON.parse(localStorage.getItem('otpStorage') || '{}');
    const expiresAt = Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000);
    
    otpStorage[email] = {
        otp: otp,
        expiresAt: expiresAt
    };
    
    localStorage.setItem('otpStorage', JSON.stringify(otpStorage));
    console.log(`✓ OTP stored for ${email}: ${otp} (expires in ${OTP_EXPIRY_MINUTES} minutes)`);
}

/**
 * Verify OTP code for a specific email
 */
function verifyOTPCode(email, inputOTP) {
    const otpStorage = JSON.parse(localStorage.getItem('otpStorage') || '{}');
    
    if (!otpStorage[email]) {
        console.log(`✗ No OTP found for ${email}`);
        return false;
    }
    
    const storedOTP = otpStorage[email];
    
    // Check if OTP has expired
    if (Date.now() > storedOTP.expiresAt) {
        delete otpStorage[email];
        localStorage.setItem('otpStorage', JSON.stringify(otpStorage));
        console.log(`✗ OTP expired for ${email}`);
        return false;
    }
    
    // Verify OTP
    if (storedOTP.otp === inputOTP) {
        // Clear OTP after successful verification
        delete otpStorage[email];
        localStorage.setItem('otpStorage', JSON.stringify(otpStorage));
        console.log(`✓ OTP verified successfully for ${email}`);
        return true;
    }
    
    console.log(`✗ OTP verification failed for ${email}`);
    return false;
}

/**
 * Send OTP to email (simulated - in production, use email service)
 * For demo purposes, logs OTP to console
 */
function sendOTPEmail(email, otp) {
    // In production, call your email service here
    // For now, we'll simulate it with a console log and alert
    console.log(`
    ╔════════════════════════════════════════╗
    ║         OTP VERIFICATION CODE          ║
    ║                                        ║
    ║  Email: ${email.padEnd(36)}║
    ║  OTP:   ${otp.padEnd(33)}║
    ║                                        ║
    ║  Valid for 5 minutes                   ║
    ║  Do not share this code                ║
    ╚════════════════════════════════════════╝
    `);
    
    // For demo, show OTP in browser console and user-friendly alert
    alert(`✓ Demo Mode: Your OTP is: ${otp}\n\nIn production, this would be sent to your email.`);
}

/**
 * Clear expired OTPs from storage (cleanup function)
 */
function clearExpiredOTPs() {
    const otpStorage = JSON.parse(localStorage.getItem('otpStorage') || '{}');
    let cleared = 0;
    
    Object.keys(otpStorage).forEach(email => {
        if (Date.now() > otpStorage[email].expiresAt) {
            delete otpStorage[email];
            cleared++;
        }
    });
    
    if (cleared > 0) {
        localStorage.setItem('otpStorage', JSON.stringify(otpStorage));
        console.log(`✓ Cleared ${cleared} expired OTPs`);
    }
}

// Clear expired OTPs every 5 minutes
setInterval(clearExpiredOTPs, 5 * 60 * 1000);