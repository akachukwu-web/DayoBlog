const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const messageAlert = document.getElementById('messageAlert');

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(data.message, 'success');
                forgotPasswordForm.reset();
            } else {
                showMessage(data.message || 'Failed to send email', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('An error occurred. Please try again.', 'error');
        } finally {
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
    // We don't auto-hide success messages here so the user sees the instruction
}