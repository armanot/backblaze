document.addEventListener('DOMContentLoaded', () => {
    document.title = 'SnapSync';

    const cameraInput = document.getElementById('cameraInput');
    const uploadForm = document.getElementById('uploadForm');
    const previewCanvas = document.getElementById('previewCanvas');
    const statusElement = document.getElementById('status');
    const coordinatesElement = document.getElementById('coordinates');
    const generateMapButton = document.getElementById('generateMap');
    const saveMapButton = document.getElementById('saveMap');
    const mapContainer = document.getElementById('mapContainer');
    const mapStatusElement = document.getElementById('mapStatus');
    const sitenameInput = document.getElementById('sitename');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');

    let latitude = null;
    let longitude = null;
    let map = null;

    // Set default site name
    const defaultSitename = `Site_${new Date().toISOString().split('T')[0]}`;
    sitenameInput.value = defaultSitename;

    // Detect user location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                latitude = position.coords.latitude.toFixed(6);
                longitude = position.coords.longitude.toFixed(6);
                coordinatesElement.textContent = `Lat: ${latitude}, Lon: ${longitude}`;
                latitudeInput.value = latitude;
                longitudeInput.value = longitude;
            },
            (error) => {
                console.error('Error getting location:', error.message);
                coordinatesElement.textContent = 'Unable to detect location';
            }
        );
    } else {
        coordinatesElement.textContent = 'Geolocation not supported';
    }

    // Handle form submission for image upload
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = cameraInput.files[0];
        const siteName = sitenameInput.value.trim();
        const customFilename = document.getElementById('customFilename').value.trim();
        const widthInches = parseFloat(document.getElementById('width').value.trim());
        const heightInches = parseFloat(document.getElementById('height').value.trim());
        const dpi = parseInt(document.getElementById('dpi').value.trim());

        if (!file || !siteName || !customFilename || !widthInches || !heightInches || !dpi) {
            alert('Please fill out all fields and select an image.');
            return;
        }

        if (!latitude || !longitude) {
            alert('Location not detected. Please allow location access.');
            return;
        }

        const widthPixels = Math.round(widthInches * dpi);
        const heightPixels = Math.round(heightInches * dpi);
        const finalFilename = `${siteName}-${customFilename}-${latitude}_${longitude}`;

        try {
            statusElement.textContent = 'Resizing image...';
            const resizedImageBlob = await resizeImage(file, widthPixels, heightPixels);

            await displayPreview(resizedImageBlob);

            statusElement.textContent = 'Uploading image...';
            const result = await uploadImage(resizedImageBlob, finalFilename);

            statusElement.innerHTML = `Uploaded successfully!`;
        } catch (error) {
            console.error('Error occurred during upload:', error.message);
            statusElement.textContent = `Error: ${error.message}`;
        }
    });

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
            canvas.toBlob(resolve, 'image/jpeg', 0.8);
        });
    }

    async function uploadImage(fileBlob, filename) {
        const formData = new FormData();
        formData.append('file', fileBlob, `${filename}.jpg`);

        const API_URL = 'https://backblaze.onrender.com'; // Replace with your actual backend URL
        const response = await fetch(`${API_URL}/upload-and-email`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        return response.json();
    }

    generateMapButton.addEventListener('click', () => {
        const mapLatitude = parseFloat(latitudeInput.value);
        const mapLongitude = parseFloat(longitudeInput.value);
        const mapZoom = parseInt(document.getElementById('zoom').value, 10);

        if (isNaN(mapLatitude) || isNaN(mapLongitude) || isNaN(mapZoom)) {
            alert('Please enter valid latitude, longitude, and zoom level.');
            return;
        }

        if (map) {
            map.remove();
        }

        map = L.map(mapContainer).setView([mapLatitude, mapLongitude], mapZoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        L.marker([mapLatitude, mapLongitude]).addTo(map).bindPopup('Selected Location').openPopup();
        mapStatusElement.textContent = 'Map generated successfully!';

        map.on('zoomend', () => {
            const currentZoom = map.getZoom();
            document.getElementById('zoom').value = currentZoom;
        });
    });

    saveMapButton.addEventListener('click', async () => {
        if (!map) {
            alert('Please generate the map first.');
            return;
        }

        try {
            await new Promise((resolve, reject) => {
                const tiles = mapContainer.querySelectorAll('.leaflet-tile');
                let loadedCount = 0;
                tiles.forEach((tile) => {
                    if (tile.complete) {
                        loadedCount++;
                    } else {
                        tile.addEventListener('load', () => {
                            loadedCount++;
                            if (loadedCount === tiles.length) resolve();
                        });
                        tile.addEventListener('error', () => reject(new Error('Failed to load some map tiles')));
                    }
                });
                if (loadedCount === tiles.length) resolve();
            });

            const canvas = await html2canvas(mapContainer, { useCORS: true });
            const mapBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));

            const siteName = sitenameInput.value.trim();
            const finalFilename = `map-${siteName}-${latitude}_${longitude}`;

            mapStatusElement.textContent = 'Uploading map image...';
            const result = await uploadImage(mapBlob, finalFilename);

            mapStatusElement.innerHTML = `Map image uploaded and emailed successfully!`;
        } catch (error) {
            console.error('Error saving the map image:', error.message);
            mapStatusElement.textContent = 'Error saving the map image.';
        }
    });
});
