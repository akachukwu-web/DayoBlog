/**
 * Load and display blog posts from localStorage
 */
function loadPosts() {
    const postsContainer = document.getElementById('posts');
    if (!postsContainer) return;

    // Get posts from localStorage
    let posts = JSON.parse(localStorage.getItem('blog-posts')) || [];

    // If no custom posts, show placeholder message
    if (posts.length === 0) {
        postsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
                <i class="fa-solid fa-feather" style="font-size: 3rem; color: var(--text-gray); margin-bottom: 1rem; display: block;"></i>
                <p style="color: var(--text-gray); font-size: 1.1rem;">No posts yet. <a href="create-post.html" style="color: var(--text-dark); text-decoration: underline;">Create one now!</a></p>
            </div>
        `;
        return;
    }

    // Render posts
    postsContainer.innerHTML = posts.map(post => `
        <article class="post-card">
            <div class="post-image" style="background: linear-gradient(135deg, var(--text-dark) 0%, var(--text-dark) 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">
                <i class="fa-solid fa-article"></i>
            </div>
            <div class="post-content">
                <h2 class="post-title">${escapeHtml(post.title)}</h2>
                <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
                <div class="post-meta">
                    <span class="post-author"><i class="fa-solid fa-user"></i> ${escapeHtml(post.author)}</span>
                    <span class="post-date"><i class="fa-solid fa-calendar"></i> ${post.date}</span>
                    <span class="post-category" style="background-color: var(--border-gray); color: var(--text-dark);">${escapeHtml(post.category)}</span>
                </div>
            </div>
            <div class="post-footer">
                <button class="btn btn-primary btn-small" onclick="viewPost(${post.id})">
                    Read More <i class="fa-solid fa-arrow-right"></i>
                </button>
                <div class="post-actions">
                    <button class="btn btn-outline btn-small" onclick="editPost(${post.id})" title="Edit">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deletePost(${post.id})" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </article>
    `).join('');
}

/**
 * View full post
 */
function viewPost(postId) {
    const posts = JSON.parse(localStorage.getItem('blog-posts')) || [];
    const post = posts.find(p => p.id === postId);
    
    if (post) {
        localStorage.setItem('current-post', JSON.stringify(post));
        window.location.href = `post-view.html?id=${postId}`;
    }
    
}

/**
 * Edit post
 */
function editPost(postId) {
    const posts = JSON.parse(localStorage.getItem('blog-posts')) || [];
    const post = posts.find(p => p.id === postId);
    
    if (post) {
        localStorage.setItem('edit-post', JSON.stringify(post));
        window.location.href = `create-post.html?id=${postId}`;
    }
}

/**
 * Delete post with confirmation
 */
function deletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        let posts = JSON.parse(localStorage.getItem('blog-posts')) || [];
        posts = posts.filter(p => p.id !== postId);
        localStorage.setItem('blog-posts', JSON.stringify(posts));
        loadPosts();
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Search posts
 */
function searchPosts(query) {
    const postsContainer = document.getElementById('posts');
    if (!postsContainer) return;

    let posts = JSON.parse(localStorage.getItem('blog-posts')) || [];
    
    if (!query.trim()) {
        loadPosts();
        return;
    }

    const filtered = posts.filter(post => 
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.content.toLowerCase().includes(query.toLowerCase()) ||
        post.author.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length === 0) {
        postsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
                <p style="color: var(--text-gray); font-size: 1.1rem;">No posts found matching "${escapeHtml(query)}"</p>
            </div>
        `;
        return;
    }

    postsContainer.innerHTML = filtered.map(post => `
        <article class="post-card">
            <div class="post-image" style="background: linear-gradient(135deg, var(--text-dark) 0%, var(--text-dark) 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">
                <i class="fa-solid fa-article"></i>
            </div>
            <div class="post-content">
                <h2 class="post-title">${escapeHtml(post.title)}</h2>
                <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
                <div class="post-meta">
                    <span class="post-author"><i class="fa-solid fa-user"></i> ${escapeHtml(post.author)}</span>
                    <span class="post-date"><i class="fa-solid fa-calendar"></i> ${post.date}</span>
                    <span class="post-category" style="background-color: var(--border-gray); color: var(--text-dark);">${escapeHtml(post.category)}</span>
                </div>
            </div>
            <div class="post-footer">
                <button class="btn btn-primary btn-small" onclick="viewPost(${post.id})">
                    Read More <i class="fa-solid fa-arrow-right"></i>
                </button>
                <div class="post-actions">
                    <button class="btn btn-outline btn-small" onclick="editPost(${post.id})" title="Edit">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deletePost(${post.id})" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </article>
    `).join('');
}

// Load posts on page load
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();

    // Add search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            searchPosts(e.target.value);
        });
    }
});
