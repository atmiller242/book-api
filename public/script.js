const API_URL = "/books";

const bookForm = document.getElementById("bookForm");
const bookList = document.getElementById("bookList");
const statusMessage = document.getElementById("status");

const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const yearInput = document.getElementById("year");
const bookIdInput = document.getElementById("bookId");

const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");

// Display loading and error messages
function showStatus(message) {
    statusMessage.textContent = message;
}

// READ books
async function loadBooks() {
    showStatus("Loading books...");
    bookList.innerHTML = "";

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load books");
        }

        const books = await response.json();

        bookList.innerHTML = "";

        if (books.length === 0) {
            bookList.textContent = "No books have been added yet.";
        }

        books.forEach(book => {
            const div = document.createElement("div");
            div.className = "book";

            const heading = document.createElement("h3");
            heading.textContent = book.title;

            const author = document.createElement("p");
            author.textContent = "Author: " + book.author;

            const year = document.createElement("p");
            year.textContent = "Year: " + (book.year || "Unknown");

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => editBook(book));

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => deleteBook(book.id));

            div.append(heading, author, year, editButton, deleteButton);
            bookList.appendChild(div);
        });

        showStatus("");
    } catch (error) {
        showStatus("Error: " + error.message);
    }
}

// CREATE and UPDATE books
bookForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = bookIdInput.value;

    const book = {
        title: titleInput.value.trim(),
        author: authorInput.value.trim(),
        year: yearInput.value ? Number(yearInput.value) : null
    };

    if (!book.title || !book.author) {
        showStatus("Please enter a title and author.");
        return;
    }

    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/${id}` : API_URL;

    try {
        submitButton.disabled = true;
        showStatus(id ? "Updating book..." : "Adding book...");

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(book)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Something went wrong");
        }

        resetForm();
        await loadBooks();
        showStatus(id ? "Book updated successfully!" : "Book added successfully!");
    } catch (error) {
        showStatus("Error: " + error.message);
    } finally {
        submitButton.disabled = false;
    }
});

// PUT: prepare a book for editing
function editBook(book) {
    bookIdInput.value = book.id;
    titleInput.value = book.title;
    authorInput.value = book.author;
    yearInput.value = book.year || "";

    submitButton.textContent = "Update Book";
    cancelButton.hidden = false;

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// DELETE books
async function deleteBook(id) {
    if (!confirm("Are you sure you want to delete this book?")) {
        return;
    }

    try {
        showStatus("Deleting book...");

        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not delete book");
        }

        await loadBooks();
        showStatus("Book deleted successfully!");
    } catch (error) {
        showStatus("Error: " + error.message);
    }
}

// Reset form
function resetForm() {
    bookForm.reset();
    bookIdInput.value = "";
    submitButton.textContent = "Add Book";
    cancelButton.hidden = true;
}

cancelButton.addEventListener("click", resetForm);

// Load books when website opens
loadBooks();