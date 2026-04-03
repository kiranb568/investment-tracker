// auth.js - Complete Authentication System with Password Change

// Initialize database
function initializeDatabase() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
        console.log('✓ Users database initialized');
    }
}

// Register new user
function registerUser(name, email, password) {
    try {
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Check if email exists
        if (users.find(u => u.email === email)) {
            showMessage('Email already registered', 'error');
            return false;
        }

        // First user becomes admin
        const isAdmin = users.length === 0;

        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            isAdmin,
            emailVerified: true,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem(`investments_${email}`, JSON.stringify({}));

        console.log('✓ User registered:', { name, email, isAdmin });
        return true;
    } catch (error) {
        console.error('✗ Registration error:', error);
        showMessage('Registration error occurred', 'error');
        return false;
    }
}

// Login user
function loginUser(email, password) {
    try {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            showMessage('Invalid email or password', 'error');
            return false;
        }

        sessionStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin
        }));

        console.log('✓ User logged in:', email, 'Role:', user.isAdmin ? 'Admin' : 'User');
        return true;
    } catch (error) {
        console.error('✗ Login error:', error);
        showMessage('Login error occurred', 'error');
        return false;
    }
}

// Logout user
function logoutUser() {
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('tempInvestments');
    console.log('✓ User logged out');
    window.location.href = 'index.html';
}

// Get current user
function getCurrentUser() {
    const user = sessionStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Check if user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.isAdmin;
}

// Check authentication
function requireAuth() {
    if (!getCurrentUser()) {
        window.location.href = 'index.html';
    }
}

function showMessage(msg, type) {
    const msgDiv = document.getElementById('message');
    if (msgDiv) {
        msgDiv.textContent = msg;
        msgDiv.className = type;
        msgDiv.style.display = 'block';
    }
}
