// Initialize data structure
let budgetData = {
    incomes: [],
    expenses: []
};

// Category icons mapping
const categoryIcons = {
    // Income categories
    'Salary': 'fa-money-bill-wave',
    'Freelance': 'fa-laptop-code',
    'Investments': 'fa-chart-line',
    'Gifts': 'fa-gift',
    'Other': 'fa-circle',
    
    // Expense categories
    'Housing': 'fa-home',
    'Transportation': 'fa-car',
    'Food': 'fa-utensils',
    'Utilities': 'fa-bolt',
    'Healthcare': 'fa-heartbeat',
    'Entertainment': 'fa-film',
    'Shopping': 'fa-shopping-bag',
    'Education': 'fa-graduation-cap',
    'Personal': 'fa-user',
    'Other': 'fa-circle'
};

// Color coding for categories
const categoryColors = {
    'Housing': '#dc3545',
    'Transportation': '#fd7e14',
    'Food': '#ffc107',
    'Utilities': '#20c997',
    'Healthcare': '#0dcaf0',
    'Entertainment': '#6610f2',
    'Shopping': '#d63384',
    'Education': '#0d6efd',
    'Personal': '#6f42c1',
    'Other': '#6c757d'
};

// Toast notification setup
const successToast = new bootstrap.Toast(document.getElementById('successToast'));
function showToast(message) {
    document.getElementById('toast-message').textContent = message;
    successToast.show();
}

// Initialize charts
let expenseChart = new Chart(document.getElementById('expense-chart'), {
    type: 'doughnut',
    data: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: Object.values(categoryColors),
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 15
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const value = context.raw;
                        const percentage = Math.round((value / total) * 100);
                        return ` $${value.toFixed(2)} (${percentage}%)`;
                    }
                }
            }
        }
    }
});

let comparisonChart = new Chart(document.getElementById('comparison-chart'), {
    type: 'bar',
    data: {
        labels: ['Current Month'],
        datasets: [
            {
                label: 'Income',
                data: [0],
                backgroundColor: 'rgba(40, 167, 69, 0.7)',
                borderColor: '#28a745',
                borderWidth: 1
            },
            {
                label: 'Expenses',
                data: [0],
                backgroundColor: 'rgba(220, 53, 69, 0.7)',
                borderColor: '#dc3545',
                borderWidth: 1
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: value => `$${value}`
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: context => `${context.dataset.label}: $${context.raw.toFixed(2)}`
                }
            }
        }
    }
});

// Current active filters
let activeIncomeFilter = 'all';
let activeExpenseFilter = 'all';

// Add a time period filter variable
let activePeriodFilter = 'month'; // Default to monthly view

// Form submission handlers
document.getElementById('income-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const source = document.getElementById('income-source').value;
    const amount = parseFloat(document.getElementById('income-amount').value);
    const category = document.getElementById('income-category').value;
    const frequency = document.getElementById('income-frequency').value;
    
    if (amount <= 0) {
        showToast("Amount must be greater than zero");
        return;
    }
    
    // Use forced March 2025 date instead of current date
    const forcedYear = 2025;
    const forcedMonth = 2; // March (0-indexed)
    const forcedDate = new Date(forcedYear, forcedMonth, 15);
    const dateString = forcedDate.toISOString().split('T')[0];
    
    console.log(`Using forced date for new income: ${dateString}`);
    
    addIncome(source, amount, dateString, category, frequency);
    this.reset();
    // Set default frequency
    document.getElementById('income-frequency').value = 'monthly';
    updateSummary();
    showToast("Income added successfully!");
});

document.getElementById('expense-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('expense-name').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const frequency = document.getElementById('expense-frequency').value;
    
    if (amount <= 0) {
        showToast("Amount must be greater than zero");
        return;
    }
    
    // Use forced March 2025 date instead of current date
    const forcedYear = 2025;
    const forcedMonth = 2; // March (0-indexed)
    const forcedDate = new Date(forcedYear, forcedMonth, 15);
    const dateString = forcedDate.toISOString().split('T')[0];
    
    console.log(`Using forced date for new expense: ${dateString}`);
    
    addExpense(name, amount, dateString, category, frequency);
    this.reset();
    // Set default frequency back to monthly
    document.getElementById('expense-frequency').value = 'monthly';
    updateSummary();
    showToast("Expense added successfully!");
});

// Add income function
function addIncome(source, amount, date, category, frequency) {
    // Default to monthly if one-time was selected (removing one-time option)
    if (frequency === 'one-time') {
        frequency = 'monthly';
        console.log(`Converting one-time income to monthly: ${source}`);
    }
    
    const income = {
        id: Date.now(),
        source: source,
        amount: amount,
        date: date,
        category: category,
        frequency: frequency
    };
    
    budgetData.incomes.push(income);
    
    const listItem = document.createElement('li');
    listItem.className = 'list-group-item new-item';
    listItem.dataset.category = category;
    
    // Format frequency text
    let frequencyText = '';
    let frequencyIcon = '';
    switch(frequency) {
        case 'weekly':
            frequencyText = 'Weekly';
            frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
            break;
        case 'bi-weekly':
            frequencyText = 'Bi-weekly';
            frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
            break;
        case 'monthly':
            frequencyText = 'Monthly';
            frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
            break;
        case 'annually':
            frequencyText = 'Annually';
            frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
            break;
        default:
            // Default to monthly if somehow a one-time gets through
            frequencyText = 'Monthly';
            frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
    }
    
    listItem.innerHTML = `
        <div>
            <i class="fas ${categoryIcons[category]} me-2" style="color: #198754;"></i>
            <span>${source}</span>
            <span class="category-badge bg-success bg-opacity-10 text-success">${category}</span>
            <div class="small text-muted mt-1">
                <span class="badge bg-info">${frequencyIcon} ${frequencyText}</span>
            </div>
        </div>
        <div>
            <strong>$${amount.toFixed(2)}</strong>
            <i class="fas fa-times ms-2 delete-btn" onclick="deleteIncome(${income.id})"></i>
        </div>
    `;
    
    const incomeList = document.getElementById('income-list');
    incomeList.insertBefore(listItem, incomeList.firstChild);
    saveData();
}

// Add expense function
function addExpense(name, amount, date, category, frequency) {
    // Default to monthly if one-time was selected (removing one-time option)
    if (frequency === 'one-time') {
        frequency = 'monthly';
        console.log(`Converting one-time expense to monthly: ${name}`);
    }
    
    const expense = {
        id: Date.now(),
        name: name,
        amount: amount,
        date: date,
        category: category,
        frequency: frequency
    };
    
    budgetData.expenses.push(expense);
    
    const listItem = document.createElement('li');
    listItem.className = 'list-group-item new-item';
    listItem.dataset.category = category;
    
    // Format frequency text
    let frequencyText = '';
    let frequencyIcon = '';
    switch(frequency) {
        case 'weekly':
            frequencyText = 'Weekly';
            frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
            break;
        case 'bi-weekly':
            frequencyText = 'Bi-weekly';
            frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
            break;
        case 'monthly':
            frequencyText = 'Monthly';
            frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
            break;
        case 'annually':
            frequencyText = 'Annually';
            frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
            break;
        default:
            // Default to monthly if somehow a one-time gets through
            frequencyText = 'Monthly';
            frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
    }
    
    listItem.innerHTML = `
        <div>
            <i class="fas ${categoryIcons[category]} me-2" style="color: ${categoryColors[category]};"></i>
            <span>${name}</span>
            <span class="category-badge" style="background-color: ${categoryColors[category] + '20'}; color: ${categoryColors[category]};">${category}</span>
            <div class="small text-muted mt-1">
                <span class="badge bg-info">${frequencyIcon} ${frequencyText}</span>
            </div>
        </div>
        <div>
            <strong>$${amount.toFixed(2)}</strong>
            <i class="fas fa-times ms-2 delete-btn" onclick="deleteExpense(${expense.id})"></i>
        </div>
    `;
    
    const expenseList = document.getElementById('expense-list');
    expenseList.insertBefore(listItem, expenseList.firstChild);
    updateExpenseChart();
    saveData();
}

// Delete functions
function deleteIncome(id) {
    budgetData.incomes = budgetData.incomes.filter(income => income.id !== id);
    updateIncomeList();
    updateSummary();
    saveData();
    showToast("Income deleted");
}

function deleteExpense(id) {
    budgetData.expenses = budgetData.expenses.filter(expense => expense.id !== id);
    updateExpenseList();
    updateSummary();
    updateExpenseChart();
    saveData();
    showToast("Expense deleted");
}

// Update display functions
function updateIncomeList() {
    const incomeList = document.getElementById('income-list');
    incomeList.innerHTML = '';
    
    // Filter incomes
    const filteredIncomes = activeIncomeFilter === 'all' 
        ? budgetData.incomes 
        : budgetData.incomes.filter(income => income.category === activeIncomeFilter);
    
    // Sort by ID (most recent first)
    filteredIncomes.sort((a, b) => b.id - a.id);
    
    filteredIncomes.forEach(income => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.dataset.category = income.category;
        
        // Format frequency text
        let frequencyText = '';
        let frequencyIcon = '';
        switch(income.frequency) {
            case 'weekly':
                frequencyText = 'Weekly';
                frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
                break;
            case 'bi-weekly':
                frequencyText = 'Bi-weekly';
                frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
                break;
            case 'monthly':
                frequencyText = 'Monthly';
                frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
                break;
            case 'annually':
                frequencyText = 'Annually';
                frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
                break;
            default:
                // Convert one-time to monthly for display
                frequencyText = 'Monthly';
                frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
                income.frequency = 'monthly'; // Update the object
        }
        
        listItem.innerHTML = `
            <div>
                <i class="fas ${categoryIcons[income.category]} me-2" style="color: #198754;"></i>
                <span>${income.source}</span>
                <span class="category-badge bg-success bg-opacity-10 text-success">${income.category}</span>
                <div class="small text-muted mt-1">
                    <span class="badge bg-info">${frequencyIcon} ${frequencyText}</span>
                </div>
            </div>
            <div>
                <strong>$${income.amount.toFixed(2)}</strong>
                <i class="fas fa-times ms-2 delete-btn" onclick="deleteIncome(${income.id})"></i>
            </div>
        `;
        
        incomeList.appendChild(listItem);
    });
    
    // Show "no data" message if empty
    if (filteredIncomes.length === 0) {
        incomeList.innerHTML = '<li class="list-group-item text-center text-muted">No income data to display</li>';
    }
}

function updateExpenseList() {
    const expenseList = document.getElementById('expense-list');
    expenseList.innerHTML = '';
    
    // Filter expenses
    const filteredExpenses = activeExpenseFilter === 'all' 
        ? budgetData.expenses 
        : budgetData.expenses.filter(expense => expense.category === activeExpenseFilter);
    
    // Sort by ID (most recent first)
    filteredExpenses.sort((a, b) => b.id - a.id);
    
    filteredExpenses.forEach(expense => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.dataset.category = expense.category;
        
        // Format frequency text
        let frequencyText = '';
        let frequencyIcon = '';
        switch(expense.frequency) {
            case 'weekly':
                frequencyText = 'Weekly';
                frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
                break;
            case 'bi-weekly':
                frequencyText = 'Bi-weekly';
                frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
                break;
            case 'monthly':
                frequencyText = 'Monthly';
                frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
                break;
            case 'annually':
                frequencyText = 'Annually';
                frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
                break;
            default:
                // Convert one-time to monthly for display
                frequencyText = 'Monthly';
                frequencyIcon = '<i class="fas fa-sync-alt me-1"></i>';
                expense.frequency = 'monthly'; // Update the object
        }
        
        listItem.innerHTML = `
            <div>
                <i class="fas ${categoryIcons[expense.category]} me-2" style="color: ${categoryColors[expense.category]};"></i>
                <span>${expense.name}</span>
                <span class="category-badge" style="background-color: ${categoryColors[expense.category] + '20'}; color: ${categoryColors[expense.category]};">${expense.category}</span>
                <div class="small text-muted mt-1">
                    <span class="badge bg-info">${frequencyIcon} ${frequencyText}</span>
                </div>
            </div>
            <div>
                <strong>$${expense.amount.toFixed(2)}</strong>
                <i class="fas fa-times ms-2 delete-btn" onclick="deleteExpense(${expense.id})"></i>
            </div>
        `;
        
        expenseList.appendChild(listItem);
    });
    
    // Show "no data" message if empty
    if (filteredExpenses.length === 0) {
        expenseList.innerHTML = '<li class="list-group-item text-center text-muted">No expense data to display</li>';
    }
}

function updateSummary() {
    // Force current date to be March 2025 to match the monthly breakdown
    // IMPORTANT: We hardcode the month to be March (2) since JavaScript months are 0-indexed
    const currentMonth = 2; // March (0-indexed)
    const currentYear = 2025;
    const currentDate = new Date(currentYear, currentMonth, 15); // Middle of March
    
    console.log(`Forcing summary calculations with month: ${currentMonth + 1}/${currentYear} and period: ${activePeriodFilter}`);
    
    // Get filtered income and expenses based on time period
    const { totalIncome, totalExpenses, periodLabel } = calculateFinancials(currentDate, activePeriodFilter);
    const balance = totalIncome - totalExpenses;
    
    // Update the summary UI
    document.getElementById('total-income').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `$${totalExpenses.toFixed(2)}`;
    
    const balanceElement = document.getElementById('balance');
    balanceElement.textContent = `$${balance.toFixed(2)}`;
    balanceElement.className = balance >= 0 ? 'text-success' : 'text-danger';
    
    // Update the time period display
    document.getElementById('time-period-display').textContent = periodLabel;
    
    // Update all charts and statistics to reflect the new time period
    updateComparisonChart(totalIncome, totalExpenses);
    updateExpenseChart();
    updateStatistics();
    
    // Update combined transactions table
    updateCombinedTransactions();
}

function updateExpenseChart() {
    // Don't try to update if the chart container doesn't exist
    const expenseChartCanvas = document.getElementById('expense-chart');
    if (!expenseChartCanvas) return;
    
    try {
        // Get expense data by category
        const categoryTotals = {};
        const now = new Date();
        
        // Use the forced date for consistency
        const forcedYear = 2025;
        const forcedMonth = 2; // March (0-indexed)
        const forcedDate = new Date(forcedYear, forcedMonth, 15);
        
        // Determine time period
        let periodStartDate = new Date(forcedDate);
        periodStartDate.setDate(1);
        let months = 1;
        
        if (activePeriodFilter === '6month') {
            periodStartDate.setMonth(periodStartDate.getMonth() - 5);
            months = 6;
        } else if (activePeriodFilter === 'year') {
            periodStartDate.setMonth(periodStartDate.getMonth() - 11);
            months = 12;
        }
        
        // Process expenses in batches to avoid freezing
        const expensesToProcess = [...budgetData.expenses];
        const batchSize = 50; // Process 50 expenses at a time
        
        function processBatch() {
            const batch = expensesToProcess.splice(0, batchSize);
            
            if (batch.length === 0) {
                // All batches processed, update the chart
                finishChartUpdate();
                return;
            }
            
            batch.forEach(expense => {
                const expenseDate = new Date(expense.date);
                
                // Skip future expenses
                if (expenseDate > forcedDate) return;
                
                // Skip expenses outside our period
                if (expenseDate < periodStartDate) return;
                
                // Calculate monthly amount based on frequency
                let monthlyAmount = 0;
                
                switch(expense.frequency) {
                    case 'weekly':
                        monthlyAmount = expense.amount * 4.33;
                        break;
                    case 'bi-weekly':
                        monthlyAmount = expense.amount * 2.17;
                        break;
                    case 'monthly':
                        monthlyAmount = expense.amount;
                        break;
                    case 'annually':
                        monthlyAmount = expense.amount / 12;
                        break;
                    default:
                        monthlyAmount = expense.amount;
                }
                
                // Multiply by number of months in the period
                const totalAmount = monthlyAmount * months;
                
                // Add to category total
                if (categoryTotals[expense.category]) {
                    categoryTotals[expense.category] += totalAmount;
                } else {
                    categoryTotals[expense.category] = totalAmount;
                }
            });
            
            // Process next batch using requestAnimationFrame to avoid UI blocking
            window.requestAnimationFrame(processBatch);
        }
        
        function finishChartUpdate() {
            // Filter out categories with zero or negative values
            const filteredCategories = Object.keys(categoryTotals)
                .filter(category => categoryTotals[category] > 0);
            
            // Sort categories by amount (descending)
            filteredCategories.sort((a, b) => categoryTotals[b] - categoryTotals[a]);
            
            // Prepare chart data
            const chartLabels = filteredCategories;
            const chartData = filteredCategories.map(category => categoryTotals[category]);
            const chartColors = filteredCategories.map(category => categoryColors[category] || '#6c757d');
            
            // Update expense chart
            expenseChart.data.labels = chartLabels;
            expenseChart.data.datasets[0].data = chartData;
            expenseChart.data.datasets[0].backgroundColor = chartColors;
            expenseChart.update();
            
            // Also update comparison chart
            const { totalIncome, totalExpenses } = calculateFinancials(forcedDate, activePeriodFilter);
            updateComparisonChart(totalIncome, totalExpenses);
            
            // Update top expenses list
            updateStatistics();
        }
        
        // Start batch processing
        processBatch();
        
    } catch (error) {
        console.error("Error updating expense chart:", error);
    }
}

function updateComparisonChart(totalIncome, totalExpenses) {
    // Update chart label based on active period filter
    let chartLabel = 'Current Month';
    if (activePeriodFilter === '6month') {
        chartLabel = '6 Months';
    } else if (activePeriodFilter === 'year') {
        chartLabel = 'Full Year';
    }
    
    comparisonChart.data.labels = [chartLabel];
    comparisonChart.data.datasets[0].data = [totalIncome];
    comparisonChart.data.datasets[1].data = [totalExpenses];
    comparisonChart.update();
}

function updateStatistics() {
    // Update top expenses by category
    const topExpensesElement = document.getElementById('top-expenses');
    topExpensesElement.innerHTML = '';
    
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
            periodLabel = ' (Monthly)';
            break;
        case '6month':
            // Go back 5 months (for a total of 6 months including current)
            periodStartDate.setMonth(periodStartDate.getMonth() - 5);
            periodLabel = ' (6 Months)';
            break;
        case 'year':
            // Go back 11 months (for a total of 12 months including current)
            periodStartDate.setMonth(periodStartDate.getMonth() - 11);
            periodLabel = ' (Yearly)';
            break;
    }
    
    // Update title to include time period
    const topExpensesTitle = document.querySelector('#top-expenses').closest('.card-body').querySelector('.card-title');
    topExpensesTitle.textContent = `Top Expense Categories${periodLabel}`;
    
    // Calculate monthly values
    let totalMonths = 1; // Default for monthly view
    if (activePeriodFilter === '6month') totalMonths = 6;
    if (activePeriodFilter === 'year') totalMonths = 12;
    
    const expensesByCategory = {};
    
    // Filter expenses based on time period and calculate their impact
    budgetData.expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        
        // Skip expenses outside the selected time period
        if (expenseDate < periodStartDate || expenseDate > currentDate) {
            return;
        }
        
        // Calculate monthly amount based on frequency
        let monthlyAmount = 0;
        
        switch(expense.frequency) {
            case 'weekly':
                monthlyAmount = expense.amount * 4.33;
                break;
            case 'bi-weekly':
                monthlyAmount = expense.amount * 2.17;
                break;
            case 'monthly':
                monthlyAmount = expense.amount;
                break;
            case 'annually':
                monthlyAmount = expense.amount / 12;
                break;
            default:
                monthlyAmount = expense.amount;
        }
        
        // Multiply by number of months in period
        const totalAmount = monthlyAmount * totalMonths;
        expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + totalAmount;
    });
    
    // Sort categories by amount (descending)
    const sortedCategories = Object.keys(expensesByCategory).sort((a, b) => 
        expensesByCategory[b] - expensesByCategory[a]
    );
    
    // Display top 5 categories
    const topCategories = sortedCategories.slice(0, 5);
    
    if (topCategories.length === 0) {
        topExpensesElement.innerHTML = '<li class="list-group-item text-center text-muted">No expense data</li>';
    } else {
        const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
        
        topCategories.forEach(category => {
            const amount = expensesByCategory[category];
            const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
            
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            listItem.innerHTML = `
                <div>
                    <i class="fas ${categoryIcons[category]} me-2" style="color: ${categoryColors[category]};"></i>
                    ${category}
                </div>
                <div>
                    <strong>$${amount.toFixed(2)}</strong>
                    <span class="ms-2 badge bg-secondary">${percentage}%</span>
                </div>
            `;
            
            topExpensesElement.appendChild(listItem);
        });
    }
    
    // Update monthly/yearly summary with the current filter
    updateMonthlySummary();
}

function updateMonthlySummary() {
    const monthlySummaryElement = document.getElementById('monthly-summary');
    monthlySummaryElement.innerHTML = '';
    
    // First check if there's any data at all
    if (budgetData.incomes.length === 0 && budgetData.expenses.length === 0) {
        monthlySummaryElement.innerHTML = '<div class="text-center text-muted">Enter income or expenses to see financial breakdown</div>';
        return; // Exit early if no data
    }
    
    // Get current date and time period settings
    const currentMonth = 2; // March (0-indexed)
    const currentYear = 2025;
    const currentDate = new Date(currentYear, currentMonth, 15);
    
    // Calculate title and time range based on active filter
    let titleText = '';
    let timeRangeText = '';
    let totalMonths = 12; // Default for yearly view
    
    switch(activePeriodFilter) {
        case 'month':
            titleText = '1-Month Financial Summary';
            timeRangeText = currentDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
            totalMonths = 1;
            break;
        case '6month':
            titleText = '6-Month Financial Summary';
            const sixMonthStartDate = new Date(currentDate);
            sixMonthStartDate.setMonth(sixMonthStartDate.getMonth() - 5);
            timeRangeText = `${sixMonthStartDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} to ${currentDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
            totalMonths = 6;
            break;
        case 'year':
            titleText = '12-Month Financial Summary';
            timeRangeText = 'Mar 2025 to Feb 2026';
            totalMonths = 12;
            break;
    }
    
    // Calculate financials based on the current time period
    const { totalIncome, totalExpenses } = calculateFinancials(currentDate, activePeriodFilter);
    const balance = totalIncome - totalExpenses;
    
    // Function to format currency with commas for thousands
    function formatCurrency(amount) {
        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    // Create a financial summary card
    const summaryCard = document.createElement('div');
    summaryCard.className = 'card shadow-sm mb-4';
    
    summaryCard.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">${titleText}</h5>
            <p class="card-text text-muted mb-4">Projected finances for ${timeRangeText}</p>
            
            <div class="row">
                <div class="col-md-4">
                    <div class="card bg-light mb-3">
                        <div class="card-body text-center">
                            <h6 class="card-subtitle mb-2 text-muted">Total Income</h6>
                            <h3 class="text-success">$${formatCurrency(totalIncome)}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light mb-3">
                        <div class="card-body text-center">
                            <h6 class="card-subtitle mb-2 text-muted">Total Expenses</h6>
                            <h3 class="text-danger">$${formatCurrency(totalExpenses)}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light mb-3">
                        <div class="card-body text-center">
                            <h6 class="card-subtitle mb-2 text-muted">Net Balance</h6>
                            <h3 class="${balance >= 0 ? 'text-success' : 'text-danger'}">$${formatCurrency(balance)}</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-3 text-center">
                <p class="text-muted">
                    <small>Based on ${budgetData.incomes.length} income sources and ${budgetData.expenses.length} expenses across ${totalMonths} ${totalMonths === 1 ? 'month' : 'months'}</small>
                </p>
            </div>
        </div>
    `;
    
    monthlySummaryElement.appendChild(summaryCard);
    
    console.log(`Financial Summary updated for ${activePeriodFilter} view`);
    console.log(`Income: $${totalIncome.toFixed(2)}, Expenses: $${totalExpenses.toFixed(2)}, Balance: $${balance.toFixed(2)}`);
}

// Filter click handlers
document.querySelectorAll('.income-filter').forEach(filter => {
    filter.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active filter
        activeIncomeFilter = this.dataset.filter;
        
        // Update UI
        document.querySelectorAll('.income-filter').forEach(f => 
            f.classList.remove('filter-active')
        );
        this.classList.add('filter-active');
        
        // Update list
        updateIncomeList();
    });
});

document.querySelectorAll('.expense-filter').forEach(filter => {
    filter.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active filter
        activeExpenseFilter = this.dataset.filter;
        
        // Update UI
        document.querySelectorAll('.expense-filter').forEach(f => 
            f.classList.remove('filter-active')
        );
        this.classList.add('filter-active');
        
        // Update list
        updateExpenseList();
    });
});

// Export functionality
document.getElementById('export-btn').addEventListener('click', function() {
    const dataStr = JSON.stringify(budgetData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `budget_data_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Budget data exported successfully');
});

// Reset functionality
document.getElementById('reset-btn').addEventListener('click', function() {
    // Show confirmation modal
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    document.getElementById('confirmModalTitle').textContent = 'Reset Budget Data';
    document.getElementById('confirmModalBody').textContent = 'Are you sure you want to reset all budget data? This action cannot be undone.';
    
    // Set up confirm button
    const confirmBtn = document.getElementById('confirmModalBtn');
    confirmBtn.addEventListener('click', function resetHandler() {
        budgetData = {
            incomes: [],
            expenses: []
        };
        
        saveData();
        updateIncomeList();
        updateExpenseList();
        updateSummary();
        updateExpenseChart();
        
        confirmModal.hide();
        showToast('Budget data has been reset');
        
        // Remove event handler to prevent multiple bindings
        confirmBtn.removeEventListener('click', resetHandler);
    }, { once: true });
    
    confirmModal.show();
});

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Debounce function to prevent excessive calculations
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    // Original load data call with error handling
    try {
        loadData();
        
        // Check for pending loan expenses from loan calculator page
        checkPendingLoanExpenses();
        
        // Set up the time period filter buttons
        const timeFilterButtons = document.querySelectorAll('.time-filter');
        timeFilterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Update active button
                timeFilterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Update the active filter
                activePeriodFilter = this.dataset.period;
                
                // Use requestAnimationFrame for smoother UI updates
                window.requestAnimationFrame(() => {
                    // Update the summary and all charts/statistics
                    updateSummary();
                    
                    // Log the change
                    console.log(`Time period filter changed to: ${activePeriodFilter}`);
                });
            });
        });
        
        // Update all UI elements with loaded data
        updateIncomeList();
        updateExpenseList();
        updateSummary();
    } catch (error) {
        console.error("Error initializing budget app:", error);
        showToast("Error loading data. Please try refreshing the page.");
    }
});

// Save data to localStorage
function saveData() {
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
}

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('budgetData');
    if (savedData) {
        budgetData = JSON.parse(savedData);
        let dataChanged = false;
        
        // Ensure compatibility with older versions and FIX FEBRUARY DATA
        const marchDate = '2025-03-15'; // March 15, 2025 string representation
        
        // Migrate any February data to March
        budgetData.incomes.forEach(income => {
            if (!income.date) {
                income.date = marchDate;
                dataChanged = true;
            }
            if (!income.category) {
                income.category = 'Other';
                dataChanged = true;
            }
            if (!income.frequency) {
                income.frequency = 'monthly'; // Change default to monthly
                dataChanged = true;
            }
            
            // Convert one-time to monthly
            if (income.frequency === 'one-time') {
                income.frequency = 'monthly';
                console.log(`Converting one-time income to monthly during load: ${income.source}`);
                dataChanged = true;
            }
            
            // More aggressive check for February dates - handle both string and Date objects
            const incomeDate = new Date(income.date);
            if (incomeDate.getFullYear() === 2025 && incomeDate.getMonth() === 1) { // February is month 1 (0-indexed)
                console.log(`Moving income from February to March: ${income.source} - $${income.amount}`);
                income.date = marchDate;
                dataChanged = true;
            }
            
            // Also check for "2025-02" format in the date string
            if (typeof income.date === 'string' && income.date.startsWith('2025-02')) {
                console.log(`Found February date in string format: ${income.date}`);
                income.date = marchDate;
                dataChanged = true;
            }
        });
        
        budgetData.expenses.forEach(expense => {
            if (!expense.date) {
                expense.date = marchDate;
                dataChanged = true;
            }
            if (!expense.name && expense.category) {
                expense.name = expense.category;
                dataChanged = true;
            }
            if (!expense.frequency) {
                expense.frequency = 'monthly'; // Default expenses to monthly
                dataChanged = true;
            }
            
            // Convert one-time to monthly
            if (expense.frequency === 'one-time') {
                expense.frequency = 'monthly';
                console.log(`Converting one-time expense to monthly during load: ${expense.name}`);
                dataChanged = true;
            }
            
            // More aggressive check for February dates - handle both string and Date objects
            const expenseDate = new Date(expense.date);
            if (expenseDate.getFullYear() === 2025 && expenseDate.getMonth() === 1) { // February is month 1 (0-indexed)
                console.log(`Moving expense from February to March: ${expense.name} - $${expense.amount}`);
                expense.date = marchDate;
                dataChanged = true;
            }
            
            // Also check for "2025-02" format in the date string
            if (typeof expense.date === 'string' && expense.date.startsWith('2025-02')) {
                console.log(`Found February date in string format: ${expense.date}`);
                expense.date = marchDate;
                dataChanged = true;
            }
        });
        
        // Save the corrected data only if changes were made
        if (dataChanged) {
            console.log('Saving corrected data after migration');
            saveData();
        }
        
        updateIncomeList();
        updateExpenseList();
        updateSummary();
        updateExpenseChart();
    }
}

// Save data when changes are made
['income-form', 'expense-form'].forEach(formId => {
    document.getElementById(formId).addEventListener('submit', saveData);
});

// Loan Calculator Functions
/**
 * Calculate monthly loan payment and update the UI
 */
function calculateLoan() {
    // Get form values
    const loanAmount = parseFloat(document.getElementById('loan-amount').value);
    const interestRate = parseFloat(document.getElementById('interest-rate').value) / 100 / 12; // Monthly interest rate
    const loanTerm = parseInt(document.getElementById('loan-term').value) * 12; // Months
    
    // Calculate monthly payment using formula: P = (r*PV) / (1 - (1+r)^-n)
    // Where:
    // P = Monthly Payment
    // r = Monthly Interest Rate (annual rate / 12)
    // PV = Loan Amount
    // n = Loan Term in months
    
    let monthlyPayment = 0;
    
    if (interestRate === 0) {
        // Simple division if interest rate is zero
        monthlyPayment = loanAmount / loanTerm;
    } else {
        // Standard loan formula
        monthlyPayment = (interestRate * loanAmount) / (1 - Math.pow(1 + interestRate, -loanTerm));
    }
    
    // Calculate total payment and interest
    const totalPayment = monthlyPayment * loanTerm;
    const totalInterest = totalPayment - loanAmount;
    
    // Update UI
    document.getElementById('monthly-payment').textContent = formatCurrency(monthlyPayment);
    document.getElementById('total-payment').textContent = formatCurrency(totalPayment);
    document.getElementById('total-interest').textContent = formatCurrency(totalInterest);
}

/**
 * Add the calculated monthly loan payment as an expense in the budget
 */
function addLoanPaymentAsExpense() {
    const monthlyPayment = parseFloat(document.getElementById('monthly-payment').textContent.replace(/[$,]/g, ''));
    const loanAmount = parseFloat(document.getElementById('loan-amount').value);
    const interestRate = parseFloat(document.getElementById('interest-rate').value);
    const loanTerm = parseInt(document.getElementById('loan-term').value);
    
    // Use the current date for the new expense
    const forcedYear = 2025;
    const forcedMonth = 2; // March (0-indexed)
    const forcedDate = new Date(forcedYear, forcedMonth, 15);
    const dateString = forcedDate.toISOString().split('T')[0];
    
    // Create expense name with loan details
    const expenseName = `Loan Payment ($${loanAmount} @ ${interestRate}% for ${loanTerm} years)`;
    
    // Add as a monthly expense
    addExpense(expenseName, monthlyPayment, dateString, 'Housing', 'monthly');
    
    // Update summary
    updateSummary();
    
    // Show success message
    showToast("Loan payment added as monthly expense!");
    
    // Close the modal
    const loanCalculatorModal = bootstrap.Modal.getInstance(document.getElementById('loanCalculatorModal'));
    loanCalculatorModal.hide();
}

/**
 * Check for pending loan expenses from loan calculator page
 */
function checkPendingLoanExpenses() {
    const pendingExpenses = localStorage.getItem('pendingExpenses');
    
    if (pendingExpenses) {
        try {
            const expensesList = JSON.parse(pendingExpenses);
            
            if (Array.isArray(expensesList) && expensesList.length > 0) {
                expensesList.forEach(expense => {
                    // Use the forced date for consistency
                    const forcedYear = 2025;
                    const forcedMonth = 2; // March (0-indexed)
                    const forcedDate = new Date(forcedYear, forcedMonth, 15);
                    const dateString = forcedDate.toISOString().split('T')[0];
                    
                    // Validate expense object before adding
                    if (expense && expense.name && !isNaN(expense.amount) && expense.amount > 0) {
                        // Add expense to the budget
                        addExpense(expense.name, expense.amount, dateString, 
                                  expense.category || 'Housing', expense.frequency || 'monthly');
                    }
                });
                
                // Clear pending expenses
                localStorage.removeItem('pendingExpenses');
                
                // Update UI
                window.requestAnimationFrame(() => {
                    updateSummary();
                    updateExpenseList();
                });
                
                // Show notification
                showToast(`Added ${expensesList.length} loan payment(s) as expenses`);
            }
        } catch (error) {
            console.error('Error processing pending loan expenses:', error);
            localStorage.removeItem('pendingExpenses');
            showToast("Error processing loan expenses. Please try again.");
        }
    }
}

// New helper function to calculate financials based on time period
function calculateFinancials(baseDate, periodFilter) {
    // Create a deep copy of the budgetData to avoid modifying the original
    const workingData = JSON.parse(JSON.stringify(budgetData));
    
    // Calculate period start date based on filter
    let periodStartDate = new Date(baseDate);
    periodStartDate.setDate(1); // Start from first day of month
    let periodLabel = '';
    
    switch(periodFilter) {
        case 'month':
            // Current month only
            periodLabel = baseDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
            break;
        case '6month':
            // Go back 5 months (for a total of 6 months including current)
            periodStartDate.setMonth(periodStartDate.getMonth() - 5);
            periodLabel = `${periodStartDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} - ${baseDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
            break;
        case 'year':
            // Go back 11 months (for a total of 12 months including current)
            periodStartDate.setMonth(periodStartDate.getMonth() - 11);
            periodLabel = `${periodStartDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} - ${baseDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
            break;
        default:
            // Default to current month
            periodLabel = baseDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    }
    
    console.log(`Calculating financials from ${periodStartDate.toISOString()} to ${baseDate.toISOString()}`);
    
    // Calculate monthly values
    let totalMonths = 1; // Default for monthly view
    if (periodFilter === '6month') totalMonths = 6;
    if (periodFilter === 'year') totalMonths = 12;
    
    // Calculate total income
    const totalIncome = workingData.incomes.reduce((sum, income) => {
        const incomeStartDate = new Date(income.date);
        
        // Skip future incomes that haven't started yet
        if (incomeStartDate > baseDate) {
            return sum;
        }
        
        // Calculate based on frequency and period
        let monthlyAmount = 0;
        
        switch(income.frequency) {
            case 'weekly':
                // Approximately 4.33 weeks per month
                monthlyAmount = income.amount * 4.33;
                break;
            case 'bi-weekly':
                // Approximately 2.17 bi-weekly periods per month
                monthlyAmount = income.amount * 2.17;
                break;
            case 'monthly':
                monthlyAmount = income.amount;
                break;
            case 'annually':
                // Distribute annual amount evenly across months
                monthlyAmount = income.amount / 12;
                break;
            default:
                // Default to monthly
                monthlyAmount = income.amount;
        }
        
        // For recurring incomes, multiply by the number of months in the period
        return sum + (monthlyAmount * totalMonths);
    }, 0);
    
    // Calculate total expenses
    const totalExpenses = workingData.expenses.reduce((sum, expense) => {
        const expenseStartDate = new Date(expense.date);
        
        // Skip future expenses that haven't started yet
        if (expenseStartDate > baseDate) {
            return sum;
        }
        
        // Calculate based on frequency and period
        let monthlyAmount = 0;
        
        switch(expense.frequency) {
            case 'weekly':
                // Approximately 4.33 weeks per month
                monthlyAmount = expense.amount * 4.33;
                break;
            case 'bi-weekly':
                // Approximately 2.17 bi-weekly periods per month
                monthlyAmount = expense.amount * 2.17;
                break;
            case 'monthly':
                monthlyAmount = expense.amount;
                break;
            case 'annually':
                // Distribute annual amount evenly across months
                monthlyAmount = expense.amount / 12;
                break;
            default:
                // Default to monthly
                monthlyAmount = expense.amount;
        }
        
        // For recurring expenses, multiply by the number of months in the period
        return sum + (monthlyAmount * totalMonths);
    }, 0);
    
    return { totalIncome, totalExpenses, periodLabel };
}

// Update table breakdown function
function updateTableBreakdown() {
    const breakdownContainer = document.getElementById('table-breakdown-container');
    if (!breakdownContainer) return;
    
    try {
        // Use the forced date for consistency
        const forcedYear = 2025;
        const forcedMonth = 2; // March (0-indexed)
        const baseDate = new Date(forcedYear, forcedMonth, 15);
        
        // Set default time period
        let months = 1;
        if (activePeriodFilter === '6month') months = 6;
        if (activePeriodFilter === 'year') months = 12;
        
        // Prep data in memory before DOM manipulation
        let monthlyData = [];
        let totalBalance = 0;
        let totalIncome = 0;
        let totalExpense = 0;
        
        // Calculate period start date
        let periodStartDate = new Date(baseDate);
        periodStartDate.setDate(1);
        
        if (activePeriodFilter === '6month') {
            periodStartDate.setMonth(periodStartDate.getMonth() - 5);
        } else if (activePeriodFilter === 'year') {
            periodStartDate.setMonth(periodStartDate.getMonth() - 11);
        }
        
        // Generate summary for each month in our period
        for (let i = 0; i < months; i++) {
            const currentMonth = new Date(periodStartDate);
            currentMonth.setMonth(currentMonth.getMonth() + i);
            
            // Calculate income for this month
            const monthlyIncome = budgetData.incomes.reduce((sum, income) => {
                const incomeDate = new Date(income.date);
                
                // Skip incomes outside our range
                if (incomeDate > baseDate) return sum;
                if (incomeDate > currentMonth) return sum;
                
                let amount = 0;
                
                switch(income.frequency) {
                    case 'weekly':
                        amount = income.amount * 4.33;  // Approx weeks per month
                        break;
                    case 'bi-weekly':
                        amount = income.amount * 2.17;  // Approx bi-weekly periods per month
                        break;
                    case 'monthly':
                        amount = income.amount;
                        break;
                    case 'annually':
                        amount = income.amount / 12;   // Distribute annual amount evenly
                        break;
                    default:
                        amount = income.amount;
                }
                
                return sum + amount;
            }, 0);
            
            // Calculate expenses for this month
            const monthlyExpense = budgetData.expenses.reduce((sum, expense) => {
                const expenseDate = new Date(expense.date);
                
                // Skip expenses outside our range
                if (expenseDate > baseDate) return sum;
                if (expenseDate > currentMonth) return sum;
                
                let amount = 0;
                
                switch(expense.frequency) {
                    case 'weekly':
                        amount = expense.amount * 4.33;
                        break;
                    case 'bi-weekly':
                        amount = expense.amount * 2.17;
                        break;
                    case 'monthly':
                        amount = expense.amount;
                        break;
                    case 'annually':
                        amount = expense.amount / 12;
                        break;
                    default:
                        amount = expense.amount;
                }
                
                return sum + amount;
            }, 0);
            
            const monthlyBalance = monthlyIncome - monthlyExpense;
            
            // Add to monthly data array
            monthlyData.push({
                month: currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
                income: monthlyIncome,
                expense: monthlyExpense,
                balance: monthlyBalance
            });
            
            // Update totals
            totalIncome += monthlyIncome;
            totalExpense += monthlyExpense;
        }
        
        totalBalance = totalIncome - totalExpense;
        
        // Build HTML table
        const tableHTML = `
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>Period</th>
                        <th class="text-end">Income</th>
                        <th class="text-end">Expenses</th>
                        <th class="text-end">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${monthlyData.map(data => `
                        <tr>
                            <td>${data.month}</td>
                            <td class="text-end text-success">$${formatMoney(data.income)}</td>
                            <td class="text-end text-danger">$${formatMoney(data.expense)}</td>
                            <td class="text-end ${data.balance >= 0 ? 'text-success' : 'text-danger'}">
                                ${data.balance >= 0 ? '+' : ''}$${formatMoney(Math.abs(data.balance))}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot class="table-light fw-bold">
                    <tr>
                        <td>Total (${monthlyData.length} entries)</td>
                        <td class="text-end text-success">$${formatMoney(totalIncome)}</td>
                        <td class="text-end text-danger">$${formatMoney(totalExpense)}</td>
                        <td class="text-end ${totalBalance >= 0 ? 'text-success' : 'text-danger'}">
                            ${totalBalance >= 0 ? '+' : ''}$${formatMoney(Math.abs(totalBalance))}
                        </td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        // Use a single DOM update
        breakdownContainer.innerHTML = tableHTML;
        
    } catch (error) {
        console.error("Error updating table breakdown:", error);
        breakdownContainer.innerHTML = '<div class="alert alert-danger">Error generating breakdown table</div>';
    }
    
    // Helper function for formatting money values
    function formatMoney(amount) {
        return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
}

// Update combined transactions table
function updateCombinedTransactions() {
    const transactionsContainer = document.getElementById('combined-transactions-container');
    if (!transactionsContainer) return;
    
    transactionsContainer.innerHTML = '';
    
    // First check if there's any data at all
    if (budgetData.incomes.length === 0 && budgetData.expenses.length === 0) {
        transactionsContainer.innerHTML = '<div class="text-center text-muted">Enter income or expenses to see transactions</div>';
        return; // Exit early if no data
    }
    
    // Add filter controls
    const filterDiv = document.createElement('div');
    filterDiv.className = 'mb-3';
    filterDiv.innerHTML = `
        <div class="btn-group btn-group-sm mb-3" role="group" aria-label="Transaction filters">
            <button type="button" class="btn btn-outline-primary active" data-filter="all">All Transactions</button>
            <button type="button" class="btn btn-outline-success" data-filter="income">Income Only</button>
            <button type="button" class="btn btn-outline-danger" data-filter="expense">Expenses Only</button>
        </div>
    `;
    transactionsContainer.appendChild(filterDiv);
    
    // Add event listeners to filter buttons
    const filterButtons = filterDiv.querySelectorAll('button');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter transactions
            const filterType = this.dataset.filter;
            renderTransactionsTable(filterType);
        });
    });
    
    // Render the initial table with all transactions
    renderTransactionsTable('all');
    
    function renderTransactionsTable(filterType) {
        // Combine both income and expense data
        const combinedTransactions = [];
        
        // Add incomes to combined array if needed
        if (filterType === 'all' || filterType === 'income') {
            budgetData.incomes.forEach(income => {
                combinedTransactions.push({
                    id: income.id,
                    date: income.date,
                    name: income.source,
                    category: income.category,
                    amount: income.amount,
                    frequency: income.frequency,
                    type: 'income'
                });
            });
        }
        
        // Add expenses to combined array if needed
        if (filterType === 'all' || filterType === 'expense') {
            budgetData.expenses.forEach(expense => {
                combinedTransactions.push({
                    id: expense.id,
                    date: expense.date,
                    name: expense.name,
                    category: expense.category,
                    amount: expense.amount,
                    frequency: expense.frequency,
                    type: 'expense'
                });
            });
        }
        
        // Sort by date (most recent first)
        combinedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Clear previous table if any
        const existingTable = transactionsContainer.querySelector('.table-responsive');
        if (existingTable) {
            existingTable.remove();
        }
        
        // Clear previous note if any
        const existingNote = transactionsContainer.querySelector('.small.text-muted');
        if (existingNote) {
            existingNote.remove();
        }
        
        // Create a responsive table
        const table = document.createElement('div');
        table.className = 'table-responsive';
        
        // Show message if no transactions match filter
        if (combinedTransactions.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'text-center text-muted my-3';
            emptyMessage.textContent = `No ${filterType === 'all' ? 'transactions' : filterType} data to display`;
            transactionsContainer.appendChild(emptyMessage);
            return;
        }
        
        // Format money with commas
        function formatMoney(amount) {
            return amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        
        // Format frequency text
        function getFrequencyText(frequency) {
            switch(frequency) {
                case 'weekly': return 'Weekly';
                case 'bi-weekly': return 'Bi-weekly';
                case 'monthly': return 'Monthly';
                case 'annually': return 'Annually';
                default: return 'Monthly';
            }
        }
        
        let tableHTML = `
            <table class="table table-sm table-hover">
                <thead class="table-light">
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Category</th>
                        <th scope="col">Frequency</th>
                        <th scope="col" class="text-end">Amount</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add each transaction as a row
        combinedTransactions.forEach(transaction => {
            const isIncome = transaction.type === 'income';
            const amountClass = isIncome ? 'text-success' : 'text-danger';
            const icon = isIncome ? 
                categoryIcons[transaction.category] || 'fa-circle' : 
                categoryIcons[transaction.category] || 'fa-circle';
            const iconColor = isIncome ? '#198754' : categoryColors[transaction.category] || '#6c757d';
            const frequencyText = getFrequencyText(transaction.frequency);
            
            tableHTML += `
                <tr class="transaction-row-${transaction.type}">
                    <td>
                        <i class="fas ${icon} me-2" style="color: ${iconColor};"></i>
                        ${transaction.name}
                    </td>
                    <td>
                        <span class="badge ${isIncome ? 'bg-success bg-opacity-10 text-success' : ''}" 
                            ${!isIncome ? `style="background-color: ${categoryColors[transaction.category] + '20'}; color: ${categoryColors[transaction.category]};"` : ''}>
                            ${transaction.category}
                        </span>
                    </td>
                    <td>
                        <small class="badge bg-info">
                            <i class="fas fa-sync-alt me-1"></i> ${frequencyText}
                        </small>
                    </td>
                    <td class="text-end ${amountClass}">
                        ${isIncome ? '+' : '-'}$${formatMoney(transaction.amount)}
                    </td>
                </tr>
            `;
        });
        
        // Add totals row
        const totalAmount = combinedTransactions.reduce((sum, transaction) => {
            return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
        }, 0);
        
        tableHTML += `
                </tbody>
                <tfoot class="table-light fw-bold">
                    <tr>
                        <td colspan="3">Total (${combinedTransactions.length} entries)</td>
                        <td class="text-end ${totalAmount >= 0 ? 'text-success' : 'text-danger'}">
                            ${totalAmount >= 0 ? '+' : ''}$${formatMoney(Math.abs(totalAmount))}
                        </td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        table.innerHTML = tableHTML;
        transactionsContainer.appendChild(table);
        
        // Add a small note about the calculation
        const note = document.createElement('div');
        note.className = 'small text-muted text-center mt-2';
        
        if (filterType === 'all') {
            note.textContent = 'All income and expense transactions';
        } else if (filterType === 'income') {
            note.textContent = 'Income transactions only';
        } else {
            note.textContent = 'Expense transactions only';
        }
        
        transactionsContainer.appendChild(note);
    }
}