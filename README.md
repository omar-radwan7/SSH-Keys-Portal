# HPC SSH Keys Portal

A comprehensive web-based portal for managing SSH keys across HPC (High Performance Computing) environments. The system provides centralized SSH key lifecycle management, automated deployment, user administration, and comprehensive auditing to operate securely at scale.

## Why this project?

HPC environments span many nodes and users. Manual SSH key distribution is error prone, hard to audit, and risky. This portal:
- Centralizes SSH key lifecycle management (creation, rotation, revocation)
- Enforces consistent security policies across clusters
- Automates deployment to managed hosts
- Provides full auditing for compliance and forensics
- Reduces operational toil and eliminates configuration drift

## Features

### Core Functionality
- SSH Key Management: import existing keys, generate new keys, manage lifecycle
- Automated Deployment: push authorized keys to many hosts via secure SSH
- Multi-tenancy: multiple users with role-based access control
- Key Lifecycle: expiration, rotation, revocation workflows
- Audit Trail: complete logging of user and administrator actions

### User Features
- Key import with validation
- Key generation (client-side or server-side with secure download)
- Manage personal keys and statuses (active, expired, revoked)
- Multi-language user interface
- Key status tracking

### Administrative Features
- User management (create, manage, roles)
- Host management (add, configure, test HPC nodes)
- Role-based authorization (administrator, user, auditor)
- Bulk operations (deploy to multiple hosts)
- Metrics

## Architecture

**Frontend**: React (modern, responsive single page application)  
**Backend**: Python (FastAPI and SQLAlchemy)  
**Database**: PostgreSQL  
**Deployment**: Docker, systemd, Nginx  
**Security**: JSON Web Token based authentication, HTTPS, Role Based Access Control

## Usage Overview

1. Administrator sets up users and HPC hosts  
2. Users add or generate SSH keys  
3. Keys can be deployed to configured hosts  
4. Audit logs record every operation  

## Zero-Dependency Quick Start

Works without installing Node, Python, or PostgreSQL manually.  

### Linux and macOS
```bash
git clone https://github.com/your-org/hpc-ssh-keys-portal.git
cd hpc-ssh-keys-portal
make setup
make run
Windows (PowerShell)
powershell
Copy code
git clone https://github.com/your-org/hpc-ssh-keys-portal.git
cd hpc-ssh-keys-portal
.\make.ps1 setup
.\make.ps1 run
Requirements
Docker and Docker Compose

Make (Linux and macOS) or PowerShell (Windows)

Installation and Setup
Automatic (Recommended)
bash
Copy code
make setup
make run
Manual
Install Python 3.10+, Node.js, PostgreSQL

Configure .env file

Run backend and frontend separately

Database Setup
bash
Copy code
make migrate
Or manually with Alembic migrations.

Production Setup
Reverse proxy with Nginx

HTTPS via Let’s Encrypt

systemd service files for backend and frontend

Usage Guide
Access portal at http://localhost:3000

Login with administrator credentials

Add SSH keys, users, and hosts via the dashboard

Troubleshooting
Check logs with make logs

Rebuild containers with make rebuild

Reset database with make reset-db

API Documentation
Backend provides interactive API documentation (Swagger UI):
http://localhost:8000/docs

Makefile Automation
Common commands:

bash
Copy code
make setup       # Initial setup
make run         # Start all services
make stop        # Stop services
make logs        # Tail logs
make migrate     # Apply database migrations
make rebuild     # Rebuild containers
