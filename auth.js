// auth.js - Supabase-backed Authentication + Storage helpers

const SUPABASE_USERS_TABLE = "users";
const DEFAULT_SUPABASE_CONFIG = {
    url: "https://wvdqaepetsifprpsdiwf.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2ZHFhZXBldHNpZnBycHNkaXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjY5NTMsImV4cCI6MjA5MDgwMjk1M30.V3vKi8dl6pRDwKwiK1mmD_YYuAVSAecOJ4eTTOXo4Qk",
    storageBucket: "user-files"
};

function initializeSupabaseApp() {
    if (window.supabaseClient) {
        return true;
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
        return false;
    }

    const runtimeConfig = window.__APP_CONFIG__ || {};

    if (!window.supabaseAppConfig) {
        window.supabaseAppConfig = {
            url: runtimeConfig.supabaseUrl || window.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_CONFIG.url,
            anonKey: runtimeConfig.supabaseAnonKey || window.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_CONFIG.anonKey,
            storageBucket: runtimeConfig.supabaseStorageBucket || window.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || DEFAULT_SUPABASE_CONFIG.storageBucket
        };
    }

    window.hasSupabasePlaceholders = Object.values(window.supabaseAppConfig).some(value => {
        if (typeof value !== "string") {
            return true;
        }

        const normalizedValue = value.trim();
        return !normalizedValue || normalizedValue.includes("YOUR_");
    });

    if (window.hasSupabasePlaceholders) {
        return false;
    }

    window.supabaseClient = window.supabase.createClient(
        window.supabaseAppConfig.url,
        window.supabaseAppConfig.anonKey
    );

    return true;
}

function getSupabaseClient() {
    initializeSupabaseApp();

    if (!window.supabaseClient) {
        showMessage("Supabase is not initialized. Check your Vercel/Supabase config.", "error");
        return null;
    }

    if (window.hasSupabasePlaceholders) {
        showMessage("Replace the Supabase placeholders before using the app.", "error");
        return null;
    }

    return window.supabaseClient;
}

function getSupabaseStorageBucket() {
    const bucketName = window.supabaseAppConfig?.storageBucket;

    if (!bucketName || bucketName.includes("YOUR_")) {
        showMessage("Supabase Storage bucket is not configured.", "error");
        return null;
    }

    return bucketName;
}

async function initializeDatabase() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        return;
    }

    try {
        const { error } = await supabase
            .from(SUPABASE_USERS_TABLE)
            .select("id")
            .limit(1);

        if (error) {
            throw error;
        }

        console.log("Supabase users table is reachable.");
    } catch (error) {
        console.error("Supabase initialization error:", error);
        showMessage("Unable to connect to the Supabase users table.", "error");
    }
}

async function registerUser(name, email, password) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        return false;
    }

    try {
        const { data: existingUsers, error: existingError } = await supabase
            .from(SUPABASE_USERS_TABLE)
            .select("id")
            .eq("email", email)
            .limit(1);

        if (existingError) {
            throw existingError;
        }

        if (existingUsers && existingUsers.length > 0) {
            showMessage("Email already registered.", "error");
            return false;
        }

        const { count, error: countError } = await supabase
            .from(SUPABASE_USERS_TABLE)
            .select("*", { count: "exact", head: true });

        if (countError) {
            throw countError;
        }

        const newUser = {
            name,
            email,
            password,
            isAdmin: !count,
            emailVerified: true,
            createdAt: new Date().toISOString()
        };

        const { data: insertedUser, error: insertError } = await supabase
            .from(SUPABASE_USERS_TABLE)
            .insert([newUser])
            .select("id")
            .single();

        if (insertError) {
            throw insertError;
        }

        console.log("User registered:", {
            id: insertedUser.id,
            name,
            email,
            isAdmin: newUser.isAdmin
        });

        return true;
    } catch (error) {
        console.error("Registration error:", error);
        showMessage("Registration failed. Please try again.", "error");
        return false;
    }
}

async function listUsers() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        return [];
    }

    try {
        const { data: users, error } = await supabase
            .from(SUPABASE_USERS_TABLE)
            .select("id, name, email, isAdmin, createdAt, avatarPath")
            .order("createdAt", { ascending: true });

        if (error) {
            throw error;
        }

        return users || [];
    } catch (error) {
        console.error("Unable to load users:", error);
        showMessage("Unable to load users.", "error");
        return [];
    }
}

async function getUserByEmail(email, includePassword = false) {
    const supabase = getSupabaseClient();
    if (!supabase || !email) {
        return null;
    }

    try {
        const selectFields = includePassword
            ? "id, name, email, isAdmin, createdAt, avatarPath, password"
            : "id, name, email, isAdmin, createdAt, avatarPath";

        const { data: user, error } = await supabase
            .from(SUPABASE_USERS_TABLE)
            .select(selectFields)
            .eq("email", email)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return user || null;
    } catch (error) {
        console.error("Unable to load user:", error);
        showMessage("Unable to load user details.", "error");
        return null;
    }
}

async function deleteUserByEmail(email) {
    const supabase = getSupabaseClient();
    if (!supabase || !email) {
        return false;
    }

    try {
        const { error } = await supabase
            .from(SUPABASE_USERS_TABLE)
            .delete()
            .eq("email", email);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        console.error("Unable to delete user:", error);
        showMessage("Unable to delete user.", "error");
        return false;
    }
}

async function updateUserPassword(email, password) {
    const supabase = getSupabaseClient();
    if (!supabase || !email || !password) {
        return false;
    }

    try {
        const { error } = await supabase
            .from(SUPABASE_USERS_TABLE)
            .update({ password })
            .eq("email", email);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        console.error("Unable to update password:", error);
        showMessage("Unable to update password.", "error");
        return false;
    }
}

async function loginUser(email, password) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        return false;
    }

    try {
        const { data: users, error } = await supabase
            .from(SUPABASE_USERS_TABLE)
            .select("id, name, email, isAdmin, password, avatarPath")
            .eq("email", email)
            .eq("password", password)
            .limit(1);

        if (error) {
            throw error;
        }

        if (!users || users.length === 0) {
            showMessage("Invalid email or password.", "error");
            return false;
        }

        const user = users[0];

        sessionStorage.setItem("currentUser", JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            avatarPath: user.avatarPath || null
        }));

        console.log("User logged in:", email, "Role:", user.isAdmin ? "Admin" : "User");
        return true;
    } catch (error) {
        console.error("Login error:", error);
        showMessage("Login failed. Please try again.", "error");
        return false;
    }
}

function logoutUser() {
    sessionStorage.removeItem("currentUser");
    console.log("User logged out.");
    window.location.href = "index.html";
}

function getCurrentUser() {
    const user = sessionStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
}

function isAdmin() {
    const user = getCurrentUser();
    return Boolean(user && user.isAdmin);
}

function requireAuth() {
    if (!getCurrentUser()) {
        window.location.href = "index.html";
    }
}

async function uploadUserAsset(file, userId, folder = "profiles") {
    const supabase = getSupabaseClient();
    const bucketName = getSupabaseStorageBucket();

    if (!supabase || !bucketName || !file || !userId) {
        return null;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${folder}/${userId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true
        });

    if (error) {
        console.error("Supabase Storage upload error:", error);
        showMessage("File upload failed.", "error");
        return null;
    }

    return filePath;
}

function getUserAssetUrl(filePath) {
    const supabase = getSupabaseClient();
    const bucketName = getSupabaseStorageBucket();

    if (!supabase || !bucketName || !filePath) {
        return null;
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data?.publicUrl || null;
}

async function saveUserAvatar(userId, file) {
    const supabase = getSupabaseClient();
    if (!supabase || !userId || !file) {
        return null;
    }

    const avatarPath = await uploadUserAsset(file, userId, "avatars");
    if (!avatarPath) {
        return null;
    }

    const { error } = await supabase
        .from(SUPABASE_USERS_TABLE)
        .update({ avatarPath })
        .eq("id", userId);

    if (error) {
        console.error("Unable to save avatar path:", error);
        showMessage("Avatar was uploaded but could not be linked to the user.", "error");
        return null;
    }

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        currentUser.avatarPath = avatarPath;
        sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
    }

    return avatarPath;
}

function showMessage(message, type) {
    const messageElement = document.getElementById("message");

    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;
    messageElement.className = type;
    messageElement.style.display = "block";
}
