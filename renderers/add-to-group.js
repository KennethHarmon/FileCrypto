addEventListener("DOMContentLoaded", async (event) => {
    console.log('Getting groups...')
    const groups = await window.groupsAPI.getGroups();
    const group_select = document.querySelector('#group');
    for (let i = 0; i < groups.length; i++) {
        console.log("Adding group: " + groups[i].GroupName + " with id: " + groups[i].rowid)
        group_select.appendChild(new Option(groups[i].GroupName, groups[i].rowid));
    }

    console.log("Getting users...")
    const users = await window.usersAPI.getUsers();
    console.log("users: " + users)
    const user_select = document.querySelector('#person_to_add');
    for (let i = 0; i < users.length; i++) {
        user_select.appendChild(new Option(users[i].UserName, users[i].rowid));
    }

});

document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const selector = document.querySelector('#group');
    const group_name = selector.options[selector.selectedIndex].value;

    console.log('Group name: ' + group_name)

    const selector2 = document.querySelector('#person_to_add');
    const user_id = selector2.options[selector2.selectedIndex].value;

    console.log('User id: ' + user_id)

    console.log('Adding user: ' + user_id + ' to group: ' + group_name + '')
    window.groupsAPI.addToGroup(user_id, group_name);
})