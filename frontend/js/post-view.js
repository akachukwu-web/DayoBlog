// Initialize mobile menu
initMobileMenu();

// Modal Elements
const deleteCommentModal = document.getElementById('deleteCommentModal');
const confirmCommentDeleteBtn = document.getElementById('confirmCommentDelete');
const cancelCommentDeleteBtn = document.getElementById('cancelCommentDelete');
let commentToDeleteId = null;
let postToDeleteFromId = null;

if (cancelCommentDeleteBtn && deleteCommentModal) {
    cancelCommentDeleteBtn.addEventListener('click', () => {
        deleteCommentModal.classList.remove('show');
    });
}

if (confirmCommentDeleteBtn) {
    confirmCommentDeleteBtn.addEventListener('click', () => {
        if (commentToDeleteId && postToDeleteFromId) {
            performDeleteComment(commentToDeleteId, postToDeleteFromId);
        }
    });
}

// Load and display post
async function loadPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    let post = null;
    try {
        const response = await fetch(`/api/posts/${postId}`);
        if (response.ok) post = await response.json();
    } catch (e) { console.error(e); }

    const postContentDiv = document.getElementById('postContent');

    if (!post) {
        postContentDiv.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-exclamation-circle"></i>
                <p>Post not found. <a href="../index.html">Go back home</a></p>
            </div>
        `;
        return;
    }

    // Update page title
    document.title = `${post.title} - TechZon`;

    postContentDiv.innerHTML = `
        <article>
            ${post.image 
                ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" style="width: 100%; height: 400px; object-fit: cover; border-radius: 0.75rem; margin-bottom: 2rem;">` 
                : ''
            }
            <div class="post-header">
                <h1 class="post-view-title">${escapeHtml(post.title)}</h1>
                <div class="post-view-meta">
                    <div class="post-view-meta-item">
                        <i class="fa-solid fa-user"></i>
                        <span>${escapeHtml(post.author)}</span>
                    </div>
                    <div class="post-view-meta-item">
                        <i class="fa-solid fa-calendar"></i>
                        <span>${post.date}</span>
                    </div>
                    <div class="post-view-meta-item">
                        <i class="fa-solid fa-tag"></i>
                        <span>${escapeHtml(post.category)}</span>
                    </div>
                </div>
            </div>

            <div class="post-view-content">
                ${post.content.split('\n').map(p => p.trim() ? `<p>${escapeHtml(p)}</p>` : '').join('')}
            </div>
        </article>

        <section class="comments-section">
            <div class="comments-header">
                <h3><i class="fa-solid fa-comments"></i> Comments (<span id="commentCount">0</span>)</h3>
            </div>
            
            <div id="commentFormContainer">
                <!-- Form injected via JS if logged in -->
            </div>

            <div id="commentsList" class="comment-list">
                <!-- Comments injected via JS -->
            </div>
        </section>
    `;

    loadComments(postId);
    renderCommentForm(postId);
}

async function loadComments(postId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    let postComments = [];
    try {
        const response = await fetch(`/api/comments?postId=${postId}`);
        postComments = await response.json();
    } catch (e) { console.error(e); }
    
    // Update count
    const countEl = document.getElementById('commentCount');
    if (countEl) countEl.textContent = postComments.length;

    const listEl = document.getElementById('commentsList');
    if (!listEl) return;

    if (postComments.length === 0) {
        listEl.innerHTML = '<p class="text-gray">No comments yet. Be the first to share your thoughts!</p>';
        return;
    }

    // Sort by newest first
    postComments.sort((a, b) => b.timestamp - a.timestamp);

    listEl.innerHTML = postComments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author"><i class="fa-solid fa-user-circle"></i> ${escapeHtml(comment.author)}</span>
                <div class="comment-meta">
                    <span class="comment-date">${comment.date}</span>
                    ${currentUser && currentUser.id === comment.userId 
                        ? `<button class="btn-delete-comment" onclick="deleteComment('${comment.id}', '${postId}')" title="Delete comment"><i class="fa-solid fa-trash"></i></button>` 
                        : ''}
                </div>
            </div>
            <div class="comment-body">
                ${escapeHtml(comment.content)}
            </div>
        </div>
    `).join('');
}

function deleteComment(commentId, postId) {
    commentToDeleteId = commentId;
    postToDeleteFromId = postId;
    if (deleteCommentModal) {
        deleteCommentModal.classList.add('show');
    }
}

async function performDeleteComment(commentId, postId) {
    await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
    });

    if (deleteCommentModal) {
        deleteCommentModal.classList.remove('show');
    }

    showAlert('Comment deleted successfully', 'success');
    loadComments(postId);
}

function renderCommentForm(postId) {
    const container = document.getElementById('commentFormContainer');
    if (!container) return;

    const authToken = localStorage.getItem('authToken');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!authToken || !currentUser) {
        container.innerHTML = `
            <div class="alert alert-info">
                Please <a href="login.html" style="text-decoration: underline;">login</a> to leave a comment.
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <form id="commentForm" class="comment-form">
            <div class="form-group">
                <label for="commentContent">Leave a comment as <strong>${escapeHtml(currentUser.name)}</strong></label>
                <textarea id="commentContent" rows="3" placeholder="Share your thoughts..." required style="min-height: 100px;"></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-small">Post Comment</button>
        </form>
    `;

    document.getElementById('commentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitComment(postId, currentUser);
    });
}

async function submitComment(postId, user) {
    const contentEl = document.getElementById('commentContent');
    const content = contentEl.value.trim();

    if (!content) return;

    const newComment = {
        postId: postId,
        author: user.name,
        userId: user.id,
        content: content,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    };

    await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComment)
    });

    contentEl.value = '';
    showAlert('Comment posted successfully!', 'success');
    loadComments(postId);
}

function updateNavOnAuth() {
    const authToken = localStorage.getItem('authToken');
    const navLoginLink = document.querySelector('#navbar a[href*="login.html"]');

    if (authToken && navLoginLink) {
        navLoginLink.innerHTML = '<i class="fa-solid fa-tachometer-alt"></i> Dashboard';
        navLoginLink.href = 'admin.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadPost();
    updateNavOnAuth();
});
