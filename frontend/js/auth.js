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

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            let data;
            try {
                data = await res.json();
            } catch (e) {
                // If response is not JSON (e.g., 502 Bad Gateway HTML), throw a clear error
                throw new Error(`Server Error: ${res.status} ${res.statusText}`);
            }

            if (res.ok) {
                showMessage('Login successful! Redirecting...', 'success');

                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1500);
            } else {
                // Check if it is the "Not Verified" error (403)
                if (res.status === 403) {
                    showMessage(data.message, 'danger', 10000); // Show for longer
                    
                    // Add a "Resend Email" button dynamically to the alert
                    const alertBox = document.getElementById('messageAlert');
                    const resendBtn = document.createElement('button');
                    resendBtn.className = 'btn btn-small btn-outline';
                    resendBtn.style.marginTop = '10px';
                    resendBtn.style.borderColor = 'currentColor';
                    resendBtn.style.color = 'inherit';
                    resendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Resend Verification Email';
                    
                    resendBtn.onclick = () => resendVerification(email);
                    
                    alertBox.appendChild(resendBtn);
                } else {
                    showMessage(data.message || 'Login failed', 'error');
                }
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

}

// Function to handle resending verification
async function resendVerification(email) {
    const alertBox = document.getElementById('messageAlert');
    alertBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending email...';
    
    try {
        const res = await fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            showMessage(data.message, 'success', 6000);
        } else {
            showMessage(data.message || 'Failed to send email', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
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

// This script handles messages from the email verification redirect
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const verificationStatus = params.get('verification');

    if (verificationStatus) {
        let message = '';
        let type = 'info';

        if (verificationStatus === 'success') {
            message = 'Email verified successfully! You can now log in.';
            type = 'success';
        } else if (verificationStatus === 'failed') {
            message = 'Verification failed. The link may be invalid or has expired.';
            type = 'danger';
        } else if (verificationStatus === 'error') {
            message = 'An error occurred during email verification.';
            type = 'danger';
        }

        if (message) {
            showMessage(message, type, 6000);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
});
