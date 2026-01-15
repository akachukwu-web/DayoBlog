/**
 * Shared Utility Functions
 */

// Prevent XSS attacks
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Show alert messages
function showAlert(message, type, elementId = 'messageAlert') {
    const messageAlert = document.getElementById(elementId);
    if (!messageAlert) return;

    messageAlert.textContent = message;
    messageAlert.className = `alert show alert-${type}`;
    messageAlert.classList.remove('hidden');

    setTimeout(() => {
        messageAlert.classList.remove('show');
        messageAlert.classList.add('hidden');
    }, 3000);
}

// Initialize Mobile Menu
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navbar = document.getElementById('navbar');
    
    if (menuToggle && navbar) {
        menuToggle.addEventListener('click', () => {
            navbar.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !navbar.contains(e.target)) {
                navbar.classList.remove('active');
            }
        });
    }
}

// Make functions available globally if needed (for modules)
window.escapeHtml = escapeHtml;
window.showAlert = showAlert;
window.initMobileMenu = initMobileMenu;