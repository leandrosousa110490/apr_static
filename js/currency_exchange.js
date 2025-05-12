// Currency Exchange JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log("Currency Exchange JS Loading...");

    // --- DOM Element References ---
    // Form Elements
    const converterForm = document.getElementById('currency-converter-form');
    const amountInput = document.getElementById('amount');
    const fromCurrencySelect = document.getElementById('from-currency');
    const toCurrencySelect = document.getElementById('to-currency');
    const swapButton = document.getElementById('swap-button');
    
    // Results Elements
    const conversionResult = document.getElementById('conversion-result');
    const fromAmountSpan = document.getElementById('from-amount');
    const fromCurrencyNameSpan = document.getElementById('from-currency-name');
    const toAmountSpan = document.getElementById('to-amount');
    const toCurrencyNameSpan = document.getElementById('to-currency-name');
    const exchangeRateSpan = document.getElementById('exchange-rate');
    const lastUpdatedSpan = document.getElementById('last-updated');
    const amountError = document.getElementById('amountError');
    
    // Chart Elements
    const strengthChartContainer = document.getElementById('strength-chart-container');
    const strengthChartCanvas = document.getElementById('currency-strength-chart');
    const chartLoading = document.getElementById('chart-loading');
    const baseCurrencySelect = document.getElementById('base-currency');
    
    // Popular Rates Elements
    const usdEurRate = document.getElementById('usd-eur-rate');
    const usdGbpRate = document.getElementById('usd-gbp-rate');
    const usdJpyRate = document.getElementById('usd-jpy-rate');
    const eurGbpRate = document.getElementById('eur-gbp-rate');
    
    // --- State Variables ---
    let allCurrencies = {};
    let exchangeRates = {};
    let currentFromCurrency = 'usd';
    let currentToCurrency = 'eur';
    let currencyStrengthChart = null;
    
    // Common major currencies to compare
    const majorCurrencies = ['usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'cny'];
    
    // --- API Configuration ---
    const apiBaseUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest';
    const fallbackApiBaseUrl = 'https://latest.currency-api.pages.dev';
    const apiVersion = 'v1';
    
    // --- Helper Functions ---
    function formatCurrency(amount, currencyCode) {
        return parseFloat(amount).toFixed(2);
    }

    function showError(message) {
        amountError.textContent = message;
        amountInput.classList.add('is-invalid');
    }
    
    function hideError() {
        amountError.textContent = '';
        amountInput.classList.remove('is-invalid');
    }
    
    // Gets a formatted currency name like "USD - US Dollar"
    function getCurrencyFullName(code) {
        if (!allCurrencies) return code.toUpperCase();
        
        const currencyName = allCurrencies[code.toLowerCase()];
        if (!currencyName) return code.toUpperCase();
        
        return `${code.toUpperCase()} - ${currencyName}`;
    }
    
    // Gets just the currency name without the code
    function getCurrencyName(code) {
        if (!allCurrencies) return code.toUpperCase();
        return allCurrencies[code.toLowerCase()] || code.toUpperCase();
    }

    // --- API Functions ---
    async function fetchWithFallback(endpoint) {
        try {
            const response = await fetch(`${apiBaseUrl}/${apiVersion}/${endpoint}`);
            if (!response.ok) throw new Error(`Primary API request failed with status ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn(`Primary API failed: ${error.message}. Trying fallback...`);
            try {
                const fallbackResponse = await fetch(`${fallbackApiBaseUrl}/${apiVersion}/${endpoint}`);
                if (!fallbackResponse.ok) throw new Error(`Fallback API request failed with status ${fallbackResponse.status}`);
                return await fallbackResponse.json();
            } catch (fallbackError) {
                console.error(`Fallback API also failed: ${fallbackError.message}`);
                throw new Error('Could not fetch data from any API endpoint');
            }
        }
    }

    async function fetchCurrencies() {
        try {
            const data = await fetchWithFallback('currencies.json');
            allCurrencies = data;
            populateCurrencySelects();
        } catch (error) {
            console.error('Failed to fetch currencies:', error);
            // Show a user-friendly error message
            alert('Could not load currency data. Please try again later.');
        }
    }

    async function fetchExchangeRates(baseCurrency) {
        try {
            baseCurrency = baseCurrency.toLowerCase();
            const data = await fetchWithFallback(`currencies/${baseCurrency}.json`);
            exchangeRates = data[baseCurrency];
            updatePopularRates();
            return exchangeRates;
        } catch (error) {
            console.error(`Failed to fetch exchange rates for ${baseCurrency}:`, error);
            return null;
        }
    }

    async function fetchCurrencyStrengthData(baseCurrency) {
        // Show loading indicator
        if (chartLoading) chartLoading.classList.remove('d-none');
        
        try {
            baseCurrency = baseCurrency.toLowerCase();
            const data = await fetchWithFallback(`currencies/${baseCurrency}.json`);
            
            if (!data || !data[baseCurrency]) {
                throw new Error(`Could not get exchange rates for ${baseCurrency}`);
            }
            
            const rates = data[baseCurrency];
            const currencyData = [];
            
            // Filter to include only major currencies (excluding the base currency)
            for (const currency of majorCurrencies) {
                if (currency !== baseCurrency && rates[currency]) {
                    // For the strength chart, we want to invert the rate if necessary
                    // so that higher values = stronger currency
                    let value;
                    if (baseCurrency === 'jpy' && currency !== 'jpy') {
                        // For JPY base (large numbers), smaller is stronger
                        value = 1 / rates[currency];
                    } else if (currency === 'jpy' && baseCurrency !== 'jpy') {
                        // For JPY as target (large numbers), larger is stronger
                        value = rates[currency] / 100; // Scale down for better visualization
                    } else {
                        // For normal currencies, larger means stronger against base
                        value = rates[currency];
                    }
                    
                    // Normalize the values for better visualization
                    currencyData.push({
                        currency: currency.toUpperCase(),
                        rate: rates[currency],
                        value: value
                    });
                }
            }
            
            // Hide loading indicator
            if (chartLoading) chartLoading.classList.add('d-none');
            
            return currencyData;
        } catch (error) {
            console.error(`Failed to fetch currency strength data: ${error.message}`);
            if (chartLoading) chartLoading.classList.add('d-none');
            return [];
        }
    }

    // --- UI Functions ---
    function populateCurrencySelects() {
        if (!fromCurrencySelect || !toCurrencySelect) return;
        
        // Clear existing options
        fromCurrencySelect.innerHTML = '';
        toCurrencySelect.innerHTML = '';
        
        // Add all currencies to both selects
        for (const [code, name] of Object.entries(allCurrencies)) {
            const fromOption = document.createElement('option');
            fromOption.value = code;
            fromOption.textContent = `${code.toUpperCase()} - ${name}`;
            
            const toOption = document.createElement('option');
            toOption.value = code;
            toOption.textContent = `${code.toUpperCase()} - ${name}`;
            
            fromCurrencySelect.appendChild(fromOption);
            toCurrencySelect.appendChild(toOption);
        }
        
        // Set default selected currencies
        fromCurrencySelect.value = currentFromCurrency;
        toCurrencySelect.value = currentToCurrency;
    }

    async function updateConversionResult() {
        const amount = parseFloat(amountInput.value);
        const fromCurrency = fromCurrencySelect.value;
        const toCurrency = toCurrencySelect.value;
        
        if (isNaN(amount) || amount <= 0) {
            showError('Please enter a valid positive amount');
            conversionResult.classList.add('d-none');
            return;
        }
        
        hideError();
        
        try {
            const rates = await fetchExchangeRates(fromCurrency);
            if (!rates || !rates[toCurrency]) {
                throw new Error(`Could not get exchange rate for ${fromCurrency} to ${toCurrency}`);
            }
            
            const rate = rates[toCurrency];
            const convertedAmount = amount * rate;
            
            // Update result display
            fromAmountSpan.textContent = `${formatCurrency(amount)} ${fromCurrency.toUpperCase()}`;
            toAmountSpan.textContent = `${formatCurrency(convertedAmount)} ${toCurrency.toUpperCase()}`;
            fromCurrencyNameSpan.textContent = getCurrencyName(fromCurrency);
            toCurrencyNameSpan.textContent = getCurrencyName(toCurrency);
            exchangeRateSpan.textContent = `1 ${fromCurrency.toUpperCase()} = ${formatCurrency(rate)} ${toCurrency.toUpperCase()}`;
            
            // Get today's date for last updated
            const today = new Date();
            lastUpdatedSpan.textContent = today.toISOString().split('T')[0];
            
            // Show result
            conversionResult.classList.remove('d-none');
        } catch (error) {
            console.error('Conversion failed:', error);
            alert('Could not perform currency conversion. Please try again later.');
        }
    }

    async function updatePopularRates() {
        if (!usdEurRate || !usdGbpRate || !usdJpyRate || !eurGbpRate) return;
        
        try {
            // Fetch USD rates
            const usdRates = await fetchExchangeRates('usd');
            if (usdRates) {
                usdEurRate.textContent = formatCurrency(usdRates.eur);
                usdGbpRate.textContent = formatCurrency(usdRates.gbp);
                usdJpyRate.textContent = formatCurrency(usdRates.jpy);
            }
            
            // Fetch EUR rates
            const eurRates = await fetchExchangeRates('eur');
            if (eurRates) {
                eurGbpRate.textContent = formatCurrency(eurRates.gbp);
            }
        } catch (error) {
            console.error('Failed to update popular rates:', error);
        }
    }

    async function updateCurrencyStrengthChart(baseCurrency) {
        if (!strengthChartCanvas) return;
        
        try {
            const currencyData = await fetchCurrencyStrengthData(baseCurrency);
            
            if (currencyData.length === 0) {
                console.error('No currency strength data available');
                return;
            }
            
            // Sort currencies by value (strongest first)
            currencyData.sort((a, b) => b.value - a.value);
            
            // Prepare data for chart
            const labels = currencyData.map(item => item.currency);
            const values = currencyData.map(item => item.value);
            const rates = currencyData.map(item => item.rate);
            
            // Generate colors - create a gradient from red to green
            const backgroundColors = values.map((_, index) => {
                // Create a color gradient based on position in the sorted array
                const normalizedPosition = index / (currencyData.length - 1);
                // Red to green gradient (red for weakest, green for strongest)
                return `hsla(${normalizedPosition * 120}, 70%, 50%, 0.7)`;
            });
            
            const borderColors = backgroundColors.map(color => color.replace('0.7', '1.0'));
            
            // Destroy existing chart if it exists
            if (currencyStrengthChart) {
                currencyStrengthChart.destroy();
            }
            
            // Get the chart context
            const ctx = strengthChartCanvas.getContext('2d');
            
            // Create the chart
            currencyStrengthChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `Value against ${baseCurrency.toUpperCase()}`,
                        data: values,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',  // Make it a horizontal bar chart
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    return context[0].label;
                                },
                                label: function(context) {
                                    const index = context.dataIndex;
                                    const currency = labels[index];
                                    const rate = rates[index];
                                    return [
                                        `1 ${baseCurrency.toUpperCase()} = ${formatCurrency(rate)} ${currency}`,
                                        `1 ${currency} = ${formatCurrency(1/rate)} ${baseCurrency.toUpperCase()}`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: `Relative Value (higher = stronger against ${baseCurrency.toUpperCase()})`
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Currency'
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        } catch (error) {
            console.error('Failed to update currency strength chart:', error);
            if (chartLoading) chartLoading.classList.add('d-none');
        }
    }

    // --- Event Listeners ---
    if (converterForm) {
        converterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateConversionResult();
        });
    }
    
    if (swapButton) {
        swapButton.addEventListener('click', function() {
            const fromValue = fromCurrencySelect.value;
            const toValue = toCurrencySelect.value;
            
            fromCurrencySelect.value = toValue;
            toCurrencySelect.value = fromValue;
            
            // Update the current currencies
            currentFromCurrency = toValue;
            currentToCurrency = fromValue;
        });
    }
    
    if (baseCurrencySelect) {
        baseCurrencySelect.addEventListener('change', function() {
            // Update chart with new base currency
            const selectedCurrency = this.value;
            updateCurrencyStrengthChart(selectedCurrency);
        });
    }

    // --- Initialization ---
    function init() {
        // Fetch currency data and populate selects
        fetchCurrencies()
            .then(() => fetchExchangeRates('usd'))
            .then(() => {
                // Initialize the strength comparison chart if on currency page
                if (strengthChartCanvas && baseCurrencySelect) {
                    // Get selected base currency from dropdown
                    const baseCurrency = baseCurrencySelect.value;
                    updateCurrencyStrengthChart(baseCurrency);
                }
            });
    }
    
    // Initialize the app
    init();
}); 