const sqlite3 = require('sqlite3');
const path = require('path');

const db_path = path.join(__dirname, "..", 'db.sqlite3');
const db = new sqlite3.Database(db_path, (err) => {
    if (err) console.error('Database opening error: ', err);
});

exports.db = db;