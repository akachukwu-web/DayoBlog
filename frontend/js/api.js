// This is a mock API to simulate a backend using localStorage.
// In a real application, this would be replaced with actual HTTP requests.

const MOCK_DELAY = 500; // Simulate network latency

function apiCall(endpoint, method, body) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(`Mock API Call: ${method} ${endpoint}`, body);

            if (endpoint === '/api/auth/register' && method === 'POST') {
                const users = JSON.parse(localStorage.getItem('blog-users')) || [];
                const existingUser = users.find(user => user.email === body.email);

                if (existingUser) {
                    return reject({ message: 'An account with this email already exists.' });
                }

                const newUser = {
                    id: Date.now(),
                    name: body.name,
                    email: body.email,
                    password: body.password // In a real app, this should be hashed!
                };
                users.push(newUser);
                localStorage.setItem('blog-users', JSON.stringify(users));

                return resolve({ message: 'Account created successfully!' });
            }

            if (endpoint === '/api/auth/login' && method === 'POST') {
                const users = JSON.parse(localStorage.getItem('blog-users')) || [];
                const user = users.find(u => u.email === body.email && u.password === body.password);

                if (user) {
                    // Create a mock JWT-like token and return user info
                    const token = `mock-token-for-${user.id}-${Date.now()}`;
                    return resolve({
                        message: 'Login successful!',
                        token: token,
                        user: { id: user.id, name: user.name, email: user.email }
                    });
                } else {
                    return reject({ message: 'Invalid email or password.' });
                }
            }

            reject({ message: `Mock endpoint ${endpoint} not found.` });
        }, MOCK_DELAY);
    });
}

export { apiCall };