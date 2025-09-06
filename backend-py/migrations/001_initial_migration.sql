-- Initial migration for SSH Key Portal
-- This migration creates all the necessary tables for the enhanced system

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    display_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'auditor')),
    CONSTRAINT users_status_check CHECK (status IN ('active', 'disabled'))
);

-- SSH Keys table
CREATE TABLE IF NOT EXISTS ssh_keys (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    algorithm VARCHAR(50) NOT NULL,
    bit_length INTEGER NOT NULL,
    comment TEXT,
    fingerprint_sha256 VARCHAR(64) UNIQUE NOT NULL,
    origin VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    authorized_keys_options TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_applied_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ssh_keys_origin_check CHECK (origin IN ('import', 'client_gen', 'system_gen')),
    CONSTRAINT ssh_keys_status_check CHECK (status IN ('active', 'deprecated', 'revoked', 'expired'))
);

-- Managed Hosts table
CREATE TABLE IF NOT EXISTS managed_hosts (
    id VARCHAR(36) PRIMARY KEY,
    hostname VARCHAR(255) UNIQUE NOT NULL,
    address VARCHAR(255) NOT NULL,
    os_family VARCHAR(50) NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Host Account mappings
CREATE TABLE IF NOT EXISTS user_host_accounts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    host_id VARCHAR(36) REFERENCES managed_hosts(id) ON DELETE CASCADE,
    remote_username VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT user_host_accounts_status_check CHECK (status IN ('active', 'disabled')),
    UNIQUE(user_id, host_id)
);

-- Deployments table
CREATE TABLE IF NOT EXISTS deployments (
    id VARCHAR(36) PRIMARY KEY,
    host_id VARCHAR(36) REFERENCES managed_hosts(id) ON DELETE CASCADE,
    user_host_account_id VARCHAR(36) REFERENCES user_host_accounts(id) ON DELETE CASCADE,
    generation INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    checksum VARCHAR(64),
    key_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    CONSTRAINT deployments_status_check CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled'))
);

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rules JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Events table
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(36) PRIMARY KEY,
    ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actor_user_id VARCHAR(36) REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255),
    metadata_json TEXT,
    source_ip VARCHAR(45),
    user_agent TEXT
);

-- System Generation Requests table
CREATE TABLE IF NOT EXISTS system_gen_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    algorithm VARCHAR(50) NOT NULL,
    bit_length INTEGER NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    download_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Apply Queue table
CREATE TABLE IF NOT EXISTS apply_queue (
    id VARCHAR(36) PRIMARY KEY,
    user_host_account_id VARCHAR(36) REFERENCES user_host_accounts(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT apply_queue_status_check CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled'))
);

-- Notification Queue table
CREATE TABLE IF NOT EXISTS notification_queue (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT notification_queue_status_check CHECK (status IN ('queued', 'sent', 'failed')),
    CONSTRAINT notification_queue_type_check CHECK (notification_type IN ('expiry_reminder', 'key_generated', 'key_revoked', 'apply_failed', 'emergency_revoke'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ssh_keys_user_id ON ssh_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_ssh_keys_status ON ssh_keys(status);
CREATE INDEX IF NOT EXISTS idx_ssh_keys_expires_at ON ssh_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_deployments_host_id ON deployments(host_id);
CREATE INDEX IF NOT EXISTS idx_deployments_user_host_account_id ON deployments(user_host_account_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_audit_events_ts ON audit_events(ts);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_user_id ON audit_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_apply_queue_status ON apply_queue(status);
CREATE INDEX IF NOT EXISTS idx_apply_queue_priority ON apply_queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_at ON notification_queue(scheduled_at);

-- Insert default policy if none exists
INSERT INTO policies (id, name, rules, is_active, created_at)
SELECT 
    gen_random_uuid()::text,
    'Default SSH Key Policy',
    '{"allowed_algorithms": ["ssh-ed25519", "ssh-rsa"], "min_key_lengths": {"ssh-rsa": 2048, "ssh-ed25519": 256, "ecdsa-sha2-nistp256": 256}, "default_ttl_days": 365, "max_keys_per_user": 5, "comment_regex": null, "allowed_options": ["no-port-forwarding", "no-agent-forwarding", "no-X11-forwarding", "no-pty", "restrict", "from"], "expiry_reminder_days": [30, 7, 1]}'::jsonb,
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM policies WHERE is_active = true);

COMMIT; 