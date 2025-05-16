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

    // New input fields for upfront and add-to-loan costs
    const downPaymentInput = document.getElementById('down-payment');
    const taxesLoanInput = document.getElementById('taxes-loan');
    const closingCostsInput = document.getElementById('closing-costs');
    const feesLoanInput = document.getElementById('fees-loan');

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

    // --- Calculate Monthly Payment (Principal & Interest) ---
    function calculateMonthlyPayment(principal, monthlyInterestRate, numberOfPayments) {
        if (principal <= 0) return 0;
        if (monthlyInterestRate === 0) {
            return principal / numberOfPayments; // No interest, just divide principal by payments
        }
        // Standard formula for monthly payment
        return principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    }

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

    function displayAmortizationSchedule(schedule, totalMonthlyAdditionalExpenses = 0) {
        if (!amortizationScheduleDiv) return;
        if (!schedule || schedule.length === 0) {
            amortizationScheduleDiv.innerHTML = '<p class="text-center">No schedule data to display.</p>';
            amortizationCard.classList.add('d-none');
            return;
        }

        // Check if any entry has an extra payment to decide on showing the column
        const hasExtraPayments = schedule.some(row => row.hasOwnProperty('extraPayment') && row.extraPayment > 0);
        const showMonthlyExtras = totalMonthlyAdditionalExpenses > 0;

        let tableHTML = `
            <table class="table table-striped table-hover table-sm small">
                <thead class="table-dark sticky-top">
                    <tr>
                        <th>Month</th>
                        <th>P&I Payment</th>
                        <th>Principal</th>
                        <th>Interest</th>
                        ${hasExtraPayments ? '<th>Extra Payment</th>' : ''}
                        ${showMonthlyExtras ? '<th>Monthly Extras</th>' : ''}
                        ${showMonthlyExtras ? '<th>Total Outlay</th>' : ''}
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
        `;

        schedule.forEach(row => {
            const pAndIPayment = row.payment || 0;
            const principalPayment = row.principal || 0;
            const interestPayment = row.interest || 0;
            const extraPayment = (hasExtraPayments && row.extraPayment) ? row.extraPayment : 0;
            const balance = row.balance || 0;
            const totalOutlay = pAndIPayment + extraPayment + (showMonthlyExtras ? totalMonthlyAdditionalExpenses : 0);

            tableHTML += `
                <tr>
                    <td>${row.month}</td>
                    <td>$${pAndIPayment.toFixed(2)}</td>
                    <td>$${principalPayment.toFixed(2)}</td>
                    <td>$${interestPayment.toFixed(2)}</td>
                    ${hasExtraPayments ? `<td>$${extraPayment.toFixed(2)}</td>` : ''}
                    ${showMonthlyExtras ? `<td>$${totalMonthlyAdditionalExpenses.toFixed(2)}</td>` : ''}
                    ${showMonthlyExtras ? `<td>$${totalOutlay.toFixed(2)}</td>` : ''}
                    <td>$${balance.toFixed(2)}</td>
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
        calculatorForm.addEventListener('submit', function(event) {
            event.preventDefault();

            if (!validateInputs()) {
                // Clear previous results if validation fails
                resultDiv.classList.add('d-none');
                amortizationCard.classList.add('d-none');
                if (paymentChart) paymentChart.destroy();
                if (amortizationChart) amortizationChart.destroy();
                if (payoffComparisonChart) payoffComparisonChart.destroy();
                return;
            }

            let loanAmount = parseFloat(loanAmountInput.value);
            const annualInterestRate = parseFloat(interestRateInput.value);
            const loanTermYears = parseInt(loanTermInput.value);

            // Get values from new input fields
            const downPayment = parseFloat(downPaymentInput.value) || 0;
            const taxesLoan = parseFloat(taxesLoanInput.value) || 0;
            const closingCosts = parseFloat(closingCostsInput.value) || 0;
            const feesLoan = parseFloat(feesLoanInput.value) || 0;

            // Adjust loan amount
            let actualLoanAmount = loanAmount; // Original amount entered by user
            if (downPayment > actualLoanAmount) {
                // Handle case where down payment is more than loan amount (show error or cap)
                // For now, let's assume loan amount becomes 0, or show an error.
                // This scenario should ideally be validated.
                // For simplicity, let's cap down payment at loan amount for calculation.
                // Or better, validate this upfront or provide feedback.
                // For now, just proceed, this implies the user gets money back or a 0 loan.
                // Let's adjust the principal to be at least 0.
                 alert("Down payment cannot exceed the loan amount. Please adjust your inputs.");
                 return; // Stop calculation
            }

            let principal = actualLoanAmount - downPayment;
            principal = principal + taxesLoan + closingCosts + feesLoan;
            
            // Ensure principal is not negative after adjustments
            if (principal < 0) {
                principal = 0; // Or handle as an error
            }

            const monthlyInterestRate = (annualInterestRate / 100) / 12;
            const numberOfPayments = loanTermYears * 12;
            
            const baseMonthlyPayment = calculateMonthlyPayment(principal, monthlyInterestRate, numberOfPayments);
            
            if (isNaN(baseMonthlyPayment) || !isFinite(baseMonthlyPayment)) {
                monthlyPaymentSpan.textContent = 'N/A';
                totalPrincipalSpan.textContent = 'N/A';
                totalInterestSpan.textContent = 'N/A';
                if(paymentChart) paymentChart.destroy();
                resultDiv.classList.remove('d-none'); // Show result div to display N/A
                amortizationCard.classList.add('d-none');
                if (additionalExpensesSummary) additionalExpensesSummary.classList.add('d-none');
                if (extraPaymentsSummary) extraPaymentsSummary.classList.add('d-none');
                calculationNote.textContent = 'Please check your inputs. Calculation resulted in an invalid value.';
                return;
            }

            monthlyPaymentSpan.textContent = baseMonthlyPayment.toFixed(2);
            totalPrincipalSpan.textContent = principal.toFixed(2); // Display the final calculated principal

            // Generate the standard amortization schedule (without any extra payments)
            // This will serve as the baseline for comparisons.
            const standardScheduleWithoutExtras = generateAmortizationSchedule(principal, monthlyInterestRate, numberOfPayments, baseMonthlyPayment);
            const standardTotalInterest = standardScheduleWithoutExtras.reduce((total, payment) => total + payment.interest, 0);
            // Get the term in months from the last payment's month property
            const standardTermInMonths = standardScheduleWithoutExtras.length > 0 ? standardScheduleWithoutExtras[standardScheduleWithoutExtras.length - 1].month : 0;

            // Update total interest span with standard total interest initially
            if (totalInterestSpan) totalInterestSpan.textContent = standardTotalInterest.toFixed(2);

            let finalScheduleToDisplay = standardScheduleWithoutExtras;
            let finalTotalInterest = standardTotalInterest;
            let finalTermInMonths = standardTermInMonths;
            
            if (includeExtraPaymentsCheckbox && includeExtraPaymentsCheckbox.checked) {
                // Get extra payment values
                const extraMonthly = parseFloat(extraMonthlyInput.value) || 0;
                const extraAnnual = parseFloat(extraAnnualInput.value) || 0;
                const oneTimeAmount = parseFloat(extraOneTimeInput.value) || 0;
                const oneTimeMonth = parseInt(oneTimeMonthInput.value) || 1;
                const paymentScheduleType = paymentScheduleSelect.value; // Renamed from paymentSchedule to avoid conflict
                
                const extraPayments = {
                    extraMonthly: extraMonthly,
                    extraAnnual: extraAnnual,
                    oneTimeAmount: oneTimeAmount,
                    oneTimeMonth: oneTimeMonth,
                    paymentSchedule: paymentScheduleType // Use the renamed variable
                };
                
                const acceleratedSchedule = generateAmortizationWithExtraPayments(
                    principal, 
                    monthlyInterestRate, 
                    numberOfPayments, // Original number of payments for reference, function might terminate earlier
                    baseMonthlyPayment, 
                    extraPayments
                );
                
                finalScheduleToDisplay = acceleratedSchedule; 
                finalTotalInterest = acceleratedSchedule.reduce((sum, payment) => sum + payment.interest, 0);
                // Get the accelerated term in months from the last payment's month property
                finalTermInMonths = acceleratedSchedule.length > 0 ? acceleratedSchedule[acceleratedSchedule.length - 1].month : 0;
                
                if (totalInterestSpan) totalInterestSpan.textContent = finalTotalInterest.toFixed(2);

                const timeSavedMonths = standardTermInMonths - finalTermInMonths;
                const interestSaved = standardTotalInterest - finalTotalInterest;
                
                const savingsPercentage = standardTotalInterest > 0 ? (interestSaved / standardTotalInterest) * 100 : 0;
                
                // Update comparison display values
                if (standardTermSpan) standardTermSpan.textContent = (standardTermInMonths / 12).toFixed(1);
                if (acceleratedTermSpan) acceleratedTermSpan.textContent = (finalTermInMonths / 12).toFixed(1);
                if (standardInterestSpan) standardInterestSpan.textContent = standardTotalInterest.toFixed(2);
                if (acceleratedInterestSpan) acceleratedInterestSpan.textContent = finalTotalInterest.toFixed(2);
                
                if (timeSavedSpan) {
                    const yearsSaved = Math.floor(timeSavedMonths / 12);
                    const monthsSaved = timeSavedMonths % 12;
                    timeSavedSpan.textContent = `${yearsSaved} years, ${monthsSaved} months`;
                }
                if (interestSavedSpan) interestSavedSpan.textContent = interestSaved.toFixed(2);
                
                if (savingsProgressBar && savingsPercentageSpan) {
                    savingsProgressBar.style.width = `${Math.max(0, Math.min(savingsPercentage, 100)).toFixed(2)}%`;
                    savingsPercentageSpan.textContent = `${savingsPercentage.toFixed(1)}%`;
                }
                
                displayPayoffComparisonChart(standardScheduleWithoutExtras, acceleratedSchedule);
                extraPaymentsSummary.classList.remove('d-none');
            } else {
                // If not including extra payments, ensure standard values are shown/reset
                finalTermInMonths = standardTermInMonths; // Ensure finalTermInMonths reflects standard term here
                if (standardTermSpan) standardTermSpan.textContent = (standardTermInMonths / 12).toFixed(1);
                if (standardInterestSpan) standardInterestSpan.textContent = standardTotalInterest.toFixed(2);
                // Clear accelerated specific fields if they were previously shown
                if (acceleratedTermSpan) acceleratedTermSpan.textContent = "N/A";
                if (acceleratedInterestSpan) acceleratedInterestSpan.textContent = "N/A";
                if (timeSavedSpan) timeSavedSpan.textContent = "0 years, 0 months";
                if (interestSavedSpan) interestSavedSpan.textContent = "0.00";
                if (savingsProgressBar) savingsProgressBar.style.width = '0%';
                if (savingsPercentageSpan) savingsPercentageSpan.textContent = '0%';
                
                if (payoffComparisonChart) payoffComparisonChart.destroy(); // Destroy chart if extras are unchecked

                extraPaymentsSummary.classList.add('d-none');
            }
            
            let totalMonthlyAdditionalExpenses = 0; // Initialize for clarity
            let lifetimeAdditionalExpenses = 0; 

            if (includeExtrasCheckbox && includeExtrasCheckbox.checked) {
                const monthlyPropertyTax = (parseFloat(propertyTaxInput.value) || 0) / 12;
                const monthlyInsurance = (parseFloat(insuranceInput.value) || 0) / 12;
                const monthlyPmi = parseFloat(pmiInput.value) || 0;
                const monthlyHoa = parseFloat(hoaInput.value) || 0;
                const monthlyOther = parseFloat(otherExpensesInput.value) || 0;
                
                const totalMonthlyAdditionalExpenses = monthlyPropertyTax + monthlyInsurance + monthlyPmi + monthlyHoa + monthlyOther;
                const totalOverallMonthlyPayment = baseMonthlyPayment + totalMonthlyAdditionalExpenses;
                
                monthlyTaxSpan.textContent = monthlyPropertyTax.toFixed(2);
                monthlyInsuranceSpan.textContent = monthlyInsurance.toFixed(2);
                monthlyPmiSpan.textContent = monthlyPmi.toFixed(2);
                monthlyHoaSpan.textContent = monthlyHoa.toFixed(2);
                monthlyOtherSpan.textContent = monthlyOther.toFixed(2);
                totalMonthlyPaymentSpan.textContent = totalOverallMonthlyPayment.toFixed(2);
                
                additionalExpensesSummary.classList.remove('d-none');
                calculationNote.textContent = 'Calculation includes principal, interest, and all additional monthly expenses.';
                
                // Calculate lifetime additional expenses based on the final schedule's actual term in months
                lifetimeAdditionalExpenses = totalMonthlyAdditionalExpenses * finalTermInMonths;

            } else {
                additionalExpensesSummary.classList.add('d-none');
                totalMonthlyPaymentSpan.textContent = baseMonthlyPayment.toFixed(2); // Show only P&I if no extras
                calculationNote.textContent = 'Calculation includes principal and interest only.';
                lifetimeAdditionalExpenses = 0;
            }
            
            resultDiv.classList.remove('d-none');
            
            // Update pie chart with potentially adjusted total interest and lifetime additional expenses
            if (paymentChartCtx) {
                updatePaymentChart(principal, finalTotalInterest, lifetimeAdditionalExpenses);
            }
            
            displayAmortizationSchedule(finalScheduleToDisplay, totalMonthlyAdditionalExpenses);
            displayAmortizationChart(finalScheduleToDisplay);
            
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // --- Update Payment Breakdown Chart ---
    function updatePaymentChart(principal, totalInterest, totalLifetimeAdditionalExpenses) {
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
        if (totalLifetimeAdditionalExpenses > 0) { // Check against the lifetime value
            labels.push('Additional Expenses');
            data.push(totalLifetimeAdditionalExpenses); // Use the lifetime value
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