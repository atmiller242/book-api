# Book REST API

A REST API built with Node.js and Express. It stores books in memory, so changes reset when the server restarts.

## Setup

1. Install Node.js if it is not already installed.
2. Open a terminal in this project folder.
3. Run `npm install`.
4. Run `npm start`.
5. The API will run at http://localhost:3000.

## API reference

| Method | Endpoint | What it returns | Success status |
|---|---|---|---|
| GET | `/books` | All books as a JSON array | 200 OK |
| GET | `/books/:id` | One book matching the ID | 200 OK |
| POST | `/books` | The newly created book | 201 Created |
| PUT | `/books/:id` | The updated book | 200 OK |
| DELETE | `/books/:id` | A deletion message and the deleted book | 200 OK |

Error responses:
- `400 Bad Request`: title or author is missing/invalid, or the JSON body is malformed.
- `404 Not Found`: the requested book ID does not exist.

## Example JSON body for POST and PUT

```json
{
  "title": "The Hobbit",
  "author": "J.R.R. Tolkien"
}
```

## Test every endpoint (PowerShell)

Keep the server running in one terminal. Open a second PowerShell terminal and run these commands one at a time:

```powershell
# 1. Get all books
Invoke-RestMethod -Uri http://localhost:3000/books

# 2. Get book with ID 1
Invoke-RestMethod -Uri http://localhost:3000/books/1

# 3. Create a book (it should receive ID 3)
Invoke-RestMethod -Method POST -Uri http://localhost:3000/books -ContentType "application/json" -Body '{"title":"The Hobbit","author":"J.R.R. Tolkien"}'

# 4. Update book with ID 3
Invoke-RestMethod -Method PUT -Uri http://localhost:3000/books/3 -ContentType "application/json" -Body '{"title":"The Hobbit: Updated","author":"J.R.R. Tolkien"}'

# 5. Delete book with ID 3
Invoke-RestMethod -Method DELETE -Uri http://localhost:3000/books/3
```

Optional 404 test: request `http://localhost:3000/books/999`.

## Upload to GitHub

The `.gitignore` file excludes `node_modules`. After you test the API, create an empty GitHub repository and run these commands in this folder (replace the URL with your repository URL):

```bash
git init
git add .
git commit -m "Build Book REST API with Express"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```
