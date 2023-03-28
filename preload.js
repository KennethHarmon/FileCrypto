const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('groupsAPI', {
    createGroup: (group_name) => ipcRenderer.send('create-group', group_name),
    getGroups: () => ipcRenderer.invoke('get-groups'),
    addToGroup: (user_id, group_id) => ipcRenderer.send('add-to-group', user_id, group_id)
})

contextBridge.exposeInMainWorld('usersAPI', {
    getUsers: () => ipcRenderer.invoke('get-users'),
    addUser: (username, public_key) => ipcRenderer.send('add-user', username, public_key),
    deleteUser: (user_id) => ipcRenderer.send('delete-user', user_id)
})