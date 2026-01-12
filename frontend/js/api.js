// API Base URL
const API_BASE_URL = 'http://localhost:5000';

// Make API calls
export async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add request body for non-GET requests
    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        // Handle authentication errors
        if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
            throw new Error('Unauthorized. Please login again.');
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP Error: ${response.status}`);
        }

        return result;
    } catch (error) {
        console.error(`API Error (${method} ${endpoint}):`, error);
        throw error;
    }
}

// Login
export async function login(email, password) {
    return apiCall('/api/auth/login', 'POST', { email, password });
}

// Get all posts
export async function getPosts(page = 1, limit = 10) {
    return apiCall(`/api/posts?page=${page}&limit=${limit}`, 'GET');
}

// Get single post
export async function getPost(id) {
    return apiCall(`/api/posts/${id}`, 'GET');
}

// Create post
export async function createPost(title, content, category = 'General') {
    return apiCall('/api/posts', 'POST', { title, content, category });
}

// Update post
export async function updatePost(id, title, content, category) {
    return apiCall(`/api/posts/${id}`, 'PUT', { title, content, category });
}

// Delete post
export async function deletePost(id) {
    return apiCall(`/api/posts/${id}`, 'DELETE');
}

// Get user posts
export async function getUserPosts() {
    return apiCall('/api/posts/user/my-posts', 'GET');
}
