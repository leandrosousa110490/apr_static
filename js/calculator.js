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
    
    // Additional expense inputs
    const includeExtrasCheckbox = document.getElementById('include-extras');
    const extrasContainer = document.getElementById('extras-container');
    const propertyTaxInput = document.getElementById('property-tax');
    const insuranceInput = document.getElementById('insurance');
    const pmiInput = document.getElementById('pmi');
    const hoaInput = document.getElementById('hoa');
    const otherExpensesInput = document.getElementById('other-expenses');
    const additionalExpensesSummary = document.getElementById('additional-expenses-summary');
    const calculationNote = document.getElementById('calculation-note');
    
    // Extra payment elements
    const includeExtraPaymentsCheckbox = document.getElementById('include-extra-payments');
    const extraPaymentsContainer = document.getElementById('extra-payments-container');
    const paymentScheduleSelect = document.getElementById('payment-schedule');
    const extraMonthlyInput = document.getElementById('extra-monthly');
    const extraAnnualInput = document.getElementById('extra-annual');
    const extraOneTimeInput = document.getElementById('extra-one-time');
    const oneTimeMonthInput = document.getElementById('one-time-month');
    const extraPaymentsSummary = document.getElementById('extra-payments-summary');
    
    // Extra payment comparison elements
    const standardTermSpan = document.getElementById('standard-term');
    const standardInterestSpan = document.getElementById('standard-interest');
    const acceleratedTermSpan = document.getElementById('accelerated-term');
    const acceleratedInterestSpan = document.getElementById('accelerated-interest');
    const timeSavedSpan = document.getElementById('time-saved');
    const interestSavedSpan = document.getElementById('interest-saved');
    const savingsProgressBar = document.getElementById('savings-progress');
    const savingsPercentageSpan = document.getElementById('savings-percentage');
    const payoffComparisonChartCtx = document.getElementById('payoff-comparison-chart')?.getContext('2d');
    
    // Additional expense outputs
    const monthlyTaxSpan = document.getElementById('monthly-tax');
    const monthlyInsuranceSpan = document.getElementById('monthly-insurance');
    const monthlyPmiSpan = document.getElementById('monthly-pmi');
    const monthlyHoaSpan = document.getElementById('monthly-hoa');
    const monthlyOtherSpan = document.getElementById('monthly-other');
    const totalMonthlyPaymentSpan = document.getElementById('total-monthly-payment');
    
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
    let payoffComparisonChart = null;
    
    // Toggle additional expenses section
    if (includeExtrasCheckbox) {
        includeExtrasCheckbox.addEventListener('change', function() {
            if (this.checked) {
                extrasContainer.classList.remove('d-none');
            } else {
                extrasContainer.classList.add('d-none');
            }
        });
    }
    
    // Toggle extra payments section
    if (includeExtraPaymentsCheckbox) {
        includeExtraPaymentsCheckbox.addEventListener('change', function() {
            if (this.checked) {
                extraPaymentsContainer.classList.remove('d-none');
            } else {
                extraPaymentsContainer.classList.add('d-none');
            }
        });
    }

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
                        ${schedule[0].hasOwnProperty('extraPayment') ? '<th>Extra Payment</th>' : ''}
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
                    ${row.hasOwnProperty('extraPayment') ? `<td>$${row.extraPayment.toFixed(2)}</td>` : ''}
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

    // --- Generate Amortization Schedule with Extra Payments ---
    function generateAmortizationWithExtraPayments(principal, monthlyInterestRate, numberOfPayments, monthlyPayment, extraPayments) {
        let schedule = [];
        let balance = principal;
        let month = 1;
        
        // Destructure extra payments object for easier access
        const { extraMonthly, extraAnnual, extraOneTime, oneTimeMonth, biweekly } = extraPayments;
        
        // For bi-weekly payment calculation
        const biweeklyPayment = biweekly ? monthlyPayment / 2 : 0;
        const biweeklyExtraPerMonth = biweekly ? (biweeklyPayment * 26) / 12 - monthlyPayment : 0;
        
        while (balance > 0 && month <= numberOfPayments * 1.5) { // Allow for up to 50% longer term as safeguard
            let extraPrincipalThisMonth = extraMonthly + (biweekly ? biweeklyExtraPerMonth : 0);
            
            // Add annual extra payment in December (month 12, 24, 36, etc.)
            if (extraAnnual > 0 && month % 12 === 0) {
                extraPrincipalThisMonth += extraAnnual;
            }
            
            // Add one-time extra payment in specified month
            if (extraOneTime > 0 && month === oneTimeMonth) {
                extraPrincipalThisMonth += extraOneTime;
            }
            
            let interestPayment = balance * monthlyInterestRate;
            let principalPayment = monthlyPayment - interestPayment;
            let paymentAmount = monthlyPayment;
            
            // Adjust for final payment
            if (balance < (monthlyPayment + extraPrincipalThisMonth)) {
                principalPayment = balance;
                interestPayment = balance * monthlyInterestRate;
                paymentAmount = principalPayment + interestPayment;
                balance = 0;
            } else {
                // Apply extra payment directly to principal
                balance = balance - principalPayment - extraPrincipalThisMonth;
                
                // Include extra payment in total payment amount
                paymentAmount = monthlyPayment + extraPrincipalThisMonth;
            }
            
            // Handle potential tiny negative balance due to floating point math
            if (balance < 0.005) { 
                balance = 0;
            }
            
            schedule.push({
                month: month,
                payment: paymentAmount,
                principal: principalPayment + extraPrincipalThisMonth,
                interest: interestPayment,
                extraPayment: extraPrincipalThisMonth,
                balance: balance
            });
            
            month++;
            
            // Break if balance is paid off
            if (balance === 0) {
                break;
            }
        }
        
        return schedule;
    }

    // --- Display Comparison Chart between Standard and Accelerated Payoff ---
    function displayPayoffComparisonChart(standardSchedule, acceleratedSchedule) {
        if (!payoffComparisonChartCtx) return;
        
        // Destroy previous chart if it exists
        if (payoffComparisonChart) {
            payoffComparisonChart.destroy();
            payoffComparisonChart = null;
        }
        
        // Prepare data for chart - balance over time
        const standardBalances = standardSchedule.map(row => row.balance);
        const acceleratedBalances = acceleratedSchedule.map(row => row.balance);
        
        // Get the maximum number of months from either schedule
        const maxMonths = Math.max(standardSchedule.length, acceleratedSchedule.length);
        
        // Generate labels for all months up to the longest schedule
        const labels = Array.from({ length: maxMonths }, (_, i) => `Month ${i + 1}`);
        
        // Ensure both datasets are the same length by padding with zeros
        // This is necessary because accelerated schedule may be shorter
        while (acceleratedBalances.length < standardBalances.length) {
            acceleratedBalances.push(0);
        }
        
        // Set up theme-aware colors
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        const textColor = currentTheme === 'dark' ? '#f8f9fa' : '#212529';
        const gridColor = currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        // Create the chart
        payoffComparisonChart = new Chart(payoffComparisonChartCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Standard Payment Schedule',
                        data: standardBalances,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        fill: true
                    },
                    {
                        label: 'With Extra Payments',
                        data: acceleratedBalances,
                        borderColor: 'rgba(75, 192, 92, 1)',
                        backgroundColor: 'rgba(75, 192, 92, 0.1)',
                        borderWidth: 2,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Loan Balance Over Time',
                        color: textColor
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
                            color: textColor
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Month',
                            color: textColor
                        },
                        ticks: {
                            color: textColor,
                            autoSkip: true,
                            maxTicksLimit: 12
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Remaining Balance ($)',
                            color: textColor
                        },
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                return new Intl.NumberFormat('en-US', { 
                                    style: 'currency', 
                                    currency: 'USD',
                                    maximumFractionDigits: 0
                                }).format(value);
                            }
                        },
                        grid: {
                            color: gridColor
                        }
                    }
                }
            }
        });
    }

    // --- Handle Form Submission ---
    if (calculatorForm) {
        calculatorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateInputs()) {
                return; // Stop if validation fails
            }
            
            const principal = parseFloat(loanAmountInput.value);
            const annualInterestRate = parseFloat(interestRateInput.value);
            const loanTermYears = parseInt(loanTermInput.value);
            
            const monthlyInterestRate = (annualInterestRate / 100) / 12;
            const numberOfPayments = loanTermYears * 12;
            
            let monthlyPayment = 0;
            
            // Calculate monthly payment (principal and interest)
            if (annualInterestRate === 0) {
                // Handle 0% interest case
                monthlyPayment = principal / numberOfPayments;
            } else {
                // Standard formula for monthly payment
                monthlyPayment = principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
            }
            
            // Calculate additional expenses if included
            let additionalMonthlyExpenses = 0;
            let monthlyTax = 0;
            let monthlyInsurance = 0;
            let monthlyPmi = 0;
            let monthlyHoa = 0;
            let monthlyOther = 0;
            
            if (includeExtrasCheckbox && includeExtrasCheckbox.checked) {
                // Calculate monthly property tax
                if (propertyTaxInput && propertyTaxInput.value) {
                    const annualTax = parseFloat(propertyTaxInput.value);
                    monthlyTax = annualTax / 12;
                    additionalMonthlyExpenses += monthlyTax;
                }
                
                // Calculate monthly insurance
                if (insuranceInput && insuranceInput.value) {
                    const annualInsurance = parseFloat(insuranceInput.value);
                    monthlyInsurance = annualInsurance / 12;
                    additionalMonthlyExpenses += monthlyInsurance;
                }
                
                // Add PMI if provided
                if (pmiInput && pmiInput.value) {
                    monthlyPmi = parseFloat(pmiInput.value);
                    additionalMonthlyExpenses += monthlyPmi;
                }
                
                // Add HOA fees if provided
                if (hoaInput && hoaInput.value) {
                    monthlyHoa = parseFloat(hoaInput.value);
                    additionalMonthlyExpenses += monthlyHoa;
                }
                
                // Add other expenses if provided
                if (otherExpensesInput && otherExpensesInput.value) {
                    monthlyOther = parseFloat(otherExpensesInput.value);
                    additionalMonthlyExpenses += monthlyOther;
                }
                
                // Show additional expenses in the summary
                if (additionalExpensesSummary) {
                    additionalExpensesSummary.classList.remove('d-none');
                }
                
                // Update the expense spans
                if (monthlyTaxSpan) monthlyTaxSpan.textContent = monthlyTax.toFixed(2);
                if (monthlyInsuranceSpan) monthlyInsuranceSpan.textContent = monthlyInsurance.toFixed(2);
                if (monthlyPmiSpan) monthlyPmiSpan.textContent = monthlyPmi.toFixed(2);
                if (monthlyHoaSpan) monthlyHoaSpan.textContent = monthlyHoa.toFixed(2);
                if (monthlyOtherSpan) monthlyOtherSpan.textContent = monthlyOther.toFixed(2);
                
                // Update calculation note
                if (calculationNote) {
                    calculationNote.textContent = 'Calculation includes principal, interest, and all additional expenses.';
                }
            } else {
                // Hide additional expenses in the summary
                if (additionalExpensesSummary) {
                    additionalExpensesSummary.classList.add('d-none');
                }
                
                // Update calculation note
                if (calculationNote) {
                    calculationNote.textContent = 'Calculation includes principal and interest only. It does not include taxes, insurance, or other expenses.';
                }
            }
            
            const totalMonthlyPayment = monthlyPayment + additionalMonthlyExpenses;
            
            // Update the payment result
            if (monthlyPaymentSpan) monthlyPaymentSpan.textContent = monthlyPayment.toFixed(2);
            if (totalMonthlyPaymentSpan) totalMonthlyPaymentSpan.textContent = totalMonthlyPayment.toFixed(2);
            
            // Generate standard amortization schedule
            const standardSchedule = generateAmortizationSchedule(principal, monthlyInterestRate, numberOfPayments, monthlyPayment);
            
            // Calculate total interest for standard schedule
            const standardTotalInterest = standardSchedule.reduce((total, payment) => total + payment.interest, 0);
            
            // Total amounts over the life of the loan
            if (totalPrincipalSpan) totalPrincipalSpan.textContent = principal.toFixed(2);
            if (totalInterestSpan) totalInterestSpan.textContent = standardTotalInterest.toFixed(2);
            
            // Handle extra payments if included
            let acceleratedSchedule = standardSchedule;
            
            if (includeExtraPaymentsCheckbox && includeExtraPaymentsCheckbox.checked) {
                // Get extra payment values
                const extraMonthly = extraMonthlyInput && extraMonthlyInput.value ? parseFloat(extraMonthlyInput.value) : 0;
                const extraAnnual = extraAnnualInput && extraAnnualInput.value ? parseFloat(extraAnnualInput.value) : 0;
                const extraOneTime = extraOneTimeInput && extraOneTimeInput.value ? parseFloat(extraOneTimeInput.value) : 0;
                const oneTimeMonth = oneTimeMonthInput && oneTimeMonthInput.value ? parseInt(oneTimeMonthInput.value) : 1;
                const biweekly = paymentScheduleSelect && paymentScheduleSelect.value === 'biweekly';
                
                // Calculate accelerated amortization schedule with extra payments
                acceleratedSchedule = generateAmortizationWithExtraPayments(
                    principal, 
                    monthlyInterestRate, 
                    numberOfPayments, 
                    monthlyPayment, 
                    { extraMonthly, extraAnnual, extraOneTime, oneTimeMonth, biweekly }
                );
                
                // Calculate total interest for accelerated schedule
                const acceleratedTotalInterest = acceleratedSchedule.reduce((total, payment) => total + payment.interest, 0);
                
                // Calculate savings
                const interestSaved = standardTotalInterest - acceleratedTotalInterest;
                const timesSavedMonths = standardSchedule.length - acceleratedSchedule.length;
                const timeSavedYears = (timesSavedMonths / 12).toFixed(1);
                const savingsPercentage = Math.round((interestSaved / standardTotalInterest) * 100);
                
                // Update the comparison section
                if (standardTermSpan) standardTermSpan.textContent = (loanTermYears).toFixed(0);
                if (standardInterestSpan) standardInterestSpan.textContent = standardTotalInterest.toFixed(2);
                if (acceleratedTermSpan) acceleratedTermSpan.textContent = (acceleratedSchedule.length / 12).toFixed(1);
                if (acceleratedInterestSpan) acceleratedInterestSpan.textContent = acceleratedTotalInterest.toFixed(2);
                if (timeSavedSpan) timeSavedSpan.textContent = timeSavedYears;
                if (interestSavedSpan) interestSavedSpan.textContent = interestSaved.toFixed(2);
                if (savingsProgressBar) {
                    savingsProgressBar.style.width = `${savingsPercentage}%`;
                    savingsProgressBar.setAttribute('aria-valuenow', savingsPercentage);
                }
                if (savingsPercentageSpan) savingsPercentageSpan.textContent = savingsPercentage;
                
                // Show the extra payments summary
                if (extraPaymentsSummary) {
                    extraPaymentsSummary.classList.remove('d-none');
                }
                
                // Display comparison chart
                displayPayoffComparisonChart(standardSchedule, acceleratedSchedule);
            } else {
                // Hide the extra payments summary
                if (extraPaymentsSummary) {
                    extraPaymentsSummary.classList.add('d-none');
                }
            }
            
            // Display results
            if (resultDiv) resultDiv.classList.remove('d-none');
            
            // Update pie chart
            if (paymentChartCtx) {
                updatePaymentChart(principal, standardTotalInterest, additionalMonthlyExpenses * standardSchedule.length);
            }
            
            // Display amortization schedule (use the appropriate schedule)
            displayAmortizationSchedule(includeExtraPaymentsCheckbox && includeExtraPaymentsCheckbox.checked ? acceleratedSchedule : standardSchedule);
            
            // Display amortization chart
            displayAmortizationChart(includeExtraPaymentsCheckbox && includeExtraPaymentsCheckbox.checked ? acceleratedSchedule : standardSchedule);
            
            // Scroll to results
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // --- Update Payment Breakdown Chart ---
    function updatePaymentChart(principal, totalInterest, totalAdditionalExpenses) {
        if (!paymentChartCtx) return;
        
        // Destroy previous chart if it exists
        if (paymentChart) {
            paymentChart.destroy();
            paymentChart = null;
        }
        
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        const textColor = currentTheme === 'dark' ? '#f8f9fa' : '#212529';
        
        // Create datasets based on whether additional expenses are included
        const datasets = [];
        const labels = [];
        const data = [];
        const backgroundColor = [];
        
        // Always include principal and interest
        labels.push('Principal', 'Interest');
        data.push(principal, totalInterest);
        backgroundColor.push(
            'rgba(54, 162, 235, 0.7)', // Blue for principal
            'rgba(255, 99, 132, 0.7)'  // Red for interest
        );
        
        // Add additional expenses if included
        if (includeExtrasCheckbox && includeExtrasCheckbox.checked && totalAdditionalExpenses > 0) {
            labels.push('Additional Expenses');
            data.push(totalAdditionalExpenses);
            backgroundColor.push('rgba(75, 192, 192, 0.7)'); // Teal for additional expenses
        }
        
        paymentChart = new Chart(paymentChartCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColor,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Total Payment Breakdown',
                        color: textColor
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    },
                    legend: {
                        labels: {
                            color: textColor
                        }
                    }
                }
            }
        });
    }

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