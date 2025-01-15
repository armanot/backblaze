document.addEventListener('DOMContentLoaded', () => {
    const userList = document.getElementById('userList');
    const addUserForm = document.getElementById('addUserForm');
    const status = document.getElementById('status');

    // Utility function to update the status message
    function updateStatus(message, isError = false) {
        status.textContent = message;
        status.style.color = isError ? 'red' : 'green';
        setTimeout(() => {
            status.textContent = ''; // Clear the status message after 5 seconds
        }, 5000);
    }

    // Fetch and display users
    async function fetchUsers() {
        try {
            const response = await fetch('/users');
            const users = await response.json();
            userList.innerHTML = '';
            users.forEach(user => {
                const li = document.createElement('li');
                li.textContent = `${user.username}`;
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.onclick = () => deleteUser(user.id);
                li.appendChild(deleteButton);
                userList.appendChild(li);
            });
            updateStatus('User list updated');
        } catch (err) {
            console.error('Error fetching users:', err);
            updateStatus('Failed to fetch user list', true);
        }
    }

    // Add a new user
    addUserForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                updateStatus('User added successfully');
                fetchUsers();
                addUserForm.reset();
            } else {
                const errorData = await response.json();
                updateStatus(`Error: ${errorData.error}`, true);
            }
        } catch (err) {
            console.error('Error adding user:', err);
            updateStatus('Failed to add user', true);
        }
    });

    // Delete a user
    async function deleteUser(userId) {
        try {
            const response = await fetch(`/admin/users/${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                updateStatus('User deleted successfully');
                fetchUsers();
            } else {
                const errorData = await response.json();
                updateStatus(`Error: ${errorData.error}`, true);
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            updateStatus('Failed to delete user', true);
        }
    }

    // Initialize the admin page
    fetchUsers();
});
