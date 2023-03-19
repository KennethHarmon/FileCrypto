const { contextBridge, ipcRenderer } = require('electron')
const { addUser, getUser } = require('./models/usersmgr')
const { getGroups, createGroup, addToGroup, getGroupMembers, deleteGroup, deleteUserFromGroup } = require('./models/groupsmgr')

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    addUser: addUser,
    getUser: getUser,
    getGroups: getGroups,
    createGroup: createGroup,
    addToGroup: addToGroup,
    getGroupMembers: getGroupMembers,
    deleteGroup: deleteGroup,
    deleteUserFromGroup: deleteUserFromGroup
  // we can also expose variables, not just functions
})