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
                    <h2 style="margin-bottom: 1.5rem; color: #333;">Login</h2>
                    <form id="login-form" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div>
                            <label for="username" style="display: block; text-align: left; margin-bottom: 0.5rem;">Username:</label>
                            <input type="text" id="username" required style="
                                width: 100%;
                                padding: 0.5rem;
                                border: 1px solid #ccc;
                                border-radius: 4px;
                                font-size: 1rem;">
                        </div>
                        <div>
                            <label for="password" style="display: block; text-align: left; margin-bottom: 0.5rem;">Password:</label>
                            <input type="password" id="password" required style="
                                width: 100%;
                                padding: 0.5rem;
                                border: 1px solid #ccc;
                                border-radius: 4px;
                                font-size: 1rem;">
                        </div>
                        <button type="submit" style="
                            padding: 0.75rem;
                            background-color: #007bff;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            font-size: 1rem;
                            cursor: pointer;">
                            Login
                        </button>
                    </form>
                    <p id="error-message" style="color: red; margin-top: 1rem; display: none;">Invalid credentials. Please try again.</p>
                </div>
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
        `;
        document.getElementById('logout-button').addEventListener('click', handleLogout);
        initializeAppFeatures();
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

        // Add more logic for upload and app-specific features hereconst mapContainer = document.getElementById('mapContainer');
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

   