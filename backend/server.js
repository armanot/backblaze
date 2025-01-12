const express = require('express');
const multer = require('multer');
const cors = require('cors');
const BackblazeB2 = require('backblaze-b2');

const app = express();
const port = 3000;

// Configure Multer for file uploads
const upload = multer(); // Default storage (in-memory)

// Initialize Backblaze B2 SDK
const b2 = new BackblazeB2({
    applicationKeyId: '005a39b96679ffe0000000001', // Replace with your actual key ID
    applicationKey: 'K005xjV3vAioJbFf7ZeOIcyYq1bxgBk' // Replace with your actual application key
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
app.use(cors());

// File upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        console.log('Request Headers:', req.headers);
        console.log('Request Body:', req.body);
        console.log('Request File:', req.file);

        // Validate file
        if (!req.file) {
            return res.status(400).json({ error: 'No file received' });
        }

        console.log('Received file:', req.file);

        // Get an upload URL from Backblaze
        const uploadUrl = await b2.getUploadUrl({ bucketId: 'da5359fbf9265657994f0f1e' }); // Replace with your actual bucket ID

        // Upload file to Backblaze
        const response = await b2.uploadFile({
            uploadUrl: uploadUrl.data.uploadUrl,
            uploadAuthToken: uploadUrl.data.authorizationToken,
            fileName: req.file.originalname,
            data: req.file.buffer
        });

        console.log('Upload successful:', response.data);

        // Respond with success
        res.status(200).json({
            message: 'File uploaded successfully!',
            fileUrl: response.data.fileName
        });
    } catch (error) {
        console.error('Upload error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// File download endpoint (optional for generating pre-signed download links)
app.get('/download/:fileName', async (req, res) => {
    try {
        const { fileName } = req.params;

        // Get download authorization
        const response = await b2.getDownloadAuthorization({
            bucketId: 'da5359fbf9265657994f0f1e', // Replace with your actual bucket ID
            fileNamePrefix: fileName,
            validDurationInSeconds: 3600 // Valid for 1 hour
        });

        const downloadUrl = `${response.data.downloadUrl}?Authorization=${response.data.authorizationToken}`;

        console.log('Generated download link:', downloadUrl);

        // Respond with the signed URL
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
