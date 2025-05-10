// Placeholder for calculator logic
document.addEventListener('DOMContentLoaded', () => {
    // Register Chart.js annotation plugin if available
    if (typeof Chart !== 'undefined' && Chart.register && Chart.Annotation) {
        Chart.register(Chart.Annotation);
    }
    
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
    function generateAmortizationWithExtraPayments(principal, monthlyInterestRate, numberOfPayments, baseMonthlyPayment, extraPayments) {
        let schedule = [];
        let balance = principal;
        let month = 1;

        // Destructure extra payment parameters
        const { 
            extraMonthly = 0, 
            extraAnnual = 0, 
            oneTimeAmount = 0, 
            oneTimeMonth = 1,
            paymentSchedule = 'monthly'
        } = extraPayments || {};

        const biweekly = paymentSchedule === 'biweekly';
        let scheduledPayment = biweekly ? baseMonthlyPayment / 2 : baseMonthlyPayment;
        
        // For biweekly, we'll make a payment every two weeks (26 payments per year)
        // which equals 13 monthly-equivalent payments instead of 12
        const paymentsPerPeriod = biweekly ? 2 : 1;
        let biweeklyCounter = 0;

        while (balance > 0 && month <= numberOfPayments * 1.5) {  // Limit to 1.5x original term as safety
            for (let p = 0; p < paymentsPerPeriod; p++) {
                if (balance <= 0) break;
                
                // Only proceed with the second payment in biweekly if we have balance left
                if (biweekly && p === 1 && balance <= 0) break;
                
                // For biweekly, we count each payment separately
                if (biweekly) biweeklyCounter++;
                
                // Calculate regular interest for this payment period
                const interestPayment = balance * (biweekly ? monthlyInterestRate / 2 : monthlyInterestRate);
                
                // Determine base payment amount not to exceed remaining balance + interest
                let paymentAmount = Math.min(scheduledPayment, balance + interestPayment);
                let principalPayment = paymentAmount - interestPayment;
                
                // Calculate extra payments for this period
                let extraPayment = 0;
                
                // Add monthly extra payment
                if (extraMonthly > 0) {
                    if (biweekly) {
                        // Split the monthly extra payment across the two biweekly payments
                        extraPayment += extraMonthly / 2;
                    } else {
                        extraPayment += extraMonthly;
                    }
                }
                
                // Add annual extra payment (apply in December or divided across payments)
                if (extraAnnual > 0) {
                    if (month % 12 === 0 && p === 0) { // Apply in full on December's first payment
                        extraPayment += extraAnnual;
                    }
                }
                
                // Add one-time payment in the specified month
                if (oneTimeAmount > 0 && month === oneTimeMonth && p === 0) {
                    extraPayment += oneTimeAmount;
                }
                
                // Make sure extra payment doesn't exceed remaining balance
                extraPayment = Math.min(extraPayment, Math.max(0, balance - principalPayment));
                
                // Update balance after regular and extra payments
                balance -= (principalPayment + extraPayment);
                
                // Ensure balance doesn't go negative due to floating point issues
                if (balance < 0.01) balance = 0;
                
                // Store payment details
                schedule.push({
                    month: month,
                    payment: paymentAmount,
                    principal: principalPayment,
                    interest: interestPayment,
                    extraPayment: extraPayment,
                    balance: balance
                });
            }
            month++;
        }
        
        return schedule;
    }

    // --- Display Comparison Chart between Standard and Accelerated Payoff ---
    function displayPayoffComparisonChart(standardSchedule, acceleratedSchedule) {
        if (!payoffComparisonChartCtx) return;
        
        // Clean up old chart
        if (payoffComparisonChart) {
            payoffComparisonChart.destroy();
        }
        
        // Prepare data for the chart
        const standardLabels = standardSchedule.map(entry => entry.month);
        const standardBalances = standardSchedule.map(entry => entry.balance);
        
        const acceleratedLabels = acceleratedSchedule.map(entry => entry.month);
        const acceleratedBalances = acceleratedSchedule.map(entry => entry.balance);
        
        // Create datasets
        const datasets = [
            {
                label: 'Standard Payment Schedule',
                data: standardBalances,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 2,
                fill: true
            },
            {
                label: 'Accelerated Payment Schedule',
                data: acceleratedBalances,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2,
                fill: true
            }
        ];
        
        // Get current theme
        const theme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        const isDarkMode = theme === 'dark';
        const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        // Create the chart
        payoffComparisonChart = new Chart(payoffComparisonChartCtx, {
            type: 'line',
            data: {
                labels: standardLabels.length > acceleratedLabels.length ? acceleratedLabels : standardLabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + context.raw.toFixed(2);
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor
                        }
                    },
                    title: {
                        display: true,
                        text: 'Loan Balance Over Time',
                        color: textColor
                    },
                    annotation: {
                        annotations: {
                            standardEnd: {
                                type: 'line',
                                xMin: standardLabels.length,
                                xMax: standardLabels.length,
                                borderColor: 'rgba(255, 99, 132, 0.5)',
                                borderWidth: 2,
                                borderDash: [6, 6],
                                label: {
                                    content: 'Standard Payoff',
                                    enabled: true,
                                    position: 'center',
                                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                                    color: 'white'
                                }
                            },
                            acceleratedEnd: {
                                type: 'line',
                                xMin: acceleratedLabels.length,
                                xMax: acceleratedLabels.length,
                                borderColor: 'rgba(54, 162, 235, 0.5)',
                                borderWidth: 2,
                                borderDash: [6, 6],
                                label: {
                                    content: 'Accelerated Payoff',
                                    enabled: true,
                                    position: 'center',
                                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                                    color: 'white'
                                }
                            }
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
                            color: textColor
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
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            },
                            color: textColor
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
                const extraMonthly = parseFloat(extraMonthlyInput.value) || 0;
                const extraAnnual = parseFloat(extraAnnualInput.value) || 0;
                const oneTimeAmount = parseFloat(extraOneTimeInput.value) || 0;
                const oneTimeMonth = parseInt(oneTimeMonthInput.value) || 1;
                const paymentSchedule = paymentScheduleSelect.value;
                
                // Generate accelerated schedule with extra payments
                const extraPayments = {
                    extraMonthly: extraMonthly,
                    extraAnnual: extraAnnual,
                    oneTimeAmount: oneTimeAmount,
                    oneTimeMonth: oneTimeMonth,
                    paymentSchedule: paymentSchedule
                };
                
                const acceleratedSchedule = generateAmortizationWithExtraPayments(
                    principal, 
                    monthlyInterestRate, 
                    numberOfPayments, 
                    monthlyPayment, 
                    extraPayments
                );
                
                // Calculate accelerated totals
                const acceleratedTotalPayments = acceleratedSchedule.reduce((sum, payment) => sum + payment.payment + payment.extraPayment, 0);
                const acceleratedTotalInterest = acceleratedSchedule.reduce((sum, payment) => sum + payment.interest, 0);
                const timeSavedMonths = standardSchedule.length - acceleratedSchedule.length;
                const interestSaved = standardTotalInterest - acceleratedTotalInterest;
                
                // Calculate savings percentage
                const savingsPercentage = (interestSaved / standardTotalInterest) * 100;
                
                // Update comparison display values
                if (standardTermSpan) standardTermSpan.textContent = (standardSchedule.length / 12).toFixed(1);
                if (acceleratedTermSpan) acceleratedTermSpan.textContent = (acceleratedSchedule.length / 12).toFixed(1);
                if (standardInterestSpan) standardInterestSpan.textContent = standardTotalInterest.toFixed(2);
                if (acceleratedInterestSpan) acceleratedInterestSpan.textContent = acceleratedTotalInterest.toFixed(2);
                if (timeSavedSpan) timeSavedSpan.textContent = `${Math.floor(timeSavedMonths / 12)} years, ${timeSavedMonths % 12} months`;
                if (interestSavedSpan) interestSavedSpan.textContent = interestSaved.toFixed(2);
                
                // Update progress bar
                if (savingsProgressBar && savingsPercentageSpan) {
                    savingsProgressBar.style.width = `${Math.min(savingsPercentage, 100)}%`;
                    savingsPercentageSpan.textContent = `${savingsPercentage.toFixed(1)}%`;
                }
                
                // Display extra payments comparison chart
                displayPayoffComparisonChart(standardSchedule, acceleratedSchedule);
                
                // Display amortization schedule with extra payments
                displayAmortizationSchedule(acceleratedSchedule);
                
                // Show extra payments summary section
                if (extraPaymentsSummary) extraPaymentsSummary.classList.remove('d-none');
            } else {
                // Just show regular amortization schedule
                displayAmortizationSchedule(standardSchedule);
                
                // Hide extra payments summary
                if (extraPaymentsSummary) extraPaymentsSummary.classList.add('d-none');
            }
            
            // Process additional expenses if checked
            if (includeExtrasCheckbox && includeExtrasCheckbox.checked) {
                // Get expenses
                const monthlyPropertyTax = parseFloat(propertyTaxInput.value) / 12 || 0;
                const monthlyInsurance = parseFloat(insuranceInput.value) / 12 || 0;
                const monthlyPmi = parseFloat(pmiInput.value) || 0;
                const monthlyHoa = parseFloat(hoaInput.value) || 0;
                const monthlyOther = parseFloat(otherExpensesInput.value) || 0;
                
                // Calculate total monthly payment with additional expenses
                const totalMonthlyExpenses = monthlyPropertyTax + monthlyInsurance + monthlyPmi + monthlyHoa + monthlyOther;
                const totalMonthlyPayment = monthlyPayment + totalMonthlyExpenses;
                
                // Update display values
                monthlyTaxSpan.textContent = monthlyPropertyTax.toFixed(2);
                monthlyInsuranceSpan.textContent = monthlyInsurance.toFixed(2);
                monthlyPmiSpan.textContent = monthlyPmi.toFixed(2);
                monthlyHoaSpan.textContent = monthlyHoa.toFixed(2);
                monthlyOtherSpan.textContent = monthlyOther.toFixed(2);
                totalMonthlyPaymentSpan.textContent = totalMonthlyPayment.toFixed(2);
                
                // Show additional expenses summary
                additionalExpensesSummary.classList.remove('d-none');
                
                // Update chart to include additional expenses
                if (paymentChartCtx) {
                    updatePaymentChart(principal, standardTotalInterest, totalMonthlyExpenses * numberOfPayments);
                }
            } else {
                // Hide additional expenses summary
                additionalExpensesSummary.classList.add('d-none');
                
                // Update chart without additional expenses
                if (paymentChartCtx) {
                    updatePaymentChart(principal, standardTotalInterest, 0);
                }
            }
            
            // Show results
            resultDiv.classList.remove('d-none');
            
            // Update pie chart
            if (paymentChartCtx) {
                updatePaymentChart(principal, standardTotalInterest, additionalMonthlyExpenses * standardSchedule.length);
            }
            
            // Display amortization schedule (use the appropriate schedule)
            displayAmortizationSchedule(includeExtraPaymentsCheckbox && includeExtraPaymentsCheckbox.checked ? acceleratedSchedule : standardSchedule);
            
            // Display amortization chart
            displayAmortizationChart(includeExtraPaymentsCheckbox && includeExtraPaymentsCheckbox.checked ? acceleratedSchedule : standardSchedule);
            
            // Scroll to results
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        const theme = event.detail.theme;
        // Re-render charts if they exist
        if (paymentChart || amortizationChart || payoffComparisonChart) {
            // We need to trigger a resize event to make the charts re-render with new theme colors
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
        }
    });

    // Tooltip initialization
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}); 