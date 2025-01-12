document.addEventListener('DOMContentLoaded', () => {
    const cameraInput = document.getElementById('cameraInput');
    const uploadForm = document.getElementById('uploadForm');
    const previewCanvas = document.getElementById('previewCanvas');
    const statusElement = document.getElementById('status');

    // Handle form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = cameraInput.files[0];
        const customFilename = document.getElementById('customFilename').value;

        if (!file || !customFilename) {
            alert('Please take a picture and enter a filename.');
            return;
        }

        try {
            // Display status
            statusElement.textContent = 'Resizing image...';
            const resizedImageBlob = await resizeImage(file, 800, 600);

            // Show preview
            await displayPreview(resizedImageBlob);

            // Update status
            statusElement.textContent = 'Uploading image...';
            const result = await uploadImage(resizedImageBlob, customFilename);

            // Show success message
            statusElement.innerHTML = `Uploaded successfully! <a href="${result.fileUrl}" target="_blank">View File</a>`;
        } catch (error) {
            console.error('Error occurred during upload:', error.message);
            statusElement.textContent = `Error: ${error.message}`;
        }
    });

    // Resize the image
    async function resizeImage(file, width, height) {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        await new Promise((resolve) => (img.onload = resolve));

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        URL.revokeObjectURL(img.src);

        return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.8); // Adjust quality if needed
        });
    }

    // Display the image preview
    async function displayPreview(blob) {
        const ctx = previewCanvas.getContext('2d');
        const img = new Image();
        img.src = URL.createObjectURL(blob);

        await new Promise((resolve) => (img.onload = resolve));

        previewCanvas.width = img.width;
        previewCanvas.height = img.height;
        previewCanvas.hidden = false;

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(img.src);
    }

    // Upload the image
    async function uploadImage(fileBlob, customFilename) {
        const formData = new FormData();
        formData.append('file', fileBlob, `${customFilename}.jpg`);

        const API_URL = 'https://backblaze.onrender.com';

        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        return response.json();
    }
});
