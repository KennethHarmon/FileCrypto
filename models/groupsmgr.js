const { db } = require("./dbmgr")

exports.getGroups = async () => {
    return new Promise((resolve, reject) => {
    
        db.all('SELECT GroupName FROM groups', [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const groups = rows.map((row) => row.GroupName);
            resolve(groups);
          }
        });
      });
}

exports.createGroup = (groupname) => {
    const query = "INSERT INTO groups (GroupName) VALUES(?)";
    db.prepare(query,[groupname]).run().finalize();
}

exports.addToGroup = (groupname, username) => {
    const query = "INSERT INTO user_groups (user_id, group_id) VALUES  ((SELECT UserID FROM users WHERE username = ?), (SELECT groupID FROM groups WHERE groupname = ?));"
    db.prepare(query, [username, groupname]).run().finalize();
}

exports.getGroupMembers = (groupname) => {
    const query = "SELECT * FROM users WHERE UserID IN (SELECT user_id FROM user_groups WHERE group_id = (SELECT groupID FROM groups WHERE groupname = ?));"
    db.prepare(query, [groupname]).run().finalize();
}

exports.deleteGroup = (groupname) => {
    const query = "DELETE FROM groups WHERE groupname = ?;"
    db.prepare(query, [groupname]).run().finalize();
}

exports.deleteUserFromGroup = (groupname, username) => {    
    const query = "DELETE FROM user_groups WHERE user_id = (SELECT UserID FROM users WHERE username = ?) AND group_id = (SELECT groupID FROM groups WHERE groupname = ?);"
    db.prepare(query, [username, groupname]).run().finalize();
}
