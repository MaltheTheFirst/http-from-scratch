const usernameInput = document.getElementById('username');
const createUserForm = document.getElementById('create-user-form');

const userIdInput = document.getElementById('user-id');
const findUserForm = document.getElementById('find-user-form');

const loadUsersButton = document.getElementById('load-users');
const usersList = document.getElementById('users-list');

const loadNotesButton = document.getElementById('load-notes');
const notesList = document.getElementById('notes-list');

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
        await loadUsers();  
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
    await loadUsers();
});

loadNotesButton.addEventListener('click', async () => {
    await loadNotes();
});

async function loadUsers() {
    usersList.innerHTML = '';
    const loadingItem = document.createElement('li');
    loadingItem.textContent = 'Loading...';
    usersList.appendChild(loadingItem);

    try {
        const response = await fetch("/users");

        if (!response.ok) {
            usersList.innerHTML = '';
            const li = document.createElement('li');
            li.textContent = `Error: ${response.status} ${response.statusText}`;
            usersList.appendChild(li);
            return;
        }
    
        const users = await response.json();
    
        usersList.innerHTML = '';

        if (users.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No users found';
            usersList.appendChild(li);
            return;
        }

        for (let i = 0; i < users.length; i++) {
            const user = users[i];

            const li = document.createElement('li');
            li.textContent = `ID: ${user.id}, Username: ${user.username}`;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';

            deleteButton.addEventListener('click', async () => {
                const response = await fetch(`/users/${user.id}`, {
                    method: "DELETE"
                });

                const data = await response.json();

                if (response.ok) {
                    result.textContent = `User deleted: ID ${data.id}, Username: ${data.username}`;
                    await loadUsers();
                } else {
                    result.textContent = `Error: ${data.error}`;
                }
            });

            li.appendChild(deleteButton);

            usersList.appendChild(li);
        }    
    } catch  (error) {
        usersList.innerHTML = '';
        const li = document.createElement('li');
        li.textContent = `Error: ${error.message}`;
        usersList.appendChild(li);
    }
}

async function loadNotes() {
    notesList.innerHTML = '';
    const loadingItem = document.createElement('li');
    loadingItem.textContent = 'Loading...';
    notesList.appendChild(loadingItem);

    try {
        const response = await fetch("/notes");

        if (!response.ok) {
            notesList.innerHTML = '';
            const li = document.createElement('li');
            li.textContent = `Error: ${response.status} ${response.statusText}`;
            notesList.appendChild(li);
            return;
        }
    
        const notes = await response.json();
    
        notesList.innerHTML = '';

        if (notes.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No notes found';
            notesList.appendChild(li);
            return;
        }

        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];

            const li = document.createElement('li');
            li.textContent = `ID: ${note.id}, Username: ${note.username}, Notes: ${note.content}`;

            notesList.appendChild(li);
        }    
    } catch  (error) {
        notesList.innerHTML = '';
        const li = document.createElement('li');
        li.textContent = `Error: ${error.message}`;
        notesList.appendChild(li);
    }
}