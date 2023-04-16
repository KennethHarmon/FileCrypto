const {doc, collection, query, where, getDoc, getDocs, setDoc, updateDoc, deleteField} = require('firebase/firestore'); 
const { getGroupMembers, getPublicKeys} = require('./firegroupsmgr');
const crypto = require('crypto');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Store = require('electron-store');

exports.saveKeys = async (db, file_id, user_id, encrypted_passphrase, encrypted_iv) => {
    const docRef = doc(db, "file_keys/", file_id);

    await setDoc(docRef, {
        [user_id]: {
            encrypted_passphrase: encrypted_passphrase,
            encrypted_iv: encrypted_iv
        }},
        { 
            merge: true 
        }
    );
    console.log(`Keys saved for file ${file_id}`);
}

exports.getKeys = async (db, file_id, user_id) => {
    const docRef = doc(db, "file_keys", file_id);
    const docSnapshot = await getDoc(docRef);
    
    if (docSnapshot.exists()) {
        if (user_id in docSnapshot.data()) {
            const keys = docSnapshot.get(user_id);
            console.log(`Keys retrieved for file ${file_id} and user ${user_id}`);
            console.log('Keys: ' + JSON.stringify(keys));
            return keys;
        }
        else {
            console.log(`User ${user_id} has no keys for file ${file_id}`);
            return null;
        }
    }
}

exports.getFilesForGroup = async (db, group_id) => {
    const groupQuery = query(collection(db, "file_keys"),where("group_id", '==', group_id)); 
    const querySnapshot = await getDocs(groupQuery);

    const files = [];
    querySnapshot.forEach((doc) => {
        files.push({
        id: doc.id,
        ...doc.data(),
        });
    });

    return files;
}

exports.encryptFile = async (db, file_path, group) => {
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
      await exports.saveKeys(db, file_id, user_id, encrypted_key, encrypted_iv);
    }

    //Save the groupid with the file_keys
    const docRef = doc(db, "file_keys/", file_id);
    await setDoc(docRef, {
        group_id: group
    }, {
        merge: true
    });
    
    //Return the encrypted file
    return file_path + '.enc';

}

exports.decryptFile = async (db, file_path, current_user_id) => {

    console.log('Decrypting file: ' + file_path + " for user " + current_user_id);

    const encryptedFileData = fs.readFileSync(file_path);
    console.log('Encrypted file data: ' + encryptedFileData + '')

    let {id, data} = JSON.parse(encryptedFileData);
    console.log("File id: " + id + "");
    console.log("Data: " + data + "");

    //file_id = Buffer.from(id).toString('base64');
    //data = Buffer.from(data).toString('base64');

    //Check if the user is in group for the given file:
    const keys = await exports.getKeys(db, id, current_user_id);

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
      const passphrase = crypto.privateDecrypt({key: private_key}, Buffer.from(encrypted_passphrase, 'base64'));
      const iv = crypto.privateDecrypt({key: private_key}, Buffer.from(encrypted_iv, 'base64'));

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
      return new_file_path;
    }

}

exports.reEncryptFiles = async (db, group, current_user_id, new_user_id) => {
    // Get all the files that have been encrypted for the given group
    const files = await exports.getFilesForGroup(db, group);

    //Get the public keys of the new group member
    const public_keys = await getPublicKeys(db, [new_user_id]);


    // For each file, decrypt its passcode and re-encrypt it with the new public keys
    for (const file of files) {
        //Get the encrypted passcode and iv for the user
        const keys = await exports.getKeys(db, file.id, user_id);
        const {encrypted_passphrase, encrypted_iv} = keys;

        //Decrypt the passcode and iv with the private key
        const store = new Store();
        const private_key = store.get(`${current_user_id}-private_key`);

        const passphrase = crypto.privateDecrypt({key: private_key}, Buffer.from(encrypted_passphrase, 'base64'));
        const iv = crypto.privateDecrypt({key: private_key}, Buffer.from(encrypted_iv, 'base64'));

        for (const [user_id, public_key] of Object.entries(public_keys)) {
            console.log('Encrypting passphrase and iv for user: ' + user_id);
            //Encrypt the passphrase and iv with the public key
            const encrypted_key = crypto.publicEncrypt(public_key, passphrase).toString('base64');
            const encrypted_iv = crypto.publicEncrypt(public_key, iv).toString('base64');
      
            //Save the encrypted passphrase and iv to the database
            await exports.saveKeys(db, file_id, user_id, encrypted_key, encrypted_iv);
          }
    
    } 

}

exports.removeFileAccess = async (db, group, user_id) => {

    //Get all the files that have been encrypted for the given group
    const files = await exports.getFilesForGroup(db, group);

    //For each file
    for (const file of files) {
        //Remove the user from the group
        const docRef = doc(db, "file_keys/", file.id);
        await updateDoc(docRef, {
            [user_id]: deleteField()
        });
    }
    
}