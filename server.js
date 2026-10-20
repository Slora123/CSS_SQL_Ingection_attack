require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB || "password_practical",
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD
});

app.get("/api/health", async (_req, res) => {
  try { await pool.query("SELECT 1"); res.json({ success: true }); }
  catch (_) { res.status(500).json({ success: false, message: "Check PostgreSQL and .env settings." }); }
});

// Intentionally vulnerable: for this local educational demonstration only.
app.post("/api/login-vulnerable", async (req, res) => {
  const username = String(req.body.username ?? "");
  const password = String(req.body.password ?? "");
  const query = "SELECT id, username, password FROM sqli_users WHERE username = '" +
    username + "' AND password = '" + password + "'";
  console.log("\n--- VULNERABLE SQL QUERY (LOCAL LAB ONLY) ---\n" + query);
  try {
    const result = await pool.query(query);
    return res.json({
      success: result.rows.length > 0,
      message: result.rows.length > 0
        ? "Vulnerable login succeeded. SQL injection demonstrated."
        : "Invalid username or password.",
      query,
      users: result.rows
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: "SQL Error: " + error.message, query });
  }
});

// Secure: parameters are sent separately from SQL syntax.
app.post("/api/login-secure", async (req, res) => {
  const username = String(req.body.username ?? "");
  const password = String(req.body.password ?? "");
  const query = "SELECT id, username, password FROM sqli_users WHERE username = $1 AND password = $2";
  try {
    const result = await pool.query(query, [username, password]);
    return res.json({
      success: result.rows.length > 0,
      message: result.rows.length > 0
        ? "Login successful."
        : "Invalid username or password. Input was treated as data.",
      query: query + " (values passed separately as parameters)",
      users: result.rows
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Database error: " + error.message });
  }
});

// Registration API
app.post("/api/register", async (req, res) => {
  const username = String(req.body.username ?? "").trim();
  const password = String(req.body.password ?? "").trim();
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required." });
  }
  try {
    // Check if user exists
    const checkUser = await pool.query("SELECT id FROM sqli_users WHERE username = $1", [username]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Username already exists." });
    }
    const insertResult = await pool.query(
      "INSERT INTO sqli_users (username, password) VALUES ($1, $2) RETURNING id, username, password",
      [username, password]
    );
    return res.json({
      success: true,
      message: `User '${username}' registered successfully!`,
      user: insertResult.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Registration failed: " + error.message });
  }
});

// Get all users API
app.get("/api/users", async (_req, res) => {
  try {
    const result = await pool.query("SELECT id, username, password FROM sqli_users ORDER BY id ASC");
    return res.json({ success: true, users: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch users: " + error.message });
  }
});

app.listen(PORT, async () => {
  console.log("SQL Injection Lab running at http://localhost:" + PORT);
  try { await pool.query("SELECT 1"); console.log("PostgreSQL connected successfully!"); }
  catch (error) { console.error("PostgreSQL connection failed:", error.message); }
});
