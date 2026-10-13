const usernameInput = document.getElementById('username');
const createUserForm = document.getElementById('create-user-form');

const userIdInput = document.getElementById('user-id');
const findUserForm = document.getElementById('find-user-form');

const loadUsersButton = document.getElementById('load-users');
const usersList = document.getElementById('users-list');

const result = document.getElementById('result');

createUserForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = usernameInput.value;

    const response = await fetch("/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({ username })
    })

    const data = await response.json();
    if (response.ok) {
        result.textContent = `User created: ID ${data.id}, Username: ${data.username}`;
    } else {
        result.textContent = `Error: ${data.error}`;
    }
})

findUserForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const userId = userIdInput.value;

    const response = await fetch(`/users/${userId}`);

    const data = await response.json();
    if (response.ok) {
        result.textContent = `User found: ID ${data.id}, Username: ${data.username}`;
    } else {
        result.textContent = `Error: ${data.error}`;
    }
})

loadUsersButton.addEventListener('click', async () => {
    const response = await fetch("/users");
    const users = await response.json();

    usersList.innerHTML = '';

    for (let i = 0; i < users.length; i++) {
        const user = users[i];

        const li = document.createElement('li');
        li.textContent = `ID: ${user.id}, Username: ${user.username}`;
        usersList.appendChild(li);
    }
});