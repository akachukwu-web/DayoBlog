// Initialize mobile menu
initMobileMenu();

// Post form handling
const postForm = document.getElementById('postForm');
const messageAlert = document.getElementById('messageAlert');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
let editPostId = null;

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

// Check authentication
if (!localStorage.getItem('authToken')) {
    window.location.href = 'login.html';
}

function populateAuthorField() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const authorInput = document.getElementById('postAuthor');
    const urlParams = new URLSearchParams(window.location.search);
    const isEditing = urlParams.has('id');

    if (currentUser && authorInput && !isEditing) {
        authorInput.value = currentUser.name;
        authorInput.readOnly = true;
    }
}

// Load edit post if available
function loadEditPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get('id'));
    const posts = JSON.parse(localStorage.getItem('blog-posts')) || [];
    const post = posts.find(p => p.id === postId);
    
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
        confirmDeleteBtn.onclick = () => {
            let posts = JSON.parse(localStorage.getItem('blog-posts')) || [];
            posts = posts.filter(p => p.id !== editPostId);
            localStorage.setItem('blog-posts', JSON.stringify(posts));
            
            showAlert('Post deleted successfully!', 'success');
            setTimeout(() => window.location.href = '../index.html', 1500);
        };
    }

    actionsDiv.appendChild(deleteBtn);
}

postForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('postTitle').value.trim();
    const author = document.getElementById('postAuthor').value.trim();
    const category = document.getElementById('postCategory').value.trim();
    const image = document.getElementById('postImage').value.trim();
    const content = document.getElementById('postContent').value.trim();

    if (!title || !author || !category || !content) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    // Get existing posts from localStorage
    let posts = JSON.parse(localStorage.getItem('blog-posts')) || [];

    if (editPostId) {
        // Update existing post
        const postIndex = posts.findIndex(p => p.id === editPostId);
        if (postIndex !== -1) {
            posts[postIndex] = {
                id: editPostId,
                userId: posts[postIndex].userId, // Preserve original userId
                title: escapeHtml(title),
                author: escapeHtml(author),
                category: escapeHtml(category),
                image: escapeHtml(image),
                content: escapeHtml(content),
                excerpt: escapeHtml(content.substring(0, 150)) + '...',
                date: posts[postIndex].date,
                timestamp: posts[postIndex].timestamp
            };
            showAlert('Post updated successfully!', 'success');
        }
    } else {
        // Create new post
        const newPost = {
            id: Date.now(),
            userId: currentUser ? currentUser.id : null,
            title: escapeHtml(title),
            author: escapeHtml(author),
            category: escapeHtml(category),
            image: escapeHtml(image),
            content: escapeHtml(content),
            excerpt: escapeHtml(content.substring(0, 150)) + '...',
            date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            timestamp: Date.now()
        };
        posts.unshift(newPost);
        showAlert('Post published successfully!', 'success');
    }

    // Save to localStorage
    localStorage.setItem('blog-posts', JSON.stringify(posts));

    // Reset form
    postForm.reset();

    // Redirect after 2 seconds
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 2000);
});

function updateNavOnAuth() {
    const authToken = localStorage.getItem('authToken');
    const navLoginLink = document.querySelector('#navbar a[href*="login.html"]');

    if (authToken && navLoginLink) {
        navLoginLink.innerHTML = '<i class="fa-solid fa-tachometer-alt"></i> Dashboard';
        navLoginLink.href = 'admin.html';
    }
}

// Load edit post on page load
loadEditPost();
populateAuthorField();
updateNavOnAuth();
