document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById('fileInput').files[0];
        const customFilename = document.getElementById('customFilename').value;

        console.log('File Input:', fileInput);
        console.log('Custom Filename:', customFilename);

        if (!fileInput || !customFilename) {
            alert('Please select an image and enter a filename.');
            return;
        }

        console.log('File and filename are valid');

        try {
            // Resize the image
            const resizedImageBlob = await resizeImage(fileInput, 800, 600);

            // Upload resized image with the custom filename
            const result = await uploadImage(resizedImageBlob, customFilename);
            document.getElementById('status').innerText = `Uploaded successfully! File URL: ${result.fileUrl}`;
        } catch (error) {
            console.error('Error occurred during upload:', error);
            document.getElementById('status').innerText = `Error: ${error.message}`;
        }
    });
});

async function resizeImage(file, width, height) {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    await new Promise((resolve) => (img.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Draw the image onto the canvas
    ctx.drawImage(img, 0, 0, width, height);

    // Release object URL memory
    URL.revokeObjectURL(img.src);

    // Convert canvas to Blob
    return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8); // Adjust quality if needed
    });
}

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
