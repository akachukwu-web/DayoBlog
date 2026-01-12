import { apiCall } from './api.js';

// Handle login form submission
const loginForm = document.getElementById('loginForm');
const messageAlert = document.getElementById('messageAlert');
const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');

function clearMessage() {
    if (!messageAlert) return;
    messageAlert.classList.add('hidden');
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

        try {
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';

            const response = await apiCall('/api/auth/login', 'POST', {
                email,
                password
            });

            if (response.token) {
                localStorage.setItem('authToken', response.token);

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
            showMessage(error.message || 'An error occurred during login. Please try again.', 'error');
            const submitBtn = loginForm.querySelector('button[type="submit"]');
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
function showMessage(message, type) {
    if (!messageAlert) return;

    messageAlert.textContent = message;
    messageAlert.setAttribute('role', 'alert');
    messageAlert.className = `alert alert-${type}`;
    messageAlert.classList.remove('hidden');

    if (type === 'success') {
        setTimeout(() => {
            messageAlert.classList.add('hidden');
        }, 3000);
    }
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
    window.location.href = 'index.html';
}
