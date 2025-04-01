document.addEventListener('DOMContentLoaded', () => {
    const aprForm = document.getElementById('apr-checker-form');
    const resultAlert = document.getElementById('apr-result');
    const errorAlert = document.getElementById('apr-error');

    // Input fields
    const loanAmountInput = document.getElementById('loan-amount');
    const financeChargeInput = document.getElementById('finance-charge');
    const termMonthsInput = document.getElementById('loan-term-months');
    const statedAprInput = document.getElementById('stated-apr');

    if (aprForm) {
        aprForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Reset alerts
            resultAlert.classList.add('d-none');
            errorAlert.classList.add('d-none');
            resultAlert.innerHTML = '';
            errorAlert.innerHTML = '';

            // Get and validate inputs
            const principal = parseFloat(loanAmountInput.value);
            const financeCharge = parseFloat(financeChargeInput.value);
            const termMonths = parseInt(termMonthsInput.value);
            const statedAPR = parseFloat(statedAprInput.value); // Optional

            let errorMessage = '';
            if (isNaN(principal) || principal <= 0) {
                errorMessage += 'Please enter a valid positive Loan Amount. ';
            }
            if (isNaN(financeCharge) || financeCharge < 0) { // Finance charge can be 0
                errorMessage += 'Please enter a valid Finance Charge. ';
            }
            if (isNaN(termMonths) || termMonths <= 0) {
                errorMessage += 'Please enter a valid positive Loan Term (Total Payments). ';
            }
            // Optional stated APR doesn't need strict validation unless entered
             if (statedAprInput.value.trim() !== '' && (isNaN(statedAPR) || statedAPR < 0)) {
                 errorMessage += 'If entering a Stated APR, please ensure it is a valid non-negative number. ';
            }


            if (errorMessage) {
                errorAlert.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`;
                errorAlert.classList.remove('d-none');
                return;
            }

            // Calculate Estimated APR using n-ratio approximation
            // APR ≈ (2 * N * I) / (P * (n + 1))
            // N = 12 (periods per year)
            // I = Finance Charge
            // P = Principal (Loan Amount)
            // n = Total number of payments (termMonths)
            
            let calculatedAPR = 0;
            if (principal > 0 && termMonths > 0) { // Avoid division by zero
                 calculatedAPR = (2 * 12 * financeCharge) / (principal * (termMonths + 1));
                 calculatedAPR *= 100; // Convert to percentage
            } else if (principal === 0 && financeCharge === 0) {
                 calculatedAPR = 0; // Sensible default if no loan amount and no finance charge
            } else {
                 errorAlert.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Cannot calculate APR with zero principal or term unless finance charge is also zero.`;
                 errorAlert.classList.remove('d-none');
                 return;
            }


            // --- Display Results ---
            let resultHTML = `
                <h4 class="alert-heading">Estimated APR Result:</h4>
                <p class="mb-1">Based on the provided information, the estimated APR is approximately: 
                    <strong class="fs-5">${calculatedAPR.toFixed(3)}%</strong>
                </p>
            `;

            // Compare with stated APR if provided
            if (!isNaN(statedAPR)) {
                const difference = calculatedAPR - statedAPR;
                let comparisonText = '';
                let comparisonClass = 'text-muted'; // Default

                if (Math.abs(difference) < 0.1) { // Allow for small rounding differences
                    comparisonText = `This is very close to the stated APR of ${statedAPR.toFixed(3)}%.`;
                    comparisonClass = 'text-success';
                } else if (difference > 0.1) {
                    comparisonText = `This is <strong class="text-danger">higher</strong> than the stated APR of ${statedAPR.toFixed(3)}%. You might be paying more than expected.`;
                     comparisonClass = 'text-danger fw-bold';
                } else { // difference < -0.1
                    comparisonText = `This is <strong class="text-warning">lower</strong> than the stated APR of ${statedAPR.toFixed(3)}%. This could be due to calculation differences or unlisted fees in the finance charge.`;
                     comparisonClass = 'text-warning fw-bold';
                }
                 resultHTML += `<hr><p class="mb-0 ${comparisonClass}">${comparisonText}</p>`;
            }

            resultAlert.innerHTML = resultHTML;
            resultAlert.classList.remove('d-none');
        });
    }
}); 