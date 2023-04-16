const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { encryptFile, decryptFile, reEncryptFiles, removeFileAccess } = require('./models/fireencryptionmanager');
const { createGroup, addToGroup, getGroupsForUser} = require('./models/firegroupsmgr');
const { createUser, getUserByEmail } = require('./models/fireusersmgr');
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

  ipcMain.on('add-to-group', async (event, email, group_id, add_to_existing_files) => {
    const adding_user_id = await getUserByEmail(db, email);
    console.log("Adding user: " + adding_user_id + " to group: " + group_id);
    addToGroup(db, adding_user_id, group_id);

    if (add_to_existing_files) {
      reEncryptFiles(db, group_id, current_user_id);
    }
  })

  ipcMain.handle('remove-from-group', async (event, group_id, email, revmove_file_access) => {
    const removing_user_id = await getUserByEmail(db, email);
    console.log("Removing user: " + removing_user_id + " from group: " + group_id);
    removeFromGroup(db, removing_user_id, group_id);

    if (revmove_file_access) {
      removeFileAccess(db, group_id, removing_user_id);
    }
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

  ipcMain.handle('sign-out', async (event) => {
    console.log('Signing out');
    auth.signOut();
  });
}

const registerEncryptionFunctions = () => {
  ipcMain.handle('encrypt-file', async (event, file_path, group) => {
    const encrypted_file_path = await encryptFile(db, file_path, group);
    return encrypted_file_path;
  });

  ipcMain.handle('decrypt-file', async (event, file_path) => {
    const new_file_path = await decryptFile(db, file_path, current_user_id);
    return new_file_path;
  });
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Secure File Sharing',
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