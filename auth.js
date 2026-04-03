// auth.js - Firestore-backed Authentication System

function getFirestoreDb() {
    if (!window.firestoreDb) {
        showMessage('Firestore is not initialized. Check Firebase setup.', 'error');
        return null;
    }
    if (window.hasFirebasePlaceholders) {
        showMessage('Set your Firebase config values before using auth.', 'error');
        return null;
    }
    return window.firestoreDb;
}

// Initialize database
async function initializeDatabase() {
    const db = getFirestoreDb();
    if (!db) {
        return;
    }

    try {
        await db.collection('users').limit(1).get();
        console.log('✓ Firestore users collection reachable');
    } catch (error) {
        console.error('✗ Firestore initialization error:', error);
        showMessage('Unable to connect to Firestore', 'error');
    }
}

// Register new user
async function registerUser(name, email, password) {
    const db = getFirestoreDb();
    if (!db) {
        return false;
    }

    try {
        const usersCollection = db.collection('users');
        const existingUserSnapshot = await usersCollection.where('email', '==', email).limit(1).get();

        if (!existingUserSnapshot.empty) {
            showMessage('Email already registered', 'error');
            return false;
        }

        const firstUserCheck = await usersCollection.limit(1).get();
        const isAdmin = firstUserCheck.empty;
        const createdAt = new Date().toISOString();
        const newUserDocRef = usersCollection.doc();

        const newUser = {
            id: newUserDocRef.id,
            name,
            email,
            password,
            isAdmin,
            emailVerified: true,
            createdAt
        };

        await newUserDocRef.set(newUser);

        console.log('✓ User registered:', { name, email, isAdmin });
        return true;
    } catch (error) {
        console.error('✗ Registration error:', error);
        showMessage('Registration error occurred', 'error');
        return false;
    }
}

// Login user
async function loginUser(email, password) {
    const db = getFirestoreDb();
    if (!db) {
        return false;
    }

    try {
        const snapshot = await db
            .collection('users')
            .where('email', '==', email)
            .where('password', '==', password)
            .limit(1)
            .get();

        if (snapshot.empty) {
            showMessage('Invalid email or password', 'error');
            return false;
        }

        const user = snapshot.docs[0].data();

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
