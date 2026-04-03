// chart-config.js - Chart.js Configuration for all dashboards

// Chart color scheme
const CHART_COLORS = {
    primary: '#0f3460',
    secondary: '#16213e',
    accent: '#00d4ff',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',
    light: '#ecf0f1'
};

/**
 * Create Investment Distribution Chart (Pie Chart)
 */
function createInvestmentDistributionChart(containerSelector, investmentData) {
    const ctx = document.querySelector(containerSelector);
    if (!ctx) return;

    const labels = investmentData.map(item => item.name || 'Unnamed');
    const data = investmentData.map(item => item.amount);
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
    ];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, data.length),
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12, weight: 600 },
                        color: '#0f3460',
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '₹' + context.parsed.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create Investment Growth Over Time Chart (Line Chart)
 */
function createInvestmentGrowthChart(containerSelector, chartData) {
    const ctx = document.querySelector(containerSelector);
    if (!ctx) return;

    const months = chartData.map(item => item.month);
    const investments = chartData.map(item => item.investment);
    const returns = chartData.map(item => item.returns);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Investment Amount',
                    data: investments,
                    borderColor: '#0f3460',
                    backgroundColor: 'rgba(15, 52, 96, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#0f3460',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                },
                {
                    label: 'Returns Generated',
                    data: returns,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#00d4ff',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        font: { size: 12, weight: 600 },
                        color: '#0f3460',
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        },
                        color: '#666'
                    },
                    grid: {
                        color: '#f0f0f0'
                    }
                },
                x: {
                    ticks: {
                        color: '#666'
                    },
                    grid: {
                        color: '#f0f0f0'
                    }
                }
            }
        }
    });
}

/**
 * Create Monthly Performance Chart (Bar Chart)
 */
function createMonthlyPerformanceChart(containerSelector, performanceData) {
    const ctx = document.querySelector(containerSelector);
    if (!ctx) return;

    const months = performanceData.map(item => item.month);
    const dailyReturn = performanceData.map(item => item.dailyReturn);
    const monthlyReturn = performanceData.map(item => item.monthlyReturn);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Daily Return (₹)',
                    data: dailyReturn,
                    backgroundColor: '#667eea',
                    borderRadius: 8,
                    borderSkipped: false
                },
                {
                    label: 'Monthly Return (₹)',
                    data: monthlyReturn,
                    backgroundColor: '#00d4ff',
                    borderRadius: 8,
                    borderSkipped: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        font: { size: 12, weight: 600 },
                        color: '#0f3460',
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        },
                        color: '#666'
                    },
                    grid: {
                        color: '#f0f0f0'
                    }
                },
                x: {
                    ticks: {
                        color: '#666'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Create ROI Comparison Chart (Horizontal Bar)
 */
function createROIChart(containerSelector, roiData) {
    const ctx = document.querySelector(containerSelector);
    if (!ctx) return;

    const customers = roiData.map(item => item.name);
    const roi = roiData.map(item => item.roi);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: customers,
            datasets: [{
                label: 'ROI (%)',
                data: roi,
                backgroundColor: roi.map(r => r >= 15 ? '#27ae60' : r >= 10 ? '#f39c12' : '#e74c3c'),
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: { size: 12, weight: 600 },
                        color: '#0f3460'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.x.toFixed(2) + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        },
                        color: '#666'
                    },
                    grid: {
                        color: '#f0f0f0'
                    }
                },
                y: {
                    ticks: {
                        color: '#666'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Create Portfolio Allocation Chart (Stacked Bar)
 */
function createPortfolioAllocationChart(containerSelector, allocationData) {
    const ctx = document.querySelector(containerSelector);
    if (!ctx) return;

    const categories = Object.keys(allocationData);
    const values = Object.values(allocationData);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Portfolio Allocation'],
            datasets: categories.map((cat, idx) => ({
                label: cat,
                data: [values[idx]],
                backgroundColor: colors[idx % colors.length],
                borderRadius: 8
            }))
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(0) + '%';
                        },
                        color: '#666'
                    },
                    grid: {
                        color: '#f0f0f0'
                    }
                },
                y: {
                    stacked: true,
                    ticks: {
                        color: '#666'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: { size: 12, weight: 600 },
                        color: '#0f3460',
                        padding: 15
                    }
                }
            }
        }
    });
}