import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, client } from './config/db.js';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import transporter from './config/mailer.js';
import crypto from 'crypto';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render/Heroku to correctly identify protocol (http/https)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files (html, css, js)

// Connect to Database
let db;

// Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        client: client,
        dbName: process.env.DB_NAME,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
        maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    }
}));

// Auth Middleware to protect routes
const authMiddleware = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ message: 'Unauthorized: You must be logged in.' });
};

// Helper to map MongoDB's _id to id for client-side consistency
const mapId = (doc) => {
    if (doc) {
        doc.id = doc._id;
        delete doc._id;
    }
    return doc;
};

// --- AUTH API ---

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 6) {
        return res.status(400).json({ message: 'All fields are required and password must be at least 6 characters.' });
    }

    try {
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            joinedAt: new Date()
        };

        await db.collection('users').insertOne(newUser);
        res.status(201).json({ message: 'Account created successfully!' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await db.collection('users').findOne({ email });
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const userSessionData = {
            id: user._id,
            name: user.name,
            email: user.email
        };

        // Set session
        req.session.user = userSessionData;

        res.json({
            message: 'Login successful!',
            user: userSessionData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get current user if authenticated
app.get('/api/auth/me', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out, please try again.' });
        }
        // The default session cookie name is 'connect.sid'
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
});

// Request Password Reset
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate token
        const token = crypto.randomBytes(20).toString('hex');
        const expiry = Date.now() + 3600000; // 1 hour

        await db.collection('users').updateOne(
            { email },
            { $set: { resetPasswordToken: token, resetPasswordExpires: expiry } }
        );

        // Construct reset URL
        // Assuming the server serves static files from root, the path includes 'frontend'
        const protocol = req.protocol;
        const host = req.headers.host;
        const resetUrl = `${protocol}://${host}/frontend/reset-password.html?token=${token}`;

        const mailOptions = {
            to: user.email,
            from: {
                name: "TechZon Security",
                address: process.env.EMAIL_USER
            },
            subject: 'Password Reset Request',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
                `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
                `${resetUrl}\n\n` +
                `If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Password reset email sent' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending email' });
    }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    const { token, password } = req.body;
    try {
        const user = await db.collection('users').findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { resetPasswordToken: "", resetPasswordExpires: "" }
            }
        );

        res.json({ message: 'Password has been updated.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error resetting password' });
    }
});

// --- POSTS API ---

// GET posts for current user (Dashboard)
app.get('/api/my-posts', authMiddleware, async (req, res) => {
    try {
        const userId = String(req.session.user.id);
        const posts = await db.collection('posts').find({ userId: userId }).sort({ timestamp: -1 }).toArray();
        res.json(posts.map(mapId));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user posts' });
    }
});

// GET all posts
app.get('/api/posts', async (req, res) => {
    const { query } = req.query;
    let filter = {};
    if (query) {
        filter = {
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } }
            ]
        };
    }
    const posts = await db.collection('posts').find(filter).sort({ timestamp: -1 }).toArray();
    res.json(posts.map(mapId));
});

// GET single post
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await db.collection('posts').findOne({ _id: new ObjectId(req.params.id) });
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(mapId(post));
    } catch (error) {
        res.status(400).json({ message: 'Invalid post ID' });
    }
});

// POST create or update post
app.post('/api/posts', authMiddleware, async (req, res) => {
    const postData = req.body;

    if (postData.id) { // This is an update
        const postId = postData.id;
        delete postData.id; // Don't try to set the _id field
        try {
            const result = await db.collection('posts').updateOne(
                { _id: new ObjectId(postId) },
                { $set: postData }
            );
            if (result.matchedCount === 0) {
                return res.status(404).json({ message: 'Post not found' });
            }
            postData.id = postId;
            res.json({ success: true, post: postData });
        } catch (error) {
            res.status(400).json({ message: 'Invalid post ID' });
        }
    } else { // This is a new post
        postData.timestamp = Date.now();
        if (!postData.date) {
            postData.date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        postData.userId = String(req.session.user.id); // Set userId from session for new posts
        const result = await db.collection('posts').insertOne(postData);
        const newPost = await db.collection('posts').findOne({ _id: result.insertedId });
        res.status(201).json({ success: true, post: mapId(newPost) });
    }
});

// DELETE post
app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
    try {
        const result = await db.collection('posts').deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }
        // Also delete associated comments
        await db.collection('comments').deleteMany({ postId: req.params.id });
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ message: 'Invalid post ID' });
    }
});

// --- COMMENTS API ---

app.get('/api/comments', async (req, res) => {
    const { postId } = req.query;
    if (postId) {
        const comments = await db.collection('comments').find({ postId: postId }).sort({ timestamp: -1 }).toArray();
        return res.json(comments.map(mapId));
    }
    const comments = await db.collection('comments').find({}).toArray();
    res.json(comments.map(mapId));
});

app.post('/api/comments', authMiddleware, async (req, res) => {
    const newComment = req.body;
    newComment.timestamp = Date.now();
    const result = await db.collection('comments').insertOne(newComment);
    const insertedComment = await db.collection('comments').findOne({ _id: result.insertedId });
    res.status(201).json(mapId(insertedComment));
});

app.delete('/api/comments/:id', authMiddleware, async (req, res) => {
    try {
        const result = await db.collection('comments').deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ message: 'Invalid comment ID' });
    }
});

// --- CONTACT API ---
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const newMessage = {
        name,
        email,
        subject: subject || 'No Subject',
        message,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('en-US')
    };

    try {
        // 1. Save the message to your database
        await db.collection('messages').insertOne(newMessage);

        // 2. Send an email notification to the admin
        const mailOptions = {
            from: {
                name: name,
                address: process.env.EMAIL_USER
            },
            to: process.env.ADMIN_EMAIL,
            subject: `New Contact Form Message: ${newMessage.subject}`,
            text: `You have a new message from:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `
                <h3>New message from your TechZon contact form:</h3>
                <ul>
                    <li><strong>Name:</strong> ${name}</li>
                    <li><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
                </ul>
                <h4>Subject:</h4>
                <p>${newMessage.subject}</p>
                <h4>Message:</h4>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error("Contact form submission error:", error);
        res.status(500).json({ message: 'Failed to send message due to a server error.' });
    }
});

// --- NEWSLETTER API ---
app.post('/api/newsletter', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Check if already subscribed
        const existing = await db.collection('subscribers').findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'This email is already subscribed.' });
        }

        await db.collection('subscribers').insertOne({ 
            email, 
            subscribedAt: new Date() 
        });

        // Optional: Send a welcome email (fire and forget)
        const mailOptions = {
            from: {
                name: "TechZon",
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Welcome to TechZon Newsletter!',
            text: 'Thank you for subscribing to our newsletter. Stay tuned for the latest tech updates!',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #000;">Welcome to TechZon!</h2>
                    <p>Hi there,</p>
                    <p>Thanks for subscribing to our newsletter. You're now part of a community of tech enthusiasts.</p>
                    <p>We'll keep you updated with the latest articles, tutorials, and insights.</p>
                    <br>
                    <p>Best regards,<br>The TechZon Team</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: 'Subscribed successfully!' });
    } catch (error) {
        console.error("Newsletter error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start Server
connectDB().then(database => {
    db = database;
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}).catch(e => {
    console.error("Failed to connect to DB and start server", e);
    process.exit(1);
});
