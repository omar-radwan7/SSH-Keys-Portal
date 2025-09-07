-- Migration: Add user activity tracking and update status options
-- Date: 2024-01-15

-- Add new columns for activity tracking
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN last_activity_at TIMESTAMP;

-- Update status constraint to include new options
-- First drop the old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;

-- Add the new constraint with updated status options
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'new'));

-- Update existing users with 'disabled' status to 'inactive'
UPDATE users SET status = 'inactive' WHERE status = 'disabled';

-- Set existing users as 'active' if they don't have a status or have 'active'
UPDATE users SET status = 'active' WHERE status IS NULL OR status = 'active'; 