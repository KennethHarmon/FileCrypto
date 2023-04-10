const {doc, collection, query, where, getDoc, getDocs, setDoc} = require('firebase/firestore'); 
const { execSync } = require('child_process')
const crypto = require('crypto');
const Store = require('electron-store');
const util = require('util')
const fs = require('fs');

const generateKeyPairAsync = util.promisify(crypto.generateKeyPair);

async function generateKeys(user_id) {
    try {
      const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      const store = new Store();
      store.set(`${user_id}-private_key`, privateKey);

      fs.writeFileSync('privateKey.pem', privateKey);

      // Generate a self-signed x.509 certificate using OpenSSL
      execSync(`openssl req -new -x509 -key privateKey.pem -out certificate.pem -days 365 -nodes -subj "/CN=${user_id}"`);

      return { publicKey, privateKey };
    } catch (err) {
      console.error(err);
    }
  }

exports.createUser = async (db, user_id, user_email) => {

    const { publicKey, privateKey } = await generateKeys(user_id);

    const cert = fs.readFileSync('certificate.pem', 'utf8');

    const signer = crypto.createSign('SHA256');
    signer.update(publicKey);
    const signature = signer.sign(privateKey, 'base64');

    const verifier = crypto.createVerify('SHA256');
    verifier.update(publicKey);
    const isValid = verifier.verify(cert, signature, 'base64');
    console.log('Signature verified: ', isValid);

    await setDoc(doc(db, "users", user_id), {
        email: user_email,
        public_key: publicKey,
        cert: cert,
        signature: signature
    });
    console.log("User added with ID: ", user_id);
    
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
        return doc.id;
    } else {
        console.log("No such user!");
        return null;
    }
};