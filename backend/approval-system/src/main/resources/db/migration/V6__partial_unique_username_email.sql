ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

CREATE UNIQUE INDEX idx_unique_active_username ON users(username) WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_unique_active_email ON users(email) WHERE is_active = TRUE;
