// Initialize mobile menu
initMobileMenu();

function updateNavOnAuth() {
    const authToken = localStorage.getItem('authToken');
    const navLoginLink = document.querySelector('#navbar a[href*="login.html"]');

    if (authToken && navLoginLink) {
        navLoginLink.innerHTML = '<i class="fa-solid fa-tachometer-alt"></i> Dashboard';
        navLoginLink.href = 'admin.html';
    }
}

function prefillUserInfo() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        if (nameInput) nameInput.value = currentUser.name;
        if (emailInput) emailInput.value = currentUser.email;
    }
}

// Run on page load
updateNavOnAuth();
prefillUserInfo();

const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                showAlert('Message sent successfully! We will get back to you soon.', 'success');
                contactForm.reset();
                prefillUserInfo(); // Re-fill user info after form reset
            } else {
                showAlert(result.message || 'Failed to send message.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('An error occurred. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}