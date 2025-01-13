document.addEventListener('DOMContentLoaded', () => {
    console.log("SnapSync: Application initializing...");
    document.title = 'SnapSync';

    // Fixed login credentials
    const fixedUsername = "snapuser";
    const fixedPassword = "snappass";

    // Check if user is logged in
    const loggedIn = sessionStorage.getItem("loggedIn");
    console.log("Login status:", loggedIn);

    if (loggedIn !== "true") {
        console.log("User not logged in, showing login form...");
        displayLoginForm();
    } else {
        console.log("User already logged in, initializing app...");
        initializeAppFeatures(); // Initialize app-specific features
    }

    // Handle login form submission
    function handleLogin(event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === fixedUsername && password === fixedPassword) {
            sessionStorage.setItem("loggedIn", "true");
            sessionStorage.setItem("username", username);
            window.location.reload(); // Reload the page to initialize the app
        } else {
            const errorMessage = document.getElementById('error-message');
            errorMessage.textContent = 'Invalid credentials. Please try again.';
            errorMessage.style.display = 'block';
        }
    }

    // Display login form
    function displayLoginForm() {
        document.body.innerHTML = `
            <div id="login-container" style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background-color: #f4f4f9;
                font-family: Arial, sans-serif;">
                <div style="
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    max-width: 400px;
                    width: 100%;">
                    <h2>Login</h2>
                    <form id="login-form">
                        <label for="username">Username:</label>
                        <input type="text" id="username" required />
                        <label for="password">Password:</label>
                        <input type="password" id="password" required />
                        <button type="submit">Login</button>
                    </form>
                    <p id="error-message" style="color: red; margin-top: 1rem; display: none;">Invalid credentials. Please try again.</p>
                </div>
            </div>
        `;

        document.getElementById('login-form').addEventListener('submit', handleLogin);
    }

    // Initialize app-specific features
    function initializeAppFeatures() {
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

                statusElement.textContent = 'Uploading image...';
                await uploadImage(resizedImageBlob, finalFilename);

                statusElement.textContent = 'Uploaded successfully!';
            } catch (error) {
                statusElement.textContent = `Error: ${error.message}`;
            }
        });

        // Function to resize the image
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

        // Function to upload the image
        async function uploadImage(fileBlob, filename) {
            const formData = new FormData();
            formData.append('file', fileBlob, `${filename}.jpg`);

            const API_URL = 'https://backblaze.onrender.com';
            const response = await fetch(`${API_URL}/upload-and-email`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            return response.json();
        }

        // Generate Map
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
        });

        // Save Map
        saveMapButton.addEventListener('click', async () => {
            if (!map) {
                alert('Please generate the map first.');
                return;
            }

            try {
                const canvas = await html2canvas(mapContainer, { useCORS: true });
                const mapBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));

                const siteName = sitenameInput.value.trim();
                const finalFilename = `map-${siteName}-${latitude}_${longitude}`;

                mapStatusElement.textContent = 'Uploading map image...';
                await uploadImage(mapBlob, finalFilename);

                mapStatusElement.textContent = 'Map image uploaded successfully!';
            } catch (error) {
                mapStatusElement.textContent = 'Error saving the map image.';
            }
        });
    }
});
