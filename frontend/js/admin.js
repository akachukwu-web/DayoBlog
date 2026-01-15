// Auth Check
if (!localStorage.getItem('authToken')) {
    window.location.href = 'login.html';
}

// Mobile Menu
initMobileMenu();

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('rememberedEmail');
        showAlert('Logging out...', 'success');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1500);
    });
}

// Modal Logic
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');
let postToDeleteId = null;

if (cancelDeleteBtn && deleteModal) {
    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.remove('show');
        postToDeleteId = null;
    });
}

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
        if (postToDeleteId) {
            performDelete(postToDeleteId);
        }
    });
}

// Load Posts
document.addEventListener('DOMContentLoaded', () => {
    loadAdminPosts();
});

function loadAdminPosts() {
    const postsListDiv = document.getElementById('postsList');
    if (!postsListDiv) return;

    const posts = JSON.parse(localStorage.getItem('blog-posts')) || [];

    if (posts.length === 0) {
        postsListDiv.innerHTML = `<p class="text-center text-gray">You haven't created any posts yet.</p>`;
        return;
    }

    postsListDiv.innerHTML = `
        <table class="posts-table">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${posts.map(post => `
                    <tr>
                        <td data-label="Title" class="post-title-cell">${escapeHtml(post.title)}</td>
                        <td data-label="Category">${escapeHtml(post.category)}</td>
                        <td data-label="Date">${post.date}</td>
                        <td data-label="Actions">
                            <div class="post-actions">
                                <a href="create-post.html?id=${post.id}" class="btn btn-edit">
                                    <i class="fa-solid fa-pen"></i> Edit
                                </a>
                                <button class="btn btn-delete" onclick="deletePost(${post.id})">
                                    <i class="fa-solid fa-trash"></i> Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deletePost(postId) {
    postToDeleteId = postId;
    if (deleteModal) {
        deleteModal.classList.add('show');
    }
}

function performDelete(postId) {
    let posts = JSON.parse(localStorage.getItem('blog-posts')) || [];
    const updatedPosts = posts.filter(p => p.id !== postId);
    localStorage.setItem('blog-posts', JSON.stringify(updatedPosts));

    if (deleteModal) {
        deleteModal.classList.remove('show');
    }
    
    showAlert('Post deleted successfully!', 'success');
    loadAdminPosts(); // Refresh the list
}