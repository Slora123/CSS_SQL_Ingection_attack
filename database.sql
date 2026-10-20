-- Safe to run in password_practical: this does not drop or alter your existing users table.
CREATE TABLE IF NOT EXISTS sqli_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(100) NOT NULL
);
INSERT INTO sqli_users (username, password)
SELECT 'admin', 'admin123'
WHERE NOT EXISTS (SELECT 1 FROM sqli_users WHERE username = 'admin');
SELECT id, username FROM sqli_users;
