document.addEventListener('DOMContentLoaded', () => {
    const userList = document.getElementById('userList');
    const addUserForm = document.getElementById('addUserForm');

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
        } catch (err) {
            console.error('Error fetching users:', err);
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
                alert('User added successfully');
                fetchUsers();
                addUserForm.reset();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error}`);
            }
        } catch (err) {
            console.error('Error adding user:', err);
        }
    });

    // Delete a user
    async function deleteUser(userId) {
        try {
            const response = await fetch(`/admin/users/${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('User deleted successfully');
                fetchUsers();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error}`);
            }
        } catch (err) {
            console.error('Error deleting user:', err);
        }
    }

    // Initialize the admin page
    fetchUsers();
});
