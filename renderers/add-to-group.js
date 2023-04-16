addEventListener("DOMContentLoaded", async (event) => {
    console.log('Getting groups...')
    const groups = await window.groupsAPI.getGroupsForUser();
    const group_select = document.querySelector('#group');
    for (let i = 0; i < groups.length; i++) {
        console.log("Adding group: " + groups[i].name + " with id: " + groups[i].id)
        group_select.appendChild(new Option(groups[i].name, groups[i].id));
    }

});

document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const selector = document.querySelector('#group');
    const group_name = selector.options[selector.selectedIndex].value;
    console.log('Group name: ' + group_name)

    const email = document.querySelector('#email').value;

    const add_to_existing_files = document.querySelector('#add-to-existing-files').checked;
    
    console.log('Adding user: ' + email + ' to group: ' + group_name + '')
    window.groupsAPI.addToGroup(email, group_name, add_to_existing_files);
})