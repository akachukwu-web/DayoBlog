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
function showAlert(message, type, duration = 5000) {
    // Create container for toasts if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    // Use 'danger' for 'error' type for consistency with CSS
    const alertType = type === 'error' ? 'danger' : type;
    toast.className = `toast toast-${alertType}`;

    const icons = {
        success: 'fa-solid fa-check-circle',
        danger: 'fa-solid fa-exclamation-triangle',
        info: 'fa-solid fa-info-circle'
    };
    const iconClass = icons[alertType] || icons.info;

    toast.innerHTML = `<i class="${iconClass}"></i> <span>${escapeHtml(message)}</span>`;

    toastContainer.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        // Remove the element after the transition ends
        toast.addEventListener('transitionend', () => {
            toast.remove();
            // If container is empty, remove it to keep the DOM clean
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        });
    }, duration);
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