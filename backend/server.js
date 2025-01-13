const express = require('express');
const multer = require('multer');
const cors = require('cors');
const BackblazeB2 = require('backblaze-b2');
const nodemailer = require('nodemailer');
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
    !process.env.EMAIL_PASS
) {
    console.error('Missing required environment variables.');
    process.exit(1);
}

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
            subject: 'Your Map Image from SnapSync',
            // text: `Hello! Your map image is ready. You can download it here: ${fileUrl}`,
            text: `Your map image is ready. File is as attached`,
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
            // fileUrl,
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
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

