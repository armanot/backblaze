const express = require('express');
const multer = require('multer');
const cors = require('cors');
const BackblazeB2 = require('backblaze-b2');
const nodemailer = require('nodemailer');
const { Pool } = require('pg'); // PostgreSQL client
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

// Configure Multer for file uploads
const upload = multer(); // Default storage (in-memory)

// Check for required environment variables
if (
    !process.env.BACKBLAZE_KEY_ID ||
    !process.env.BACKBLAZE_APPLICATION_KEY ||
    !process.env.BACKBLAZE_BUCKET_ID ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS ||
    !process.env.PG_USER ||
    !process.env.PG_HOST ||
    !process.env.PG_DATABASE ||
    !process.env.PG_PASSWORD ||
    !process.env.PG_PORT ||
    !process.env.DATABASE_URL
) {
    console.error('Missing required environment variables.');
    process.exit(1);
}

// Initialize PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false, // Use SSL only for hosted databases
});


pool.connect((err) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err);
    } else {
        console.log('Connected to PostgreSQL');
    }
});

// Initialize Backblaze B2 SDK
const b2 = new BackblazeB2({
    applicationKeyId: process.env.BACKBLAZE_KEY_ID,
    applicationKey: process.env.BACKBLAZE_APPLICATION_KEY,
});

// Authorize with Backblaze B2
(async () => {
    try {
        await b2.authorize();
        console.log('Backblaze B2 Authorized');
    } catch (err) {
        console.error('Error authorizing Backblaze B2:', err.message);
    }
})();

// Enable CORS for frontend communication
app.use((req, res, next) => {
    const allowedOrigins = ['https://armanot.github.io', 'http://localhost:3000']; // Add all valid origins
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your Gmail App Password
    },
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        res.status(200).json({
            message: 'Login successful',
            isAdmin: user.is_admin,
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Example: Create a new user (for admin use)
app.post('/users', async (req, res) => {
    const { username, password, isAdmin } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (username, password, is_admin) VALUES ($1, $2, $3)',
            [username, hashedPassword, isAdmin || false]
        );
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});


// File upload and email sending endpoint
app.post('/upload-and-email', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file received' });
        }

        // Upload file to Backblaze B2
        const uploadUrl = await b2.getUploadUrl({ bucketId: process.env.BACKBLAZE_BUCKET_ID });
        const response = await b2.uploadFile({
            uploadUrl: uploadUrl.data.uploadUrl,
            uploadAuthToken: uploadUrl.data.authorizationToken,
            fileName: req.file.originalname,
            data: req.file.buffer,
        });

        const fileUrl = `https://f${response.data.downloadHost}/file/${process.env.BACKBLAZE_BUCKET_ID}/${req.file.originalname}`;

        // Send email with the uploaded file link
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'armanot@gmail.com', // Replace with recipient's email
            subject: 'Your Image File from SnapSync',
            text: `Your image file is ready. File is as attached`,
            attachments: [
                {
                    filename: req.file.originalname,
                    content: req.file.buffer,
                },
            ],
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: 'File uploaded and email sent successfully!',
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Example endpoint to interact with PostgreSQL
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
