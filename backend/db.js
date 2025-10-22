const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'data.sqlite');
const dbExists = fs.existsSync(DB_PATH);
const db = new sqlite3.Database(DB_PATH);

if (!dbExists) {
  db.serialize(() => {
    db.run(`
      CREATE TABLE videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        s3key TEXT NOT NULL,
        originalname TEXT NOT NULL,
        title TEXT,
        channel TEXT,
        description TEXT,
        duration INTEGER DEFAULT 0,
        size INTEGER,
        created_at INTEGER DEFAULT (strftime('%s','now'))
      )
    `);
  });
}

module.exports = db;