document.addEventListener('DOMContentLoaded', () => {
    // Highlight active navigation link
    const currentPage = window.location.pathname.split('/').pop(); // Gets filename like 'index.html'

    if (currentPage === 'index.html' || currentPage === '') {
        document.getElementById('nav-home')?.classList.add('active');
    } else if (currentPage === 'calculator.html') {
        document.getElementById('nav-calculator')?.classList.add('active');
    } else if (currentPage === 'budget.html') {
        document.getElementById('nav-budget')?.classList.add('active');
    }

    // --- Dark Mode Toggle --- 
    const themeToggleBtn = document.getElementById('theme-toggle');
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');
    const htmlElement = document.documentElement; // Get the <html> element

    // Function to set theme
    const setTheme = (theme) => {
        htmlElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme); // Save preference
        // Update icon visibility
        if (theme === 'dark') {
            lightIcon?.classList.add('d-none');
            darkIcon?.classList.remove('d-none');
            themeToggleBtn?.classList.remove('btn-outline-secondary');
            themeToggleBtn?.classList.add('btn-outline-light');
        } else {
            lightIcon?.classList.remove('d-none');
            darkIcon?.classList.add('d-none');
            themeToggleBtn?.classList.remove('btn-outline-light');
            themeToggleBtn?.classList.add('btn-outline-secondary');
        }
        // Dispatch custom event for other scripts (like chart) to listen to
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: theme } }));
    };

    // Function to get preferred theme
    const getPreferredTheme = () => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            return storedTheme;
        }
        // Check system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // Set initial theme
    const initialTheme = getPreferredTheme();
    setTheme(initialTheme);

    // Add click listener to toggle button
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-bs-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }

    // Optional: Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
         // Only change if no theme is explicitly stored in localStorage
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

    // Add any other global initializations or functions here
}); 