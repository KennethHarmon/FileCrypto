const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const Store = require('electron-store');
const { v4: uuidv4 } = require('uuid');
const { saveKeys, getKeys } = require('./models/fireencryptionmanager');
const { createGroup, addToGroup, getGroupsForUser, getGroupMembers, getPublicKeys } = require('./models/firegroupsmgr');
const { createUser, getUsers, getUserByEmail } = require('./models/fireusersmgr');
const { initializeApp } = require('firebase/app');
const { getFirestore } =  require("firebase/firestore");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } = require("firebase/auth");


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
let current_user_id = null;

const registerGroupFunctions = () => {
  ipcMain.on('create-group', async (event, group_name) => {
      console.log("Creating group: " + group_name + "");
      const group_id = await createGroup(db, group_name);
      await addToGroup(db, current_user_id, group_id);
  });

  ipcMain.handle('get-groups-for-user', async (event) => {
      try {
        console.log('Getting groups for user..')
        const groups = await getGroupsForUser(db, current_user_id);
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

  ipcMain.handle('sign-up', async (event, email, password) => {
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

  ipcMain.on('add-user', (event, username, public_key, add_to_existing_files) => {
    //Add the user to the group
    console.log('Adding user: ' + username + " with public key " + public_key);
    addUser(username, public_key); 

    if (add_to_existing_files) {
      //Get each file for the group

      //For each file:
      //Decrypt the passphrase and iv for that file
      //Re-encrypt using the added users public key
      //Store the keys
    }
  })

  ipcMain.handle('remove-user', async (event, group_id, user_id) => {
    //Remove user from usergroups

    //Get all files encrypted for the given group

    //For each file, remove the specified users password from the file
  })

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
    console.log('Passphrase: ' + key.toString('base64'));
    console.log('IV: ' + iv.toString('base64'));

    //Encrypt the file with the passphrase and iv
    const fileData = fs.readFileSync(file_path);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encryptedData = cipher.update(fileData);
    encryptedData = Buffer.concat([encryptedData, cipher.final()]);

    //Generate a unique file id
    const file_id = Buffer.from(uuidv4()).toString('base64')
    console.log('File id: ' + file_id);

    //Write the encrypted file to disk
    fs.writeFileSync((file_path + '.enc'), JSON.stringify({
      id: file_id,
      data: encryptedData.toString('base64')
    }));
    console.log('Encrypted Data: ' + encryptedData.toString('base64'));

    console.log('File encryption complete!');
      
    //Get the public keys for each user in the group
    const group_members = await getGroupMembers(db, group);

    const public_keys = await getPublicKeys(db, group_members);

    for (const [user_id, public_key] of Object.entries(public_keys)) {
      console.log('Encrypting passphrase and iv for user: ' + user_id);
      //Encrypt the passphrase and iv with the public key
      const encrypted_key = crypto.publicEncrypt(public_key, key).toString('base64');
      const encrypted_iv = crypto.publicEncrypt(public_key, iv).toString('base64');

      //Save the encrypted passphrase and iv to the database
      await saveKeys(db, file_id,user_id, encrypted_key, encrypted_iv);
    }
    
    //Return the encrypted file
    return file_path + '.enc';

  });

  ipcMain.handle('decrypt-file', async (event, file_path) => {
    console.log('Encrypting file: ' + file_path + " for user " + current_user_id);

    const encryptedFileData = fs.readFileSync(file_path);
    console.log('Encrypted file data: ' + encryptedFileData + '')

    let {id, data} = JSON.parse(encryptedFileData);
    console.log("File id: " + id + "");
    console.log("Data: " + data + "");

    //file_id = Buffer.from(id).toString('base64');
    //data = Buffer.from(data).toString('base64');

    //Check if the user is in group for the given file:
    const keys = await getKeys(db, id, current_user_id);

    if (keys == null) {
      console.log('User is not in group for file');
      return null;
    }
    else {
      console.log('User is in group for file');
      const {encrypted_passphrase, encrypted_iv} = keys;
      //Decrypt the passphrase and iv with the private key
      console.log('encrypted_passphrase: ' + encrypted_passphrase + '')
      console.log('encrypted_iv: ' + encrypted_iv + '')

      const store = new Store();
      const private_key = store.get(`${current_user_id}-private_key`);

      console.log('Private key: ' + private_key + '')
      const passphrase = crypto.privateDecrypt({key: private_key, passphrase: 'suoer duper top secret'}, Buffer.from(encrypted_passphrase, 'base64'));
      const iv = crypto.privateDecrypt({key: private_key, passphrase: 'suoer duper top secret'}, Buffer.from(encrypted_iv, 'base64'));

      console.log('Passphrase: ' + passphrase.toString('base64') + '');
      console.log('IV: ' + iv.toString('base64') + '');

      //Decrypt the file with the passphrase and iv
      const algorithm = 'aes-256-cbc';
      const decipher = crypto.createDecipheriv(algorithm, passphrase, iv);
      let decryptedData = decipher.update(Buffer.from(data, 'base64'));
      decryptedData = Buffer.concat([decryptedData, decipher.final()]);
      console.log('Decrypted Data: ' + decryptedData.toString('base64') + '');
      console.log('Dec encrypted Data: ' + decryptedData.toString('utf8') + '');

      //Write the decrypted file to disk
      const split_path = file_path.split('.');
      split_path.pop();
      split_path[0] = split_path[0] + '-decrypted';
      const new_file_path = split_path.join('.');
      console.log('New file path: ' + new_file_path + '')
      fs.writeFileSync((new_file_path), decryptedData.toString('utf8'));
    }

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
      current_user_id = uid;
      win.loadFile('./renderers/index.html');
    } else {
      console.log('User is signed out')
      win.loadFile('./renderers/login.html');
      current_user_id = null;
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