// multi-user support
let users = [];
let currentUser = null;

function loginUser(username) {
    if (!users.includes(username)) {
        users.push(username);
    }
    currentUser = username;
}

// investment persistence
let investments = [];

function saveInvestment(investment) {
    if (currentUser) {
        investments.push({ user: currentUser, investment });
    } else {
        console.error('No user logged in.');
    }
}

// analytics calculations
function calculateAnalytics() {
    let totalInvested = investments.reduce((acc, item) => acc + item.investment, 0);
    return { totalInvested };
}

// dashboard switching feature
function switchDashboard(dashboardName) {
    console.log(`Switching to ${dashboardName} dashboard`);
}

// admin access features
function grantAdminAccess(username) {
    // logic to grant admin access
}

// Example usage
loginUser('kiranb568');
saveInvestment(1000);
console.log(calculateAnalytics());
switchDashboard('Main');
grantAdminAccess('adminUser');