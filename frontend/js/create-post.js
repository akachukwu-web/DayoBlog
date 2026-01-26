// Initialize mobile menu
initMobileMenu();

// Post form handling
const postForm = document.getElementById('postForm');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
let editPostId = null, currentUser = null;

// Modal Elements
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

// Setup Modal Listeners
if (cancelDeleteBtn && deleteModal) {
    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.remove('show');
    });
}

// Auth Check and User Fetch
(async () => {
    try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
            window.location.href = 'login.html';
            return;
        }
        const data = await response.json();
        currentUser = data.user;
        
        // Initialize page components that depend on user data
        loadEditPost();
        populateAuthorField();
        updateNavOnAuth();
    } catch (e) {
        window.location.href = 'login.html';
    }
})();

function showAlert(message, type, duration = 4000) {
    let messageAlert = document.getElementById('messageAlert');

    // If the alert element doesn't exist, create and inject it.
    if (!messageAlert) {
        messageAlert = document.createElement('div');
        messageAlert.id = 'messageAlert';
        
        // Inject it before the form's main title
        const formTitleEl = document.getElementById('formTitle');
        if (formTitleEl && formTitleEl.parentNode) {
            formTitleEl.parentNode.insertBefore(messageAlert, formTitleEl);
        } else {
            postForm.prepend(messageAlert);
        }
    }

    const icons = {
        success: 'fa-solid fa-check-circle',
        error: 'fa-solid fa-exclamation-triangle',
        danger: 'fa-solid fa-exclamation-triangle',
        info: 'fa-solid fa-info-circle'
    };
    const iconClass = icons[type] || icons.info;

    messageAlert.innerHTML = `<i class="${iconClass}"></i> <span>${escapeHtml(message)}</span>`;
    messageAlert.className = 'alert'; // Reset classes
    messageAlert.classList.add(`alert-${type === 'error' ? 'danger' : type}`, 'show');

    setTimeout(() => messageAlert.classList.remove('show'), duration);
}

function populateAuthorField() {
    const authorInput = document.getElementById('postAuthor');
    const urlParams = new URLSearchParams(window.location.search);
    const isEditing = urlParams.has('id');

    if (currentUser && authorInput && !isEditing) {
        authorInput.value = currentUser.name;
        authorInput.readOnly = true;
    }
}

// Load edit post if available
async function loadEditPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (!postId) return;

    const response = await fetch(`/api/posts/${postId}`);
    if (!response.ok) return;
    const post = await response.json();
    
    if (post) {
        editPostId = post.id;
        
        // Fill form with existing data
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postAuthor').value = post.author;
        document.getElementById('postCategory').value = post.category;
        document.getElementById('postImage').value = post.image || '';
        document.getElementById('postContent').value = post.content;
        
        // Update UI for edit mode
        formTitle.textContent = 'Edit Post';
        submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Update Post';
        
        addDeleteButton();
    }
}

function addDeleteButton() {
    const actionsDiv = submitBtn.parentNode;
    
    // Check if button already exists to prevent duplicates
    if (actionsDiv.querySelector('.btn-danger')) return;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete Post';
    deleteBtn.style.flex = '1';
    
    deleteBtn.onclick = () => {
        if (deleteModal) {
            deleteModal.classList.add('show');
        }
    };

    // Attach actual delete logic to the modal's confirm button
    if (confirmDeleteBtn) {
        confirmDeleteBtn.onclick = async () => {
            await fetch(`/api/posts/${editPostId}`, {
                method: 'DELETE'
            });
            
            showAlert('Post deleted successfully!', 'success');
            setTimeout(() => window.location.href = '../index.html', 1500);
        };
    }

    actionsDiv.appendChild(deleteBtn);
}

postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('postTitle').value.trim();
    const author = document.getElementById('postAuthor').value.trim();
    const category = document.getElementById('postCategory').value.trim();
    const image = document.getElementById('postImage').value.trim();
    const content = document.getElementById('postContent').value.trim();

    if (!title) {
        showAlert('Post Title is a required field.', 'error');
        document.getElementById('postTitle').focus();
        return;
    }
    if (!author) {
        showAlert('Author is a required field.', 'error');
        document.getElementById('postAuthor').focus();
        return;
    }
    if (!category) {
        showAlert('Category is a required field.', 'error');
        document.getElementById('postCategory').focus();
        return;
    }
    if (!content) {
        showAlert('Content is a required field.', 'error');
        document.getElementById('postContent').focus();
        return;
    }

    const postData = {
        title: escapeHtml(title),
        author: escapeHtml(author),
        category: escapeHtml(category),
        image: escapeHtml(image),
        content: escapeHtml(content),
        excerpt: escapeHtml(content.substring(0, 150)) + '...',
    };

    if (editPostId) {
        postData.id = editPostId;
        // We don't overwrite date on edit usually, backend handles logic or we pass it
    } else {
        postData.userId = currentUser ? currentUser.id : null;
    }

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });

        if (response.ok) {
            showAlert(editPostId ? 'Post updated successfully!' : 'Post published successfully!', 'success');
        }
    } catch (error) {
        showAlert('Error saving post', 'error');
        return;
    }

    // Reset form
    postForm.reset();

    // Redirect after 2 seconds
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 2000);
});

function updateNavOnAuth() {
    const navLoginLink = document.querySelector('#navbar a[href*="login.html"]');

    if (currentUser && navLoginLink) {
        navLoginLink.innerHTML = '<i class="fa-solid fa-tachometer-alt"></i> Dashboard';
        navLoginLink.href = 'admin.html';
    }
}
