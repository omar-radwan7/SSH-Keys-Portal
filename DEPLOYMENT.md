# SSH Key Portal - Deployment Guide

This document provides comprehensive deployment instructions for the SSH Key Portal, including all the enhanced features and configuration options.

## Overview

The SSH Key Portal is a centralized system for managing SSH keys for HPC clusters with:

- **Authentication**: LDAP/AD integration with role mapping
- **Key Management**: Import, client/server generation, rotation, expiry handling
- **Policy Enforcement**: Configurable algorithms, lengths, TTL, options validation
- **Automated Deployment**: Background workers with retry logic and atomic updates
- **User-Host Mapping**: Flexible account mapping across multiple hosts
- **Audit & Monitoring**: Complete action logging, metrics, and notifications
- **Admin Controls**: Emergency revoke, user management, policy configuration

## Architecture

### Backend (Python/FastAPI)
- **FastAPI** web framework with async support
- **SQLAlchemy** ORM with PostgreSQL/SQLite support
- **Background Workers** for async key deployment and maintenance
- **LDAP3** for directory authentication and group mapping
- **Paramiko** for secure SSH deployment to managed hosts

### Frontend (React/TypeScript)
- **React 18** with TypeScript
- **Tailwind CSS** for modern, responsive UI
- **React Router** for navigation
- **Axios** for API communication

### Database
- **PostgreSQL** (recommended for production)
- **SQLite** (development/testing)
- **Structured migrations** for schema management

## Prerequisites

### System Requirements
- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 14+** (production) or SQLite (development)
- **LDAP/AD server** (optional, has demo mode)
- **SSH access** to managed HPC nodes

### Network Requirements
- Portal server → LDAP server (port 389/636)
- Portal server → HPC nodes (port 22)
- Users → Portal web interface (port 3000/3001)

## Installation

### 1. Clone and Setup

```bash
git clone <repository-url>
cd ssh-keys-portal
```

### 2. Backend Setup

```bash
cd backend-py

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build
```

## Configuration

### Environment Variables

Create `.env` files in both `backend-py/` and `frontend/` directories:

#### Backend Configuration (`backend-py/.env`)

```bash
# Application
APP_NAME="HPC SSH Key Portal"
ENV="production"
PORT=3000
FRONTEND_URL="http://localhost:3001"

# Database (PostgreSQL recommended for production)
USE_SQLITE=false
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hpc_ssh_portal
DB_USER=postgres
DB_PASSWORD=your_secure_password
# Alternative: DATABASE_URL=postgresql://user:pass@host:port/dbname

# Security
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_HOURS=24

# LDAP/AD Configuration
LDAP_URL=ldap://your-ldap-server.com:389
LDAP_BASE_DN=dc=company,dc=com
LDAP_USER_FILTER=(sAMAccountName={username})
LDAP_GROUP_FILTER=(member={user_dn})
LDAP_ADMIN_GROUPS=cn=ssh-admins,ou=groups,dc=company,dc=com
LDAP_AUDITOR_GROUPS=cn=ssh-auditors,ou=groups,dc=company,dc=com

# System-Generated Key Security
SYSGEN_ENCRYPTION_KEY=your_encryption_key_for_temporary_private_keys
SYSGEN_DOWNLOAD_TTL_MIN=10

# SSH Deployment Configuration
APPLY_SSH_USER=root
APPLY_SSH_KEY_PATH=~/.ssh/id_rsa
APPLY_STRICT_HOST_KEY_CHECK=false

# Development Mode (set to false in production)
ALLOW_TEST_LOGIN=false
```

#### Frontend Configuration (`frontend/.env`)

```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_ALLOW_TEST_LOGIN=false
```

### Database Setup

#### PostgreSQL (Recommended)

1. **Install PostgreSQL**:
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
```

2. **Create Database**:
```bash
sudo -u postgres psql
CREATE DATABASE hpc_ssh_portal;
CREATE USER ssh_portal_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE hpc_ssh_portal TO ssh_portal_user;
\q
```

3. **Run Migration**:
```bash
cd backend-py
psql -h localhost -U ssh_portal_user -d hpc_ssh_portal -f migrations/001_initial_migration.sql
```

#### SQLite (Development Only)

Set `USE_SQLITE=true` in `.env`. Database will be created automatically.

### LDAP/AD Integration

#### Active Directory Example
```bash
LDAP_URL=ldap://your-ad-server.company.com:389
LDAP_BASE_DN=dc=company,dc=com
LDAP_USER_FILTER=(sAMAccountName={username})
LDAP_GROUP_FILTER=(member={user_dn})
LDAP_ADMIN_GROUPS=cn=HPC-SSH-Admins,ou=Security Groups,dc=company,dc=com
LDAP_AUDITOR_GROUPS=cn=HPC-SSH-Auditors,ou=Security Groups,dc=company,dc=com
```

#### FreeIPA Example
```bash
LDAP_URL=ldap://ipa.company.com:389
LDAP_BASE_DN=dc=company,dc=com
LDAP_USER_FILTER=(uid={username})
LDAP_GROUP_FILTER=(member={user_dn})
LDAP_ADMIN_GROUPS=cn=ssh-admins,cn=groups,cn=accounts,dc=company,dc=com
LDAP_AUDITOR_GROUPS=cn=ssh-auditors,cn=groups,cn=accounts,dc=company,dc=com
```

### SSH Key Setup for Deployment

The portal needs SSH access to managed HPC nodes to deploy authorized_keys files.

1. **Generate SSH key for the portal**:
```bash
ssh-keygen -t ed25519 -f /opt/ssh-portal/ssh-key -N ""
```

2. **Deploy public key to all HPC nodes**:
```bash
# Copy to each HPC node as root
ssh-copy-id -i /opt/ssh-portal/ssh-key.pub root@hpc-node-1
ssh-copy-id -i /opt/ssh-portal/ssh-key.pub root@hpc-node-2
```

3. **Update configuration**:
```bash
APPLY_SSH_USER=root
APPLY_SSH_KEY_PATH=/opt/ssh-portal/ssh-key
```

## Deployment

### Development Mode

```bash
# Terminal 1: Backend
cd backend-py
source venv/bin/activate
python -m app.main

# Terminal 2: Frontend
cd frontend
npm start
```

Access at: http://localhost:3001

### Production Deployment

#### Option 1: Systemd Services

1. **Create service files**:

`/etc/systemd/system/ssh-portal-backend.service`:
```ini
[Unit]
Description=SSH Portal Backend
After=network.target postgresql.service

[Service]
Type=simple
User=ssh-portal
Group=ssh-portal
WorkingDirectory=/opt/ssh-portal/backend-py
Environment=PATH=/opt/ssh-portal/backend-py/venv/bin
ExecStart=/opt/ssh-portal/backend-py/venv/bin/python -m app.main
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

2. **Start services**:
```bash
sudo systemctl enable ssh-portal-backend
sudo systemctl start ssh-portal-backend
sudo systemctl status ssh-portal-backend
```

3. **Setup Nginx reverse proxy**:

`/etc/nginx/sites-available/ssh-portal`:
```nginx
server {
    listen 80;
    server_name ssh-portal.company.com;
    
    # Frontend static files
    location / {
        root /opt/ssh-portal/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

#### Option 2: Docker Deployment

1. **Create Dockerfile** (backend):
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 3000

CMD ["python", "-m", "app.main"]
```

2. **Create docker-compose.yml**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hpc_ssh_portal
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend-py
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:your_secure_password@postgres:5432/hpc_ssh_portal
    depends_on:
      - postgres
    volumes:
      - ./ssh-keys:/opt/ssh-keys
      - ./logs:/app/logs

  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./frontend/build:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Initial Setup

### 1. Admin Account Setup

For LDAP environments, ensure your admin user is in the configured admin group.

For development/testing:
```bash
# Use demo credentials
Username: admin
Password: admin
```

### 2. Configure Policies

1. Login as admin
2. Navigate to Admin → Policies
3. Configure SSH key policies:

```json
{
  "allowed_algorithms": ["ssh-ed25519", "ssh-rsa"],
  "min_key_lengths": {
    "ssh-rsa": 2048,
    "ssh-ed25519": 256,
    "ecdsa-sha2-nistp256": 256
  },
  "default_ttl_days": 365,
  "max_keys_per_user": 5,
  "comment_regex": "^[a-zA-Z0-9@._-]+$",
  "allowed_options": [
    "no-port-forwarding",
    "no-agent-forwarding", 
    "no-X11-forwarding",
    "no-pty",
    "restrict",
    "from"
  ],
  "expiry_reminder_days": [30, 7, 1]
}
```

### 3. Add Managed Hosts

1. Go to Admin → Hosts
2. Add each HPC node:
   - **Hostname**: hpc-node-1.company.com
   - **Address**: 10.0.1.100
   - **OS Family**: linux

### 4. Create User-Host Account Mappings

1. Go to Admin → User-Host Accounts
2. Map users to their accounts on each host:
   - **User**: john.doe
   - **Host**: hpc-node-1.company.com  
   - **Remote Username**: jdoe

## Operations

### User Workflows

#### 1. Key Import
1. User logs in with LDAP credentials
2. Clicks "Import Key"
3. Pastes public key, adds comment/expiry
4. System validates against policy
5. Key is imported and queued for deployment

#### 2. Client-Side Generation (Preferred)
1. User clicks "Generate Key (Client)"
2. Browser generates key pair using Web Crypto API
3. Private key stays in browser, public key sent to server
4. User downloads private key immediately
5. Public key deployed to mapped hosts

#### 3. Server-Side Generation
1. User clicks "Generate Key (Server)"
2. Server generates key pair
3. Private key encrypted with one-time download token
4. User has 10 minutes to download private key
5. Public key deployed to mapped hosts

#### 4. Key Rotation
1. User selects existing key → "Rotate"
2. Provides new public key
3. Old key marked as deprecated
4. New key deployed, old key removed after successful deployment

### Admin Workflows

#### 1. Emergency Key Revocation
1. Admin goes to Admin → Emergency Controls
2. Enters fingerprint of compromised key
3. System revokes all matching keys across all users
4. Immediate deployment to all hosts

#### 2. User Management
1. Admin → Users shows all users with key counts
2. Can change user roles (user/admin/auditor)
3. Can disable/enable user accounts
4. Role changes take effect immediately

#### 3. Monitoring & Metrics
1. Admin → Metrics shows system health:
   - Active keys by status
   - Users by role  
   - Pending/failed deployments
   - Keys expiring soon

#### 4. Audit & Compliance
1. Admin → Audits provides searchable log
2. Filter by date, action, user, entity
3. Export to CSV/JSON for compliance
4. All actions logged with IP, timestamp, metadata

### Deployment Status Tracking

Users can view deployment status at Dashboard → Key Status:
- **Per-host deployment status** (success/failed/pending)
- **Last applied timestamps**
- **Error details** for failed deployments
- **Key counts** per host

## Monitoring

### Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Database connectivity
curl http://localhost:3000/api/v1/admin/metrics
```

### Log Locations

- **Application logs**: stdout/systemd journal
- **Audit events**: Database `audit_events` table
- **Background worker logs**: Application logs with worker prefixes
- **Deployment errors**: `deployments` table `error` column

### Key Metrics to Monitor

1. **Failed deployments** (last 24h)
2. **Keys expiring** (next 30 days)  
3. **Pending apply operations**
4. **Authentication failures**
5. **System generation requests** (pickup rate)

## Security Considerations

### Network Security
- **TLS termination** at reverse proxy
- **Firewall rules** limiting SSH access
- **VPN/bastion** for admin access

### Key Security  
- **Private keys** never stored long-term on server
- **One-time downloads** with expiry
- **Encryption** of temporary private keys
- **Atomic deployment** prevents partial updates

### Access Control
- **LDAP group mapping** for role assignment
- **JWT tokens** with configurable expiry
- **IP logging** for all actions
- **Session management** in frontend

### Audit & Compliance
- **Complete audit trail** of all actions
- **Immutable logs** in database
- **Export capabilities** for compliance
- **Retention policies** (configure cleanup)

## Troubleshooting

### Common Issues

#### 1. LDAP Authentication Fails
```bash
# Test LDAP connectivity
ldapsearch -x -H ldap://your-server:389 -D "cn=test,dc=company,dc=com" -W

# Check logs for specific error
tail -f /var/log/ssh-portal/backend.log
```

#### 2. SSH Deployment Fails
```bash
# Test SSH connectivity from portal server
ssh -i /opt/ssh-portal/ssh-key root@hpc-node-1

# Check deployment logs
sudo journalctl -u ssh-portal-backend | grep deployment
```

#### 3. Background Workers Not Processing
```bash
# Check worker status in logs
sudo journalctl -u ssh-portal-backend | grep worker

# Check apply queue status
psql -d hpc_ssh_portal -c "SELECT status, COUNT(*) FROM apply_queue GROUP BY status;"
```

#### 4. Database Connection Issues
```bash
# Test database connectivity
psql -h localhost -U ssh_portal_user -d hpc_ssh_portal -c "SELECT 1;"

# Check connection pool status in logs
sudo journalctl -u ssh-portal-backend | grep database
```

### Performance Tuning

#### Database Optimization
```sql
-- Add additional indexes if needed
CREATE INDEX idx_audit_events_entity_action ON audit_events(entity, action);
CREATE INDEX idx_deployments_finished_at ON deployments(finished_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM audit_events WHERE action = 'ssh_key_imported';
```

#### Worker Scaling
- Increase worker concurrency for large deployments
- Adjust retry delays and max retries
- Monitor queue depth and processing time

## Backup & Recovery

### Database Backup
```bash
# PostgreSQL backup
pg_dump -h localhost -U ssh_portal_user hpc_ssh_portal > backup.sql

# Restore
psql -h localhost -U ssh_portal_user -d hpc_ssh_portal < backup.sql
```

### Configuration Backup
- Backup `.env` files
- Backup SSH keys used for deployment
- Backup nginx/reverse proxy configuration

### Disaster Recovery
1. **Restore database** from backup
2. **Restore configuration** files
3. **Re-establish SSH connectivity** to hosts
4. **Verify LDAP connectivity**
5. **Test key deployment** to one host before full operation

## Support

For issues and questions:
1. Check application logs and audit events
2. Verify configuration against this guide
3. Test individual components (LDAP, SSH, database)
4. Review security policies and network connectivity

---

This deployment guide covers the complete setup and operation of the SSH Key Portal. For additional customization or integration requirements, refer to the API documentation and source code. 