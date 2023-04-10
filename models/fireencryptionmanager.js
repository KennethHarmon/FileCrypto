const {doc, collection, query, where, getDoc, getDocs, setDoc, addDoc, updateDoc, documentId} = require('firebase/firestore'); 

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
    const groupQuery = query(collection(db, "file_keys"),where(documentId(), 'in', userGroupIds));
}