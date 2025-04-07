document.addEventListener('DOMContentLoaded', () => {
    const aprForm = document.getElementById('apr-checker-form');
    const loanAmountInput = document.getElementById('loan-amount');
    const financeChargeInput = document.getElementById('finance-charge');
    const loanTermInput = document.getElementById('loan-term-months');
    const resultDiv = document.getElementById('apr-result');
    const estimatedAprSpan = document.getElementById('estimated-apr');
    const errorDiv = document.getElementById('apr-error'); // Keep old error div for general errors

    // New error message elements for specific inputs
    const loanAmountError = document.getElementById('aprLoanAmountError');
    const financeChargeError = document.getElementById('aprFinanceChargeError');
    const loanTermError = document.getElementById('aprLoanTermMonthsError');

    // --- Input Validation Function ---
    const validateAprInputs = () => {
        let isValid = true;
        // Clear previous errors
        [loanAmountInput, financeChargeInput, loanTermInput].forEach(input => {
            input.classList.remove('is-invalid');
        });
        [loanAmountError, financeChargeError, loanTermError].forEach(errorEl => {
            if (errorEl) errorEl.textContent = '';
        });
        errorDiv.classList.add('d-none'); // Hide general error div initially

        const loanAmount = parseFloat(loanAmountInput.value);
        const financeCharge = parseFloat(financeChargeInput.value);
        const loanTermMonths = parseFloat(loanTermInput.value);

        // Validate Loan Amount
        if (isNaN(loanAmount) || loanAmount <= 0) {
            loanAmountInput.classList.add('is-invalid');
            if (loanAmountError) loanAmountError.textContent = 'Please enter a positive loan amount.';
            isValid = false;
        }

        // Validate Finance Charge
        // Can be 0 (e.g., 0% financing with no fees)
        if (isNaN(financeCharge) || financeCharge < 0) {
            financeChargeInput.classList.add('is-invalid');
            if (financeChargeError) financeChargeError.textContent = 'Please enter a non-negative finance charge.';
            isValid = false;
        }

        // Validate Loan Term
        if (isNaN(loanTermMonths) || loanTermMonths <= 0 || !Number.isInteger(loanTermMonths) || loanTermMonths > 600) { // Positive integer, max 50 years (600 months)
            loanTermInput.classList.add('is-invalid');
            if (loanTermError) loanTermError.textContent = 'Please enter a positive whole number of months (up to 600).';
            isValid = false;
        }

        // Additional check: Finance charge shouldn't logically be higher than the loan amount in most typical scenarios, 
        // but this isn't strictly invalid for APR calc, so maybe just a warning or skip.

        return isValid;
    };

    // --- Simple APR Estimation Function (using formula) ---
    // Note: This is a simplified estimation, not legally precise.
    function estimateAPR(financeCharge, loanAmount, termMonths) {
        if (loanAmount <= 0 || termMonths <= 0) {
            return NaN; // Avoid division by zero or invalid inputs
        }
         if (financeCharge === 0) return 0; // If no finance charge, APR is 0%

        // Formula: APR ≈ (Finance Charge / Loan Amount) * (12 / Term in Years) * 100
        // Let's use a slightly more common estimation formula:
        // APR ≈ (2 * Number of Payments per Year * Finance Charge) / (Loan Amount * (Total Number of Payments + 1))
        // Assuming monthly payments (Number of Payments per Year = 12)
        const n = 12; // Payments per year
        const N = termMonths; // Total number of payments

        const estimatedAPR = (2 * n * financeCharge) / (loanAmount * (N + 1));

        return estimatedAPR * 100; // Return as percentage
    }

    // --- Form Submission Handler ---
    aprForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        resultDiv.classList.add('d-none'); // Hide previous result

        // Validate inputs first
        if (!validateAprInputs()) {
            return; // Stop if validation fails
        }

        // Get validated values
        const loanAmount = parseFloat(loanAmountInput.value);
        const financeCharge = parseFloat(financeChargeInput.value);
        const termMonths = parseInt(loanTermInput.value);

        const apr = estimateAPR(financeCharge, loanAmount, termMonths);

        if (isNaN(apr)) {
             errorDiv.textContent = 'Could not calculate APR due to invalid inputs (e.g., division by zero).';
             errorDiv.classList.remove('d-none');
        } else {
            estimatedAprSpan.textContent = apr.toFixed(2);
            resultDiv.classList.remove('d-none');
        }
    });

    // Initialize Bootstrap Tooltips (if not already done globally)
    // Re-enable if needed specifically here
    /*
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    })
    */
}); 