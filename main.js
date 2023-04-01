const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { createGroup, addToGroup, getGroupsForUser, getGroupMembers } = require('./models/firegroupsmgr');
const { createUser, getUsers, getUserByEmail } = require('./models/fireusersmgr');
const { initializeApp } = require('firebase/app');
const { getFirestore } =  require("firebase/firestore");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } = require("firebase/auth");


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
const auth = getAuth();
const db = getFirestore(fb);
let user_id = null;

const registerGroupFunctions = () => {
  ipcMain.on('create-group', async (event, group_name) => {
      console.log("Creating group: " + group_name + "");
      const group_id = await createGroup(db, group_name);
      await addToGroup(db, user_id, group_id);
  });

  ipcMain.handle('get-groups-for-user', async (event) => {
      try {
        console.log('Getting groups for user..')
        const groups = await getGroupsForUser(db, user_id);
        return groups;
      } catch (err) {
        console.error(err);
      }
  });

  ipcMain.on('add-to-group', async (event, email, group_id) => {
    const adding_user_id = await getUserByEmail(db, email);
    console.log("Adding user: " + adding_user_id + " to group: " + group_id);
    addToGroup(db, adding_user_id, group_id);
  })
}

const registerUserFunctions = () => {
  ipcMain.handle('sign-in', (event, email, password) => {
    console.log('Signing in')
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log('User signed in')
      const user = userCredential.user;
      return true;
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      return errorMessage;
    });
  })

  ipcMain.handle('sign-up', (event, email, password) => {
    console.log('Signing up');
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log('User created');
      const user = userCredential.user;
      return true;
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode);
      console.log(errorMessage);
      return errorMessage;
    });
  });

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
}

const registerEncryptionFunctions = () => {
  ipcMain.handle('encrypt-file', async (event, file_path, group) => {
    console.log('Encrypting file: ' + file_path + " with public key " + group);
    //Generate a passphrase for the file, and an iv for the encryption
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const algorithm = 'aes-256-cbc';

    //Encrypt the file with the passphrase and iv
    const fileStream = fs.createReadStream(file_path);
    const encryptedFileStream = fs.createWriteStream(file_path + '.enc');
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    fileStream.pipe(cipher).pipe(encryptedFileStream);

    encryptedFileStream.on('finish', async () => {
      console.log('File encryption complete!');
      encryptedFileStream.close();
      //Get the public keys for each user in the group
      const group_members = await getGroupMembers(db, group);

      

      //Encrypt the passphrase with the public key

      //Encrypt the iv with the public key

      //Return the encrypted file, encrypted passphrase, and encrypted iv

      //Repeat for each user in the group
    });
  });
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
    },
  });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const uid = user.uid;
      console.log('User is signed in')
      console.log(uid);
      user_id = await getUserByEmail(db, user.email);
      if (user_id == null) {
        console.log('User not found in database');
        await createUser(db, uid, user.email);
      }
      win.loadFile('./renderers/index.html');
    } else {
      console.log('User is signed out')
      win.loadFile('./renderers/login.html');
      user_id = null;
    }
  });
};

app.whenReady().then(() => {
  registerGroupFunctions();
  registerUserFunctions();
  registerEncryptionFunctions();
  createWindow();

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