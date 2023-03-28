const { db } = require("./dbmgr")

exports.addUser = (username, publickey) => {
    const query = "INSERT INTO users (UserName, PublicKey) VALUES (?,?)"; 
    db.prepare(query, [username, publickey]).run().finalize();
}

exports.getUser = (username) => {
    const query = "SELECT * FROM users WHERE UserName=?";
    db.get(query, [username]).run().finalize();
}

exports.getUsers = () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT rowid, UserName FROM users', [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

exports.deleteUser = (user_id) => {
    const query = "DELETE FROM users WHERE rowid = ?;";
    db.prepare(query, [user_id]).run().finalize();
}