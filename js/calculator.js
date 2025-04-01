// Placeholder for calculator logic
document.addEventListener('DOMContentLoaded', () => {
    const calculatorForm = document.getElementById('calculator-form');
    // const resultDiv = document.getElementById('calculator-result'); // Old result div
    const resultAlert = document.getElementById('calculator-result'); // New alert div for results
    const errorAlert = document.getElementById('calculator-error');   // New alert div for errors

    if (calculatorForm) {
        calculatorForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent actual form submission

            // Hide previous alerts
            resultAlert.classList.add('d-none');
            errorAlert.classList.add('d-none');
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
        });
    }
}); 