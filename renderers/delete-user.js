addEventListener("DOMContentLoaded", async (event) => {
    console.log("Getting users...")
    const users = await window.usersAPI.getUsers();
    console.log("users: " + users)
    const user_select = document.querySelector('#person_to_delete');
    for (let i = 0; i < users.length; i++) {
        console.log("Adding user: " + users[i].UserName + " with id: " + users[i].rowid)
        user_select.appendChild(new Option(users[i].UserName, users[i].rowid));
    }

});

document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const selector = document.querySelector('#person_to_delete');
    const user_id = selector.options[selector.selectedIndex].value;
    console.log('Deleting user: ' + user_id + '');
    window.usersAPI.deleteUser(user_id);
});