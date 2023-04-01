const {doc, collection, query, where, getDoc, getDocs, setDoc, addDoc, documentId} = require('firebase/firestore'); 

exports.createGroup = async (db, groupname) => {
    const docRef = await addDoc(collection(db, "groups"), {
        name: groupname,
    });
    console.log('Group created with groupID: ', docRef.id);
    return docRef.id;
};

exports.addToGroup = async (db, user_id, group_id) => {
    await setDoc(doc(db, "userGroups", user_id), {
        [group_id]: true
    });
    console.log(`User ${user_id} added to group ${group_id}`);
}

exports.getGroupsForUser = async (db, user_id) => {
    console.log(`Getting groups for user ${user_id}`);
    const docRef = doc(db, "userGroups", user_id);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
        const userGroupsData = docSnapshot.data();
        const userGroupIds = Object.keys(userGroupsData);

        const groupQuery = query(collection(db, "groups"),where(documentId(), 'in', userGroupIds));
        const querySnapshot = await getDocs(groupQuery);

        const groups = [];
        querySnapshot.forEach((doc) => {
            groups.push({
            id: doc.id,
            ...doc.data(),
            });
        });
        console.log(`User ${user_id} belongs to groups:`, groups);
        return groups;
    } else {
        console.log(`User ${user_id} has no group memberships`);
    }
}

exports.getGroupMembers = async (db, group_id) => {
    const userGroupsQuery = query(collection(db, "userGroups"), where(group_id, '==', true));
    const querySnapshot = await getDocs(userGroupsQuery);
    
    const groupMembers = [];
    querySnapshot.forEach((doc) => {
        groupMembers.push({
        id: doc.id,
        ...doc.data(),
        });
    });
    console.log(`Group ${group_id} has members:`, groupMembers);
}

exports.getPublicKeys = async (db, user_ids) => {
    const usersQuery = query(collection(db, "users"), where(documentId(), 'in', user_ids));
    const querySnapshot = await getDocs(usersQuery);

    const publicKeys = {};
    querySnapshot.forEach((doc) => {
        publicKeys[doc.id] = doc.data().public_key;
    });
    console.log(`Public keys for users ${user_ids}:`, publicKeys);
    return publicKeys;

}
