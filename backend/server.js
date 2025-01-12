const express = require('express');
const multer = require('multer');
const cors = require('cors');
const BackblazeB2 = require('backblaze-b2');

const app = express();
const port = process.env.PORT || 3000;

// Configure Multer for file uploads
const upload = multer(); // Default storage (in-memory)

// Check for required environment variables
if (!process.env.BACKBLAZE_KEY_ID || !process.env.BACKBLAZE_APPLICATION_KEY || !process.env.BACKBLAZE_BUCKET_ID) {
    console.error('Missing Backblaze environment variables.');
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
app.use(cors({ origin: 'https://your-frontend.onrender.com' })); // Replace with your frontend domain

// File upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file received' });
        }

        const uploadUrl = await b2.getUploadUrl({ bucketId: process.env.BACKBLAZE_BUCKET_ID });
        const response = await b2.uploadFile({
            uploadUrl: uploadUrl.data.uploadUrl,
            uploadAuthToken: uploadUrl.data.authorizationToken,
            fileName: req.file.originalname,
            data: req.file.buffer,
        });

        res.status(200).json({
            message: 'File uploaded successfully!',
            fileUrl: `https://f${response.data.downloadHost}/file/${response.data.fileName}`,
        });
    } catch (error) {
        console.error('Upload error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// File download endpoint
app.get('/download/:fileName', async (req, res) => {
    try {
        const { fileName } = req.params;

        const response = await b2.getDownloadAuthorization({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
            fileNamePrefix: fileName,
            validDurationInSeconds: 3600,
        });

        const downloadUrl = `https://f${response.data.downloadHost}/file/${process.env.BACKBLAZE_BUCKET_ID}/${fileName}`;

        res.status(200).json({ downloadUrl });
    } catch (error) {
        console.error('Download error:', error.message);
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
