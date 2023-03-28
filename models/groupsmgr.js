const { db } = require("./dbmgr")

exports.getGroups = async () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT GroupName, rowid FROM groups', [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
}

exports.createGroup = (groupname) => {
    const query = "INSERT INTO groups (GroupName) VALUES(?)";
    db.prepare(query,[groupname]).run().finalize();
}

exports.addToGroup = (user_id, group_id) => {
    const query = "INSERT INTO user_groups (user_id, group_id) VALUES  (?,?);"
    db.prepare(query, [user_id, group_id]).run().finalize();
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
