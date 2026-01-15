/**
 * Load and display blog posts from localStorage
 */
const POSTS_PER_PAGE = 4;
let currentCategory = null;

function loadPosts(page = 1) {
    const postsContainer = document.getElementById('posts');
    const featuredContainer = document.getElementById('featuredPost');
    const paginationContainer = document.getElementById('pagination');

    if (!postsContainer) return;

    // Get posts from localStorage
    let posts = JSON.parse(localStorage.getItem('blog-posts')) || [];

    // Filter by category if selected
    if (currentCategory) {
        posts = posts.filter(post => post.category === currentCategory);
        
        // Update section title
        const sectionTitle = document.querySelector('#posts-section h2');
        if (sectionTitle) sectionTitle.textContent = `Category: ${currentCategory}`;
        
        // Hide featured post container when filtering to show a clean grid
        if (featuredContainer) featuredContainer.style.display = 'none';
    } else {
        const sectionTitle = document.querySelector('#posts-section h2');
        if (sectionTitle) sectionTitle.textContent = 'Latest Articles';
    }

    // If no custom posts, show placeholder message
    if (posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-feather"></i>
                <p>No posts yet. <a href="frontend/create-post.html">Create one now!</a></p>
            </div>
        `;
        if (featuredContainer) {
            featuredContainer.style.display = 'none';
        }
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
        return;
    }

    // Separate the latest post (Featured) from the rest
    const featuredPost = currentCategory ? null : posts[0];
    const remainingPosts = currentCategory ? posts : posts.slice(1);

    // Render Featured Post
    if (featuredContainer && featuredPost && !currentCategory) {
        featuredContainer.style.display = 'block';
        featuredContainer.innerHTML = `
            ${featuredPost.image 
                ? `<img src="${escapeHtml(featuredPost.image)}" alt="${escapeHtml(featuredPost.title)}" class="featured-image" style="object-fit: cover; width: 100%;">`
                : `<div class="featured-image"><i class="fa-solid fa-star"></i></div>`
            }
            <div class="p-4">
                <span class="post-category">Latest</span>
                <h3 class="mt-2">${escapeHtml(featuredPost.title)}</h3>
                <p class="text-gray">${escapeHtml(featuredPost.excerpt)}</p>
                <div class="post-meta mb-3">
                    <span class="post-author"><i class="fa-solid fa-user"></i> ${escapeHtml(featuredPost.author)}</span>
                    <span class="post-date"><i class="fa-solid fa-calendar"></i> ${featuredPost.date}</span>
                </div>
                <button class="btn btn-primary btn-small" onclick="viewPost(${featuredPost.id})">
                    Read More <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        `;
    } else if (featuredContainer) {
        featuredContainer.style.display = 'none';
    }

    // Pagination Logic
    const totalPosts = remainingPosts.length;
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
    const startIndex = (page - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const postsToDisplay = remainingPosts.slice(startIndex, endIndex);

    // Render Remaining Posts Grid
    postsContainer.innerHTML = postsToDisplay.map(post => `
        <article class="post-card">
            ${post.image 
                ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" class="post-image">` 
                : `<div class="post-image post-image-gradient"><i class="fa-solid fa-article"></i></div>`
            }
            <div class="post-content">
                <h2 class="post-title">${escapeHtml(post.title)}</h2>
                <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
                <div class="post-meta">
                    <span class="post-author"><i class="fa-solid fa-user"></i> ${escapeHtml(post.author)}</span>
                    <span class="post-date"><i class="fa-solid fa-calendar"></i> ${post.date}</span>
                    <span class="post-category post-category-style">${escapeHtml(post.category)}</span>
                </div>
            </div>
            <div class="post-footer">
                <button class="btn btn-primary btn-small" onclick="viewPost(${post.id})">
                    Read More <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </article>
    `).join('');

    // Render Pagination Controls
    if (paginationContainer) {
        renderPagination(paginationContainer, totalPages, page);
    }
}

function renderPagination(container, totalPages, currentPage) {
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    
    // Prev Button
    if (currentPage > 1) {
        html += `<a href="#" onclick="changePage(${currentPage - 1}); return false;">&laquo; Prev</a>`;
    }

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        html += `<a href="#" class="${activeClass}" onclick="changePage(${i}); return false;">${i}</a>`;
    }

    // Next Button
    if (currentPage < totalPages) {
        html += `<a href="#" onclick="changePage(${currentPage + 1}); return false;">Next &raquo;</a>`;
    }

    container.innerHTML = html;
}

function changePage(page) {
    loadPosts(page);
    const postsSection = document.getElementById('posts-section');
    if (postsSection) {
        postsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Filter posts by category
 */
function filterPosts(category) {
    currentCategory = category;
    loadPosts(1);
    
    // Update active state in sidebar
    document.querySelectorAll('.category-list a').forEach(link => {
        if (link.getAttribute('data-category') === category) {
            link.classList.add('active');
        } else if (category === null && link.getAttribute('data-category') === 'all') {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Load and render categories sidebar
 */
function loadCategories() {
    const posts = JSON.parse(localStorage.getItem('blog-posts')) || [];
    const categories = {};
    
    posts.forEach(post => {
        const cat = post.category || 'Uncategorized';
        categories[cat] = (categories[cat] || 0) + 1;
    });
    
    const container = document.querySelector('.category-list');
    if (!container) return;
    
    const allLink = `<li><a href="#" onclick="filterPosts(null); return false;" data-category="all" class="active"><i class="fa-solid fa-layer-group"></i> All Stories</a><span class="category-count">${posts.length}</span></li>`;
    
    const catLinks = Object.keys(categories).map(cat => `<li><a href="#" onclick="filterPosts('${escapeHtml(cat)}'); return false;" data-category="${escapeHtml(cat)}"><i class="fa-solid fa-tag"></i> ${escapeHtml(cat)}</a><span class="category-count">${categories[cat]}</span></li>`).join('');
    
    container.innerHTML = allLink + catLinks;
}

/**
 * View full post
 */
function viewPost(postId) {
    const posts = JSON.parse(localStorage.getItem('blog-posts')) || [];
    // Convert postId to number to ensure proper comparison
    const numPostId = parseInt(postId);
    const post = posts.find(p => parseInt(p.id) === numPostId);
    
    if (post) {
        localStorage.setItem('current-post', JSON.stringify(post));
        window.location.href = `frontend/post-view.html?id=${numPostId}`;
    }
    
}

/**
 * Search posts
 */
function searchPosts(query) {
    const postsContainer = document.getElementById('posts');
    const paginationContainer = document.getElementById('pagination');
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
            <div class="empty-state">
                <p>No posts found matching "${escapeHtml(query)}"</p>
            </div>
        `;
        return;
    }

    if (paginationContainer) {
        paginationContainer.innerHTML = '';
    }

    postsContainer.innerHTML = filtered.map(post => `
        <article class="post-card">
            ${post.image 
                ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" class="post-image">` 
                : `<div class="post-image post-image-gradient"><i class="fa-solid fa-article"></i></div>`
            }
            <div class="post-content">
                <h2 class="post-title">${escapeHtml(post.title)}</h2>
                <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
                <div class="post-meta">
                    <span class="post-author"><i class="fa-solid fa-user"></i> ${escapeHtml(post.author)}</span>
                    <span class="post-date"><i class="fa-solid fa-calendar"></i> ${post.date}</span>
                    <span class="post-category post-category-style">${escapeHtml(post.category)}</span>
                </div>
            </div>
            <div class="post-footer">
                <button class="btn btn-primary btn-small" onclick="viewPost(${post.id})">
                    Read More <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </article>
    `).join('');
}

/**
 * Updates UI elements based on authentication status.
 */
function updateAuthUI() {
    const authToken = localStorage.getItem('authToken');
    const navLoginLink = document.querySelector('#navbar a[href="frontend/login.html"]');
    const ctaLink = document.querySelector('.cta-section a.cta-btn');

    if (authToken) {
        // User is logged in: Change "Login" to "Dashboard"
        if (navLoginLink) {
            navLoginLink.innerHTML = '<i class="fa-solid fa-tachometer-alt"></i> Dashboard';
            navLoginLink.href = 'frontend/admin.html';
        }
    } else {
        // User is not logged in: Point CTA to login page
        if (ctaLink) {
            ctaLink.href = 'frontend/login.html';
        }
    }
}

// Load posts on page load
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    loadCategories();

    // Add search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            searchPosts(e.target.value);
        });
    }

    // Initialize mobile menu
    initMobileMenu();

    // Update UI based on auth status
    updateAuthUI();
});
