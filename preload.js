const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('authAPI', {
    signUp: (email, password) => ipcRenderer.invoke('sign-up', email, password),
    signIn: (email, password) => ipcRenderer.invoke('sign-in', email, password),
    signOut: () => ipcRenderer.invoke('sign-out')
});

contextBridge.exposeInMainWorld('groupsAPI', {
    createGroup: (group_name) => ipcRenderer.send('create-group', group_name),
    getGroupsForUser: () => ipcRenderer.invoke('get-groups-for-user'),
    addToGroup: (email, group_id, add_to_existing_files) => ipcRenderer.send('add-to-group', email, group_id, add_to_existing_files)
})

contextBridge.exposeInMainWorld('usersAPI', {
    getUsers: () => ipcRenderer.invoke('get-users'),
    addUser: (username, public_key) => ipcRenderer.send('add-user', username, public_key),
    deleteUser: (user_id) => ipcRenderer.send('delete-user', user_id)
})

contextBridge.exposeInMainWorld('encryptAPI', {
    encryptFile: (file_path, group) => ipcRenderer.invoke('encrypt-file', file_path, group),
    decryptFile: (file_path, group) => ipcRenderer.invoke('decrypt-file', file_path, group)
})
