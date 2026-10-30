const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(
    process.env.DB_PATH || "./database/books.db"
);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            year INTEGER
        )
    `);
});

module.exports = db;