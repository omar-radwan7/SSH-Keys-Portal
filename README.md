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
Just Check Quick-Start.md file
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
