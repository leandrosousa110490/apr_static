document.addEventListener('DOMContentLoaded', function() {
    // Initialize loan calculator
    const loanCalculatorForm = document.getElementById('loan-calculator-form');
    const addAsExpenseBtn = document.getElementById('add-as-expense-btn');
    
    // Toast notification setup
    const successToast = new bootstrap.Toast(document.getElementById('successToast'));
    
    // Initialize the pie chart with empty data (moved inside this scope)
    window.principalInterestChart = initPrincipalInterestChart();
    
    if (loanCalculatorForm) {
        loanCalculatorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            calculateLoan();
        });
        
        // Setup input listeners with debounce to prevent excessive calculations
        const loanAmount = document.getElementById('loan-amount');
        const interestRate = document.getElementById('interest-rate');
        const loanTerm = document.getElementById('loan-term');
        
        // Only calculate when user actually inputs values, not on every keystroke
        loanAmount.addEventListener('change', calculateLoan);
        interestRate.addEventListener('change', calculateLoan);
        loanTerm.addEventListener('change', calculateLoan);
    }
    
    if (addAsExpenseBtn) {
        addAsExpenseBtn.addEventListener('click', addLoanPaymentAsExpense);
    }
});

/**
 * Initialize the principal vs interest chart with empty data
 */
function initPrincipalInterestChart() {
    const ctx = document.getElementById('principal-interest-chart');
    if (!ctx) return null;
    
    // Add "no data" message container
    const chartContainer = ctx.parentElement;
    let noDataMsg = document.createElement('div');
    noDataMsg.className = 'no-data-message text-center text-muted';
    noDataMsg.style.position = 'absolute';
    noDataMsg.style.top = '50%';
    noDataMsg.style.left = '50%';
    noDataMsg.style.transform = 'translate(-50%, -50%)';
    noDataMsg.innerHTML = '<i class="fas fa-chart-pie fa-2x mb-2"></i><br>Enter loan details';
    chartContainer.style.position = 'relative';
    chartContainer.appendChild(noDataMsg);
    
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Interest'],
            datasets: [{
                data: [0, 0],
                backgroundColor: [
                    '#0d6efd', // Blue for principal
                    '#dc3545'  // Red for interest
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false, // Hide legend initially when no data
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 10
                    }
                },
                tooltip: {
                    enabled: false, // Disable tooltip initially
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
    
    return chart;
}

/**
 * Update the principal vs interest chart
 */
function updatePrincipalInterestChart(principal, interest) {
    if (!window.principalInterestChart) return;
    
    const chartContainer = document.getElementById('principal-interest-chart').parentElement;
    const noDataMsg = chartContainer.querySelector('.no-data-message');
    
    // Check if we have valid data
    if (principal <= 0 && interest <= 0) {
        // No data - show message and hide chart elements
        if (noDataMsg) noDataMsg.style.display = 'block';
        window.principalInterestChart.options.plugins.legend.display = false;
        window.principalInterestChart.options.plugins.tooltip.enabled = false;
    } else {
        // We have data - hide message and show chart elements
        if (noDataMsg) noDataMsg.style.display = 'none';
        window.principalInterestChart.options.plugins.legend.display = true;
        window.principalInterestChart.options.plugins.tooltip.enabled = true;
    }
    
    window.principalInterestChart.data.datasets[0].data = [principal, interest];
    window.principalInterestChart.update();
}

/**
 * Calculate monthly loan payment and update the UI
 */
function calculateLoan() {
    // Get form values
    const loanAmount = parseFloat(document.getElementById('loan-amount').value);
    const interestRate = parseFloat(document.getElementById('interest-rate').value) / 100 / 12; // Monthly interest rate
    const loanTerm = parseInt(document.getElementById('loan-term').value) * 12; // Months
    
    // Validate inputs to prevent calculation errors
    if (isNaN(loanAmount) || isNaN(interestRate) || isNaN(loanTerm) || loanAmount <= 0 || loanTerm <= 0) {
        // Set defaults if invalid input
        document.getElementById('monthly-payment').textContent = '$0.00';
        document.getElementById('total-payment').textContent = '$0.00';
        document.getElementById('total-interest').textContent = '$0.00';
        
        // Clear amortization schedule
        document.getElementById('amortization-schedule').innerHTML = '';
        
        // Reset chart
        updatePrincipalInterestChart(0, 0);
        return;
    }
    
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
    
    // Update the principal vs interest chart
    updatePrincipalInterestChart(loanAmount, totalInterest);
    
    // Generate and display amortization schedule (use requestAnimationFrame to avoid UI blocking)
    window.requestAnimationFrame(() => {
        generateAmortizationSchedule(loanAmount, interestRate, loanTerm, monthlyPayment);
    });
}

/**
 * Generate amortization schedule and display in the table
 */
function generateAmortizationSchedule(loanAmount, monthlyInterestRate, termMonths, monthlyPayment) {
    const scheduleBody = document.getElementById('amortization-schedule');
    
    // Clear existing schedule
    scheduleBody.innerHTML = '';
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    let remainingBalance = loanAmount;
    
    // Show first 24 payments (2 years) or all if less than 24
    const paymentsToShow = Math.min(termMonths, 24);
    
    // Batch rendering to avoid UI freezing
    function renderBatch(startIndex, endIndex) {
        // Create temporary balance for this batch
        let currentBalance = remainingBalance;
        
        for (let i = startIndex; i <= endIndex; i++) {
            const interestPayment = currentBalance * monthlyInterestRate;
            const principalPayment = monthlyPayment - interestPayment;
            currentBalance -= principalPayment;
            
            // Create table row
            const row = document.createElement('tr');
            
            // Add cells with payment information
            row.innerHTML = `
                <td>${i}</td>
                <td>${formatCurrency(monthlyPayment)}</td>
                <td>${formatCurrency(principalPayment)}</td>
                <td>${formatCurrency(interestPayment)}</td>
                <td>${formatCurrency(Math.max(0, currentBalance))}</td>
            `;
            
            fragment.appendChild(row);
        }
        
        if (endIndex < paymentsToShow) {
            // Update the actual remaining balance for next batch
            remainingBalance = currentBalance;
            
            // Schedule next batch using requestAnimationFrame
            window.requestAnimationFrame(() => {
                renderBatch(endIndex + 1, Math.min(endIndex + 10, paymentsToShow));
            });
        } else {
            // We've rendered all regular payments, add final payment if needed
            if (termMonths > 24) {
                addFinalPaymentRow(fragment, loanAmount, monthlyInterestRate, termMonths, monthlyPayment);
            }
            
            // Append all rows to the table
            scheduleBody.appendChild(fragment);
        }
    }
    
    // Start rendering in batches of 10 rows
    renderBatch(1, Math.min(10, paymentsToShow));
}

/**
 * Add the final payment row to the amortization schedule
 */
function addFinalPaymentRow(fragment, loanAmount, monthlyInterestRate, termMonths, monthlyPayment) {
    // Calculate values for final payment
    let finalRemainingBalance = loanAmount;
    
    // Skip to the final payment (termMonths)
    for (let i = 1; i < termMonths; i++) {
        const interestPayment = finalRemainingBalance * monthlyInterestRate;
        const principalPayment = monthlyPayment - interestPayment;
        finalRemainingBalance -= principalPayment;
    }
    
    // Add final payment row
    const finalInterestPayment = finalRemainingBalance * monthlyInterestRate;
    const finalPrincipalPayment = monthlyPayment - finalInterestPayment;
    
    const finalRow = document.createElement('tr');
    finalRow.classList.add('table-primary');
    finalRow.innerHTML = `
        <td>${termMonths}</td>
        <td>${formatCurrency(monthlyPayment)}</td>
        <td>${formatCurrency(finalPrincipalPayment)}</td>
        <td>${formatCurrency(finalInterestPayment)}</td>
        <td>${formatCurrency(0)}</td>
    `;
    
    fragment.appendChild(finalRow);
}

/**
 * Add the calculated monthly loan payment as an expense in the budget
 */
function addLoanPaymentAsExpense() {
    const monthlyPaymentEl = document.getElementById('monthly-payment');
    if (!monthlyPaymentEl || !monthlyPaymentEl.textContent) return;
    
    const monthlyPayment = parseFloat(monthlyPaymentEl.textContent.replace(/[$,]/g, ''));
    const loanAmount = parseFloat(document.getElementById('loan-amount').value);
    const interestRate = parseFloat(document.getElementById('interest-rate').value);
    const loanTerm = parseInt(document.getElementById('loan-term').value);
    
    // Validate inputs
    if (isNaN(monthlyPayment) || isNaN(loanAmount) || isNaN(interestRate) || isNaN(loanTerm) || monthlyPayment <= 0) {
        showToast("Invalid loan details. Please calculate a valid loan first.");
        return;
    }
    
    // Create expense object
    const expenseName = `Loan Payment ($${loanAmount} @ ${interestRate}% for ${loanTerm} years)`;
    const expenseObj = {
        name: expenseName,
        amount: monthlyPayment,
        frequency: 'monthly',
        category: 'Housing',
        date: new Date().toISOString().split('T')[0]
    };
    
    try {
        // Save to localStorage to be retrieved by the main budget page
        let pendingExpenses = [];
        const storedExpenses = localStorage.getItem('pendingExpenses');
        
        if (storedExpenses) {
            pendingExpenses = JSON.parse(storedExpenses);
        }
        
        pendingExpenses.push(expenseObj);
        localStorage.setItem('pendingExpenses', JSON.stringify(pendingExpenses));
        
        // Show success message
        showToast("Loan payment added as monthly expense! Go to the Budget Dashboard to view it.");
    } catch (error) {
        console.error("Failed to save loan expense to localStorage:", error);
        showToast("Error saving expense. Please try again.");
    }
}

/**
 * Display a toast notification
 */
function showToast(message) {
    const toastMessageEl = document.getElementById('toast-message');
    if (!toastMessageEl) return;
    
    toastMessageEl.textContent = message;
    const successToast = bootstrap.Toast.getInstance(document.getElementById('successToast'));
    
    if (successToast) {
        successToast.show();
    } else {
        // If toast not initialized yet, create it
        const toast = new bootstrap.Toast(document.getElementById('successToast'));
        toastMessageEl.textContent = message;
        toast.show();
    }
}

/**
 * Format number as currency
 */
function formatCurrency(number) {
    // Handle potential NaN values
    if (isNaN(number)) return '$0.00';
    return '$' + number.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
} 