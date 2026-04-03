// auth.js - Fixed Version with proper error handling

// Initialize database on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDatabase();
    console.log('Database initialized');
});

// Function to initialize localStorage
function initializeDatabase() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
        console.log('Users database created');
    }
}

// Function to handle user registration
function registerUser(username, password, email = '') {
    try {
        // Validation
        if (!username || !password) {
            console.error('Username and password are required');
            showError('Username and password are required');
            return false;
        }

        if (username.length < 3) {
            console.error('Username must be at least 3 characters');
            showError('Username must be at least 3 characters');
            return false;
        }

        if (password.length < 4) {
            console.error('Password must be at least 4 characters');
            showError('Password must be at least 4 characters');
            return false;
        }

        // Initialize local storage if it doesn't exist
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }

        const users = JSON.parse(localStorage.getItem('users'));
        
        // Check if user already exists
        if (users.find(user => user.username === username)) {
            console.error('User already exists:', username);
            showError('Username already exists. Please choose another.');
            return false;
        }

        // Determine if this is first user (admin)
        const isAdmin = users.length === 0;

        // Create a new user object
        const newUser = {
            username,
            password,
            email,
            isAdmin,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Initialize investments storage for new user
        localStorage.setItem(`investments_${username}`, JSON.stringify({}));

        console.log('User registered successfully:', { username, isAdmin });
        showSuccess(`Registration successful! ${isAdmin ? 'You are now Admin!' : ''}`);
        return true;
    } catch (error) {
        console.error('Registration error:', error);
        showError('An error occurred during registration');
        return false;
    }
}

// Function to handle user login
function loginUser(username, password) {
    try {
        if (!username || !password) {
            console.error('Username and password are required');
            showError('Username and password are required');
            return false;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(user => user.username === username && user.password === password);
        
        if (user) {
            sessionStorage.setItem('loggedInUser', username);
            sessionStorage.setItem('userRole', user.isAdmin ? 'admin' : 'user');
            console.log('User logged in successfully:', username, 'Role:', user.isAdmin ? 'admin' : 'user');
            return true;
        }
        
        console.error('Invalid credentials for user:', username);
        showError('Invalid username or password');
        return false;
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred during login');
        return false;
    }
}

// Function to check session
function checkSession() {
    const user = sessionStorage.getItem('loggedInUser');
    console.log('Session check:', user ? 'Active' : 'Inactive');
    return user !== null;
}

// Function to logout user
function logoutUser() {
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('userRole');
    console.log('User logged out');
}

// Function to get current user
function getCurrentUser() {
    return sessionStorage.getItem('loggedInUser');
}

// Function to check if user is admin
function isUserAdmin() {
    return sessionStorage.getItem('userRole') === 'admin';
}

// Helper function to show errors
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.className = 'error';
        console.log('Error displayed:', message);
    }
}

// Helper function to show success messages
function showSuccess(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.className = 'success';
        console.log('Success displayed:', message);
    }
}

// Debug function to view all users
function debugViewUsers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    console.table(users);
    return users;
}
