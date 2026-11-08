require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const db = require("./database/database");

const app = express();
app.disable("x-powered-by");

app.use(helmet({
  contentSecurityPolicy: {
    directives:  {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"]
    }
  },
  xFrameOptions: { action: "deny" }
}));
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in .env");
}

// Create the user table
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    )
`);

// Limit attempts to create accounts or log in
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false
});

// Create an account
app.post("/register", authLimiter, async (req, res) => {
    const { username, password } = req.body || {};

    if (
        typeof username !== "string" ||
        !/^[a-zA-Z0-9_]{3,30}$/.test(username) ||
        typeof password !== "string" ||
        password.length < 12 ||
        Buffer.byteLength(password, "utf8") > 72
    ) {
        return res.status(400).json({
            message: "Use a 3-30 character username and a 12-72 byte password."
        });
    }

    try {
        const hash = await bcrypt.hash(password, 12);

        db.run(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            [username, hash],
            function (err) {
                if (err) {
                    if (err.code === "SQLITE_CONSTRAINT") {
                        return res.status(409).json({
                            message: "Username already exists"
                        });
                    }
                    return res.status(500).json({
                        message: "Unable to create account"
                    });
                }

                res.status(201).json({
                    message: "Account created successfully"
                });
            }
        );
    } catch (err) {
        res.status(500).json({
            message: "Unable to create account"
        });
    }
});

// Log in
app.post("/login", authLimiter, (req, res) => {
    const { username, password } = req.body || {};

    if (
        typeof username !== "string" ||
        typeof password !== "string"
    ) {
        return res.status(400).json({
            message: "Invalid login details"
        });
    }

    db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (err, user) => {
            if (err) {
                return res.status(500).json({
                    message: "Login unavailable"
                });
            }

            const valid = user
                ? await bcrypt.compare(password, user.password_hash)
                : false;

            if (!valid) {
                return res.status(401).json({
                    message: "Invalid username or password"
                });
            }

            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: "1h", algorithm: "HS256" }
            );

            res.json({ token });
        }
    );
});

// Middleware for protected routes
function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const match = /^Bearer (.+)$/.exec(header);

    if (!match) {
        return res.status(401).json({
            message: "Login required"
        });
    }

    try {
        req.user = jwt.verify(
            match[1],
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );
        next();
    } catch (err) {
        res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

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
app.post("/books", requireAuth, (req, res) => {
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
app.put("/books/:id", requireAuth, (req, res) => {
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
app.delete("/books/:id", requireAuth, (req, res) => {
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
app.use((req, res) => {
  res.status(404).json({
    error: "Page not found"
  });
});
app.listen(PORT, () => {
    console.log(`Book API running at http://localhost:${PORT}`);
});