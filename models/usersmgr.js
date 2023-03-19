const { db } = require("./dbmgr")

exports.addUser = (username, publickey) => {
    const query = "INSERT INTO users (UserName, PublicKey) VALUES (?,?)"; 
    db.prepare(query, [username, publickey]).run().finalize();
}

exports.getUser = (username) => {
    const query = "SELECT * FROM users WHERE UserName=?";
    db.get(query, [username]).run().finalize();
}