document.addEventListener('DOMContentLoaded', () => {
    const roiForm = document.getElementById('roi-form');
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const transactionsContainer = document.getElementById('transactions-container');
    const resultsDiv = document.getElementById('roi-results');
    const errorMessageDiv = document.getElementById('roi-error-message');

    const netProfitResultEl = document.getElementById('net-profit-result');
    const totalRoiResultEl = document.getElementById('total-roi-result');
    const annualizedRoiResultEl = document.getElementById('annualized-roi-result');

    const roiGrowthChartCanvas = document.getElementById('roi-growth-chart');
    let roiGrowthChart = null;

    let transactionIdCounter = 0;

    // Function to add a new transaction row
    addTransactionBtn.addEventListener('click', () => {
        transactionIdCounter++;
        const transactionRow = document.createElement('div');
        transactionRow.classList.add('row', 'g-3', 'mb-2', 'align-items-center', 'transaction-row');
        transactionRow.setAttribute('id', `transaction-${transactionIdCounter}`);
        transactionRow.innerHTML = `
            <div class="col-md-5">
                <label for="transaction-amount-${transactionIdCounter}" class="visually-hidden">Amount</label>
                <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input type="number" class="form-control transaction-amount" id="transaction-amount-${transactionIdCounter}" placeholder="Amount" step="any" required>
                </div>
            </div>
            <div class="col-md-5">
                <label for="transaction-type-${transactionIdCounter}" class="visually-hidden">Type</label>
                <select class="form-select transaction-type" id="transaction-type-${transactionIdCounter}">
                    <option value="contribution" selected>Contribution</option>
                    <option value="withdrawal">Withdrawal</option>
                </select>
            </div>
            <div class="col-md-2 text-end">
                <button type="button" class="btn btn-danger btn-sm remove-transaction-btn" title="Remove Transaction">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        transactionsContainer.appendChild(transactionRow);
    });

    // Event delegation for removing transaction rows
    transactionsContainer.addEventListener('click', (event) => {
        if (event.target.closest('.remove-transaction-btn')) {
            event.target.closest('.transaction-row').remove();
        }
    });

    // Form submission handler
    roiForm.addEventListener('submit', (event) => {
        event.preventDefault();
        clearErrors();
        resultsDiv.classList.add('d-none');

        // Get and validate inputs
        const initialInvestment = parseFloat(document.getElementById('initial-investment').value);
        const finalValue = parseFloat(document.getElementById('final-value').value);
        let duration = parseFloat(document.getElementById('duration').value);
        const durationUnit = document.getElementById('duration-unit').value;

        let isValid = true;

        if (isNaN(initialInvestment) || initialInvestment < 0) {
            showError('initial-investment', 'Initial investment must be a non-negative number.');
            isValid = false;
        }
        if (isNaN(finalValue) || finalValue < 0) {
            showError('final-value', 'Final value must be a non-negative number.');
            isValid = false;
        }
        if (isNaN(duration) || duration <= 0) {
            showError('duration', 'Duration must be a positive number.');
            isValid = false;
        }

        if (!isValid) {
            scrollToErrors();
            return;
        }

        // Convert duration to years if it's in months
        let durationInYears = duration;
        if (durationUnit === 'months') {
            durationInYears = duration / 12;
        }
        if (durationInYears <= 0) {
            showError('duration', 'Duration in years must be greater than zero for annualization.');
            scrollToErrors();
            return;
        }

        // Process transactions
        let totalContributions = 0;
        let totalWithdrawals = 0;
        const transactionRows = transactionsContainer.querySelectorAll('.transaction-row');
        transactionRows.forEach(row => {
            const amountInput = row.querySelector('.transaction-amount');
            const typeSelect = row.querySelector('.transaction-type');
            const amount = parseFloat(amountInput.value);

            if (isNaN(amount) || amount < 0) {
                // Optionally, mark the specific transaction row with an error
                // For now, just show a general error and stop
                showError(null, 'All transaction amounts must be non-negative numbers.');
                isValid = false;
                return;
            }
            if (typeSelect.value === 'contribution') {
                totalContributions += amount;
            } else {
                totalWithdrawals += amount;
            }
        });

        if (!isValid) { // Check if transaction processing found errors
            scrollToErrors();
            return;
        }

        // Calculate ROI
        // Net Profit (Absolute ROI): P = FV - I0 - C + W
        const netProfit = finalValue - initialInvestment - totalContributions + totalWithdrawals;

        // Total Capital Outlay by Investor: TC = I0 + C
        const totalCapitalOutlay = initialInvestment + totalContributions;

        let totalRoiPercent = 0;
        if (totalCapitalOutlay > 0) {
            totalRoiPercent = (netProfit / totalCapitalOutlay) * 100;
        } else if (netProfit > 0) { // Profit with no capital outlay (e.g. gifted investment that grew)
            totalRoiPercent = Infinity; 
        } else if (netProfit === 0 && totalCapitalOutlay === 0) {
            totalRoiPercent = 0; // No investment, no profit
        } else { // Loss with no capital outlay, or other edge cases
            totalRoiPercent = -Infinity;
        }
        

        // Annualized ROI (%): (( (FV + W) / (I0 + C) )^(1/Y) - 1) * 100
        const effectivePrincipal = initialInvestment + totalContributions;
        const effectiveFinalValue = finalValue + totalWithdrawals;
        let annualizedRoiPercent = 0;

        if (effectivePrincipal > 0 && effectiveFinalValue >= 0) {
            if (effectivePrincipal === effectiveFinalValue) {
                 annualizedRoiPercent = 0;
            } else {
                 annualizedRoiPercent = (Math.pow(effectiveFinalValue / effectivePrincipal, 1 / durationInYears) - 1) * 100;
            }
        } else if (effectivePrincipal === 0 && effectiveFinalValue > 0) {
            annualizedRoiPercent = Infinity; // Growth from zero principal
        } else if (effectivePrincipal === 0 && effectiveFinalValue === 0) {
            annualizedRoiPercent = 0; // Zero principal, zero final value
        } else if (effectivePrincipal > 0 && effectiveFinalValue === 0 && effectivePrincipal > effectiveFinalValue) {
            annualizedRoiPercent = -100; // Total loss of principal
        } else {
             // Handles cases like negative effective principal or final value if inputs were allowed to be negative
             // or if withdrawals massively exceed final value + contributions for some reason.
            annualizedRoiPercent = NaN; 
        }

        // Display results
        netProfitResultEl.textContent = formatCurrency(netProfit);
        totalRoiResultEl.textContent = isFinite(totalRoiPercent) ? `${totalRoiPercent.toFixed(2)}%` : (totalRoiPercent > 0 ? "+∞%" : "-∞%");
        annualizedRoiResultEl.textContent = isFinite(annualizedRoiPercent) ? `${annualizedRoiPercent.toFixed(2)}%` : (annualizedRoiPercent > 0 ? "+∞%" : (annualizedRoiPercent === -100 ? "-100.00%" : "N/A"));

        if (isNaN(annualizedRoiPercent)) {
            annualizedRoiResultEl.textContent = "N/A";
            showError(null, "Annualized ROI cannot be calculated with the given inputs (e.g., negative effective principal or inconsistent values).");
        }

        updateRoiGrowthChart(initialInvestment, finalValue, durationInYears, durationUnit);

        resultsDiv.classList.remove('d-none');
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    });

    function updateRoiGrowthChart(initial, final, years, unit) {
        const chartLabels = ['Start', 'End'];
        const chartData = [initial, final];
        
        const data = {
            labels: chartLabels,
            datasets: [{
                label: 'Investment Value',
                data: chartData,
                borderColor: '#0d6efd', // Bootstrap primary color
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                fill: true,
                tension: 0.1
            }]
        };

        if (roiGrowthChart) {
            roiGrowthChart.destroy();
        }

        roiGrowthChart = new Chart(roiGrowthChartCanvas, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false, // Allow y-axis to not start at zero for better visualization of changes
                        title: {
                            display: true,
                            text: 'Investment Value ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value, false); // Use a modified formatCurrency for ticks
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatCurrency(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    function showError(inputId, message) {
        errorMessageDiv.classList.remove('d-none');
        errorMessageDiv.innerHTML += `<p>${message}</p>`; // Append messages if multiple errors
        if (inputId) {
            const inputElement = document.getElementById(inputId);
            inputElement.classList.add('is-invalid');
            // Show Bootstrap's invalid-feedback message if available
            const errorFeedback = document.getElementById(`${inputId}Error`);
            if (errorFeedback) {
                errorFeedback.textContent = message;
                errorFeedback.style.display = 'block'; 
            }
        }
    }

    function clearErrors() {
        errorMessageDiv.classList.add('d-none');
        errorMessageDiv.innerHTML = '';
        ['initial-investment', 'final-value', 'duration'].forEach(id => {
            document.getElementById(id).classList.remove('is-invalid');
            const errorFeedback = document.getElementById(`${id}Error`);
            if (errorFeedback) {
                errorFeedback.textContent = '';
                errorFeedback.style.display = 'none'; 
            }
        });
        // Clear errors from transaction rows if any were marked (not implemented yet)
    }
    
    function scrollToErrors() {
        errorMessageDiv.scrollIntoView({ behavior: 'smooth' });
    }

    function formatCurrency(value, useCurrencySymbol = true) {
        const options = {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        };
        if (!useCurrencySymbol) {
            options.style = 'decimal';
        }
        const formatter = new Intl.NumberFormat('en-US', options);
        return formatter.format(value);
    }
}); 