const resetPasswordForm = document.getElementById('resetPasswordForm');
const messageAlert = document.getElementById('messageAlert');
const passwordEl = document.getElementById('password');
const confirmEl = document.getElementById('confirmPassword');

// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
    showMessage('Invalid or missing reset token.', 'error');
    if (resetPasswordForm) resetPasswordForm.style.display = 'none';
}

if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = passwordEl.value;
        const confirmPassword = confirmEl.value;

        if (password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }

        const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Password updated successfully! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showMessage(data.message || 'Failed to reset password', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('An error occurred. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

function showMessage(message, type) {
    if (!messageAlert) return;
    messageAlert.innerHTML = `<span>${message}</span>`;
    messageAlert.className = 'alert';
    messageAlert.classList.add(`alert-${type === 'error' ? 'danger' : type}`, 'show');
}