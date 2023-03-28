addEventListener("DOMContentLoaded", async (event) => {
    console.log('Getting groups...')
    const group_names = await window.groupsAPI.getGroups();
    const group_select = document.querySelector('#group');
    for (group_name of group_names) {
        group_select.appendChild(new Option(group_name, group_name));
    }

    console.log("Getting users...")
    const users = await window.usersAPI.getUsers();
    console.log("users: " + users)
    const user_select = document.querySelector('#person_to_add');
    for (let i = 0; i < users.length; i++) {
        user_select.appendChild(new Option(users[i].UserName, users[i].UserID));
    }

});

document.querySelector('form').addEventListener('submit', () => {

})