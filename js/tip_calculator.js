// Tip Calculator JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const form = document.getElementById('tip-calculator-form');
    const billAmountInput = document.getElementById('bill-amount');
    const tipPercentageInput = document.getElementById('tip-percentage');
    const numPeopleInput = document.getElementById('num-people');
    const tipButtons = document.querySelectorAll('.tip-btn');
    const resultContainer = document.getElementById('tip-result');
    
    // Summary elements
    const summaryBillAmount = document.getElementById('summary-bill-amount');
    const summaryTipAmount = document.getElementById('summary-tip-amount');
    const summaryTotalAmount = document.getElementById('summary-total-amount');
    const summaryNumPeople = document.getElementById('summary-num-people');
    const summaryPerPersonBefore = document.getElementById('summary-per-person-before');
    const summaryTipPerPerson = document.getElementById('summary-tip-per-person');
    const summaryPerPerson = document.getElementById('summary-per-person');
    
    // Chart
    let tipChart = null;
    
    // Quick select tip percentage buttons
    tipButtons.forEach(button => {
        button.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            tipPercentageInput.value = value;
            
            // Update active button state
            tipButtons.forEach(btn => btn.classList.remove('active', 'btn-secondary'));
            tipButtons.forEach(btn => btn.classList.add('btn-outline-secondary'));
            this.classList.remove('btn-outline-secondary');
            this.classList.add('active', 'btn-secondary');
        });
    });
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate inputs
        const billAmount = parseFloat(billAmountInput.value);
        const tipPercentage = parseFloat(tipPercentageInput.value);
        const numPeople = parseInt(numPeopleInput.value);
        
        if (isNaN(billAmount) || billAmount <= 0) {
            showError(billAmountInput, 'billAmountError', 'Please enter a valid bill amount');
            return;
        } else {
            hideError(billAmountInput, 'billAmountError');
        }
        
        if (isNaN(tipPercentage) || tipPercentage < 0) {
            showError(tipPercentageInput, 'tipPercentageError', 'Please enter a valid tip percentage');
            return;
        } else {
            hideError(tipPercentageInput, 'tipPercentageError');
        }
        
        if (isNaN(numPeople) || numPeople < 1) {
            showError(numPeopleInput, 'numPeopleError', 'Please enter a valid number of people');
            return;
        } else {
            hideError(numPeopleInput, 'numPeopleError');
        }
        
        // Calculate tip
        calculateTip(billAmount, tipPercentage, numPeople);
    });
    
    // Helper functions
    function showError(inputElement, errorId, message) {
        const errorElement = document.getElementById(errorId);
        inputElement.classList.add('is-invalid');
        errorElement.textContent = message;
    }
    
    function hideError(inputElement, errorId) {
        const errorElement = document.getElementById(errorId);
        inputElement.classList.remove('is-invalid');
        errorElement.textContent = '';
    }
    
    function calculateTip(billAmount, tipPercentage, numPeople) {
        // Calculate values
        const tipAmount = billAmount * (tipPercentage / 100);
        const totalAmount = billAmount + tipAmount;
        const perPersonBefore = billAmount / numPeople;
        const tipPerPerson = tipAmount / numPeople;
        const totalPerPerson = totalAmount / numPeople;
        
        // Update summary display
        summaryBillAmount.textContent = formatCurrency(billAmount);
        summaryTipAmount.textContent = formatCurrency(tipAmount);
        summaryTotalAmount.textContent = formatCurrency(totalAmount);
        summaryNumPeople.textContent = numPeople;
        summaryPerPersonBefore.textContent = formatCurrency(perPersonBefore);
        summaryTipPerPerson.textContent = formatCurrency(tipPerPerson);
        summaryPerPerson.textContent = formatCurrency(totalPerPerson);
        
        // Show result container
        resultContainer.classList.remove('d-none');
        
        // Create chart
        createChart(billAmount, tipAmount);
        
        // Scroll to results
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    function formatCurrency(amount) {
        return amount.toFixed(2);
    }
    
    function createChart(billAmount, tipAmount) {
        const ctx = document.getElementById('tipChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (tipChart) {
            tipChart.destroy();
        }
        
        // Get the actual tip percentage from the input
        const tipPercentage = parseFloat(tipPercentageInput.value);
        
        // Create new chart
        tipChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Bill Amount', 'Tip Amount'],
                datasets: [{
                    data: [billAmount, tipAmount],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(75, 192, 192, 0.7)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                
                                if (label === 'Tip Amount') {
                                    return `${label}: $${value.toFixed(2)} (${tipPercentage}%)`;
                                } else {
                                    return `${label}: $${value.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Set default focus
    billAmountInput.focus();
    
    // Highlight the 15% tip button by default
    const defaultTipBtn = document.querySelector('.tip-btn[data-value="15"]');
    if (defaultTipBtn) {
        defaultTipBtn.classList.remove('btn-outline-secondary');
        defaultTipBtn.classList.add('active', 'btn-secondary');
    }
}); 