-- Migration 004: Fix external_id to be nullable for local accounts
-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table

BEGIN TRANSACTION;

-- Create new table with correct schema
CREATE TABLE users_new (
    id VARCHAR(36) PRIMARY KEY DEFAULT (hex(randomblob(16))),
    external_id VARCHAR(255), -- Made nullable
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    display_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    is_local_account BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (role IN ('user','admin','auditor')),
    CHECK (status IN ('active','disabled'))
);

-- Copy existing data
INSERT INTO users_new (id, external_id, username, email, display_name, password_hash, role, status, is_local_account, created_at)
SELECT id, external_id, username, email, display_name, password_hash, role, status, is_local_account, created_at
FROM users;

-- Drop old table
DROP TABLE users;

-- Rename new table
ALTER TABLE users_new RENAME TO users;

-- Recreate indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_external_id ON users(external_id);
CREATE INDEX IF NOT EXISTS idx_users_local_auth ON users(username, is_local_account) WHERE is_local_account = TRUE;

COMMIT; 