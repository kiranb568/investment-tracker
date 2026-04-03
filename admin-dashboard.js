// admin-dashboard.js - Admin Dashboard Functions

document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    loadAnalytics();
    setupEventListeners();
});

function loadCustomers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const list = document.getElementById('customer-list');
    list.innerHTML = '';
    
    users.forEach(user => {
        const investments = JSON.parse(localStorage.getItem(`investments_${user.username}`)) || {};
        const total = Object.values(investments).reduce((sum, inv) => sum + inv.amount, 0);
        
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${user.username}</strong> - Total: ₹${total.toLocaleString('en-IN')}
            <button onclick="viewCustomer('${user.username}')">View</button>
            <button onclick="removeCustomer('${user.username}')">Delete</button>
        `;
        list.appendChild(li);
    });
}

function addCustomer() {
    const name = document.getElementById('customer-name').value;
    const email = document.getElementById('customer-email').value;
    
    if (!name || !email) {
        alert('Fill all fields');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.username === name)) {
        alert('Customer exists');
        return;
    }
    
    users.push({ username: name, email, password: 'default', isAdmin: false, createdAt: new Date().toISOString() });
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem(`investments_${name}`, JSON.stringify({}));
    document.getElementById('add-customer-form').reset();
    loadCustomers();
    loadAnalytics();
}

function removeCustomer(username) {
    if (!confirm('Delete this customer?')) return;
    const users = JSON.parse(localStorage.getItem('users')).filter(u => u.username !== username);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.removeItem(`investments_${username}`);
    loadCustomers();
    loadAnalytics();
}

function loadAnalytics() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    let totalCustomers = 0, totalInvestment = 0, totalDaily = 0, totalMonthly = 0;
    
    users.forEach(user => {
        totalCustomers++;
        const investments = JSON.parse(localStorage.getItem(`investments_${user.username}`)) || {};
        Object.values(investments).forEach(inv => {
            totalInvestment += inv.amount;
            totalDaily += inv.dailyReturn;
            totalMonthly += inv.monthlyReturn;
        });
    });
    
    document.getElementById('analytics-data').innerHTML = `
        <p><strong>Total Customers:</strong> ${totalCustomers}</p>
        <p><strong>Total Investment:</strong> ₹${totalInvestment.toLocaleString('en-IN')}</p>
        <p><strong>Daily Return:</strong> ₹${totalDaily.toLocaleString('en-IN')}</p>
        <p><strong>Monthly Return:</strong> ₹${totalMonthly.toLocaleString('en-IN')}</p>
    `;
}

function setupEventListeners() {
    document.getElementById('add-customer-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addCustomer();
    });
}