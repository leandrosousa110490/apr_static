document.addEventListener('DOMContentLoaded', () => {
    console.log("APR Checker JS Loading...");

    // --- DOM Element References ---
    const aprForm = document.getElementById('apr-checker-form');
    const loanAmountInput = document.getElementById('loan-amount');
    const loanTermValueInput = document.getElementById('loan-term-value');
    const loanTermUnitSelect = document.getElementById('loan-term-unit');
    const financeChargeInput = document.getElementById('finance-charge');
    const monthlyPaymentInput = document.getElementById('monthly-payment');
    const closingDateInput = document.getElementById('closing-date');
    const firstPaymentDateInput = document.getElementById('first-payment-date');
    const firstPaymentAmountInput = document.getElementById('first-payment-amount');
    const lastPaymentAmountInput = document.getElementById('last-payment-amount');
    const lastPaymentDateInput = document.getElementById('last-payment-date');

    const resultDiv = document.getElementById('apr-result');
    const estimatedAprSpan = document.getElementById('estimated-apr');
    const calculatedFinanceChargeSpan = document.getElementById('calculated-finance-charge');
    const calculatedTotalPaymentsSpan = document.getElementById('calculated-total-payments');
    const errorDiv = document.getElementById('apr-error');

    const loanAmountError = document.getElementById('aprLoanAmountError');
    const loanTermError = document.getElementById('aprLoanTermError');
    const financeChargeError = document.getElementById('aprFinanceChargeError');
    const monthlyPaymentError = document.getElementById('aprMonthlyPaymentError');
    const closingDateError = document.getElementById('aprClosingDateError');
    const firstPaymentDateError = document.getElementById('aprFirstPaymentDateError');
    const firstPaymentAmountError = document.getElementById('aprFirstPaymentAmountError');
    const lastPaymentAmountError = document.getElementById('aprLastPaymentAmountError');
    const lastPaymentDateError = document.getElementById('aprLastPaymentDateError');

    if (!aprForm) {
        console.error("APR Form not found! Aborting script.");
        return;
    }
    console.log("APR Form found.");

    // --- Helper Functions ---
    const clearInputErrors = () => {
        console.log("Clearing input errors...");
        const inputs = [loanAmountInput, loanTermValueInput, financeChargeInput, monthlyPaymentInput, closingDateInput, firstPaymentDateInput, firstPaymentAmountInput, lastPaymentAmountInput, lastPaymentDateInput];
        const errorSpans = [loanAmountError, loanTermError, financeChargeError, monthlyPaymentError, closingDateError, firstPaymentDateError, firstPaymentAmountError, lastPaymentAmountError, lastPaymentDateError];

        inputs.forEach(input => input?.classList.remove('is-invalid'));
        errorSpans.forEach(span => { if (span) span.textContent = ''; });
        errorDiv.classList.add('d-none');
        errorDiv.textContent = ''; // Clear general error text
    };

    const showInputError = (inputElement, errorElement, message) => {
        console.warn(`Input Error: [${inputElement?.id || 'unknown'}] ${message}`);
        if (inputElement) inputElement.classList.add('is-invalid');
        if (errorElement) errorElement.textContent = message;
    };

    const showGeneralError = (message) => {
        console.error(`General Error: ${message}`);
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
        resultDiv.classList.add('d-none'); // Hide results on error
    };

    // --- Input Validation --- 
    const validateInputs = (inputs) => {
        console.log("Validating inputs:", inputs);
        let isValid = true;
        let specificErrorFound = false;
        let missingCoreOptional = false;

        // Required fields
        if (isNaN(inputs.loanAmount) || inputs.loanAmount <= 0) {
            showInputError(loanAmountInput, loanAmountError, 'Loan amount must be a positive number.');
            isValid = false; specificErrorFound = true;
        }
        if (isNaN(inputs.termMonths) || inputs.termMonths <= 0 || !Number.isInteger(inputs.termMonths)) {
            showInputError(loanTermValueInput, loanTermError, 'Term must be a positive whole number.');
            isValid = false; specificErrorFound = true;
        } else if (inputs.termMonths > 720) { // Max 60 years
            showInputError(loanTermValueInput, loanTermError, 'Term exceeds maximum (60 years / 720 months).');
            isValid = false; specificErrorFound = true;
        }

        // Check if at least one core optional is provided
        if (inputs.financeChargeStr === '' && inputs.monthlyPaymentStr === '') {
            isValid = false;
            missingCoreOptional = true;
        }

        // Validate optional fields *if* they contain values
        if (inputs.financeChargeStr !== '' && (isNaN(inputs.financeCharge) || inputs.financeCharge < 0)) {
            showInputError(financeChargeInput, financeChargeError, 'Finance charge must be non-negative.');
            isValid = false; specificErrorFound = true;
        }
        if (inputs.monthlyPaymentStr !== '' && (isNaN(inputs.monthlyPayment) || inputs.monthlyPayment <= 0)) {
            showInputError(monthlyPaymentInput, monthlyPaymentError, 'Monthly payment must be positive.');
            isValid = false; specificErrorFound = true;
        }
        if (inputs.firstPaymentAmountStr !== '' && (isNaN(inputs.firstPaymentAmount) || inputs.firstPaymentAmount <= 0)) {
            showInputError(firstPaymentAmountInput, firstPaymentAmountError, 'First payment must be positive.');
            isValid = false; specificErrorFound = true;
        }
        if (inputs.lastPaymentAmountStr !== '' && (isNaN(inputs.lastPaymentAmount) || inputs.lastPaymentAmount <= 0)) {
            showInputError(lastPaymentAmountInput, lastPaymentAmountError, 'Last payment must be positive.');
            isValid = false; specificErrorFound = true;
        }
        if (inputs.closingDate && inputs.firstPaymentDate && inputs.firstPaymentDate <= inputs.closingDate) {
            showInputError(firstPaymentDateInput, firstPaymentDateError, 'First payment date must be after closing date.');
            isValid = false; specificErrorFound = true;
        }
        // Add validation for last payment date if needed (e.g., must be after first payment)
        if (inputs.firstPaymentDate && inputs.lastPaymentDate && inputs.lastPaymentDate < inputs.firstPaymentDate) {
            showInputError(lastPaymentDateInput, lastPaymentDateError, 'Last payment date must be on or after first payment date.');
            isValid = false; specificErrorFound = true;
        }

        // Show general error only if missingCoreOptional is the *only* reason isValid is false
        if (missingCoreOptional && !specificErrorFound) {
            // Only reason for failure is that user provided neither FC nor MP.
            // No specific input fields had errors (like negative numbers etc.)
            showGeneralError('APR calculation requires either Total Finance Charge or Monthly Payment.'); // Reworded slightly
        }

        console.log(`Validation result: ${isValid}`);
        return isValid;
    };

    // --- APR Calculation Logic --- 
    
    // Calculates PV of a cash flow series (simplified - ignores date irregularities for now)
    function calculatePV(periodicRate, payments) {
        if (periodicRate <= -1) { // Avoid issues with rate being -100% or less
            return Infinity;
        }
        let pv = 0;
        for (let i = 0; i < payments.length; i++) {
            pv += payments[i] / Math.pow(1 + periodicRate, i + 1);
        }
        // console.log(`Rate: ${(periodicRate * 12 * 100).toFixed(6)}%, PV: ${pv.toFixed(4)}`);
        return pv;
    }

    // Iterative solver for periodic rate
    function solveRate(loanAmount, payments, tolerance = 0.000001, maxIterations = 100) {
        console.log("Solving for rate...");
        const totalPayments = payments.reduce((a, b) => a + b, 0);
        if (totalPayments <= loanAmount) {
             console.log("Total payments <= loan amount. APR is 0% or negative.")
             return 0; 
        }

        let lowRate = 0;
        let highRate = 1.0; // 100% monthly rate = 1200% APR
        let midRate, pv;

        for (let i = 0; i < maxIterations; i++) {
            midRate = (lowRate + highRate) / 2;
            pv = calculatePV(midRate, payments);

            if (isNaN(pv) || !isFinite(pv)) {
                 console.error(`PV calculation returned invalid value (${pv}) at iteration ${i}, rate ${midRate}. Trying lower rate.`);
                 highRate = midRate; // Problem might be rate too high, try lower half
                 continue; // Skip comparison for this iteration
             }

            if (Math.abs(pv - loanAmount) < tolerance) {
                console.log(`Rate converged in ${i + 1} iterations. Periodic Rate: ${midRate}`);
                return midRate;
            }

            if (pv > loanAmount) {
                lowRate = midRate; // Need higher rate to decrease PV
            } else {
                highRate = midRate; // Need lower rate to increase PV
            }
             // console.log(`Iter ${i}: Low=${lowRate.toFixed(6)}, High=${highRate.toFixed(6)}, Mid=${midRate.toFixed(6)}, PV=${pv.toFixed(4)}`);
        }

        console.warn(`Rate solver did not converge within ${maxIterations} iterations. Returning best guess: ${midRate}`);
        return midRate; // Return the last calculated mid-rate as the best guess
    }

    // --- Form Submit Handler --- 
    aprForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log("Calculate APR button clicked.");
        clearInputErrors();
        resultDiv.classList.add('d-none'); // Hide previous results

        // --- 1. Read and Parse Inputs ---
        const termValue = parseFloat(loanTermValueInput.value);
        const termUnit = loanTermUnitSelect.value;
        let calculatedTermMonths = NaN;
        if (!isNaN(termValue)) {
            calculatedTermMonths = (termUnit === 'years') ? Math.round(termValue * 12) : Math.round(termValue);
        }

        const inputs = {
            loanAmount: parseFloat(loanAmountInput.value),
            termMonths: calculatedTermMonths,
            financeChargeStr: financeChargeInput.value.trim(),
            monthlyPaymentStr: monthlyPaymentInput.value.trim(),
            closingDateStr: closingDateInput.value,
            firstPaymentDateStr: firstPaymentDateInput.value,
            firstPaymentAmountStr: firstPaymentAmountInput.value.trim(),
            lastPaymentAmountStr: lastPaymentAmountInput.value.trim(),
            lastPaymentDateStr: lastPaymentDateInput.value
        };

        inputs.financeCharge = inputs.financeChargeStr === '' ? NaN : parseFloat(inputs.financeChargeStr);
        inputs.monthlyPayment = inputs.monthlyPaymentStr === '' ? NaN : parseFloat(inputs.monthlyPaymentStr);
        inputs.firstPaymentAmount = inputs.firstPaymentAmountStr === '' ? NaN : parseFloat(inputs.firstPaymentAmountStr);
        inputs.lastPaymentAmount = inputs.lastPaymentAmountStr === '' ? NaN : parseFloat(inputs.lastPaymentAmountStr);
        // Add T00:00:00 to parse dates reliably in local timezone
        inputs.closingDate = inputs.closingDateStr ? new Date(inputs.closingDateStr + 'T00:00:00') : null;
        inputs.firstPaymentDate = inputs.firstPaymentDateStr ? new Date(inputs.firstPaymentDateStr + 'T00:00:00') : null;
        inputs.lastPaymentDate = inputs.lastPaymentDateStr ? new Date(inputs.lastPaymentDateStr + 'T00:00:00') : null;
        
        console.log("Parsed Inputs:", inputs);

        // --- 2. Validate Inputs ---
        if (!validateInputs(inputs)) {
            console.warn("Input validation failed.");
            return;
        }
        console.log("Input validation passed.");

        // --- 3. Derive Missing Payment/Finance Charge ---
        let monthlyPayment = inputs.monthlyPayment;
        let financeCharge = inputs.financeCharge;
        let firstPayment = inputs.firstPaymentAmount;
        let lastPayment = inputs.lastPaymentAmount;

        try {
            if (isNaN(monthlyPayment) && !isNaN(financeCharge)) {
                console.log("Calculating monthly payment from finance charge...");
                const totalPaid = inputs.loanAmount + financeCharge;
                let regularPaymentsTotal = totalPaid;
                let numRegularPayments = inputs.termMonths;
                
                // Use provided first/last amounts if available, otherwise assume they are part of regular calculation
                 let actualFirst = isNaN(firstPayment) ? 0 : firstPayment;
                 let actualLast = isNaN(lastPayment) ? 0 : lastPayment;
                 let firstIsDifferent = !isNaN(firstPayment);
                 let lastIsDifferent = !isNaN(lastPayment);

                 if (firstIsDifferent) { regularPaymentsTotal -= actualFirst; numRegularPayments -= 1; }
                 if (lastIsDifferent) {
                     // Avoid double-subtracting if term=1 and both are set (first covers it)
                     if (inputs.termMonths > 1 || !firstIsDifferent) {
                        regularPaymentsTotal -= actualLast;
                        numRegularPayments -= (numRegularPayments > 0 ? 1 : 0); // Ensure doesn't go below 0
                     }
                 }

                if (numRegularPayments > 0) {
                     monthlyPayment = regularPaymentsTotal / numRegularPayments;
                     if (monthlyPayment < 0) {
                         throw new Error("Calculated monthly payment is negative based on finance charge and first/last payments.");
                     }
                 } else if (numRegularPayments === 0 && (firstIsDifferent || lastIsDifferent)) {
                      monthlyPayment = 0; // All payments are accounted for by first/last
                 } else if (inputs.termMonths === 0) {
                      monthlyPayment = 0;
                 } else {
                     // This case implies negative payment needed, which is invalid
                      throw new Error("Cannot determine a non-negative regular payment. Check finance charge, first/last payments, and term.");
                 }
                console.log("Derived monthly payment:", monthlyPayment);
            }
            else if (!isNaN(monthlyPayment) && isNaN(financeCharge)) {
                 console.log("Calculating finance charge from monthly payment...");
                 // Use provided first/last if available, otherwise default to monthly payment
                 firstPayment = isNaN(firstPayment) ? monthlyPayment : firstPayment;
                 lastPayment = isNaN(lastPayment) ? monthlyPayment : lastPayment;
                 let totalPaid = 0;
                 if (inputs.termMonths === 1) {
                     totalPaid = firstPayment;
                 } else if (inputs.termMonths >= 2) {
                     totalPaid = firstPayment + lastPayment + (monthlyPayment * Math.max(0, inputs.termMonths - 2));
                 }
                 financeCharge = totalPaid - inputs.loanAmount;
                 if (financeCharge < 0) {
                     // This is possible (e.g. rebate > interest), but APR would be weird/negative
                     console.warn("Calculated finance charge is negative.");
                 }
                 console.log("Derived finance charge:", financeCharge);
            }
        } catch (error) {
             showGeneralError(`Calculation Error: ${error.message}`);
             return;
        }

        // --- 4. Construct Payment Schedule Array ---
        firstPayment = isNaN(inputs.firstPaymentAmount) ? monthlyPayment : inputs.firstPaymentAmount;
        lastPayment = isNaN(inputs.lastPaymentAmount) ? monthlyPayment : inputs.lastPaymentAmount;
        let payments = [];
        try {
             if (inputs.termMonths < 0) throw new Error("Loan term cannot be negative.");
             if (inputs.termMonths === 1) {
                payments.push(firstPayment);
            } else if (inputs.termMonths >= 2) {
                payments.push(firstPayment);
                for (let i = 1; i < inputs.termMonths - 1; i++) {
                    if (monthlyPayment < 0) throw new Error("Negative monthly payment encountered.");
                    payments.push(monthlyPayment);
                }
                payments.push(lastPayment);
            }
            // Else termMonths is 0, payments array remains empty
            
            if (payments.length !== inputs.termMonths) {
                throw new Error(`Internal error: Payment array length (${payments.length}) mismatch with term (${inputs.termMonths}).`);
            }
            console.log("Payment schedule array:", payments);
        } catch (error) {
            showGeneralError(`Payment Schedule Error: ${error.message}`);
            return;
        }

        // --- 5. Calculate APR --- 
        let periodicRate = 0;
        try {
            if (inputs.loanAmount <= 0) throw new Error("Loan amount must be positive for APR calculation.");
            // Pass dates to PV calculation if available (though currently ignored in PV calc)
            periodicRate = solveRate(inputs.loanAmount, payments);
        } catch (error) {
            showGeneralError(`APR Calculation Error: ${error.message}`);
            return;
        }
        const estimatedAPR = periodicRate * 12 * 100;
        console.log(`Calculated Periodic Rate: ${periodicRate}, Estimated APR: ${estimatedAPR}`);

        // --- 6. Display Results ---
        estimatedAprSpan.textContent = estimatedAPR.toFixed(3);
        calculatedFinanceChargeSpan.textContent = isNaN(financeCharge) ? 'N/A' : `$${financeCharge.toFixed(2)}`;
        const totalPaymentsValue = isNaN(financeCharge) ? payments.reduce((a, b) => a + b, 0) : inputs.loanAmount + financeCharge;
        calculatedTotalPaymentsSpan.textContent = `$${totalPaymentsValue.toFixed(2)}`;
        resultDiv.classList.remove('d-none');
        console.log("Results displayed.");
    });

    console.log("APR Checker JS Loaded Successfully.");
}); 