# SQL Injection Practical — PostgreSQL

A small local lab that demonstrates SQL injection and how parameterized queries prevent it.

> **Warning:** This app is intentionally vulnerable and meant for local, educational use only. Never deploy it publicly.

## Features
- **Register** (left): creates a new user in the `sqli_users` table.
- **Login** (right) with a case selector:
  - **Case 1: Secure Login** — uses parameterized queries (`$1`, `$2`).
  - **Case 2: Vulnerable Login** — concatenates input directly into the SQL string.
- **Database Records**: live view of the `sqli_users` table.

## Requirements
- Node.js 18+
- PostgreSQL

## Setup
1. Clone the repo and open it in a terminal.
2. Install dependencies: `npm install`
3. Create your env file: `cp .env.example .env`, then set `POSTGRES_PASSWORD`.
4. Create the table and sample account:
   `psql -U postgres -d password_practical -f database.sql`
5. Start the app: `npm start`
6. Open http://localhost:3001

## Tests
**Test A — SQL injection** (use Case 2: Vulnerable Login)
- Login ID: `admin' OR '1'='1' -- `
- Password: `anything`
- Expected: Case 2 logs in and returns rows; Case 1 rejects it.

**Test B — valid credentials**
- Login ID: `admin`, Password: `admin123`
- Expected: both cases succeed.

## Conclusion
The vulnerable endpoint lets input change the query logic. The secure endpoint treats input strictly as data.

## Project structure
```
public/        index.html, style.css, script.js
server.js      Express API
database.sql   Table + sample data
.env.example   Environment template
```
