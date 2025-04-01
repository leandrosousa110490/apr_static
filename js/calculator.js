// Placeholder for calculator logic
document.addEventListener('DOMContentLoaded', () => {
    const calculatorForm = document.getElementById('calculator-form');
    // const resultDiv = document.getElementById('calculator-result'); // Old result div
    const resultAlert = document.getElementById('calculator-result'); // New alert div for results
    const errorAlert = document.getElementById('calculator-error');   // New alert div for errors
    const chartContainer = document.getElementById('calculator-chart-container'); // Get chart container card
    const paymentChartCanvas = document.getElementById('payment-chart'); // Get canvas

    let paymentChart = null; // Variable to hold the chart instance

    if (calculatorForm) {
        calculatorForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent actual form submission

            // Hide previous alerts
            resultAlert.classList.add('d-none');
            errorAlert.classList.add('d-none');
            chartContainer.classList.add('d-none'); // Hide chart on new submit
            resultAlert.innerHTML = ''; // Clear content
            errorAlert.innerHTML = '';  // Clear content

            const loanAmount = parseFloat(document.getElementById('loan-amount').value);
            const annualInterestRate = parseFloat(document.getElementById('interest-rate').value);
            const loanTermYears = parseInt(document.getElementById('loan-term').value);

            if (isNaN(loanAmount) || isNaN(annualInterestRate) || isNaN(loanTermYears) || loanAmount <= 0 || annualInterestRate < 0 || loanTermYears <= 0) {
                 /* Error handling - Update error alert div */
                 // errorAlert.innerHTML = `
                 //    <p style="color: #d9534f; font-weight: bold;">
                 //        Please enter valid positive numbers for Loan Amount, Interest Rate, and Loan Term.
                 //    </p>`;
                 errorAlert.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please enter valid positive numbers for Loan Amount, Interest Rate, and Loan Term.';
                 errorAlert.classList.remove('d-none'); // Show error alert
                 chartContainer.classList.add('d-none'); // Ensure chart is hidden on error
                return;
            }

            // --- Monthly Payment Calculation --- 
            const monthlyInterestRate = (annualInterestRate / 100) / 12;
            const numberOfPayments = loanTermYears * 12;

            let monthlyPayment;
            if (monthlyInterestRate === 0) { // Handle zero interest rate
                monthlyPayment = loanAmount / numberOfPayments;
            } else {
                monthlyPayment = loanAmount * 
                    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
                    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
            }
            
            const totalPayment = monthlyPayment * numberOfPayments;
            const totalInterest = totalPayment - loanAmount;

            // --- Display Results --- 
            /* Update result alert div */
            // resultAlert.innerHTML = `
            //     <h3>Calculation Results:</h3>
            //     <p>Monthly Payment: <strong>$${monthlyPayment.toFixed(2)}</strong></p>
            //     <p>Total Payment: <strong>$${totalPayment.toFixed(2)}</strong></p>
            //     <p>Total Interest Paid: <strong>$${totalInterest.toFixed(2)}</strong></p>
            // `;
            resultAlert.innerHTML = `
                <h4 class="alert-heading">Calculation Results:</h4>
                <p class="mb-1">Monthly Payment: <strong class="fs-5">$${monthlyPayment.toFixed(2)}</strong></p>
                <hr>
                <p class="mb-1">Total Payment: <strong>$${totalPayment.toFixed(2)}</strong></p>
                <p class="mb-0">Total Interest Paid: <strong>$${totalInterest.toFixed(2)}</strong></p>
            `;
            resultAlert.classList.remove('d-none'); // Show result alert
            chartContainer.classList.remove('d-none'); // Show chart container
            updatePaymentChart(loanAmount, totalInterest); // Update the chart
        });
    }

    // --- Chart Logic ---
    function updatePaymentChart(principal, interest) {
        if (!paymentChartCanvas) return;
        const ctx = paymentChartCanvas.getContext('2d');
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';

        // Ensure values are non-negative for the chart
        const principalValue = Math.max(0, principal);
        const interestValue = Math.max(0, interest);

        // Destroy previous chart instance
        if (paymentChart) {
            paymentChart.destroy();
            paymentChart = null;
        }

        // Define colors based on theme
        const principalColor = currentTheme === 'dark' ? '#20c997' : '#198754'; // Teal/Green
        const interestColor = currentTheme === 'dark' ? '#fd7e14' : '#dc3545'; // Orange/Red
        const titleColor = currentTheme === 'dark' ? '#dee2e6' : '#212529';
        const legendColor = titleColor;
        const tooltipBodyColor = currentTheme === 'dark' ? '#dee2e6' : '#212529';
        const tooltipTitleColor = tooltipBodyColor;
        const borderColor = currentTheme === 'dark' ? '#495057' : '#fff';

         // Don't draw chart if principal and interest are zero
        if (principalValue <= 0 && interestValue <= 0) {
            ctx.clearRect(0, 0, paymentChartCanvas.width, paymentChartCanvas.height);
            ctx.font = "16px 'Segoe UI'";
            ctx.fillStyle = currentTheme === 'dark' ? '#adb5bd' : '#6c757d'; 
            ctx.textAlign = 'center';
            ctx.fillText("Enter valid loan details to see chart", paymentChartCanvas.width / 2, paymentChartCanvas.height / 2);
            chartContainer.classList.add('d-none'); // Hide container if no data
            return;
        }

        paymentChart = new Chart(ctx, {
            type: 'doughnut', // Use doughnut chart
            data: {
                labels: [
                    `Principal ($${principalValue.toFixed(2)})`,
                    `Total Interest ($${interestValue.toFixed(2)})`
                ],
                datasets: [{
                    label: 'Loan Breakdown',
                    data: [principalValue, interestValue],
                    backgroundColor: [principalColor, interestColor],
                    borderColor: borderColor,
                    borderWidth: 1,
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
                            color: legendColor, 
                            boxWidth: 12,
                            padding: 20
                        }
                    },
                    title: {
                        display: true,
                        text: 'Total Payment Breakdown',
                        color: titleColor,
                        font: { size: 16 },
                        padding: { bottom: 15 }
                    },
                    tooltip: {
                         titleColor: tooltipTitleColor,
                         bodyColor: tooltipBodyColor,
                         callbacks: {
                            // Format tooltip label
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.label) {
                                    label += context.label;
                                }
                                return label;
                            },
                             // Format tooltip value as currency
                             afterLabel: function(context) {
                                 return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
                             }
                        }
                    }
                }
            }
        });
    }

    // Listen for theme changes to re-render chart
    window.addEventListener('themeChanged', (event) => {
        if (paymentChart && !chartContainer.classList.contains('d-none')) {
             // Need the original values to redraw
             const currentPrincipal = parseFloat(document.getElementById('loan-amount').value);
             const currentInterest = parseFloat(document.querySelector("#calculator-result strong:last-of-type")?.textContent?.replace(/[^\d.-]/g, '') || 0);
             
             if (!isNaN(currentPrincipal) && !isNaN(currentInterest)) {
                 updatePaymentChart(currentPrincipal, currentInterest);
             }
        }
    });
}); 