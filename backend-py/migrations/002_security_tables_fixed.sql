-- Migration 002: Add Security Tables (Fixed)
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