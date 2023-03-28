addEventListener("DOMContentLoaded", async (event) => {
    console.log("Getting users...")
    const users = await window.usersAPI.getUsers();
    console.log("users: " + users)
    const user_select = document.querySelector('#person_to_delete');
    for (let i = 0; i < users.length; i++) {
        user_select.appendChild(new Option(users[i].UserName, users[i].UserID));
    }

});

document.querySelector('form').addEventListener('submit', () => {
    const user_id = document.querySelector('#person_to_delete').value;
    console.log('Deleting user: ' + user_id + '')
    window.usersAPI.deleteUser(user_id);
});