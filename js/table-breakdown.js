// Table Breakdown Component
// This script creates a detailed table breakdown of income and expenses

// Reference to global variables from script.js
// These are defined in script.js and used here
/* global budgetData, categoryIcons, categoryColors, activePeriodFilter */

// Function to create and update the table breakdown
function updateTableBreakdown() {
    const tableContainer = document.getElementById('table-breakdown-container');
    if (!tableContainer) return;
    
    tableContainer.innerHTML = '';
    
    // Get current date for filtering
    const currentMonth = 2; // March (0-indexed)
    const currentYear = 2025;
    const currentDate = new Date(currentYear, currentMonth, 15);
    
    // Calculate period start date based on filter
    let periodStartDate = new Date(currentDate);
    let periodLabel = '';
    
    switch(activePeriodFilter) {
        case 'month':
            // Set to beginning of current month
            periodStartDate.setDate(1);
            periodLabel = 'Monthly Breakdown';
            break;
        case '6month':
            // Go back 5 months (for a total of 6 months including current)
            periodStartDate.setMonth(periodStartDate.getMonth() - 5);
            periodLabel = '6-Month Breakdown';
            break;
        case 'year':
            // Go back 11 months (for a total of 12 months including current)
            periodStartDate.setMonth(periodStartDate.getMonth() - 11);
            periodLabel = 'Yearly Breakdown';
            break;
    }
    
    // Calculate monthly values
    let totalMonths = 1; // Default for monthly view
    if (activePeriodFilter === '6month') totalMonths = 6;
    if (activePeriodFilter === 'year') totalMonths = 12;
    
    // Create table container
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'table-responsive';
    
    // Create tabs for Income/Expense toggle
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'mb-3';
    tabsContainer.innerHTML = `
        <ul class="nav nav-tabs" id="breakdownTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="income-tab" data-bs-toggle="tab" data-bs-target="#income-breakdown" 
                    type="button" role="tab" aria-controls="income-breakdown" aria-selected="true">
                    <i class="fas fa-money-bill-wave me-2"></i>Income
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="expense-tab" data-bs-toggle="tab" data-bs-target="#expense-breakdown" 
                    type="button" role="tab" aria-controls="expense-breakdown" aria-selected="false">
                    <i class="fas fa-receipt me-2"></i>Expenses
                </button>
            </li>
        </ul>
    `;
    
    // Create tab content container
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    tabContent.id = 'breakdownTabContent';
    
    // Process income data
    const incomeData = processIncomeData(periodStartDate, currentDate, totalMonths);
    
    // Process expense data
    const expenseData = processExpenseData(periodStartDate, currentDate, totalMonths);
    
    // Create income tab panel
    const incomePanel = document.createElement('div');
    incomePanel.className = 'tab-pane fade show active';
    incomePanel.id = 'income-breakdown';
    incomePanel.setAttribute('role', 'tabpanel');
    incomePanel.setAttribute('aria-labelledby', 'income-tab');
    
    // Create expense tab panel
    const expensePanel = document.createElement('div');
    expensePanel.className = 'tab-pane fade';
    expensePanel.id = 'expense-breakdown';
    expensePanel.setAttribute('role', 'tabpanel');
    expensePanel.setAttribute('aria-labelledby', 'expense-tab');
    
    // Add income table
    if (incomeData.items.length > 0) {
        incomePanel.appendChild(createIncomeTable(incomeData, totalMonths));
    } else {
        incomePanel.innerHTML = '<div class="text-center text-muted py-4"><i class="fas fa-info-circle me-2"></i>No income data available for this period</div>';
    }
    
    // Add expense table
    if (expenseData.items.length > 0) {
        expensePanel.appendChild(createExpenseTable(expenseData, totalMonths));
    } else {
        expensePanel.innerHTML = '<div class="text-center text-muted py-4"><i class="fas fa-info-circle me-2"></i>No expense data available for this period</div>';
    }
    
    // Assemble the components
    tabContent.appendChild(incomePanel);
    tabContent.appendChild(expensePanel);
    
    tableContainer.appendChild(tabsContainer);
    tableContainer.appendChild(tabContent);
    
    // Add period label
    const periodLabelElement = document.createElement('div');
    periodLabelElement.className = 'text-center mt-2';
    periodLabelElement.innerHTML = `<span class="badge bg-light text-dark">${periodLabel}</span>`;
    tableContainer.appendChild(periodLabelElement);
}

// Process income data for the table
function processIncomeData(startDate, endDate, totalMonths) {
    const incomeItems = [];
    let totalIncome = 0;
    
    // Filter incomes based on time period
    budgetData.incomes.forEach(income => {
        const incomeDate = new Date(income.date);
        
        // Skip incomes outside the selected time period
        if (incomeDate < startDate || incomeDate > endDate) {
            return;
        }
        
        // Calculate monthly amount based on frequency
        let monthlyAmount = 0;
        let frequencyLabel = '';
        
        switch(income.frequency) {
            case 'weekly':
                monthlyAmount = income.amount * 4.33;
                frequencyLabel = 'Weekly';
                break;
            case 'bi-weekly':
                monthlyAmount = income.amount * 2.17;
                frequencyLabel = 'Bi-weekly';
                break;
            case 'monthly':
                monthlyAmount = income.amount;
                frequencyLabel = 'Monthly';
                break;
            case 'annually':
                monthlyAmount = income.amount / 12;
                frequencyLabel = 'Annually';
                break;
            default:
                monthlyAmount = income.amount;
                frequencyLabel = 'Monthly';
        }
        
        // Calculate total amount for the period
        const totalAmount = monthlyAmount * totalMonths;
        totalIncome += totalAmount;
        
        incomeItems.push({
            source: income.source,
            category: income.category,
            frequency: frequencyLabel,
            amount: income.amount,
            monthlyAmount: monthlyAmount,
            totalAmount: totalAmount
        });
    });
    
    // Sort by total amount (descending)
    incomeItems.sort((a, b) => b.totalAmount - a.totalAmount);
    
    return {
        items: incomeItems,
        total: totalIncome
    };
}

// Process expense data for the table
function processExpenseData(startDate, endDate, totalMonths) {
    const expenseItems = [];
    let totalExpenses = 0;
    
    // Filter expenses based on time period
    budgetData.expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        
        // Skip expenses outside the selected time period
        if (expenseDate < startDate || expenseDate > endDate) {
            return;
        }
        
        // Calculate monthly amount based on frequency
        let monthlyAmount = 0;
        let frequencyLabel = '';
        
        switch(expense.frequency) {
            case 'weekly':
                monthlyAmount = expense.amount * 4.33;
                frequencyLabel = 'Weekly';
                break;
            case 'bi-weekly':
                monthlyAmount = expense.amount * 2.17;
                frequencyLabel = 'Bi-weekly';
                break;
            case 'monthly':
                monthlyAmount = expense.amount;
                frequencyLabel = 'Monthly';
                break;
            case 'annually':
                monthlyAmount = expense.amount / 12;
                frequencyLabel = 'Annually';
                break;
            default:
                monthlyAmount = expense.amount;
                frequencyLabel = 'Monthly';
        }
        
        // Calculate total amount for the period
        const totalAmount = monthlyAmount * totalMonths;
        totalExpenses += totalAmount;
        
        expenseItems.push({
            name: expense.name,
            category: expense.category,
            frequency: frequencyLabel,
            amount: expense.amount,
            monthlyAmount: monthlyAmount,
            totalAmount: totalAmount
        });
    });
    
    // Sort by total amount (descending)
    expenseItems.sort((a, b) => b.totalAmount - a.totalAmount);
    
    return {
        items: expenseItems,
        total: totalExpenses
    };
}

// Create income table
function createIncomeTable(incomeData, totalMonths) {
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'table-responsive';
    
    const table = document.createElement('table');
    table.className = 'table table-hover table-striped';
    
    // Format currency function
    function formatCurrency(amount) {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Source</th>
            <th>Category</th>
            <th>Frequency</th>
            <th class="text-end">Amount</th>
            <th class="text-end">Monthly</th>
            <th class="text-end">Total (${totalMonths} ${totalMonths === 1 ? 'month' : 'months'})</th>
            <th class="text-end">%</th>
        </tr>
    `;
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    incomeData.items.forEach(item => {
        const percentage = (item.totalAmount / incomeData.total * 100).toFixed(1);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <i class="fas ${categoryIcons[item.category]} me-2" style="color: #198754;"></i>
                ${item.source}
            </td>
            <td><span class="category-badge bg-success bg-opacity-10 text-success">${item.category}</span></td>
            <td><span class="badge bg-info"><i class="fas fa-sync-alt me-1"></i>${item.frequency}</span></td>
            <td class="text-end">${formatCurrency(item.amount)}</td>
            <td class="text-end">${formatCurrency(item.monthlyAmount)}</td>
            <td class="text-end">${formatCurrency(item.totalAmount)}</td>
            <td class="text-end">
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar bg-success" style="width: ${percentage}%"></div>
                </div>
                <small>${percentage}%</small>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Create table footer with totals
    const tfoot = document.createElement('tfoot');
    tfoot.innerHTML = `
        <tr class="table-light fw-bold">
            <td colspan="3">Total Income</td>
            <td class="text-end">-</td>
            <td class="text-end">-</td>
            <td class="text-end">${formatCurrency(incomeData.total)}</td>
            <td class="text-end">100%</td>
        </tr>
    `;
    
    // Assemble the table
    table.appendChild(thead);
    table.appendChild(tbody);
    table.appendChild(tfoot);
    tableWrapper.appendChild(table);
    
    return tableWrapper;
}

// Create expense table
function createExpenseTable(expenseData, totalMonths) {
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'table-responsive';
    
    const table = document.createElement('table');
    table.className = 'table table-hover table-striped';
    
    // Format currency function
    function formatCurrency(amount) {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Frequency</th>
            <th class="text-end">Amount</th>
            <th class="text-end">Monthly</th>
            <th class="text-end">Total (${totalMonths} ${totalMonths === 1 ? 'month' : 'months'})</th>
            <th class="text-end">%</th>
        </tr>
    `;
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    expenseData.items.forEach(item => {
        const percentage = (item.totalAmount / expenseData.total * 100).toFixed(1);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <i class="fas ${categoryIcons[item.category]} me-2" style="color: ${categoryColors[item.category]};"></i>
                ${item.name}
            </td>
            <td><span class="category-badge" style="background-color: ${categoryColors[item.category] + '20'}; color: ${categoryColors[item.category]};">${item.category}</span></td>
            <td><span class="badge bg-info"><i class="fas fa-sync-alt me-1"></i>${item.frequency}</span></td>
            <td class="text-end">${formatCurrency(item.amount)}</td>
            <td class="text-end">${formatCurrency(item.monthlyAmount)}</td>
            <td class="text-end">${formatCurrency(item.totalAmount)}</td>
            <td class="text-end">
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar bg-danger" style="width: ${percentage}%"></div>
                </div>
                <small>${percentage}%</small>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Create table footer with totals
    const tfoot = document.createElement('tfoot');
    tfoot.innerHTML = `
        <tr class="table-light fw-bold">
            <td colspan="3">Total Expenses</td>
            <td class="text-end">-</td>
            <td class="text-end">-</td>
            <td class="text-end">${formatCurrency(expenseData.total)}</td>
            <td class="text-end">100%</td>
        </tr>
    `;
    
    // Assemble the table
    table.appendChild(thead);
    table.appendChild(tbody);
    table.appendChild(tfoot);
    tableWrapper.appendChild(table);
    
    return tableWrapper;
}

// Add CSS for the table breakdown
document.addEventListener('DOMContentLoaded', function() {
    // Add custom styles for the table breakdown
    const style = document.createElement('style');
    style.textContent = `
        .table-breakdown-container .progress {
            margin-top: 5px;
            border-radius: 10px;
            overflow: hidden;
        }
        
        .table-breakdown-container .progress-bar {
            border-radius: 10px;
        }
        
        .table-breakdown-container table {
            margin-bottom: 0;
        }
        
        .table-breakdown-container th, 
        .table-breakdown-container td {
            vertical-align: middle;
            padding: 10px 15px;
        }
        
        .table-breakdown-container thead th {
            border-top: none;
            background-color: rgba(0,0,0,0.02);
        }
        
        .table-breakdown-container .category-badge {
            font-size: 0.75rem;
        }
    `;
    document.head.appendChild(style);
});