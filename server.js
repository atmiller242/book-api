const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory collection. Data resets when the server restarts.
let books = [
  { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
  { id: 2, title: "Atomic Habits", author: "James Clear" }
];
let nextId = 3;

// GET: Retrieve all books.
app.get("/books", (req, res) => {
  res.status(200).json(books);
});

// GET: Retrieve one book by ID.
app.get("/books/:id", (req, res) => {
  const id = Number(req.params.id);
  const book = books.find((item) => item.id === id);

  if (!Number.isInteger(id) || id < 1 || !book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json(book);
});

// POST: Create a book.
app.post("/books", (req, res) => {
  const { title, author } = req.body || {};

  if (typeof title !== "string" || !title.trim() ||
      typeof author !== "string" || !author.trim()) {
    return res.status(400).json({
      message: "Both title and author are required as non-empty strings."
    });
  }

  const newBook = {
    id: nextId++,
    title: title.trim(),
    author: author.trim()
  };

  books.push(newBook);
  return res.status(201).json(newBook);
});

// PUT: Update an existing book.
app.put("/books/:id", (req, res) => {
  const id = Number(req.params.id);
  const book = books.find((item) => item.id === id);

  if (!Number.isInteger(id) || id < 1 || !book) {
    return res.status(404).json({ message: "Book not found" });
  }

  const { title, author } = req.body || {};

  if (typeof title !== "string" || !title.trim() ||
      typeof author !== "string" || !author.trim()) {
    return res.status(400).json({
      message: "Both title and author are required as non-empty strings."
    });
  }

  book.title = title.trim();
  book.author = author.trim();
  return res.status(200).json(book);
});

// DELETE: Remove a book.
app.delete("/books/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = books.findIndex((item) => item.id === id);

  if (!Number.isInteger(id) || id < 1 || index === -1) {
    return res.status(404).json({ message: "Book not found" });
  }

  const [deletedBook] = books.splice(index, 1);
  return res.status(200).json({
    message: "Book deleted successfully",
    book: deletedBook
  });
});

// Return a JSON error for malformed JSON request bodies.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON request body" });
  }
  return next(err);
});

app.listen(PORT, () => {
  console.log(`Book API is running at http://localhost:${PORT}`);
});
