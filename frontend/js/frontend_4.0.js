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
        console.log("User already logged in, showing app content...");
        displayAppContent();
    }

    // Handle login form submission
    function handleLogin(event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        console.log("Attempting login with username:", username);

        if (username === fixedUsername && password === fixedPassword) {
            console.log("Login successful!");
            sessionStorage.setItem("loggedIn", "true");
            sessionStorage.setItem("username", username);
            displayAppContent();
        } else {
            console.error("Invalid credentials provided.");
            const errorMessage = document.getElementById('error-message');
            errorMessage.textContent = 'Invalid credentials. Please try again.';
            errorMessage.style.display = 'block';
        }
    }

    // Display login form
    function displayLoginForm() {
        document.body.innerHTML = `
            <div id="login-container">
                <h2>Login</h2>
                <form id="login-form">
                    <label for="username">Username:</label>
                    <input type="text" id="username" required />
                    <br />
                    <label for="password">Password:</label>
                    <input type="password" id="password" required />
                    <br />
                    <button type="submit">Login</button>
                </form>
                <p id="error-message" style="color: red; display: none;">Invalid credentials. Please try again.</p>
            </div>
        `;

        document.getElementById('login-form').addEventListener('submit', handleLogin);
    }

    // Display the app content
    function displayAppContent() {
        document.body.innerHTML = `
            <header>
                <h1>SnapSync v3.0</h1>
                <p>Capture, Upload, and Map Your Snapshots</p>
                <button id="logout-button" style="float: right;">Logout</button>
            </header>
            <section>
                <h2>Take a Picture and Upload</h2>
                <form id="uploadForm">
                    <label for="cameraInput">Take a Picture:</label>
                    <input type="file" id="cameraInput" accept="image/*" capture="environment" required />
                    <label for="sitename">Site Name:</label>
                    <input type="text" id="sitename" placeholder="Enter site name" required />
                    <label for="customFilename">Custom Filename:</label>
                    <input type="text" id="customFilename" placeholder="Enter a custom filename" required />
                    <label for="width">Width (inches):</label>
                    <input type="number" id="width" placeholder="e.g., 3.4" step="0.1" value="3.4" required />
                    <label for="height">Height (inches):</label>
                    <input type="number" id="height" placeholder="e.g., 3.4" step="0.1" value="3.4" required />
                    <label for="dpi">DPI (dots per inch):</label>
                    <input type="number" id="dpi" placeholder="e.g., 72 or 300" value="72" required />
                    <button type="submit">Upload Image</button>
                </form>
                <canvas id="previewCanvas" hidden></canvas>
                <p id="status"></p>
            </section>
            <section>
                <h2>Generate Map and Save as Image</h2>
                <div>
                    <label for="latitude">Latitude:</label>
                    <input type="number" id="latitude" placeholder="Detecting latitude..." required>
                    <label for="longitude">Longitude:</label>
                    <input type="number" id="longitude" placeholder="Detecting longitude..." required>
                    <label for="zoom">Zoom Level:</label>
                    <input type="number" id="zoom" placeholder="Enter zoom level" value="12" required>
                    <button id="generateMap">Generate Map</button>
                    <button id="saveMap">Save Map as Image</button>
                </div>
                <div id="mapContainer"></div>
                <p id="mapStatus"></p>
            </section>
        `;

        document.getElementById('logout-button').addEventListener('click', handleLogout);
        initializeAppFeatures(); // Initialize app-specific features
    }

    // Logout function
    function handleLogout() {
        console.log("User logged out.");
        sessionStorage.clear();
        alert("Logged out successfully!");
        displayLoginForm();
    }

    // Initialize app-specific features
    function initializeAppFeatures() {
        console.log("Initializing app features...");
        const cameraInput = document.getElementById('cameraInput');
        const uploadForm = document.getElementById('uploadForm');
        const statusElement = document.getElementById('status');
        const mapContainer = document.getElementById('mapContainer');
        const mapStatusElement = document.getElementById('mapStatus');

        // Example: Add functionality for upload and map generation
        uploadForm.addEventListener('submit', (event) => {
            event.preventDefault();
            console.log("Uploading image...");
            // Implement upload logic here
            statusElement.textContent = "Image uploaded successfully!";
        });

        document.getElementById('generateMap').addEventListener('click', () => {
            console.log("Generating map...");
            // Implement map generation logic here
            mapStatusElement.textContent = "Map generated successfully!";
        });

        document.getElementById('saveMap').addEventListener('click', () => {
            console.log("Saving map...");
            // Implement map saving logic here
            mapStatusElement.textContent = "Map saved successfully!";
        });
    }
});

