// Placeholder for budget logic
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const incomeSourceInput = document.getElementById('income-source');
    const incomeAmountInput = document.getElementById('income-amount');
    const addIncomeButton = document.getElementById('add-income');
    const incomeList = document.getElementById('income-list');
    const totalIncomeSpan = document.getElementById('total-income');
    const incomeErrorSpan = document.getElementById('income-error');

    const expenseCategoryInput = document.getElementById('expense-category');
    const expenseAmountInput = document.getElementById('expense-amount');
    const addExpenseButton = document.getElementById('add-expense');
    const expenseList = document.getElementById('expense-list');
    const totalExpensesSpan = document.getElementById('total-expenses');
    const expenseErrorSpan = document.getElementById('expense-error');

    const remainingBudgetSpan = document.getElementById('remaining-budget');
    const expenseChartCanvas = document.getElementById('expense-chart'); // Get canvas

    // Data storage (in memory for now)
    let incomes = [];
    let expenses = [];
    let expenseChart = null; // Variable to hold the chart instance

    // Placeholders for empty lists
    const emptyIncomeListItem = '<li class="list-group-item text-muted">No income added yet.</li>';
    const emptyExpenseListItem = '<li class="list-group-item text-muted">No expenses added yet.</li>';

    // --- Event Listeners ---
    if (addIncomeButton) {
        addIncomeButton.addEventListener('click', addIncome);
    }
    if (addExpenseButton) {
        addExpenseButton.addEventListener('click', addExpense);
    }
    if (incomeList) {
        incomeList.addEventListener('click', removeIncome);
    }
     if (expenseList) {
        expenseList.addEventListener('click', removeExpense);
    }

    // --- Functions ---
    function addIncome() {
        const source = incomeSourceInput.value.trim();
        const amount = parseFloat(incomeAmountInput.value);
        incomeErrorSpan.textContent = '';

        if (!source || isNaN(amount) || amount <= 0) {
            incomeErrorSpan.textContent = 'Please enter a valid source and positive amount.';
            incomeAmountInput.classList.add('is-invalid');
            incomeSourceInput.classList.add('is-invalid');
            return;
        }
        incomeAmountInput.classList.remove('is-invalid');
        incomeSourceInput.classList.remove('is-invalid');

        const newIncome = { id: Date.now(), source, amount }; // Use timestamp as unique ID
        incomes.push(newIncome);

        renderBudget();
        clearIncomeInputs();
    }

    function addExpense() {
        const category = expenseCategoryInput.value.trim();
        const amount = parseFloat(expenseAmountInput.value);
        expenseErrorSpan.textContent = '';

        if (!category || isNaN(amount) || amount <= 0) {
            expenseErrorSpan.textContent = 'Please enter a valid category and positive amount.';
            expenseAmountInput.classList.add('is-invalid');
            expenseCategoryInput.classList.add('is-invalid');
            return;
        }
        expenseAmountInput.classList.remove('is-invalid');
        expenseCategoryInput.classList.remove('is-invalid');

        const newExpense = { id: Date.now(), category, amount }; // Use timestamp as unique ID
        expenses.push(newExpense);

        renderBudget();
        clearExpenseInputs();
    }

    function removeIncome(e) {
        if (e.target.classList.contains('delete-btn')) {
            const idToRemove = parseInt(e.target.dataset.id);
            incomes = incomes.filter(income => income.id !== idToRemove);
            renderBudget();
        }
    }

     function removeExpense(e) {
        if (e.target.classList.contains('delete-btn')) {
            const idToRemove = parseInt(e.target.dataset.id);
            expenses = expenses.filter(expense => expense.id !== idToRemove);
            renderBudget();
        }
    }

    function renderBudget() {
        // Clear existing lists
        incomeList.innerHTML = '';
        expenseList.innerHTML = '';

        let currentTotalIncome = 0;
        if (incomes.length === 0) {
            incomeList.innerHTML = emptyIncomeListItem;
        } else {
            incomes.forEach(income => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `
                    <span><i class="fas fa-arrow-up text-success"></i> ${income.source}: $${income.amount.toFixed(2)}</span>
                    <button class="btn btn-outline-danger btn-sm delete-btn" data-id="${income.id}"><i class="fas fa-trash-alt"></i></button>
                `;
                incomeList.appendChild(li);
                currentTotalIncome += income.amount;
            });
        }

        let currentTotalExpenses = 0;
        if (expenses.length === 0) {
            expenseList.innerHTML = emptyExpenseListItem;
        } else {
            expenses.forEach(expense => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                 li.innerHTML = `
                    <span><i class="fas fa-arrow-down text-danger"></i> ${expense.category}: $${expense.amount.toFixed(2)}</span>
                    <button class="btn btn-outline-danger btn-sm delete-btn" data-id="${expense.id}"><i class="fas fa-trash-alt"></i></button>
                `;
                expenseList.appendChild(li);
                currentTotalExpenses += expense.amount;
            });
        }

        // Update totals and summary
        totalIncomeSpan.textContent = currentTotalIncome.toFixed(2);
        totalExpensesSpan.textContent = currentTotalExpenses.toFixed(2);
        remainingBudgetSpan.textContent = (currentTotalIncome - currentTotalExpenses).toFixed(2);

        // Update the chart
        updateExpenseChart();
    }

    function clearIncomeInputs() {
        incomeSourceInput.value = '';
        incomeAmountInput.value = '';
    }

    function clearExpenseInputs() {
        expenseCategoryInput.value = '';
        expenseAmountInput.value = '';
    }

    // --- Chart Logic ---
    function updateExpenseChart() {
        if (!expenseChartCanvas) return;
        const ctx = expenseChartCanvas.getContext('2d');
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';

        // Destroy previous chart instance if it exists
        if (expenseChart) {
            expenseChart.destroy();
            expenseChart = null; 
        }

        // Aggregate expenses by category
        const expenseData = expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {});

        const labels = Object.keys(expenseData);
        const data = Object.values(expenseData);

        // Handle empty chart case with theme-aware text color
        if (labels.length === 0) {
            ctx.clearRect(0, 0, expenseChartCanvas.width, expenseChartCanvas.height);
            ctx.font = "16px 'Segoe UI'";
            // Use Bootstrap variables or fallback colors
            ctx.fillStyle = currentTheme === 'dark' ? '#adb5bd' : '#6c757d'; // Using Bootstrap text-muted colors
            ctx.textAlign = 'center';
            ctx.fillText("Add expenses to see the chart", expenseChartCanvas.width / 2, expenseChartCanvas.height / 2);
            return;
        }

        // Generate random colors (consider theme-specific palettes later if desired)
        const backgroundColors = data.map(() => `hsl(${Math.random() * 360}, 70%, ${currentTheme === 'dark' ? '55%' : '70%'})`); // Adjust lightness for dark mode
        const titleColor = currentTheme === 'dark' ? '#dee2e6' : '#212529'; // Bootstrap body text colors
        const legendColor = titleColor;
        const tooltipBodyColor = currentTheme === 'dark' ? '#dee2e6' : '#212529';
        const tooltipTitleColor = tooltipBodyColor;

        expenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Expenses by Category',
                    data: data,
                    backgroundColor: backgroundColors,
                    hoverOffset: 4,
                    borderColor: currentTheme === 'dark' ? '#495057' : '#fff' // Add border for contrast
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            padding: 15,
                            color: legendColor // Set legend text color
                        }
                    },
                    title: {
                        display: true,
                        text: 'Expense Breakdown',
                        font: { size: 16 },
                        color: titleColor // Set title text color
                    },
                    tooltip: {
                        titleColor: tooltipTitleColor,
                        bodyColor: tooltipBodyColor,
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // Initial render
    renderBudget();

    // Listen for theme changes to re-render chart with appropriate colors
    window.addEventListener('themeChanged', (event) => {
        // console.log('Theme changed detected in budget.js:', event.detail.theme);
        // Re-render chart which will pick up new theme settings
        if (expenseChart) {
            updateExpenseChart(); // Re-call the update function
        }
        // We might need to force re-render even if chart is null to update empty text color
         else if (expenses.length === 0) { 
            updateExpenseChart();
        }
    });
}); 