// reports.js - Investment Report Generation and Export

/**
 * Generate Investment Report for a Customer
 */
async function generateCustomerReport(email, startDate, endDate) {
    const users = typeof listUsers === 'function'
        ? await listUsers()
        : (JSON.parse(localStorage.getItem('users')) || []);
    const user = users.find(u => u.email === email);
    
    if (!user) {
        alert('❌ User not found');
        return null;
    }

    const investments = JSON.parse(localStorage.getItem(`investments_${email}`)) || {};
    const reportData = {
        customer: {
            name: user.name,
            email: user.email,
            joinDate: new Date(user.createdAt).toLocaleDateString('en-IN')
        },
        reportGenerated: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString(),
        period: {
            start: startDate,
            end: endDate
        },
        investments: [],
        summary: {
            totalInvestment: 0,
            totalDailyReturn: 0,
            totalMonthlyReturn: 0,
            totalCount: 0
        }
    };

    Object.entries(investments).forEach(([id, inv]) => {
        const invDate = new Date(inv.date);
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (invDate >= start && invDate <= end) {
            reportData.investments.push({
                date: inv.date,
                amount: inv.amount,
                multiplier: inv.multiplier,
                dailyReturn: inv.dailyReturn,
                monthlyReturn: inv.monthlyReturn
            });

            reportData.summary.totalInvestment += inv.amount;
            reportData.summary.totalDailyReturn += inv.dailyReturn;
            reportData.summary.totalMonthlyReturn += inv.monthlyReturn;
            reportData.summary.totalCount += 1;
        }
    });

    return reportData;
}

/**
 * Generate Admin Report (All Customers)
 */
async function generateAdminReport(startDate, endDate) {
    const users = typeof listUsers === 'function'
        ? await listUsers()
        : (JSON.parse(localStorage.getItem('users')) || []);
    const reportData = {
        reportType: 'System-Wide Report',
        reportGenerated: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString(),
        period: {
            start: startDate,
            end: endDate
        },
        customers: [],
        summary: {
            totalCustomers: 0,
            totalInvestment: 0,
            totalDailyReturn: 0,
            totalMonthlyReturn: 0,
            avgInvestmentPerCustomer: 0,
            avgROI: 0
        }
    };

    users.forEach(user => {
        if (!user.isAdmin) {
            const investments = JSON.parse(localStorage.getItem(`investments_${user.email}`)) || {};
            let customerInvestment = 0;
            let customerDailyReturn = 0;
            let customerMonthlyReturn = 0;
            let investmentCount = 0;

            Object.values(investments).forEach(inv => {
                const invDate = new Date(inv.date);
                const start = new Date(startDate);
                const end = new Date(endDate);

                if (invDate >= start && invDate <= end) {
                    customerInvestment += inv.amount;
                    customerDailyReturn += inv.dailyReturn;
                    customerMonthlyReturn += inv.monthlyReturn;
                    investmentCount += 1;
                }
            });

            if (investmentCount > 0) {
                reportData.customers.push({
                    name: user.name,
                    email: user.email,
                    joinDate: new Date(user.createdAt).toLocaleDateString('en-IN'),
                    totalInvestment: customerInvestment,
                    investmentCount: investmentCount,
                    totalDailyReturn: customerDailyReturn,
                    totalMonthlyReturn: customerMonthlyReturn,
                    roi: ((customerMonthlyReturn / customerInvestment) * 100).toFixed(2)
                });

                reportData.summary.totalInvestment += customerInvestment;
                reportData.summary.totalDailyReturn += customerDailyReturn;
                reportData.summary.totalMonthlyReturn += customerMonthlyReturn;
            }
        }
    });

    reportData.summary.totalCustomers = reportData.customers.length;
    reportData.summary.avgInvestmentPerCustomer = reportData.summary.totalCustomers > 0 
        ? (reportData.summary.totalInvestment / reportData.summary.totalCustomers).toFixed(2)
        : 0;
    reportData.summary.avgROI = reportData.summary.totalInvestment > 0
        ? ((reportData.summary.totalMonthlyReturn / reportData.summary.totalInvestment) * 100).toFixed(2)
        : 0;

    return reportData;
}

/**
 * Export Report to Excel (CSV format)
 */
function exportToExcel(reportData, isAdminReport = false) {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (isAdminReport) {
        // Admin Report Header
        csvContent += 'INVESTMENT TRACKER - ADMIN REPORT\n';
        csvContent += 'Generated: ' + reportData.reportGenerated + '\n';
        csvContent += 'Period: ' + reportData.period.start + ' to ' + reportData.period.end + '\n\n';

        // Summary
        csvContent += 'SUMMARY\n';
        csvContent += 'Total Customers,' + reportData.summary.totalCustomers + '\n';
        csvContent += 'Total Investment Amount,₹' + reportData.summary.totalInvestment.toLocaleString('en-IN') + '\n';
        csvContent += 'Total Daily Return,₹' + reportData.summary.totalDailyReturn.toLocaleString('en-IN') + '\n';
        csvContent += 'Total Monthly Return,₹' + reportData.summary.totalMonthlyReturn.toLocaleString('en-IN') + '\n';
        csvContent += 'Average Investment Per Customer,₹' + reportData.summary.avgInvestmentPerCustomer.toLocaleString('en-IN') + '\n';
        csvContent += 'Average ROI,' + reportData.summary.avgROI + '%\n\n';

        // Customer Details
        csvContent += 'CUSTOMER DETAILS\n';
        csvContent += 'Customer Name,Email,Join Date,Total Investment,Investment Count,Daily Return,Monthly Return,ROI\n';
        
        reportData.customers.forEach(customer => {
            csvContent += `"${customer.name}","${customer.email}","${customer.joinDate}","₹${customer.totalInvestment.toLocaleString('en-IN')}","${customer.investmentCount}","₹${customer.totalDailyReturn.toLocaleString('en-IN')}","₹${customer.totalMonthlyReturn.toLocaleString('en-IN')}","${customer.roi}%"\n`;
        });
    } else {
        // Customer Report Header
        csvContent += 'INVESTMENT TRACKER - CUSTOMER REPORT\n';
        csvContent += 'Customer Name,' + reportData.customer.name + '\n';
        csvContent += 'Email,' + reportData.customer.email + '\n';
        csvContent += 'Member Since,' + reportData.customer.joinDate + '\n';
        csvContent += 'Report Generated,' + reportData.reportGenerated + '\n';
        csvContent += 'Period,' + reportData.period.start + ' to ' + reportData.period.end + '\n\n';

        // Summary
        csvContent += 'SUMMARY\n';
        csvContent += 'Total Investments,₹' + reportData.summary.totalInvestment.toLocaleString('en-IN') + '\n';
        csvContent += 'Number of Investments,' + reportData.summary.totalCount + '\n';
        csvContent += 'Total Daily Return,₹' + reportData.summary.totalDailyReturn.toLocaleString('en-IN') + '\n';
        csvContent += 'Total Monthly Return,₹' + reportData.summary.totalMonthlyReturn.toLocaleString('en-IN') + '\n';
        csvContent += 'ROI,' + ((reportData.summary.totalMonthlyReturn / reportData.summary.totalInvestment) * 100).toFixed(2) + '%\n\n';

        // Investment Details
        csvContent += 'INVESTMENT DETAILS\n';
        csvContent += 'Date,Amount,Multiplier,Daily Return,Monthly Return\n';
        
        reportData.investments.forEach(inv => {
            csvContent += `"${inv.date}","₹${inv.amount.toLocaleString('en-IN')}","${inv.multiplier}x","₹${inv.dailyReturn.toLocaleString('en-IN')}","₹${inv.monthlyReturn.toLocaleString('en-IN')}"\n`;
        });
    }

    downloadFile(csvContent, `investment-report-${new Date().getTime()}.csv`, 'text/csv');
}

/**
 * Export Report to PDF
 */
function exportToPDF(reportData, isAdminReport = false) {
    // Using jsPDF library
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - (2 * margin);

    // Header
    doc.setFillColor(15, 52, 96);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(isAdminReport ? '📊 ADMIN REPORT' : '📄 INVESTMENT REPORT', margin, 15);
    
    yPosition = 40;

    // Report Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated: ${reportData.reportGenerated}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Period: ${reportData.period.start} to ${reportData.period.end}`, margin, yPosition);
    yPosition += 15;

    if (isAdminReport) {
        // Admin Summary
        doc.setFontSize(12);
        doc.setTextColor(0, 212, 255);
        doc.text('SUMMARY', margin, yPosition);
        yPosition += 8;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        const summaryData = [
            ['Total Customers', reportData.summary.totalCustomers.toString()],
            ['Total Investment', '₹' + reportData.summary.totalInvestment.toLocaleString('en-IN')],
            ['Total Monthly Return', '₹' + reportData.summary.totalMonthlyReturn.toLocaleString('en-IN')],
            ['Average ROI', reportData.summary.avgROI + '%']
        ];

        summaryData.forEach(item => {
            doc.text(item[0] + ':', margin, yPosition);
            doc.text(item[1], margin + 80, yPosition);
            yPosition += 7;
        });

        yPosition += 10;

        // Customer Details Table
        doc.setFontSize(11);
        doc.setTextColor(0, 212, 255);
        doc.text('CUSTOMER DETAILS', margin, yPosition);
        yPosition += 10;

        const table = reportData.customers.map(c => [
            c.name.substring(0, 20),
            '₹' + (c.totalInvestment / 1000).toFixed(1) + 'K',
            '₹' + (c.totalMonthlyReturn / 1000).toFixed(1) + 'K',
            c.roi + '%'
        ]);

        doc.autoTable({
            head: [['Customer', 'Investment', 'Monthly Return', 'ROI']],
            body: table,
            startY: yPosition,
            margin: margin,
            theme: 'grid',
            headStyles: { fillColor: [15, 52, 96], textColor: [255, 255, 255], fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [240, 240, 240] }
        });
    } else {
        // Customer Info
        doc.setFontSize(10);
        doc.text(`Customer: ${reportData.customer.name}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Email: ${reportData.customer.email}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Member Since: ${reportData.customer.joinDate}`, margin, yPosition);
        yPosition += 15;

        // Summary
        doc.setFontSize(12);
        doc.setTextColor(0, 212, 255);
        doc.text('SUMMARY', margin, yPosition);
        yPosition += 8;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        const summaryData = [
            ['Total Investment', '₹' + reportData.summary.totalInvestment.toLocaleString('en-IN')],
            ['Number of Investments', reportData.summary.totalCount.toString()],
            ['Total Monthly Return', '₹' + reportData.summary.totalMonthlyReturn.toLocaleString('en-IN')],
            ['ROI', ((reportData.summary.totalMonthlyReturn / reportData.summary.totalInvestment) * 100).toFixed(2) + '%']
        ];

        summaryData.forEach(item => {
            doc.text(item[0] + ':', margin, yPosition);
            doc.text(item[1], margin + 80, yPosition);
            yPosition += 7;
        });

        yPosition += 10;

        // Investment Details Table
        doc.setFontSize(11);
        doc.setTextColor(0, 212, 255);
        doc.text('INVESTMENT DETAILS', margin, yPosition);
        yPosition += 10;

        const table = reportData.investments.map(inv => [
            inv.date,
            '₹' + inv.amount.toLocaleString('en-IN'),
            inv.multiplier + 'x',
            '₹' + (inv.monthlyReturn / 1000).toFixed(1) + 'K'
        ]);

        doc.autoTable({
            head: [['Date', 'Amount', 'Multiplier', 'Monthly Return']],
            body: table,
            startY: yPosition,
            margin: margin,
            theme: 'grid',
            headStyles: { fillColor: [15, 52, 96], textColor: [255, 255, 255], fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [240, 240, 240] }
        });
    }

    doc.save(`investment-report-${new Date().getTime()}.pdf`);
}

/**
 * Helper: Download File
 */
function downloadFile(content, filename, mimeType) {
    const element = document.createElement('a');
    element.setAttribute('href', content);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
