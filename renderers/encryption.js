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

    const encrypt_selector = document.getElementById('encrypt_choice');
    const choice = encrypt_selector.options[encrypt_selector.selectedIndex].value;
    console.log('Choice: ' + choice);

    if (choice == 'encrypt') {
        console.log('Encrypting file...')
        const encyptedFilePath = await window.encryptAPI.encryptFile(file_path, group_name);
        const info = document.getElementById("info");
        info.innerHTML = "Encrypted file saved to: " + encyptedFilePath;
    }
    else if (choice == 'decrypt') {
        console.log('Decrypting file...')
        const decryptedFilePath = await window.encryptAPI.decryptFile(file_path, group_name);
        const info = document.getElementById("info");
        info.innerHTML = "Decrypted file saved to: " + decryptedFilePath;
    }
    else {
        console.log('Invalid choice')
    }
});