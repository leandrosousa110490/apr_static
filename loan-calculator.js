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