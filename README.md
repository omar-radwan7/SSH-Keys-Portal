# HPC SSH Keys Portal

A comprehensive web-based portal for managing SSH keys across HPC (High Performance Computing) environments. This system provides centralized SSH key management, automated deployment, user administration, and comprehensive auditing capabilities.

## 🚀 Features

### Core Functionality
- **SSH Key Management**: Import existing keys, generate new keys (client-side or server-side), and manage key lifecycle
- **Automated Deployment**: Deploy SSH keys to multiple managed hosts via secure SSH connections
- **Multi-tenancy**: Support for multiple users with role-based access control
- **Key Lifecycle**: Handle key expiration, rotation, and revocation
- **Audit Trail**: Complete logging of all key operations and administrative actions

### User Features
- **Key Import**: Upload existing SSH public keys with validation
- **Key Generation**: 
  - Client-side generation (keys generated in browser)
  - Server-side generation (secure key generation with encrypted private key download)
- **Key Management**: View, revoke, and manage personal SSH keys
- **Multi-language Support**: Interface available in multiple languages
- **Key Status Tracking**: Monitor key status (active, expired, revoked)

### Administrative Features
- **User Management**: Create, modify, and manage user accounts
- **Host Management**: Add and configure managed HPC nodes
- **Role-Based Access**: Admin, user, and auditor roles with appropriate permissions
- **Bulk Operations**: Deploy keys to multiple hosts simultaneously
- **System Metrics**: Dashboard with usage statistics and system health
- **Policy Enforcement**: Configurable security policies for key algorithms and lengths

### Security Features
- **LDAP/AD Integration**: Enterprise directory authentication support
- **JWT Authentication**: Secure session management
- **Role-Based Authorization**: Granular permission system
- **Encrypted Storage**: Secure storage of sensitive data
- **Audit Logging**: Comprehensive activity tracking
- **Key Validation**: Automatic validation of SSH key formats and security

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **FastAPI**: Modern, fast web framework with automatic API documentation
- **SQLAlchemy**: Database ORM with support for PostgreSQL and SQLite
- **Pydantic**: Data validation and serialization
- **LDAP3**: Enterprise directory integration
- **Paramiko**: SSH automation for key deployment
- **JWT**: Secure authentication tokens
- **Cryptography**: Advanced cryptographic operations

### Frontend (React/TypeScript)
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication
- **Lucide React**: Beautiful, customizable icons

### Database
- **PostgreSQL**: Production database (recommended)
- **SQLite**: Development and testing database
- **Migrations**: Structured schema versioning and updates

## 📋 Requirements

### System Requirements
- **Python**: 3.11 or higher
- **Node.js**: 18 or higher
- **Database**: PostgreSQL 14+ (production) or SQLite (development)
- **Operating System**: Linux, macOS, or Windows

### Network Requirements
- Portal server → LDAP/AD server (ports 389/636) - if using LDAP authentication
- Portal server → Managed HPC nodes (port 22) - for SSH key deployment
- Users → Portal web interface (ports 3000/3001)

## 🚀 Quick Start (Development)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "SSH keys portal"
```

### 2. Backend Setup
```bash
cd backend-py

# Create virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cat > .env << 'EOF'
ENV=development
USE_SQLITE=true
JWT_SECRET=dev-secret-change-in-production
SYSGEN_ENCRYPTION_KEY=dev-sysgen-key-change-in-production
ALLOW_TEST_LOGIN=true
APPLY_SSH_USER=root
APPLY_SSH_KEY_PATH=~/.ssh/id_rsa
APPLY_STRICT_HOST_KEY_CHECK=false
FRONTEND_URL=http://localhost:3001
EOF

# Start the backend server
python -m uvicorn app.main:app --host 0.0.0.0 --port 3000
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cat > .env << 'EOF'
REACT_APP_API_BASE_URL=http://localhost:3000/api/v1
REACT_APP_ALLOW_TEST_LOGIN=true
EOF

# Start the frontend development server
npm start
```

### 4. Access the Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs

### 5. Default Credentials (Development)
- **Admin**: `admin` / `admin`
- **Test User**: Available via test login (if enabled)

## 🔧 Production Setup

### Database Configuration (PostgreSQL)

1. **Install PostgreSQL**:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install postgresql postgresql-contrib

# RHEL/CentOS/Fedora
sudo dnf install postgresql postgresql-server postgresql-contrib
```

2. **Create Database**:
```bash
sudo -u postgres psql
CREATE DATABASE hpc_ssh_portal;
CREATE USER ssh_portal_user WITH ENCRYPTED PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE hpc_ssh_portal TO ssh_portal_user;
\q
```

3. **Run Migrations**:
```bash
cd backend-py
# Update .env with PostgreSQL settings
export DATABASE_URL="postgresql+psycopg2://ssh_portal_user:secure_password_here@localhost:5432/hpc_ssh_portal"
export USE_SQLITE=false

# Migrations will run automatically on startup
```

### Environment Configuration

#### Backend (.env)
```bash
# Application
ENV=production
APP_NAME=HPC SSH Keys Portal
PORT=3000
FRONTEND_URL=https://your-domain.com

# Database
USE_SQLITE=false
DATABASE_URL=postgresql+psycopg2://ssh_portal_user:password@localhost:5432/hpc_ssh_portal

# Security
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_EXPIRES_HOURS=24
SYSGEN_ENCRYPTION_KEY=your-encryption-key-for-private-keys
SYSGEN_DOWNLOAD_TTL_MIN=10

# Authentication
ALLOW_TEST_LOGIN=false

# LDAP/AD (optional)
LDAP_URL=ldap://your-ldap-server:389
LDAP_BASE_DN=dc=company,dc=com
LDAP_USER_FILTER=(sAMAccountName={username})
LDAP_GROUP_FILTER=(member={user_dn})
LDAP_ADMIN_GROUPS=cn=SSH-Admins,ou=Groups,dc=company,dc=com
LDAP_AUDITOR_GROUPS=cn=SSH-Auditors,ou=Groups,dc=company,dc=com

# SSH Deployment
APPLY_SSH_USER=automation
APPLY_SSH_KEY_PATH=/etc/ssh-portal/automation_key
APPLY_STRICT_HOST_KEY_CHECK=true
```

#### Frontend (.env)
```bash
REACT_APP_API_BASE_URL=https://your-domain.com/api/v1
REACT_APP_ALLOW_TEST_LOGIN=false
```

### SSH Key Deployment Setup

The portal needs SSH access to managed hosts to deploy authorized_keys files:

1. **Generate SSH key for automation**:
```bash
ssh-keygen -t ed25519 -f /etc/ssh-portal/automation_key -N ""
```

2. **Deploy public key to managed hosts**:
```bash
# Copy to each managed host
ssh-copy-id -i /etc/ssh-portal/automation_key.pub automation@hpc-node-1
ssh-copy-id -i /etc/ssh-portal/automation_key.pub automation@hpc-node-2
```

3. **Configure appropriate permissions**:
```bash
chmod 600 /etc/ssh-portal/automation_key
chown ssh-portal:ssh-portal /etc/ssh-portal/automation_key
```

### Production Deployment

#### Option 1: Systemd Services

**Backend Service** (`/etc/systemd/system/ssh-portal-backend.service`):
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
ExecStart=/opt/ssh-portal/backend-py/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Frontend (Nginx Configuration)**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend static files
    location / {
        root /opt/ssh-portal/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
```

#### Option 2: Docker Deployment

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hpc_ssh_portal
      POSTGRES_USER: ssh_portal_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  backend:
    build: ./backend-py
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql+psycopg2://ssh_portal_user:secure_password@postgres:5432/hpc_ssh_portal
      - USE_SQLITE=false
    depends_on:
      - postgres
    volumes:
      - ./ssh-keys:/etc/ssh-portal
      
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## 📖 Usage Guide

### For End Users

1. **Login**: Use your credentials (LDAP/AD or local account)
2. **Import SSH Key**: Upload your existing public key
3. **Generate New Key**: 
   - Client-side: Generate in browser (more secure)
   - Server-side: Generate on server (convenient, one-time download)
4. **Manage Keys**: View status, revoke keys, download private keys (server-generated only)

### For Administrators

1. **User Management**: 
   - Create new user accounts
   - Assign roles (user, admin, auditor)
   - Reset passwords and manage user status

2. **Host Management**:
   - Add managed HPC nodes
   - Configure SSH connection details
   - Test connectivity

3. **Key Deployment**:
   - Select target hosts
   - Specify target username on remote hosts
   - Deploy all active keys to managed hosts

4. **System Monitoring**:
   - View usage statistics
   - Monitor system health
   - Review audit logs

## 🔒 Security Considerations

- **Key Storage**: Private keys (server-generated) are encrypted and automatically deleted after download
- **Network Security**: Use HTTPS in production, secure SSH connections for deployment
- **Access Control**: Implement proper firewall rules and network segmentation
- **Authentication**: Use LDAP/AD integration for enterprise environments
- **Audit**: Enable comprehensive logging and regular security reviews
- **Key Rotation**: Implement regular key rotation policies

## 🛠️ Troubleshooting

### Common Issues

**Login Loop**: Clear browser storage
```javascript
localStorage.clear(); 
sessionStorage.clear(); 
location.reload();
```

**SSH Deployment Failures**:
- Verify SSH connectivity to target hosts
- Check SSH key permissions and paths
- Ensure target user exists on remote hosts
- Review backend logs for detailed error messages

**Database Connection Issues**:
- Verify PostgreSQL is running and accessible
- Check database credentials and connection string
- Ensure database exists and user has proper permissions

**LDAP Authentication Problems**:
- Test LDAP connectivity from the server
- Verify LDAP configuration parameters
- Check user DN format and group memberships

### Health Checks

- **Backend API**: `GET http://localhost:3000/health` → `{"success": true}`
- **Database**: Check connection in backend logs
- **Frontend**: Verify static files are served correctly

## 📝 API Documentation

The backend provides comprehensive API documentation via FastAPI's automatic documentation:

- **Swagger UI**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc
- **OpenAPI Schema**: http://localhost:3000/openapi.json

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Examine backend logs for detailed error information

---

**Note**: This is a production-ready SSH key management system. Ensure proper security measures, regular backups, and appropriate access controls are in place before deploying in a production environment.
