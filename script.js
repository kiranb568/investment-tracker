// Constants
const BASE_INVESTMENT = 20000;
const BASE_DAILY_RETURN = 325;
const DAYS_IN_MONTH = 16;
const MAX_MULTIPLES = 10;

// State
let selectedInvestments = {};
let mode = 'single';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeInvestmentOptions();
    setupModeListener();
});

// Initialize investment options
function initializeInvestmentOptions() {
    const container = document.getElementById('investmentContainer');
    container.innerHTML = '';

    for (let i = 1; i <= MAX_MULTIPLES; i++) {
        const amount = BASE_INVESTMENT * i;
        const dailyReturn = BASE_DAILY_RETURN * i;
        const monthlyReturn = dailyReturn * DAYS_IN_MONTH;

        const card = document.createElement('div');
        card.className = 'investment-card';
        card.id = `investment-${amount}`;

        const inputType = mode === 'single' ? 'radio' : 'checkbox';
        const inputName = mode === 'single' ? 'investment' : `investment-${amount}`;

        card.innerHTML = `
            <label>
                <input type="${inputType}" name="${inputName}" value="${amount}" onchange="handleInvestmentChange()">
                <span>₹${amount.toLocaleString('en-IN')}</span>
            </label>
        `;

        container.appendChild(card);
    }
}

// Setup mode listener
function setupModeListener() {
    const radioButtons = document.querySelectorAll('input[name="mode"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            mode = e.target.value;
            selectedInvestments = {}; // Reset selections on mode change
            initializeInvestmentOptions();
            updateDisplay();
        });
    });
}

// Handle investment selection
function handleInvestmentChange() {
    selectedInvestments = {};

    if (mode === 'single') {
        const checked = document.querySelector('input[name="investment"]:checked');
        if (checked) {
            const amount = parseInt(checked.value);
            selectedInvestments[amount] = true;
        }
    } else {
        const checked = document.querySelectorAll('input[type="checkbox"]:checked');
        checked.forEach(checkbox => {
            const amount = parseInt(checkbox.value);
            selectedInvestments[amount] = true;
        });
    }

    // Update UI
    document.querySelectorAll('.investment-card').forEach(card => {
        const input = card.querySelector('input');
        if (input && selectedInvestments[parseInt(input.value)]) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });

    updateDisplay();
}

// Reset selection
function resetSelection() {
    selectedInvestments = {};
    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
        if (input.name !== 'mode') {
            input.checked = false;
        }
    });
    document.querySelectorAll('.investment-card').forEach(card => {
        card.classList.remove('selected');
    });
    updateDisplay();
}

// Calculate totals
function calculateTotals() {
    let totalInvestment = 0;
    let totalDailyReturn = 0;
    let totalMonthlyReturn = 0;
    const transactions = [];

    Object.keys(selectedInvestments).forEach(amount => {
        amount = parseInt(amount);
        const multiplier = amount / BASE_INVESTMENT;
        const dailyReturn = BASE_DAILY_RETURN * multiplier;
        const monthlyReturn = dailyReturn * DAYS_IN_MONTH;

        totalInvestment += amount;
        totalDailyReturn += dailyReturn;
        totalMonthlyReturn += monthlyReturn;

        transactions.push({
            investment: amount,
            multiplier: multiplier,
            dailyReturn: dailyReturn,
            monthlyReturn: monthlyReturn
        });
    });

    return {
        totalInvestment,
        totalDailyReturn,
        totalMonthlyReturn,
        transactions
    };
}

// Update display
function updateDisplay() {
    const { totalInvestment, totalDailyReturn, totalMonthlyReturn, transactions } = calculateTotals();

    // Update metrics
    document.getElementById('totalInvestment').textContent = `₹${totalInvestment.toLocaleString('en-IN')}`;
    document.getElementById('dailyReturn').textContent = `₹${totalDailyReturn.toLocaleString('en-IN')}`;
    document.getElementById('monthlyReturn').textContent = `₹${totalMonthlyReturn.toLocaleString('en-IN')}`;
    document.getElementById('principal').textContent = `₹${totalInvestment.toLocaleString('en-IN')}`;

    // Update transactions table
    const tbody = document.getElementById('transactionBody');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Select an investment to see details</td></tr>';
    } else {
        transactions.forEach(tx => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>₹${tx.investment.toLocaleString('en-IN')}</td>
                <td>${tx.multiplier}x</td>
                <td>₹${tx.dailyReturn.toLocaleString('en-IN')}</td>
                <td>₹${tx.monthlyReturn.toLocaleString('en-IN')}</td>
                <td>
                    <button class="remove-btn" onclick="removeInvestment(${tx.investment})">Remove</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Remove specific investment
function removeInvestment(amount) {
    delete selectedInvestments[amount];
    
    // Update UI
    const input = document.querySelector(`input[value="${amount}"]`);
    if (input) {
        input.checked = false;
    }
    const card = document.getElementById(`investment-${amount}`);
    if (card) {
        card.classList.remove('selected');
    }
    
    updateDisplay();
}