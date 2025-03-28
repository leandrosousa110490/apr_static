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
    const expensesByCategory = {};
    
    // Get current date for filtering
    const currentMonth = 2; // March (0-indexed)
    const currentYear = 2025;
    const currentDate = new Date(currentYear, currentMonth, 15);
    
    // Calculate period start date based on filter
    let periodStartDate = new Date(currentDate);
    
    switch(activePeriodFilter) {
        case 'month':
            // Set to beginning of current month
            periodStartDate.setDate(1);
            break;
        case '6month':
            // Go back 5 months (for a total of 6 months including current)
            periodStartDate.setMonth(periodStartDate.getMonth() - 5);
            break;
        case 'year':
            // Go back 11 months (for a total of 12 months including current)
            periodStartDate.setMonth(periodStartDate.getMonth() - 11);
            break;
    }
    
    // Filter expenses based on time period
    const filteredExpenses = budgetData.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= periodStartDate && expenseDate <= currentDate;
    });
    
    // Calculate totals by category using the filtered expenses
    filteredExpenses.forEach(expense => {
        let monthlyAmount = 0;
        
        // Calculate monthly amount based on frequency
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
        
        // Calculate total amount based on the number of months in the period
        let totalMonths = 1;
        if (activePeriodFilter === '6month') totalMonths = 6;
        if (activePeriodFilter === 'year') totalMonths = 12;
        
        const categoryAmount = monthlyAmount * totalMonths;
        expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + categoryAmount;
    });
    
    // Sort categories by amount (descending)
    const sortedCategories = Object.keys(expensesByCategory).sort((a, b) => 
        expensesByCategory[b] - expensesByCategory[a]
    );
    
    // Add time period to chart title if not displayed elsewhere
    const chartTitle = document.querySelector('#expense-chart').closest('.card-body').querySelector('.card-title');
    let titleText = 'Expense Distribution';
    if (activePeriodFilter === 'month') {
        titleText += ' (Monthly)';
    } else if (activePeriodFilter === '6month') {
        titleText += ' (6 Months)';
    } else if (activePeriodFilter === 'year') {
        titleText += ' (Yearly)';
    }
    chartTitle.textContent = titleText;
    
    // Check if there's any data to display
    if (sortedCategories.length === 0) {
        // No expense data for this period
        // Clear the chart data
        expenseChart.data.labels = [];
        expenseChart.data.datasets[0].data = [];
        
        // Create a "No data" message if it doesn't exist yet
        let chartContainer = document.getElementById('expense-chart').parentElement;
        let noDataMsg = chartContainer.querySelector('.no-data-message');
        
        if (!noDataMsg) {
            noDataMsg = document.createElement('div');
            noDataMsg.className = 'no-data-message text-center text-muted mt-5';
            noDataMsg.style.position = 'absolute';
            noDataMsg.style.top = '50%';
            noDataMsg.style.left = '50%';
            noDataMsg.style.transform = 'translate(-50%, -50%)';
            noDataMsg.innerHTML = '<i class="fas fa-chart-pie fa-2x mb-2"></i><br>No expense data';
            chartContainer.style.position = 'relative';
            chartContainer.appendChild(noDataMsg);
        }
        
        // Make chart transparent when no data
        expenseChart.options.plugins.legend.display = false;
    } else {
        // We have data - remove no data message if it exists
        let chartContainer = document.getElementById('expense-chart').parentElement;
        let noDataMsg = chartContainer.querySelector('.no-data-message');
        if (noDataMsg) {
            noDataMsg.remove();
        }
        
        // Update chart data
        expenseChart.data.labels = sortedCategories;
        expenseChart.data.datasets[0].data = sortedCategories.map(category => expensesByCategory[category]);
        
        // Update chart colors based on category
        expenseChart.data.datasets[0].backgroundColor = sortedCategories.map(category => categoryColors[category] || '#6c757d');
        
        // Make sure legend is displayed when we have data
        expenseChart.options.plugins.legend.display = true;
    }
    
    expenseChart.update();
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

// Sample data button functionality
document.getElementById('sample-data-btn').addEventListener('click', function() {
    // Add sample data
    addSampleData();
    updateIncomeList();
    updateExpenseList();
    updateSummary();
    updateExpenseChart();
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

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Original load data call
    loadData();
    
    // Set up the time period filter buttons
    const timeFilterButtons = document.querySelectorAll('.time-filter');
    timeFilterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            timeFilterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update the active filter
            activePeriodFilter = this.dataset.period;
            
            // Update the summary and all charts/statistics
            updateSummary();
            
            // Log the change
            console.log(`Time period filter changed to: ${activePeriodFilter}`);
        });
    });
    
    // Check if there's any data - if not, add a small bit of sample data
    if (budgetData.expenses.length === 0 && budgetData.incomes.length === 0) {
        addSampleData();
        updateIncomeList();
        updateExpenseList();
        updateSummary();
        updateExpenseChart();
    }
});

// Add sample data function for testing
function addSampleData() {
    console.log("Adding sample data for testing");
    
    // Use forced March 2025 date
    const forcedYear = 2025;
    const forcedMonth = 2; // March (0-indexed)
    const forcedDate = new Date(forcedYear, forcedMonth, 15);
    const dateString = forcedDate.toISOString().split('T')[0];
    
    // Add sample income
    const sampleIncome = {
        id: Date.now(),
        source: "Sample Salary",
        amount: 3000,
        date: dateString,
        category: "Salary",
        frequency: "monthly"
    };
    budgetData.incomes.push(sampleIncome);
    
    // Add sample expenses
    const sampleExpenses = [
        {
            id: Date.now() + 1,
            name: "Rent",
            amount: 1200,
            date: dateString,
            category: "Housing",
            frequency: "monthly"
        },
        {
            id: Date.now() + 2,
            name: "Groceries",
            amount: 400,
            date: dateString,
            category: "Food",
            frequency: "monthly"
        },
        {
            id: Date.now() + 3,
            name: "Car Payment",
            amount: 300,
            date: dateString,
            category: "Transportation",
            frequency: "monthly"
        }
    ];
    
    budgetData.expenses.push(...sampleExpenses);
    
    // Save the sample data
    saveData();
    
    // Show a toast notification
    showToast("Sample data added for testing");
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
    const tableContainer = document.getElementById('table-breakdown-container');
    tableContainer.innerHTML = '';
    
    // First check if there's any data at all
    if (budgetData.incomes.length === 0 && budgetData.expenses.length === 0) {
        tableContainer.innerHTML = '<div class="text-center text-muted">Enter income or expenses to see monthly breakdown</div>';
        return; // Exit early if no data
    }
    
    // Force current date to be March 2025
    const currentMonth = 2; // March (0-indexed)
    const currentYear = 2025;
    const startDate = new Date(currentYear, currentMonth, 1);
    
    // Create an array to hold 12 months of data
    const monthlyData = [];
    
    // Set title based on active period filter
    let tableTitle = 'Monthly Breakdown';
    let months = 12; // Default to showing 12 months
    
    if (activePeriodFilter === 'month') {
        tableTitle = '1-Month Breakdown';
        months = 1;
    } else if (activePeriodFilter === '6month') {
        tableTitle = '6-Month Breakdown';
        months = 6;
    } else {
        tableTitle = '12-Month Breakdown';
    }
    
    // Generate months based on the active filter
    for (let i = 0; i < months; i++) {
        const targetDate = new Date(startDate);
        targetDate.setMonth(targetDate.getMonth() + i);
        
        const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
        const monthName = targetDate.toLocaleDateString(undefined, { month: 'short' });
        const yearNumber = targetDate.getFullYear();
        const isCurrentMonth = i === 0; // First month is current month (March 2025)
        
        monthlyData.push({
            key: monthKey,
            month: monthName,
            year: yearNumber,
            income: 0,
            expense: 0,
            balance: 0,
            isCurrentMonth: isCurrentMonth
        });
    }
    
    // Calculate monthly amount for each income
    budgetData.incomes.forEach(income => {
        let monthlyAmount = 0;
        
        // Calculate the monthly amount based on frequency
        switch(income.frequency) {
            case 'weekly':
                monthlyAmount = income.amount * 4.33;
                break;
            case 'bi-weekly':
                monthlyAmount = income.amount * 2.17;
                break;
            case 'monthly':
                monthlyAmount = income.amount;
                break;
            case 'annually':
                monthlyAmount = income.amount / 12;
                break;
            default:
                monthlyAmount = income.amount;
        }
        
        // Add this income to all months
        monthlyData.forEach(month => {
            month.income += monthlyAmount;
        });
    });
    
    // Calculate monthly amount for each expense
    budgetData.expenses.forEach(expense => {
        let monthlyAmount = 0;
        
        // Calculate the monthly amount based on frequency
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
        
        // Add this expense to all months
        monthlyData.forEach(month => {
            month.expense += monthlyAmount;
        });
    });
    
    // Calculate balance for each month and total
    let totalIncome = 0;
    let totalExpense = 0;
    
    monthlyData.forEach(month => {
        month.balance = month.income - month.expense;
        totalIncome += month.income;
        totalExpense += month.expense;
    });
    
    const totalBalance = totalIncome - totalExpense;
    
    // Create table header with title
    const tableHeader = document.createElement('div');
    tableHeader.className = 'd-flex justify-content-between align-items-center mb-2';
    tableHeader.innerHTML = `
        <h6 class="mb-0">${tableTitle}</h6>
    `;
    tableContainer.appendChild(tableHeader);
    
    // Create a responsive table
    const table = document.createElement('div');
    table.className = 'table-responsive';
    
    // Format money with commas
    function formatMoney(amount) {
        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    let tableHTML = `
        <table class="table table-sm table-hover">
            <thead class="table-light">
                <tr>
                    <th scope="col">Month</th>
                    <th scope="col" class="text-end">Income</th>
                    <th scope="col" class="text-end">Expenses</th>
                    <th scope="col" class="text-end">Balance</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Add each month as a row
    monthlyData.forEach(month => {
        tableHTML += `
            <tr ${month.isCurrentMonth ? 'class="current-month"' : ''}>
                <td>${month.month} ${month.year}</td>
                <td class="text-end text-success">$${formatMoney(month.income)}</td>
                <td class="text-end text-danger">$${formatMoney(month.expense)}</td>
                <td class="text-end ${month.balance >= 0 ? 'text-success' : 'text-danger'}">$${formatMoney(month.balance)}</td>
            </tr>
        `;
    });
    
    // Add totals row
    tableHTML += `
            </tbody>
            <tfoot class="table-light fw-bold">
                <tr>
                    <td>${months > 1 ? (months === 6 ? '6-Month' : 'Annual') : 'Monthly'} Total</td>
                    <td class="text-end text-success">$${formatMoney(totalIncome)}</td>
                    <td class="text-end text-danger">$${formatMoney(totalExpense)}</td>
                    <td class="text-end ${totalBalance >= 0 ? 'text-success' : 'text-danger'}">$${formatMoney(totalBalance)}</td>
                </tr>
            </tfoot>
        </table>
    `;
    
    table.innerHTML = tableHTML;
    tableContainer.appendChild(table);
    
    // Add a small note about the calculation
    const note = document.createElement('div');
    note.className = 'small text-muted text-center mt-2';
    
    if (months === 1) {
        note.textContent = 'Showing recurring monthly income and expenses for current month';
    } else if (months === 6) {
        note.textContent = 'Showing recurring monthly income and expenses projected over 6 months';
    } else {
        note.textContent = 'Showing recurring monthly income and expenses projected over 12 months';
    }
    
    tableContainer.appendChild(note);
}

// Update combined transactions table
function updateCombinedTransactions() {
    const transactionsContainer = document.getElementById('combined-transactions-container');
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
        
        // Get monthly amount based on frequency
        function getMonthlyAmount(amount, frequency) {
            switch(frequency) {
                case 'weekly': return amount * 4.33;
                case 'bi-weekly': return amount * 2.17;
                case 'monthly': return amount;
                case 'annually': return amount / 12;
                default: return amount;
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