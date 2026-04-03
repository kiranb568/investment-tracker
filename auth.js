// auth.js

// User authentication functions

// Function to handle user registration
function registerUser(username, password) {
    // Initialize local storage if it doesn't exist
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }

    const users = JSON.parse(localStorage.getItem('users'));
    // Check if user already exists
    if (users.find(user => user.username === username)) {
        return false; // User already exists
    }

    // Create a new user object
    const newUser = { username, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    return true;
}

// Function to handle user login
function loginUser(username, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
        sessionStorage.setItem('loggedInUser', username);
        return true; // Login successful
    }
    return false; // Login failed
}

// Function to handle session management
function checkSession() {
    return sessionStorage.getItem('loggedInUser') !== null;
}

// Function to log out user
function logoutUser() {
    sessionStorage.removeItem('loggedInUser');
}

// Function to initialize localStorage for user data (Can be called during app initialization)
function initializeDatabase() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
}

// Exporting functions for external use
export { registerUser, loginUser, checkSession, logoutUser, initializeDatabase };