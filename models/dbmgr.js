const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('../db.sqlite3', (err) => {
    if (err) console.error('Database opening error: ', err);
});

exports.db = db;