require("dotenv").config();

const express = require("express");
const path = require("path");
const db = require("./database/database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// GET all books
app.get("/books", (req, res) => {
    db.all("SELECT * FROM books", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(rows);
    });
});

// GET one book
app.get("/books/:id", (req, res) => {
    db.get(
        "SELECT * FROM books WHERE id = ?",
        [req.params.id],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (!row) {
                return res.status(404).json({ message: "Book not found" });
            }

            res.json(row);
        }
    );
});

// CREATE a book
app.post("/books", (req, res) => {
    const { title, author, year } = req.body;

    if (!title || !author) {
        return res.status(400).json({
            message: "Title and author are required"
        });
    }

    db.run(
        "INSERT INTO books (title, author, year) VALUES (?, ?, ?)",
        [title, author, year || null],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.status(201).json({
                id: this.lastID,
                title,
                author,
                year: year || null
            });
        }
    );
});

// UPDATE a book
app.put("/books/:id", (req, res) => {
    const { title, author, year } = req.body;

    if (!title || !author) {
        return res.status(400).json({
            message: "Title and author are required"
        });
    }

    db.run(
        "UPDATE books SET title = ?, author = ?, year = ? WHERE id = ?",
        [title, author, year || null, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ message: "Book not found" });
            }

            res.json({
                id: Number(req.params.id),
                title,
                author,
                year: year || null
            });
        }
    );
});

// DELETE a book
app.delete("/books/:id", (req, res) => {
    db.run(
        "DELETE FROM books WHERE id = ?",
        [req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ message: "Book not found" });
            }

            res.json({ message: "Book deleted successfully" });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Book API running at http://localhost:${PORT}`);
});