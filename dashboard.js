// dashboard.js - User Dashboard Functionality

const BASE_INVESTMENT = 20000;
const BASE_DAILY_RETURN = 325;
const DAYS_IN_MONTH = 16;

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = sessionStorage.getItem('loggedInUser');
    if (!currentUser) {
        window.location.href = 'signin.html';
        return;
    }
    document.getElementById('user-info').textContent = `Welcome, ${currentUser}`;
    loadUserInvestments();
});

function loadUserInvestments() {
    const currentUser = sessionStorage.getItem('loggedInUser');
    const investments = JSON.parse(localStorage.getItem(`investments_${currentUser}`)) || {};
    displayInvestments(investments);
    calculateAnalytics(investments);
}

function addInvestment() {
    const currentUser = sessionStorage.getItem('loggedInUser');
    const amount = parseInt(document.getElementById('investment-amount').value);
    
    if (isNaN(amount) || amount <= 0 || amount % BASE_INVESTMENT !== 0) {
        alert('Invalid amount. Enter a multiple of ₹20,000');
        return;
    }
    
    const investments = JSON.parse(localStorage.getItem(`investments_${currentUser}`)) || {};
    const multiplier = amount / BASE_INVESTMENT;
    const dailyReturn = BASE_DAILY_RETURN * multiplier;
    const monthlyReturn = dailyReturn * DAYS_IN_MONTH;
    
    investments[Date.now()] = { amount, multiplier, dailyReturn, monthlyReturn };
    localStorage.setItem(`investments_${currentUser}`, JSON.stringify(investments));
    document.getElementById('investment-amount').value = '';
    loadUserInvestments();
}

function removeInvestment(id) {
    const currentUser = sessionStorage.getItem('loggedInUser');
    const investments = JSON.parse(localStorage.getItem(`investments_${currentUser}`)) || {};
    delete investments[id];
    localStorage.setItem(`investments_${currentUser}`, JSON.stringify(investments));
    loadUserInvestments();
}

function displayInvestments(investments) {
    const tbody = document.querySelector('#investments-table tbody');
    tbody.innerHTML = '';
    Object.entries(investments).forEach(([id, inv]) => {
        tbody.innerHTML += `
            <tr>
                <td>₹${inv.amount.toLocaleString('en-IN')}</td>
                <td>${inv.multiplier}x</td>
                <td>₹${inv.dailyReturn.toLocaleString('en-IN')}</td>
                <td>₹${inv.monthlyReturn.toLocaleString('en-IN')}</td>
                <td><button onclick="removeInvestment(${id})">Remove</button></td>
            </tr>
        `;
    });
}

function calculateAnalytics(investments) {
    let total = 0, daily = 0, monthly = 0;
    Object.values(investments).forEach(inv => {
        total += inv.amount;
        daily += inv.dailyReturn;
        monthly += inv.monthlyReturn;
    });
    document.getElementById('total-investment').innerText = `₹${total.toLocaleString('en-IN')}`;
    document.getElementById('daily-return').innerText = `₹${daily.toLocaleString('en-IN')}`;
    document.getElementById('monthly-return').innerText = `₹${monthly.toLocaleString('en-IN')}`;
}

function logout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = 'signin.html';
}
