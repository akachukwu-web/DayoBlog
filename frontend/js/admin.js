// Auth Check
(async () => {
    try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
            window.location.href = 'login.html';
        }
    } catch (e) {
        window.location.href = 'login.html';
    }
})();

// Mobile Menu
initMobileMenu();

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        showAlert('Logging out...', 'info');
        await fetch('/api/auth/logout', { method: 'POST' });
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1000);
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

async function loadAdminPosts() {
    const postsListDiv = document.getElementById('postsList');
    if (!postsListDiv) return;

    let posts = [];
    try {
        const response = await fetch('/api/my-posts');
        if (response.ok) {
            posts = await response.json();
        }
    } catch (e) { console.error(e); }

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
                                <button class="btn btn-delete" onclick="deletePost('${post.id}')">
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

async function performDelete(postId) {
    await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
    });

    if (deleteModal) {
        deleteModal.classList.remove('show');
    }
    
    showAlert('Post deleted successfully!', 'success');
    loadAdminPosts(); // Refresh the list
}