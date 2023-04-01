addEventListener("DOMContentLoaded", async (event) => {
    console.log('Getting groups...')
    const groups = await window.groupsAPI.getGroupsForUser();
    const group_select = document.querySelector('#group');
    for (let i = 0; i < groups.length; i++) {
        console.log("Adding group: " + groups[i].name + " with id: " + groups[i].id)
        group_select.appendChild(new Option(groups[i].name, groups[i].id));
    }
});

document.querySelector('form').addEventListener('submit', async (event) => {

    event.preventDefault();

    const selector = document.querySelector('#group');
    const group_name = selector.options[selector.selectedIndex].value;

    console.log('Group name: ' + group_name)
    const file = document.getElementById("file_input").files[0];
    const file_path = file.path;
    console.log('File path: ' + file_path);

    await window.encryptAPI.encryptFile(file_path, group_name);
});