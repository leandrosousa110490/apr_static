document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('calc-display');
    const buttons = document.querySelectorAll('.calc-btn');
    const dynamicCalculatorModal = document.getElementById('dynamicCalculatorModal');
    const modalDialog = dynamicCalculatorModal?.querySelector('.modal-dialog'); // Get the dialog element
    const modalHeader = dynamicCalculatorModal?.querySelector('.modal-header'); // Get the header element

    let currentInput = '0';
    let previousInput = '';
    let operator = null;
    let shouldResetDisplay = false;

    // Function to update the display
    const updateDisplay = () => {
        // Limit display length slightly to prevent overflow
        if (!display) return; // Guard against missing element
        display.value = currentInput.length > 15 ? currentInput.substring(0, 15) : currentInput;
         // Adjust font size dynamically if needed (optional)
        /*
        if (currentInput.length > 10) {
            display.style.fontSize = '1.5rem'; 
        } else {
            display.style.fontSize = '1.8rem';
        }
        */
    };

    // Function to perform calculation
    const calculate = () => {
        let result;
        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);

        if (isNaN(prev) || isNaN(current)) return currentInput; // Return current if calculation can't proceed

        switch (operator) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                if (current === 0) {
                    return 'Error'; // Division by zero
                }
                result = prev / current;
                break;
            case '%':
                 if (prev === '') return currentInput; // Can't calculate % without previous number
                 result = prev * (current / 100);
                break;
            default:
                return currentInput; // Return current input if no operator
        }
        result = parseFloat(result.toFixed(10));
        return result.toString();
    };

    // Add event listeners to buttons
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const value = button.dataset.value;

            if (currentInput === 'Error' && value !== 'clear' && value !== 'backspace') {
                // If error state, only allow clear or backspace initially
                return;
            }

            if (button.classList.contains('number')) {
                if (currentInput === '0' || shouldResetDisplay) {
                    currentInput = value;
                    shouldResetDisplay = false;
                } else {
                    // Prevent excessively long numbers
                    if (currentInput.length < 15) {
                         currentInput += value;
                    }
                }
            } else if (value === '.') {
                if (shouldResetDisplay) {
                    currentInput = '0.';
                    shouldResetDisplay = false;
                } else if (!currentInput.includes('.')) {
                    if (currentInput.length < 15) { // Check length before adding dot
                        currentInput += '.';
                    }
                }
            } else if (button.classList.contains('operator')) {
                 // If an operator is clicked right after an error, treat previous as 0 or ignore
                if (previousInput === 'Error') previousInput = '0'; 

                if (operator !== null && !shouldResetDisplay) {
                    const result = calculate();
                    if (result === 'Error') {
                        currentInput = 'Error';
                        previousInput = ''; // Reset previous on error
                        operator = null;
                    } else {
                        currentInput = result;
                        previousInput = result;
                        operator = value; // Set the new operator
                    }
                } else {
                     previousInput = currentInput; // Store current as previous
                     operator = value;
                }
                shouldResetDisplay = true;

            } else if (value === '=') {
                if (operator === null || previousInput === '' || previousInput === 'Error') return;
                const result = calculate();
                currentInput = result;
                operator = null;
                previousInput = '';
                shouldResetDisplay = true;

            } else if (value === 'clear') {
                currentInput = '0';
                previousInput = '';
                operator = null;
                shouldResetDisplay = false;

            } else if (value === 'backspace') {
                if (shouldResetDisplay) {
                    // Don't clear if we just finished a calculation (=)
                    // Allow backspace on intermediate results after operator click
                    // Let's just clear to '0' if display should be reset
                     currentInput = '0';
                     shouldResetDisplay = false; // Allow typing new number
                } else if (currentInput === 'Error') {
                     currentInput = '0'; // Clear error on backspace
                } else if (currentInput.length > 1) {
                    currentInput = currentInput.slice(0, -1);
                } else {
                    currentInput = '0';
                }
            }

             updateDisplay();

             // If we got an error, prepare for reset but keep showing 'Error'
             if (currentInput === 'Error') {
                 shouldResetDisplay = true;
                 operator = null;
                 // Don't clear previousInput here, keep it for potential debugging or context
             }
        });
    });

    // --- Draggable Modal Logic ---
    if (modalDialog && modalHeader) {
        let isDragging = false;
        let currentX, currentY, initialX, initialY;
        let originalTop = null, originalLeft = null; // Store original position

        modalHeader.addEventListener('mousedown', (e) => {
            // Only drag if clicking directly on the header, not buttons inside it
            if (e.target.closest('button')) {
                return;
            }
            e.preventDefault(); // Prevent text selection

             // Store original inline style if exists, otherwise calculate current pos
            if (modalDialog.style.top && modalDialog.style.left && originalTop === null) {
                 originalTop = modalDialog.offsetTop;
                 originalLeft = modalDialog.offsetLeft;
            }
             // Use getBoundingClientRect for position relative to viewport
            const rect = modalDialog.getBoundingClientRect();

            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;
            isDragging = true;

            // Use absolute positioning relative to the modal backdrop (or viewport if no backdrop positioning)
             modalDialog.style.position = 'absolute'; 
             // Set initial top/left based on current pos to prevent jump
             modalDialog.style.left = `${rect.left}px`;
             modalDialog.style.top = `${rect.top}px`;
             modalDialog.style.margin = '0'; // Override centering margin

            dynamicCalculatorModal.classList.add('dragging');
            // We don't remove modal-dialog-centered, just override with position styles
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            modalDialog.style.top = `${currentY}px`;
            modalDialog.style.left = `${currentX}px`;
        });

        const stopDragging = () => {
            if (isDragging) {
                isDragging = false;
                dynamicCalculatorModal.classList.remove('dragging');
                // Store the final position if needed, or just leave the inline styles
                originalTop = modalDialog.offsetTop; // Update last known position
                originalLeft = modalDialog.offsetLeft;
            }
        }

        document.addEventListener('mouseup', stopDragging);
        // Optional: Handle mouse leaving the window while dragging
        document.addEventListener('mouseleave', (e) => {
            // Check if mouse button is still pressed (might not be reliable across browsers)
             if (isDragging && e.buttons === 0) { 
                 stopDragging();
             }
        });

    }

    // --- Modal Close Event Listener ---
    dynamicCalculatorModal?.addEventListener('hidden.bs.modal', () => {
        // Reset calculator state
        currentInput = '0';
        previousInput = '';
        operator = null;
        shouldResetDisplay = false;
        updateDisplay();

        // Reset modal position if it was dragged
        if (modalDialog) {
             modalDialog.style.position = ''; 
             modalDialog.style.top = '';
             modalDialog.style.left = '';
             modalDialog.style.margin = ''; // Restore original margins (allows centering)
        }
         // Reset stored original position for next drag
        // originalTop = null; 
        // originalLeft = null; // Let's not reset these, maybe keep last position? Let's reset.
         if (modalDialog && modalHeader) { // Check again if elements exist
             // Reset drag state variables if needed, although should be reset by mouseup
             isDragging = false; 
         }
    });

    // Initialize display
    updateDisplay();
}); 