const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const {createGroup, addToGroup, deleteGroup, deleteUserFromGroup, getGroupMembers, getGroups} = require('./models/groupsmgr');
const { getUsers, addUser, deleteUser } = require('./models/usersmgr')
const { generateKeyPair } = require('crypto');
const Store = require('electron-store');
import { initializeApp } from 'firebase/app';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7j3xTX6PImvheI_SQ5Owy8sQKcQbmhfM",
  authDomain: "filecrypto-a1ea0.firebaseapp.com",
  projectId: "filecrypto-a1ea0",
  storageBucket: "filecrypto-a1ea0.appspot.com",
  messagingSenderId: "669336357853",
  appId: "1:669336357853:web:a016ef6469452b930e8434"
};

const fb = initializeApp(firebaseConfig);


const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
    },
  });

  ipcMain.on('create-group', (event, group_name) => {
    console.log("Creating group: " + group_name + "");
    createGroup(group_name);
  });

  ipcMain.handle('get-groups', async (event) => {
      try {
        const groups = await getGroups();
        return groups;
      } catch (err) {
        console.error(err);
      }
  });

  ipcMain.on('add-to-group', (event, user_id, group_id) => {
    console.log("Adding user: " + user_id + " to group: " + group_id);
    addToGroup(user_id, group_id);
  })

  ipcMain.on('add-user', (event, username, public_key) => {
      console.log('Adding user: ' + username + " with public key " + public_key);
      addUser(username, public_key); 
  })

  ipcMain.on('delete-user', (event, user_id) => {
    console.log('Deleting user: ' + user_id);
    deleteUser(user_id);
  });

  ipcMain.handle('get-users', async (event) => {
      try {
        const users = await getUsers();
        return users;
      } catch (err) {
        console.error(err);
      }
  });

  win.loadFile('./renderers/index.html');
};

app.whenReady().then(() => {
  createWindow();

  const store = new Store();

  if (store.get('private_key') == undefined) {
    generateKeyPair('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: 'top secret'
      }
    }, (err, publicKey, privateKey) => {
      store.set('public_key', publicKey);
      store.set('private_key', privateKey);

      console.log("Public key: " + publicKey);
      console.log("Private key: " + privateKey);

      addUser("You", publicKey);
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});