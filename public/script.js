function escapeHtml(s) {
  return (s || "").toString()
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function usersTable(users) {
  let html = `<table><thead><tr><th>ID</th><th>Login ID</th><th>Password</th></tr></thead><tbody>`;
  users.forEach(u => {
    html += `<tr><td>${u.id}</td><td>${escapeHtml(u.username)}</td><td class="pwd">${escapeHtml(u.password)}</td></tr>`;
  });
  return html + `</tbody></table>`;
}

// Load all users into the DB table
async function loadUsers() {
  const tbody = document.getElementById("db-tbody");
  try {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (!data.success) { tbody.innerHTML = `<tr><td colspan="3" class="muted">Failed to load</td></tr>`; return; }
    if (data.users.length === 0) { tbody.innerHTML = `<tr><td colspan="3" class="muted">No users found.</td></tr>`; return; }
    tbody.innerHTML = data.users.map(u =>
      `<tr><td>${u.id}</td><td>${escapeHtml(u.username)}</td><td class="pwd">${escapeHtml(u.password)}</td></tr>`
    ).join("");
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="3" class="muted">Connection error</td></tr>`;
  }
}

// Register
async function registerUser(e) {
  e.preventDefault();
  const form = e.target;
  const toast = document.getElementById("r-result");
  const btn = form.querySelector("button");
  const data = { username: form.elements.username.value, password: form.elements.password.value };
  btn.disabled = true;
  try {
    const res = await fetch("/api/register", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    });
    const result = await res.json();
    toast.className = "toast " + (result.success ? "success" : "failure");
    toast.textContent = result.message;
    toast.style.display = "block";
    if (result.success) { form.reset(); loadUsers(); }
  } catch (err) {
    toast.className = "toast failure";
    toast.textContent = "Network error during registration.";
    toast.style.display = "block";
  } finally {
    btn.disabled = false;
  }
}

// Login (Case 1 = secure, Case 2 = vulnerable)
async function loginUser(e) {
  e.preventDefault();
  const form = e.target;
  const box = document.getElementById("l-result");
  const endpoint = form.elements.mode.value === "vulnerable" ? "/api/login-vulnerable" : "/api/login-secure";
  const data = { username: form.elements.username.value, password: form.elements.password.value };

  box.className = "result-box";
  box.innerHTML = "Checking...";
  try {
    const res = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    });
    const result = await res.json();
    box.className = "result-box " + (result.success ? "success" : "failure");
    let html = `<div class="banner"><strong>${result.success ? "Success" : "Failed"}</strong>: ${escapeHtml(result.message)}</div>`;
    if (result.users && result.users.length > 0) {
      html += `<p class="label">Data returned from query:</p>` + usersTable(result.users);
    }
    if (result.query) {
      html += `<p class="label">Executed SQL query:</p><pre>${escapeHtml(result.query)}</pre>`;
    }
    box.innerHTML = html;
  } catch (err) {
    box.className = "result-box failure";
    box.innerHTML = `<div class="banner"><strong>Error</strong>: Request failed. Check server and database connection.</div>`;
  }
}

function fill(username, password) {
  const f = document.getElementById("l-form");
  f.elements.username.value = username;
  f.elements.password.value = password;
}

document.getElementById("r-form").addEventListener("submit", registerUser);
document.getElementById("l-form").addEventListener("submit", loginUser);
document.getElementById("attack").addEventListener("click", () => {
  document.getElementById("l-case").value = "vulnerable";
  fill("admin' OR '1'='1' -- ", "anything");
});
document.getElementById("normal").addEventListener("click", () => fill("admin", "admin123"));
document.getElementById("refresh-db").addEventListener("click", loadUsers);
document.addEventListener("DOMContentLoaded", loadUsers);
