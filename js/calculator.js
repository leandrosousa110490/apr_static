// Placeholder for calculator logic
document.addEventListener('DOMContentLoaded', () => {
    const calculatorForm = document.getElementById('calculator-form');
    const loanAmountInput = document.getElementById('loan-amount');
    const interestRateInput = document.getElementById('interest-rate');
    const loanTermInput = document.getElementById('loan-term');
    const resultDiv = document.getElementById('result');
    const monthlyPaymentSpan = document.getElementById('monthly-payment');
    const totalPrincipalSpan = document.getElementById('total-principal');
    const totalInterestSpan = document.getElementById('total-interest');
    const paymentChartCtx = document.getElementById('paymentChart')?.getContext('2d');
    const amortizationCard = document.getElementById('amortization-card');
    const amortizationScheduleDiv = document.getElementById('amortization-schedule');
    const amortizationChartCtx = document.getElementById('amortizationChartCanvas')?.getContext('2d');

    // Error message elements
    const loanAmountError = document.getElementById('loanAmountError');
    const interestRateError = document.getElementById('interestRateError');
    const loanTermError = document.getElementById('loanTermError');

    let paymentChart = null;
    let amortizationChart = null;

    // --- Input Validation Function ---
    const validateInputs = () => {
        let isValid = true;
        // Clear previous errors
        [loanAmountInput, interestRateInput, loanTermInput].forEach(input => {
            input.classList.remove('is-invalid');
        });
        [loanAmountError, interestRateError, loanTermError].forEach(errorEl => {
            if(errorEl) errorEl.textContent = '';
        });

        const loanAmount = parseFloat(loanAmountInput.value);
        const interestRate = parseFloat(interestRateInput.value);
        const loanTerm = parseFloat(loanTermInput.value);

        // Validate Loan Amount
        if (isNaN(loanAmount) || loanAmount <= 0) {
            loanAmountInput.classList.add('is-invalid');
            if(loanAmountError) loanAmountError.textContent = 'Please enter a positive loan amount.';
            isValid = false;
        }

        // Validate Interest Rate
        if (isNaN(interestRate) || interestRate < 0 || interestRate > 100) { // Allowing 0% but capping at 100%
            interestRateInput.classList.add('is-invalid');
             if(interestRateError) interestRateError.textContent = 'Please enter a valid interest rate (0-100).';
            isValid = false;
        }

        // Validate Loan Term
        if (isNaN(loanTerm) || loanTerm <= 0 || !Number.isInteger(loanTerm) || loanTerm > 50) { // Integer, positive, max 50 years
            loanTermInput.classList.add('is-invalid');
            if(loanTermError) loanTermError.textContent = 'Please enter a positive whole number of years (up to 50).';
            isValid = false;
        }

        return isValid;
    };

    // --- Amortization Schedule Generation ---
    function generateAmortizationSchedule(principal, monthlyInterestRate, numberOfPayments, monthlyPayment) {
        let schedule = [];
        let balance = principal;

        for (let i = 1; i <= numberOfPayments; i++) {
            let interestPayment = balance * monthlyInterestRate;
            // Handle potential floating point issues near the end
            if (i === numberOfPayments) {
                 // Ensure the last payment covers the remaining balance exactly
                 if (balance < monthlyPayment) {
                     interestPayment = balance * monthlyInterestRate; // Interest on remaining balance
                     principalPayment = balance;
                     monthlyPayment = principalPayment + interestPayment;
                 } else {
                    principalPayment = monthlyPayment - interestPayment;
                 }
                 balance = 0; // Ensure balance goes to zero
            } else {
                 principalPayment = monthlyPayment - interestPayment;
                 balance -= principalPayment;
            }
            
             // Handle potential tiny negative balance due to floating point math
            if (balance < 0.005) { 
                 balance = 0;
             }

            schedule.push({
                month: i,
                payment: monthlyPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance: balance
            });
        }
        return schedule;
    }

    function displayAmortizationSchedule(schedule) {
        if (!amortizationScheduleDiv) return;

        let tableHTML = `
            <table class="table table-striped table-hover table-sm small">
                <thead class="table-dark sticky-top">
                    <tr>
                        <th>Month</th>
                        <th>Payment</th>
                        <th>Principal</th>
                        <th>Interest</th>
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
        `;

        schedule.forEach(row => {
            tableHTML += `
                <tr>
                    <td>${row.month}</td>
                    <td>$${row.payment.toFixed(2)}</td>
                    <td>$${row.principal.toFixed(2)}</td>
                    <td>$${row.interest.toFixed(2)}</td>
                    <td>$${row.balance.toFixed(2)}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        amortizationScheduleDiv.innerHTML = tableHTML;
        amortizationCard.classList.remove('d-none'); // Show the card
    }

    // --- Display Amortization Chart ---
    function displayAmortizationChart(schedule) {
        if (!amortizationChartCtx) return;
        
        // Destroy previous chart instance
        if (amortizationChart) {
            amortizationChart.destroy();
            amortizationChart = null;
        }

        const labels = schedule.map(row => `Month ${row.month}`);
        const principalData = schedule.map(row => row.principal);
        const interestData = schedule.map(row => row.interest);
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        const principalColor = currentTheme === 'dark' ? '#198754' : '#198754'; // Green
        const interestColor = currentTheme === 'dark' ? '#dc3545' : '#dc3545'; // Red
        const gridColor = currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const ticksColor = currentTheme === 'dark' ? '#adb5bd' : '#495057';

        amortizationChart = new Chart(amortizationChartCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Principal',
                        data: principalData,
                        backgroundColor: principalColor,
                        borderColor: principalColor,
                        borderWidth: 1
                    },
                    {
                        label: 'Interest',
                        data: interestData,
                        backgroundColor: interestColor,
                        borderColor: interestColor,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Important for controlling height via container
                plugins: {
                    title: {
                        display: true,
                        text: 'Principal vs. Interest per Payment',
                         color: ticksColor // Use ticksColor for title
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed.y !== null) {
                                     label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        labels: {
                            color: ticksColor // Use ticksColor for legend
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Payment Month',
                             color: ticksColor
                        },
                        ticks: {
                           color: ticksColor,
                           // Auto-skip ticks if too many labels
                           autoSkip: true,
                           maxTicksLimit: 12 // Adjust as needed, maybe based on term length?
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Amount ($)',
                             color: ticksColor
                        },
                        ticks: {
                            color: ticksColor,
                            callback: function(value, index, values) {
                                // Format ticks as currency
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: gridColor
                        }
                    }
                }
            }
        });
         // Card visibility handled in main submit handler
    }

    // --- Form Submission Handler ---
    calculatorForm?.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission

        // Destroy previous charts immediately
        if (paymentChart) {
            paymentChart.destroy(); 
            paymentChart = null;
        }
        if (amortizationChart) {
            amortizationChart.destroy();
             amortizationChart = null;
        }

        // Validate inputs first
        if (!validateInputs()) {
            resultDiv.classList.add('d-none'); // Hide results if validation fails
            amortizationCard.classList.add('d-none'); // Hide amortization card on validation fail
            return; // Stop calculation
        }

        // Get validated values (we know they are valid numbers now)
        const principal = parseFloat(loanAmountInput.value);
        const annualInterestRate = parseFloat(interestRateInput.value) / 100;
        const years = parseInt(loanTermInput.value);

        const monthlyInterestRate = annualInterestRate / 12;
        const numberOfPayments = years * 12;

        let monthlyPayment;
        // Calculate Monthly Payment
        if (monthlyInterestRate === 0) { // Handle 0% interest rate
             monthlyPayment = principal / numberOfPayments;
        } else {
             monthlyPayment = principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
                             (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
        }

        const totalPayment = monthlyPayment * numberOfPayments;
        const totalInterest = totalPayment - principal;

        // Display results
        monthlyPaymentSpan.textContent = monthlyPayment.toFixed(2);
        totalPrincipalSpan.textContent = principal.toFixed(2);
        totalInterestSpan.textContent = totalInterest.toFixed(2);
        resultDiv.classList.remove('d-none'); // Show the result section

        // Generate and Display Amortization Schedule
        const schedule = generateAmortizationSchedule(principal, monthlyInterestRate, numberOfPayments, monthlyPayment);
        displayAmortizationSchedule(schedule);
        displayAmortizationChart(schedule);
        amortizationCard.classList.remove('d-none'); // Show the card containing table and chart

        // Update or create the chart
        if (paymentChartCtx) {
            paymentChart = new Chart(paymentChartCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Total Principal', 'Total Interest'],
                    datasets: [{
                        label: 'Loan Breakdown',
                        data: [principal, totalInterest],
                        backgroundColor: [
                            'rgb(54, 162, 235)', // Blue for principal
                            'rgb(255, 99, 132)'  // Red for interest
                        ],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
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
    });

    // Listen for theme changes to re-render chart
    window.addEventListener('themeChanged', (event) => {
        if (paymentChart && !resultDiv.classList.contains('d-none')) {
             // Need the original values to redraw
             const currentPrincipal = parseFloat(totalPrincipalSpan.textContent || '0'); // Use displayed values
             const currentInterest = parseFloat(totalInterestSpan.textContent || '0');
             
             if (!isNaN(currentPrincipal) && !isNaN(currentInterest)) {
                 // Re-create chart (simpler than updating colors dynamically)
                 if (paymentChart) paymentChart.destroy();
                 if (paymentChartCtx) {
                     paymentChart = new Chart(paymentChartCtx, {
                         type: 'doughnut',
                         data: {
                             labels: ['Total Principal', 'Total Interest'],
                             datasets: [{
                                 label: 'Loan Breakdown',
                                 data: [currentPrincipal, currentInterest],
                                 backgroundColor: [
                                     'rgb(54, 162, 235)',
                                     'rgb(255, 99, 132)' 
                                 ],
                                 hoverOffset: 4
                             }]
                         },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                tooltip: {
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
             }
        }
        
        // Update amortization bar chart
        if (amortizationChart && !amortizationCard.classList.contains('d-none')) {
            // Re-fetch data or redraw with new colors/styles
            // Simplest is often to re-run the display function if schedule data is accessible
            // Or update colors directly: 
            const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
            const principalColor = currentTheme === 'dark' ? '#198754' : '#198754';
            const interestColor = currentTheme === 'dark' ? '#dc3545' : '#dc3545';
            const gridColor = currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            const ticksColor = currentTheme === 'dark' ? '#adb5bd' : '#495057';

            amortizationChart.data.datasets[0].backgroundColor = principalColor;
            amortizationChart.data.datasets[0].borderColor = principalColor;
            amortizationChart.data.datasets[1].backgroundColor = interestColor;
            amortizationChart.data.datasets[1].borderColor = interestColor;
            amortizationChart.options.plugins.title.color = ticksColor;
            amortizationChart.options.plugins.legend.labels.color = ticksColor;
            amortizationChart.options.scales.x.title.color = ticksColor;
            amortizationChart.options.scales.x.ticks.color = ticksColor;
            amortizationChart.options.scales.x.grid.color = gridColor;
            amortizationChart.options.scales.y.title.color = ticksColor;
            amortizationChart.options.scales.y.ticks.color = ticksColor;
            amortizationChart.options.scales.y.grid.color = gridColor;
            
            amortizationChart.update();
        }
    });
}); 