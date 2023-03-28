const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('groupsAPI', {
    createGroup: (group_name) => ipcRenderer.send('create-group', group_name),
    getGroups: () => ipcRenderer.invoke('get-groups')
})

contextBridge.exposeInMainWorld('usersAPI', {
    getUsers: () => ipcRenderer.invoke('get-users'),
    addUser: (username, public_key) => ipcRenderer.send('add-user'),
    deleteUser: (user_id) => ipcRenderer.invoke('delete-user')
})