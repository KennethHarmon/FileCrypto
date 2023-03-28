document.querySelector('form').addEventListener('submit', () => {
    const group_name = document.querySelector('#group_name').value;
    console.log('Creating group: ' + group_name + '')
    window.groupsAPI.createGroup(group_name);
});