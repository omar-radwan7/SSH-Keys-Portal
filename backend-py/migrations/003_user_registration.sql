-- Migration 003: Add User Registration Support
-- This migration adds support for local user accounts with password authentication

-- Add new columns to users table
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN is_local_account BOOLEAN DEFAULT TRUE;

-- Make external_id nullable for local accounts
-- Note: In SQLite, we need to recreate the table to modify column constraints
-- For PostgreSQL, this would be: ALTER TABLE users ALTER COLUMN external_id DROP NOT NULL;

-- Update existing users to be marked as non-local (LDAP) accounts
UPDATE users SET is_local_account = FALSE WHERE external_id IS NOT NULL;

-- Create index for faster authentication queries
CREATE INDEX IF NOT EXISTS idx_users_local_auth ON users(username, is_local_account) WHERE is_local_account = TRUE; 