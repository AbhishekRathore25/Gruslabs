document.addEventListener('DOMContentLoaded', function () {
    const userTableBody = document.getElementById('userTableBody');
    const userForm = document.getElementById('userForm');
    const userModal = document.getElementById('userModal');
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userMobileInput = document.getElementById('userMobile');
    const userStatusInput = document.getElementById('userStatus');

    const userDetailsModal = document.getElementById('userDetailsModal');
    const detailUserName = document.getElementById('detailUserName');
    const detailUserEmail = document.getElementById('detailUserEmail');
    const detailUserMobile = document.getElementById('detailUserMobile');
    const detailUserStatus = document.getElementById('detailUserStatus');

    let editIndex = null;

    // Load users from localStorage
    function loadUsers() {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        userTableBody.innerHTML = '';
        users.forEach((user, index) => {
            userTableBody.innerHTML += `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.mobile}</td>
                    <td><span class="badge badge-${user.status === 'active' ? 'success' : 'danger'}">${user.status}</span></td>
                    <td>
                        <button type="button" class="btn  btn-primary" onclick="viewUser(${index})">View</button>
                        <button class="btn btn-danger" onclick="deleteUser(${index})">Delete</button>
                    </td>
                </tr>
            `;
        });
    }

    // Save new user or edit existing user
    userForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = userNameInput.value;
        const email = userEmailInput.value;
        const mobile = userMobileInput.value;
        const status = userStatusInput.value;

        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (editIndex === null) {
            users.push({ name, email, mobile, status });
        } else {
            users[editIndex] = { name, email, mobile, status };
            editIndex = null;
        }
        localStorage.setItem('users', JSON.stringify(users));
        loadUsers();
        closeUserModal();
    });

    // View user details
    window.viewUser = function (index) {
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users[index];
        detailUserName.textContent = user.name;
        detailUserEmail.textContent = user.email;
        detailUserMobile.textContent = user.mobile;
        detailUserStatus.textContent = user.status;
        openUserDetailsModal();
    };

    // Delete user
    window.deleteUser = function (index) {
        const confirmation = confirm("Delete this user?");
        if (confirmation) {
            const users = JSON.parse(localStorage.getItem('users'));
            users.splice(index, 1);
            localStorage.setItem('users', JSON.stringify(users));
            loadUsers();
        }
    };
    window.logout = function() {
        
        localStorage.removeItem('users');
        alert('You have been logged out.');
        // Redirect to login page if necessary
        window.location.href = '/LoginPageSF-main/login.html'; 
    };
    // Open user modal
    window.openUserModal = function () {
        userModal.style.display = 'block';
    };

    // Close user modal
    window.closeUserModal = function () {
        userModal.style.display = 'none';
        userForm.reset();
    };

    // Open user details modal
    window.openUserDetailsModal = function () {
        userDetailsModal.style.display = 'block';
    };

    // Close user details modal
    window.closeUserDetailsModal = function () {
        userDetailsModal.style.display = 'none';
    };

    // Initialize table
    loadUsers();
});
