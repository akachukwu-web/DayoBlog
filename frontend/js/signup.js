import { apiCall } from './api.js';

const signupForm = document.getElementById('signupForm');
const messageAlert = document.getElementById('messageAlert');
const nameEl = document.getElementById('name');
const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');
const confirmEl = document.getElementById('confirmPassword');

function clearMessage() {
    if (!messageAlert) return;
    messageAlert.classList.add('hidden');
}

if (signupForm) {
    // Clear messages while user types
    [nameEl, emailEl, passwordEl, confirmEl].forEach((el) => {
        if (!el) return;
        el.addEventListener('input', () => {
            clearMessage();
            el.removeAttribute('aria-invalid');
        });
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = nameEl.value.trim();
        const email = emailEl.value.trim();
        const password = passwordEl.value;
        const confirmPassword = confirmEl.value;

        if (!nameEl.checkValidity()) {
            nameEl.setAttribute('aria-invalid', 'true');
            showMessage(nameEl.validationMessage || 'Please enter your name', 'error');
            nameEl.focus();
            return;
        }

        if (!emailEl.checkValidity()) {
            emailEl.setAttribute('aria-invalid', 'true');
            showMessage(emailEl.validationMessage || 'Please enter a valid email', 'error');
            emailEl.focus();
            return;
        }

        if (!passwordEl.checkValidity() || password.length < 6) {
            passwordEl.setAttribute('aria-invalid', 'true');
            showMessage('Password must be at least 6 characters', 'error');
            passwordEl.focus();
            return;
        }

        if (password !== confirmPassword) {
            confirmEl.setAttribute('aria-invalid', 'true');
            showMessage('Passwords do not match', 'error');
            confirmEl.focus();
            return;
        }

        try {
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';

            const res = await apiCall('/api/auth/register', 'POST', {
                name,
                email,
                password
            });

            showMessage(res.message || 'Account created! Redirecting to login...', 'success');

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } catch (err) {
            console.error('Signup error:', err);
            showMessage(err.message || 'Unable to create account. Try again later.', 'error');
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create account';
        }
    });
}

function showMessage(message, type) {
    if (!messageAlert) return;

    messageAlert.textContent = message;
    messageAlert.setAttribute('role', 'alert');
    messageAlert.className = `alert alert-${type}`;
    messageAlert.classList.remove('hidden');

    if (type === 'success') {
        setTimeout(() => messageAlert.classList.add('hidden'), 3000);
    }
}
