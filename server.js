import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import transporter from './config/mailer.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files (html, css, js)

// Connect to Database
let db;

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

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        const newUser = {
            name,
            email,
            password, // Note: In a real production app, you should hash this password!
            joinedAt: new Date()
        };

        await db.collection('users').insertOne(newUser);
        res.status(201).json({ message: 'Account created successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await db.collection('users').findOne({ email, password });
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Create a simple token
        const token = `auth-${user._id}-${Date.now()}`;

        res.json({
            message: 'Login successful!',
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

// --- POSTS API ---

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
app.post('/api/posts', async (req, res) => {
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
        const result = await db.collection('posts').insertOne(postData);
        const newPost = await db.collection('posts').findOne({ _id: result.insertedId });
        res.status(201).json({ success: true, post: mapId(newPost) });
    }
});

// DELETE post
app.delete('/api/posts/:id', async (req, res) => {
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

app.post('/api/comments', async (req, res) => {
    const newComment = req.body;
    newComment.timestamp = Date.now();
    const result = await db.collection('comments').insertOne(newComment);
    const insertedComment = await db.collection('comments').findOne({ _id: result.insertedId });
    res.status(201).json(mapId(insertedComment));
});

app.delete('/api/comments/:id', async (req, res) => {
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
            from: `"${name}" <${process.env.EMAIL_USER}>`,
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
            from: `"TechZon" <${process.env.EMAIL_USER}>`,
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
