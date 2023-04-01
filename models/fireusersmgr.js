const {doc, collection, query, where, getDoc, getDocs, setDoc} = require('firebase/firestore'); 
const { generateKeyPair} = require('crypto');
const Store = require('electron-store');
const util = require('util')

const generateKeyPairAsync = util.promisify(generateKeyPair);

async function generateKeys() {
    try {
      const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
          cipher: 'aes-256-cbc',
          passphrase: 'suoer duper top secret',
        }
      });
      return { publicKey, privateKey };
    } catch (err) {
      console.error(err);
    }
  }

exports.createUser = async (db, user_id, user_email) => {

    const { publicKey, privateKey } = await generateKeys();

    await setDoc(doc(db, "users", user_id), {
        email: user_email,
        public_key: publicKey,
    });
    console.log("User added with ID: ", user_id);

    const store = new Store();
    store.set(`${user_id}-private_key`, privateKey);
}

exports.addUser =  (db, email, public_key) => {
    db.collection("users").add({
        email: email,
        public_key: public_key
    })
    .then((docRef) => {
        console.log("User added with ID: ", docRef.id);
        return docRef.id;
    })
    .catch((error) => {
        console.error("Error adding user: ", error);
    });
};

exports.getUserByEmail = async (db, email) => {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        console.log("User data:", doc.data());
        return doc.id;
    } else {
        console.log("No such user!");
        return null;
    }
};