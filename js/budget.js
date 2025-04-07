document.addEventListener('DOMContentLoaded', () => {
    // Form Elements
    const incomeForm = document.getElementById('income-form');
    const expenseForm = document.getElementById('expense-form');
    const incomeDescriptionInput = document.getElementById('income-description');
    const incomeAmountInput = document.getElementById('income-amount');
    const expenseDescriptionInput = document.getElementById('expense-description');
    const expenseAmountInput = document.getElementById('expense-amount');
    const incomeSubmitButton = incomeForm?.querySelector('button[type="submit"]');
    const expenseSubmitButton = expenseForm?.querySelector('button[type="submit"]');

    // Error Message Elements
    const incomeDescriptionError = document.getElementById('incomeDescriptionError');
    const incomeAmountError = document.getElementById('incomeAmountError');
    const expenseDescriptionError = document.getElementById('expenseDescriptionError');
    const expenseAmountError = document.getElementById('expenseAmountError');

    // List Elements
    const incomeList = document.getElementById('income-list');
    const expenseList = document.getElementById('expense-list');

    // Summary Elements
    const totalIncomeSpan = document.getElementById('total-income');
    const totalExpensesSpan = document.getElementById('total-expenses');
    const netBalanceSpan = document.getElementById('net-balance');
    const summaryCard = document.getElementById('budget-summary');

    // Chart Element
    const budgetChartCtx = document.getElementById('budgetChart')?.getContext('2d');
    let budgetChart = null;

    // Data Storage & State
    let incomeItems = [];
    let expenseItems = [];
    let editingItemId = null;
    let editingItemType = null;

    // --- Validation Function ---
    const validateItem = (descriptionInput, amountInput, descriptionError, amountError) => {
        let isValid = true;
        descriptionInput.classList.remove('is-invalid');
        amountInput.classList.remove('is-invalid');
        if (descriptionError) descriptionError.textContent = '';
        if (amountError) amountError.textContent = '';
        const description = descriptionInput.value.trim();
        const amount = parseFloat(amountInput.value);
        if (description === '') {
            descriptionInput.classList.add('is-invalid');
            if (descriptionError) descriptionError.textContent = 'Description cannot be empty.';
            isValid = false;
        }
        if (isNaN(amount) || amount <= 0) {
            amountInput.classList.add('is-invalid');
            if (amountError) amountError.textContent = 'Please enter a positive amount.';
            isValid = false;
        }
        return isValid;
    };

    // --- Event Listeners for Forms ---
    incomeForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateItem(incomeDescriptionInput, incomeAmountInput, incomeDescriptionError, incomeAmountError)) {
            const description = incomeDescriptionInput.value.trim();
            const amount = parseFloat(incomeAmountInput.value);
            if (editingItemId !== null && editingItemType === 'income') {
                updateItem(editingItemId, 'income', description, amount);
            } else {
                addIncomeItem(description, amount);
            }
            resetForm('income');
            editingItemId = null; // Clear editing state after submit
            editingItemType = null;
        }
    });

    expenseForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateItem(expenseDescriptionInput, expenseAmountInput, expenseDescriptionError, expenseAmountError)) {
            const description = expenseDescriptionInput.value.trim();
            const amount = parseFloat(expenseAmountInput.value);
            if (editingItemId !== null && editingItemType === 'expense') {
                updateItem(editingItemId, 'expense', description, amount);
            } else {
                addExpenseItem(description, amount);
            }
            resetForm('expense');
            editingItemId = null; // Clear editing state after submit
            editingItemType = null;
        }
    });

    // --- Functions to Add/Update Items ---
    function addIncomeItem(description, amount) {
        const newItem = { id: Date.now(), description, amount };
        incomeItems.push(newItem);
        saveData();
        renderLists();
        updateSummary();
        updateChart();
    }

    function addExpenseItem(description, amount) {
        const newItem = { id: Date.now() + 1, description, amount }; // Offset ID slightly
        expenseItems.push(newItem);
        saveData();
        renderLists();
        updateSummary();
        updateChart();
    }

    function updateItem(id, type, newDescription, newAmount) {
        if (type === 'income') {
            incomeItems = incomeItems.map(item =>
                item.id === id ? { ...item, description: newDescription, amount: newAmount } : item
            );
        } else if (type === 'expense') {
            expenseItems = expenseItems.map(item =>
                item.id === id ? { ...item, description: newDescription, amount: newAmount } : item
            );
        }
        saveData();
        renderLists();
        updateSummary();
        updateChart();
    }

    // --- Function to Reset Form State ---
    function resetForm(type) {
        if (type === 'income') {
            incomeDescriptionInput.value = '';
            incomeAmountInput.value = '';
            incomeDescriptionInput.classList.remove('is-invalid');
            incomeAmountInput.classList.remove('is-invalid');
            if (incomeDescriptionError) incomeDescriptionError.textContent = '';
            if (incomeAmountError) incomeAmountError.textContent = '';
            if (incomeSubmitButton) {
                incomeSubmitButton.innerHTML = '<i class="fas fa-plus me-1"></i> Add Income';
                incomeSubmitButton.classList.remove('btn-warning');
                incomeSubmitButton.classList.add('btn-success');
            }
        } else if (type === 'expense') {
            expenseDescriptionInput.value = '';
            expenseAmountInput.value = '';
            expenseDescriptionInput.classList.remove('is-invalid');
            expenseAmountInput.classList.remove('is-invalid');
             if (expenseDescriptionError) expenseDescriptionError.textContent = '';
            if (expenseAmountError) expenseAmountError.textContent = '';
            if (expenseSubmitButton) {
                expenseSubmitButton.innerHTML = '<i class="fas fa-plus me-1"></i> Add Expense';
                expenseSubmitButton.classList.remove('btn-warning');
                expenseSubmitButton.classList.add('btn-danger');
            }
        }
         // No need to reset editingItemId/Type here, done in submit/delete/edit handlers
         renderLists(); // Re-render to remove highlight if necessary
    }

    // --- Function to Render Lists ---
    function renderLists() {
        incomeList.innerHTML = '';
        expenseList.innerHTML = '';

        // Render Income
        if (incomeItems.length === 0) {
            incomeList.innerHTML = '<li class="list-group-item text-muted">No income added yet.</li>';
        } else {
            incomeItems.forEach(item => {
                const li = document.createElement('li');
                // Add warning class if this item is being edited
                li.className = `list-group-item d-flex justify-content-between align-items-center ${editingItemId === item.id && editingItemType === 'income' ? 'list-group-item-warning' : ''}`;
                li.dataset.id = item.id;
                li.innerHTML = `
                    <div>
                        <span class="item-description">${item.description}</span>
                        <span class="badge bg-success rounded-pill ms-2">$${item.amount.toFixed(2)}</span>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary me-1 edit-btn" data-type="income" title="Edit Income">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-type="income" title="Delete Income">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
                incomeList.appendChild(li);
            });
        }

        // Render Expenses
        if (expenseItems.length === 0) {
            expenseList.innerHTML = '<li class="list-group-item text-muted">No expenses added yet.</li>';
        } else {
            expenseItems.forEach(item => {
                const li = document.createElement('li');
                // Add warning class if this item is being edited
                li.className = `list-group-item d-flex justify-content-between align-items-center ${editingItemId === item.id && editingItemType === 'expense' ? 'list-group-item-warning' : ''}`;
                li.dataset.id = item.id;
                 li.innerHTML = `
                     <div>
                        <span class="item-description">${item.description}</span>
                        <span class="badge bg-danger rounded-pill ms-2">$${item.amount.toFixed(2)}</span>
                    </div>
                     <div>
                        <button class="btn btn-sm btn-outline-secondary me-1 edit-btn" data-type="expense" title="Edit Expense">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-type="expense" title="Delete Expense">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
                expenseList.appendChild(li);
            });
        }
    }

    // --- Function to Handle List Item Actions ---
    function handleListActions(e) {
        const button = e.target.closest('button');
        if (!button) return;
        const li = button.closest('li');
        if (!li || !li.dataset.id) return;
        const id = parseInt(li.dataset.id);
        const type = button.dataset.type;

        if (button.classList.contains('delete-btn')) {
            // If deleting the item currently being edited, reset the form state first
            if (editingItemId === id && editingItemType === type) {
                resetForm(type);
                editingItemId = null;
                editingItemType = null;
            }
            deleteItem(id, type);
        } else if (button.classList.contains('edit-btn')) {
            editItem(id, type);
        }
    }

    // --- Function to Delete Item ---
    function deleteItem(id, type) {
        if (type === 'income') {
            incomeItems = incomeItems.filter(item => item.id !== id);
        } else if (type === 'expense') {
            expenseItems = expenseItems.filter(item => item.id !== id);
        }
        saveData();
        renderLists();
        updateSummary();
        updateChart();
    }

    // --- Function to Initiate Editing ---
    function editItem(id, type) {
        // If already editing another item, reset that form first
        if (editingItemId !== null && editingItemType !== null && (editingItemId !== id || editingItemType !== type)) {
            resetForm(editingItemType);
        }
        
        editingItemId = id;
        editingItemType = type;
        let itemToEdit;

        if (type === 'income') {
            itemToEdit = incomeItems.find(item => item.id === id);
            if (!itemToEdit) return;
            incomeDescriptionInput.value = itemToEdit.description;
            incomeAmountInput.value = itemToEdit.amount;
            if (incomeSubmitButton) {
                incomeSubmitButton.innerHTML = '<i class="fas fa-check me-1"></i> Update Income';
                incomeSubmitButton.classList.remove('btn-success');
                incomeSubmitButton.classList.add('btn-warning');
            }
            // Clear potential validation errors from previous state
            incomeDescriptionInput.classList.remove('is-invalid');
            incomeAmountInput.classList.remove('is-invalid');
            if(incomeDescriptionError) incomeDescriptionError.textContent = '';
            if(incomeAmountError) incomeAmountError.textContent = '';
            incomeDescriptionInput.focus(); // Focus the input for editing
        } else if (type === 'expense') {
            itemToEdit = expenseItems.find(item => item.id === id);
            if (!itemToEdit) return;
            expenseDescriptionInput.value = itemToEdit.description;
            expenseAmountInput.value = itemToEdit.amount;
            if (expenseSubmitButton) {
                expenseSubmitButton.innerHTML = '<i class="fas fa-check me-1"></i> Update Expense';
                expenseSubmitButton.classList.remove('btn-danger');
                expenseSubmitButton.classList.add('btn-warning');
            }
             // Clear potential validation errors from previous state
            expenseDescriptionInput.classList.remove('is-invalid');
            expenseAmountInput.classList.remove('is-invalid');
            if(expenseDescriptionError) expenseDescriptionError.textContent = '';
            if(expenseAmountError) expenseAmountError.textContent = '';
            expenseDescriptionInput.focus(); // Focus the input for editing
        }
        renderLists(); // Re-render to highlight the item being edited
    }

    // --- Functions to Update Summary and Chart ---
    function updateSummary() {
        const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
        const netBalance = totalIncome - totalExpenses;
        totalIncomeSpan.textContent = totalIncome.toFixed(2);
        totalExpensesSpan.textContent = totalExpenses.toFixed(2);
        netBalanceSpan.textContent = netBalance.toFixed(2);
        summaryCard.classList.remove('border-success', 'border-danger', 'border-secondary');
        netBalanceSpan.classList.remove('text-success', 'text-danger');
        if (netBalance > 0) {
            summaryCard.classList.add('border-success');
            netBalanceSpan.classList.add('text-success');
        } else if (netBalance < 0) {
            summaryCard.classList.add('border-danger');
            netBalanceSpan.classList.add('text-danger');
        } else {
            summaryCard.classList.add('border-secondary');
        }
    }

    function updateChart() {
        if (!budgetChartCtx) return;
        const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        if (budgetChart) {
            budgetChart.destroy();
        }
        if (totalIncome <= 0 && totalExpenses <= 0) {
            budgetChartCtx.clearRect(0, 0, budgetChartCtx.canvas.width, budgetChartCtx.canvas.height);
            budgetChartCtx.font = "16px 'Segoe UI'";
            budgetChartCtx.fillStyle = currentTheme === 'dark' ? '#adb5bd' : '#6c757d';
            budgetChartCtx.textAlign = 'center';
            budgetChartCtx.fillText("Add income or expenses to see chart", budgetChartCtx.canvas.width / 2, budgetChartCtx.canvas.height / 2);
            return;
        }
        const incomeColor = currentTheme === 'dark' ? '#20c997' : '#198754';
        const expenseColor = currentTheme === 'dark' ? '#fd7e14' : '#dc3545';
        const legendColor = currentTheme === 'dark' ? '#dee2e6' : '#212529';
        budgetChart = new Chart(budgetChartCtx, {
            type: 'doughnut',
            data: {
                labels: ['Total Income', 'Total Expenses'],
                datasets: [{
                    label: 'Budget Overview',
                    data: [Math.max(0, totalIncome), Math.max(0, totalExpenses)],
                    backgroundColor: [incomeColor, expenseColor],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: legendColor
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) { label += ': '; }
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

    // --- Local Storage Functions ---
    function saveData() {
        try {
            localStorage.setItem('budgetIncomeItems', JSON.stringify(incomeItems));
            localStorage.setItem('budgetExpenseItems', JSON.stringify(expenseItems));
        } catch (e) {
            console.error("Error saving data to localStorage:", e);
            // Optionally notify the user that data couldn't be saved (e.g., alert)
        }
    }

    function loadData() {
        try {
            const storedIncome = localStorage.getItem('budgetIncomeItems');
            const storedExpenses = localStorage.getItem('budgetExpenseItems');
            if (storedIncome) {
                incomeItems = JSON.parse(storedIncome);
            } else {
                incomeItems = []; // Ensure it's an array if nothing is stored
            }
            if (storedExpenses) {
                expenseItems = JSON.parse(storedExpenses);
            } else {
                expenseItems = []; // Ensure it's an array if nothing is stored
            }
        } catch (e) {
            console.error("Error loading data from localStorage:", e);
            // Reset to empty arrays on error and clear potentially corrupted storage
            incomeItems = [];
            expenseItems = [];
            localStorage.removeItem('budgetIncomeItems');
            localStorage.removeItem('budgetExpenseItems');
            // Optionally notify the user that data couldn't be loaded
        }
        // Initial render after loading
        renderLists();
        updateSummary();
        updateChart();
    }

    // --- Event Listeners Setup ---
    incomeList?.addEventListener('click', handleListActions);
    expenseList?.addEventListener('click', handleListActions);
    window.addEventListener('themeChanged', updateChart);

    // Load data on initial page load
    loadData();

}); 