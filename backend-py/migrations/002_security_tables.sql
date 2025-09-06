-- Migration 002: Add Security Tables
-- This migration adds tables for rate limiting, security lockouts, and security alerts
-- Required for SRS compliance with security monitoring requirements

-- Rate Limiting Table
CREATE TABLE IF NOT EXISTS rate_limits (
    id VARCHAR(36) PRIMARY KEY DEFAULT (hex(randomblob(16))),
    user_id VARCHAR(36) NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    count INTEGER DEFAULT 1,
    window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_operation ON rate_limits(user_id, operation_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- Security Lockouts Table
CREATE TABLE IF NOT EXISTS security_lockouts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (hex(randomblob(16))),
    user_id VARCHAR(36) NOT NULL,
    lockout_type VARCHAR(50) NOT NULL,
    locked_until DATETIME NOT NULL,
    reason TEXT,
    attempt_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_security_lockouts_user_active ON security_lockouts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_security_lockouts_locked_until ON security_lockouts(locked_until);

-- Security Alerts Table
CREATE TABLE IF NOT EXISTS security_alerts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (hex(randomblob(16))),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    alert_metadata TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(36),
    acknowledged_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_type_severity ON security_alerts(alert_type, severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_acknowledged ON security_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at);

-- Add missing columns to existing tables if they don't exist
-- (These might already exist from previous migrations, so we use ALTER TABLE IF NOT EXISTS equivalent)

-- Add retry_count to deployments table
ALTER TABLE deployments ADD COLUMN retry_count INTEGER DEFAULT 0;

-- Add metadata column to notification_queue if it doesn't exist
ALTER TABLE notification_queue ADD COLUMN metadata TEXT;

-- Update the notification_queue to allow NULL user_id for system notifications
-- This is already nullable in the original schema, so no change needed

-- Insert initial security policy if not exists
INSERT OR IGNORE INTO policies (id, rules, created_at, updated_at) 
VALUES (
    'security-policy-001',
    '{"rate_limits": {"import": 10, "generate": 5, "apply": 20, "revoke": 10, "download": 3}, "lockout_durations": {"rate_limit": 60, "failed_pickup": 30, "suspicious": 240}, "alert_thresholds": {"spike_multiplier": 3, "revoke_threshold": 10}}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
); 