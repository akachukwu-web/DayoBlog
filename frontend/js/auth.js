import { apiCall } from './api.js';

// Handle login form submission
const loginForm = document.getElementById('loginForm');
const messageAlert = document.getElementById('messageAlert');
const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');

function clearMessage() {
    if (messageAlert) {
        messageAlert.classList.remove('show');
    }
}

if (loginForm) {
    // Live input clears previous messages
    [emailEl, passwordEl].forEach((el) => {
        if (!el) return;
        el.addEventListener('input', () => {
            clearMessage();
            el.removeAttribute('aria-invalid');
        });
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailEl.value.trim();
        const password = passwordEl.value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Modern validation using Constraint API + custom checks
        if (!emailEl.checkValidity()) {
            emailEl.setAttribute('aria-invalid', 'true');
            showMessage(emailEl.validationMessage || 'Please enter a valid email address', 'error');
            emailEl.focus();
            return;
        }

        if (!passwordEl.checkValidity() || password.length < 6) {
            passwordEl.setAttribute('aria-invalid', 'true');
            showMessage('Password must be at least 6 characters', 'error');
            passwordEl.focus();
            return;
        }

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';

            const response = await apiCall('/api/auth/login', 'POST', {
                email,
                password
            });

            if (response.token) {
                localStorage.setItem('authToken', response.token);
                if (response.user) {
                    // Store logged in user's info for other parts of the app
                    localStorage.setItem('currentUser', JSON.stringify(response.user));
                }

                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                showMessage('Login successful! Redirecting...', 'success');

                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1500);
            } else {
                showMessage(response.message || 'Login failed', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Login error:', error);
            const message = (error.message === 'Invalid email or password.') ? 'Invalid credentials' : (error.message || 'An error occurred. Please try again.');
            showMessage(message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    // Restore remembered email if it exists
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailEl.value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
    }
}

// Show message alert
function showMessage(message, type, duration = 4000) {
    if (!messageAlert) return;

    const icons = {
        success: 'fa-solid fa-check-circle',
        error: 'fa-solid fa-exclamation-circle',
        danger: 'fa-solid fa-exclamation-triangle',
        info: 'fa-solid fa-info-circle'
    };
    const iconClass = icons[type] || icons.info;

    messageAlert.innerHTML = `<i class="${iconClass}"></i> <span>${message}</span>`;
    messageAlert.className = 'alert'; // Reset classes
    messageAlert.classList.add(`alert-${type === 'error' ? 'danger' : type}`, 'show');

    setTimeout(() => {
        messageAlert.classList.remove('show');
    }, duration);
}

// Check if user is already logged in
export function checkAuth() {
    const token = localStorage.getItem('authToken');
    return !!token;
}

// Get current user token
export function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Logout
export function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('rememberedEmail');
    window.location.href = '../index.html';
}

// Toggle Password Visibility
const togglePassword = document.getElementById('togglePassword');
if (togglePassword && passwordEl) {
    togglePassword.addEventListener('click', () => {
        const type = passwordEl.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordEl.setAttribute('type', type);
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });
}
