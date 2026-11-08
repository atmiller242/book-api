
const API_URL = "/books";

// Authentication
let authToken = null;

const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const logoutButton = document.getElementById("logoutButton");

// Book elements
const bookForm = document.getElementById("bookForm");
const bookList = document.getElementById("bookList");
const statusMessage = document.getElementById("status");

const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const yearInput = document.getElementById("year");
const bookIdInput = document.getElementById("bookId");

const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");

// Display status messages
function showStatus(message) {
    statusMessage.textContent = message;
}

// Return authentication headers
function getAuthHeaders() {
    return {
        "Authorization": `Bearer ${authToken}`
    };
}

// Update login interface
function updateLoginUI() {
    const loggedIn = Boolean(authToken);

    loginForm.hidden = loggedIn;
    logoutButton.hidden = !loggedIn;

    // Users must log in to modify books
    bookForm.hidden = !loggedIn;
}

// LOGIN
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    loginStatus.textContent = "Logging in...";

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            loginStatus.textContent = data.message || "Login failed";
            return;
        }

        authToken = data.token;

        // Clear the password from the form
        loginForm.reset();

        loginStatus.textContent = "Logged in successfully!";

        updateLoginUI();
        await loadBooks();

    } catch (error) {
        loginStatus.textContent = "Unable to connect to server";
    }
});

// LOGOUT
logoutButton.addEventListener("click", async () => {
    authToken = null;

    resetForm();

    loginStatus.textContent = "Logged out successfully.";

    updateLoginUI();
    await loadBooks();
});

// READ books
async function loadBooks() {
    showStatus("Loading books...");
    bookList.replaceChildren();

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load books");
        }

        const books = await response.json();

        bookList.replaceChildren();

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
            year.textContent = "Year: " + (book.year ?? "Unknown");

            div.append(heading, author, year);

            // Only show Edit and Delete when logged in
            if (authToken) {
                const editButton = document.createElement("button");
                editButton.textContent = "Edit";
                editButton.addEventListener("click", () => editBook(book));

                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete";
                deleteButton.addEventListener("click", () => deleteBook(book.id));

                div.append(editButton, deleteButton);
            }

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

    // Require login
    if (!authToken) {
        showStatus("Please log in before adding or editing books.");
        return;
    }

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
            method: method,
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders()
            },
            body: JSON.stringify(book)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || result.error || "Something went wrong");
        }

        resetForm();
        await loadBooks();

        showStatus(
            id ? "Book updated successfully!" : "Book added successfully!"
        );

    } catch (error) {
        showStatus("Error: " + error.message);
    } finally {
        submitButton.disabled = false;
    }
});

// Prepare a book for editing
function editBook(book) {
    if (!authToken) {
        showStatus("Please log in before editing books.");
        return;
    }

    bookIdInput.value = book.id;
    titleInput.value = book.title;
    authorInput.value = book.author;
    yearInput.value = book.year ?? "";

    submitButton.textContent = "Update Book";
    cancelButton.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// DELETE books
async function deleteBook(id) {
    if (!authToken) {
        showStatus("Please log in before deleting books.");
        return;
    }

    if (!confirm("Are you sure you want to delete this book?")) {
        return;
    }

    try {
        showStatus("Deleting book...");

        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || result.error || "Could not delete book"
            );
        }

        await loadBooks();
        showStatus("Book deleted successfully!");

    } catch (error) {
        showStatus("Error: " + error.message);
    }
}

// Reset the book form
function resetForm() {
    bookForm.reset();
    bookIdInput.value = "";
    submitButton.textContent = "Add Book";
    cancelButton.hidden = true;
}

cancelButton.addEventListener("click", resetForm);

// Initialize the website
updateLoginUI();
loadBooks();
