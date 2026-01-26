const signupForm = document.getElementById('signupForm');
const messageAlert = document.getElementById('messageAlert');
const nameEl = document.getElementById('name');
const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');
const confirmEl = document.getElementById('confirmPassword');

function clearMessage() {
    if (!messageAlert) return;
    messageAlert.classList.remove('show');
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

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                // If response is not JSON (e.g., 502 Bad Gateway HTML), throw a clear error
                throw new Error(`Server Error: ${response.status} ${response.statusText}`);
            }

            if (response.ok) {
                showMessage(data.message || 'Account created! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Signup error:', err);
            showMessage(err.message || 'Unable to create account. Try again later.', 'error');
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create account';
        }
    });
}

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

const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
if (toggleConfirmPassword && confirmEl) {
    toggleConfirmPassword.addEventListener('click', () => {
        const type = confirmEl.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmEl.setAttribute('type', type);
        toggleConfirmPassword.classList.toggle('fa-eye');
        toggleConfirmPassword.classList.toggle('fa-eye-slash');
    });
}
