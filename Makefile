# SSH Keys Portal - Cross-Platform Makefile
# ==========================================
# Works on Windows (with make), macOS, and Linux

.PHONY: help install setup dev clean test lint format build deploy docker status logs backup windows-setup

# Detect OS for cross-platform compatibility
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
    PYTHON := python
    PIP := pip
    VENV_ACTIVATE := venv\Scripts\activate.bat
    VENV_PYTHON := venv\Scripts\python.exe
    SHELL := cmd
    RM := del /f /q
    RMDIR := rmdir /s /q
    MKDIR := mkdir
    SEP := \\
    REQUIREMENTS := requirements-windows.txt
else
    DETECTED_OS := $(shell uname -s)
    PYTHON := python3
    PIP := pip3
    VENV_ACTIVATE := venv/bin/activate
    VENV_PYTHON := venv/bin/python
    RM := rm -f
    RMDIR := rm -rf
    MKDIR := mkdir -p
    SEP := /
    REQUIREMENTS := requirements.txt
endif

# Default target
help: ## Show this help message
	@echo "SSH Keys Portal - Available Commands ($(DETECTED_OS)):"
	@echo "=================================================="
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  make auto-setup    - Full automated setup"
	@echo "  make dev           - Start development servers"
	@echo ""
	@echo "📦 Setup Commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make setup         - Complete setup with database"
	@echo ""
	@echo "🔧 Development:"
	@echo "  make dev-backend   - Start backend only"
	@echo "  make dev-frontend  - Start frontend only"
	@echo "  make test          - Run tests"
	@echo "  make clean         - Clean temporary files"
	@echo ""
ifeq ($(DETECTED_OS),Windows)
	@echo "💡 Windows Users (if make not installed):"
	@echo "  npm run setup           - Shows setup options"
	@echo "  setup-windows.bat       - Direct Windows setup"
endif
	@echo ""
	@echo "📖 For detailed help: make info"

# =============================================================================
# AUTOMATIC ENVIRONMENT SETUP
# =============================================================================

check-system: ## Check and install system dependencies
	@echo "🔍 Checking system dependencies..."
	@$(MAKE) check-python
	@$(MAKE) check-node
	@$(MAKE) check-git
	@echo "✅ System check complete!"

check-python: ## Check Python installation (cross-platform)
	@echo "🐍 Checking Python installation..."
ifeq ($(DETECTED_OS),Windows)
	@python --version >nul 2>&1 && echo "✅ Python found: $$(python --version)" || \
	(python3 --version >nul 2>&1 && echo "✅ Python3 found: $$(python3 --version)" || \
	(py --version >nul 2>&1 && echo "✅ Python launcher found: $$(py --version)" || \
	(echo "❌ Python not found! Install from https://python.org" && echo "⚠️  Make sure to check 'Add Python to PATH'" && exit 1)))
else
	@command -v python3 >/dev/null 2>&1 && echo "✅ Python3 found: $$(python3 --version)" || \
	(echo "❌ Python3 not found. Installing..." && \
	(command -v apt-get >/dev/null 2>&1 && sudo apt-get update && sudo apt-get install -y python3 python3-pip python3-venv) || \
	(command -v yum >/dev/null 2>&1 && sudo yum install -y python3 python3-pip) || \
	(command -v brew >/dev/null 2>&1 && brew install python3) || \
	(echo "⚠️  Please install Python3 manually from https://python.org" && exit 1))
endif

check-node: ## Check and install Node.js
	@echo "⚛️  Checking Node.js installation..."
	@if ! command -v node >/dev/null 2>&1; then \
		echo "❌ Node.js not found. Installing..."; \
		if command -v curl >/dev/null 2>&1; then \
			curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -; \
			sudo apt-get install -y nodejs; \
		elif command -v wget >/dev/null 2>&1; then \
			wget -qO- https://deb.nodesource.com/setup_lts.x | sudo -E bash -; \
			sudo apt-get install -y nodejs; \
		elif command -v brew >/dev/null 2>&1; then \
			brew install node; \
		else \
			echo "⚠️  Please install Node.js manually from https://nodejs.org"; \
			exit 1; \
		fi; \
	else \
		echo "✅ Node.js found: $$(node --version)"; \
	fi
	@if ! command -v npm >/dev/null 2>&1; then \
		echo "❌ npm not found with Node.js installation"; \
		exit 1; \
	else \
		echo "✅ npm found: $$(npm --version)"; \
	fi

check-git: ## Check Git installation
	@echo "📂 Checking Git installation..."
	@if ! command -v git >/dev/null 2>&1; then \
		echo "❌ Git not found. Installing..."; \
		if command -v apt-get >/dev/null 2>&1; then \
			sudo apt-get update && sudo apt-get install -y git; \
		elif command -v yum >/dev/null 2>&1; then \
			sudo yum install -y git; \
		elif command -v brew >/dev/null 2>&1; then \
			brew install git; \
		else \
			echo "⚠️  Please install Git manually"; \
			exit 1; \
		fi; \
	else \
		echo "✅ Git found: $$(git --version)"; \
	fi

# =============================================================================
# SETUP & INSTALLATION
# =============================================================================

install: check-system ## Install all dependencies (backend + frontend)
	@echo "📦 Installing dependencies..."
	$(MAKE) setup-venv
	$(MAKE) install-backend
	$(MAKE) install-frontend

setup-venv: ## Create Python virtual environment
	@echo "🐍 Setting up Python virtual environment..."
ifeq ($(DETECTED_OS),Windows)
	@if not exist "backend-py\venv" ( \
		cd backend-py && $(PYTHON) -m venv venv && \
		echo "✅ Virtual environment created" \
	) else ( \
		echo "✅ Virtual environment already exists" \
	)
else
	@if [ ! -d "backend-py/venv" ]; then \
		cd backend-py && $(PYTHON) -m venv venv; \
		echo "✅ Virtual environment created"; \
	else \
		echo "✅ Virtual environment already exists"; \
	fi
endif

install-backend: ## Install Python backend dependencies
	@echo "🐍 Installing backend dependencies..."
ifeq ($(DETECTED_OS),Windows)
	@cd backend-py && ( \
		if exist venv\Scripts\activate.bat ( \
			call venv\Scripts\activate.bat && \
			python -m pip install --upgrade pip && \
			pip install -r $(REQUIREMENTS) \
		) else ( \
			echo "❌ Virtual environment not found. Creating it first..." && \
			$(PYTHON) -m venv venv && \
			call venv\Scripts\activate.bat && \
			python -m pip install --upgrade pip && \
			pip install -r $(REQUIREMENTS) \
		) \
	)
else
	@cd backend-py && \
		if [ -d "venv" ]; then \
			. venv/bin/activate && \
			python -m pip install --upgrade pip && \
			pip install -r $(REQUIREMENTS); \
		else \
			echo "❌ Virtual environment not found. Creating it first..."; \
			$(PYTHON) -m venv venv && \
			. venv/bin/activate && \
			python -m pip install --upgrade pip && \
			pip install -r $(REQUIREMENTS); \
		fi
endif
	@echo "✅ Backend dependencies installed"

install-frontend: ## Install Node.js frontend dependencies
	@echo "⚛️  Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Frontend dependencies installed"

auto-setup: ## Fully automated setup (everything from scratch)
	@echo "🚀 Starting fully automated setup..."
	@echo "This will install system dependencies, create virtual environments, and set up the project"
	@$(MAKE) check-system
	@$(MAKE) install
	@$(MAKE) setup-db
	@echo ""
	@echo "🎉 AUTO-SETUP COMPLETE!"
	@echo "======================================"
	@echo "✅ System dependencies installed"
	@echo "✅ Python virtual environment created"
	@echo "✅ Backend dependencies installed"
	@echo "✅ Frontend dependencies installed"
	@echo "✅ Database initialized"
	@echo ""
	@echo "🚀 Ready to run: make dev"

setup: install ## Complete project setup (install + database)
	@echo "🚀 Setting up project..."
	$(MAKE) setup-db
	@echo "✅ Setup complete!"

setup-db: ## Initialize database with migrations
	@echo "🗄️  Setting up database..."
	cd backend-py && python -c "from app.core.db import init_db; init_db()"

# =============================================================================
# DEVELOPMENT
# =============================================================================

dev: ## Start both backend and frontend in development mode
	@echo "🔥 Starting development servers..."
	/usr/bin/make dev-backend &
	/usr/bin/make dev-frontend &
	@echo "✅ Development servers started!"
	@echo "   Backend:  http://localhost:3000"
	@echo "   Frontend: http://localhost:3001"

dev-backend: ## Start backend development server
	@echo "🐍 Starting backend server..."
	@cd backend-py && \
		if [ -d "venv" ]; then \
			. venv/bin/activate && python run.py; \
		else \
			python run.py; \
		fi

dev-frontend: ## Start frontend development server
	@echo "⚛️  Starting frontend server..."
	cd frontend && npm start

dev-backend-debug: ## Start backend with debug logging
	@echo "🐛 Starting backend in debug mode..."
	@cd backend-py && \
		if [ -d "venv" ]; then \
			. venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload --log-level debug; \
		else \
			python -m uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload --log-level debug; \
		fi

# =============================================================================
# TESTING & QUALITY
# =============================================================================

test: ## Run all tests
	@echo "🧪 Running tests..."
	$(MAKE) test-backend
	$(MAKE) test-frontend

test-backend: ## Run backend tests
	@echo "🐍 Running backend tests..."
	cd backend-py && python -m pytest tests/ -v

test-frontend: ## Run frontend tests
	@echo "⚛️  Running frontend tests..."
	cd frontend && npm test

lint: ## Run linting on all code
	@echo "🔍 Running linters..."
	$(MAKE) lint-backend
	$(MAKE) lint-frontend

lint-backend: ## Lint Python backend code
	@echo "🐍 Linting backend..."
	cd backend-py && python -m flake8 app/
	cd backend-py && python -m mypy app/

lint-frontend: ## Lint TypeScript frontend code
	@echo "⚛️  Linting frontend..."
	cd frontend && npm run lint

format: ## Format all code
	@echo "✨ Formatting code..."
	$(MAKE) format-backend
	$(MAKE) format-frontend

format-backend: ## Format Python backend code
	@echo "🐍 Formatting backend..."
	cd backend-py && python -m black app/
	cd backend-py && python -m isort app/

format-frontend: ## Format TypeScript frontend code
	@echo "⚛️  Formatting frontend..."
	cd frontend && npm run format

# =============================================================================
# BUILD & DEPLOYMENT
# =============================================================================

build: ## Build production assets
	@echo "🏗️  Building production assets..."
	$(MAKE) build-frontend

build-frontend: ## Build frontend for production
	@echo "⚛️  Building frontend..."
	cd frontend && npm run build

deploy: build ## Deploy to production
	@echo "🚀 Deploying to production..."
	@echo "⚠️  Deploy script needs to be configured for your environment"

# =============================================================================
# DOCKER OPERATIONS
# =============================================================================

docker-build: ## Build Docker images
	@echo "🐳 Building Docker images..."
	docker-compose build

docker-up: ## Start services with Docker Compose
	@echo "🐳 Starting Docker services..."
	docker-compose up -d

docker-down: ## Stop Docker services
	@echo "🐳 Stopping Docker services..."
	docker-compose down

docker-logs: ## Show Docker logs
	@echo "📋 Docker logs..."
	docker-compose logs -f

docker-clean: ## Clean Docker containers and images
	@echo "🧹 Cleaning Docker resources..."
	docker-compose down -v
	docker system prune -f

# =============================================================================
# DATABASE OPERATIONS
# =============================================================================

db-migrate: ## Run database migrations
	@echo "🗄️  Running database migrations..."
	cd backend-py && python -c "from app.core.db import run_migrations; run_migrations()"

db-reset: ## Reset database (⚠️  DESTRUCTIVE)
	@echo "⚠️  Resetting database..."
	@read -p "Are you sure? This will delete all data! [y/N]: " confirm && [ "$$confirm" = "y" ]
	cd backend-py && rm -f *.db
	$(MAKE) setup-db

db-backup: ## Create database backup
	@echo "💾 Creating database backup..."
	cd backend-py && cp hpc_ssh_portal.db "backups/db_backup_$$(date +%Y%m%d_%H%M%S).db"

# =============================================================================
# MONITORING & MAINTENANCE
# =============================================================================

status: ## Check service status
	@echo "📊 Service Status:"
	@echo "=================="
	@echo -n "Backend (port 3000): "
	@curl -s http://localhost:3000/health >/dev/null 2>&1 && echo "✅ Running" || echo "❌ Down"
	@echo -n "Frontend (port 3001): "
	@curl -s http://localhost:3001 >/dev/null 2>&1 && echo "✅ Running" || echo "❌ Down"

logs: ## Show application logs
	@echo "📋 Application logs..."
	@echo "Backend logs:"
	@tail -f backend-py/logs/*.log 2>/dev/null || echo "No backend logs found"

clean: ## Clean temporary files and caches
	@echo "🧹 Cleaning temporary files..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	cd frontend && npm run clean 2>/dev/null || true
	cd backend-py && rm -rf .pytest_cache/ 2>/dev/null || true

clean-all: clean ## Clean everything including node_modules and venv
	@echo "🧹 Deep cleaning..."
	rm -rf frontend/node_modules/
	rm -rf backend-py/venv/
	rm -rf backend-py/.venv/

# =============================================================================
# UTILITIES
# =============================================================================

kill-ports: ## Kill processes on development ports
	@echo "🔪 Killing processes on ports 3000 and 3001..."
	-fuser -k 3000/tcp 2>/dev/null || true
	-fuser -k 3001/tcp 2>/dev/null || true
	@echo "✅ Ports cleared"

health-check: ## Comprehensive health check
	@echo "🏥 Health Check:"
	@echo "==============="
	$(MAKE) status
	@echo ""
	@echo "Dependencies:"
	@python --version 2>/dev/null && echo "✅ Python installed" || echo "❌ Python missing"
	@node --version 2>/dev/null && echo "✅ Node.js installed" || echo "❌ Node.js missing"
	@docker --version 2>/dev/null && echo "✅ Docker installed" || echo "❌ Docker missing"

backup: ## Create full project backup
	@echo "💾 Creating project backup..."
	@mkdir -p backups
	@tar -czf "backups/project_backup_$$(date +%Y%m%d_%H%M%S).tar.gz" \
		--exclude=node_modules \
		--exclude=venv \
		--exclude=.venv \
		--exclude=__pycache__ \
		--exclude=.git \
		--exclude=backups \
		.
	@echo "✅ Backup created in backups/ directory"

update: ## Update all dependencies
	@echo "⬆️  Updating dependencies..."
	cd backend-py && pip install --upgrade -r requirements.txt
	cd frontend && npm update
	@echo "✅ Dependencies updated"

# =============================================================================
# QUICK COMMANDS
# =============================================================================

start: dev ## Alias for dev
stop: kill-ports ## Stop all development servers
restart: stop dev ## Restart development servers

# Environment info
info: ## Show project information
	@echo "SSH Keys Portal - Project Information"
	@echo "===================================="
	@echo ""
	@echo "🚀 QUICK START (No dependencies needed!):"
	@echo "  git clone <your-repo>"
	@echo "  cd SSH-Keys-Portal"
	@echo "  make auto-setup    # Installs everything automatically"
	@echo "  make dev           # Start development servers"
	@echo ""
	@echo "📁 Project Structure:"
	@echo "  📁 backend-py/     - Python FastAPI backend"
	@echo "  📁 frontend/       - React TypeScript frontend"
	@echo "  📁 migrations/     - Database migrations"
	@echo ""
	@echo "🌐 Development URLs:"
	@echo "  🌐 Backend API:    http://localhost:3000"
	@echo "  🌐 Frontend App:   http://localhost:3001"
	@echo "  📚 API Docs:       http://localhost:3000/docs"
	@echo ""
	@echo "⚡ Key Commands:"
	@echo "  make auto-setup   - Full automated setup (installs everything)"
	@echo "  make dev          - Start both servers"
	@echo "  make test         - Run all tests"
	@echo "  make build        - Build for production"
	@echo "  make help         - Show all commands"
	@echo ""
	@echo "🔧 System Requirements:"
	@echo "  ✅ Automatically installs: Python3, Node.js, pip, npm"
	@echo "  ✅ Creates virtual environments automatically"
	@echo "  ✅ No manual dependency installation needed!"

first-time: auto-setup ## First time setup for new users (alias for auto-setup)
	@echo "✅ First-time setup complete!"

# =============================================================================
# WINDOWS SPECIFIC HELPERS
# =============================================================================

windows-setup: ## Setup make on Windows (install instructions)
	@echo "🪟 Windows Make Installation Guide:"
	@echo "==================================="
	@echo ""
	@echo "Auto-Install Options:"
	@echo "  1. Chocolatey: choco install make -y"
	@echo "  2. Scoop: scoop install make"
	@echo "  3. winget: winget install GnuWin32.Make"
	@echo ""
	@echo "Manual Options:"
	@echo "  1. Download Git Bash: https://git-scm.com/download/win"
	@echo "  2. Use WSL: wsl --install"
	@echo ""
	@echo "No-Make Fallbacks:"
	@echo "  1. Windows: setup-windows.bat auto-setup"
	@echo "  2. PowerShell: setup.ps1 auto-setup"
	@echo "  3. npm: npm run setup (if available)"
	@echo ""

install-make-windows: ## Auto-install make on Windows
ifeq ($(DETECTED_OS),Windows)
	@echo "🔧 Auto-installing make for Windows..."
	@powershell -Command "if (Get-Command choco -ErrorAction SilentlyContinue) { choco install make -y } elseif (Get-Command scoop -ErrorAction SilentlyContinue) { scoop install make } elseif (Get-Command winget -ErrorAction SilentlyContinue) { winget install GnuWin32.Make } else { echo 'Please install Chocolatey, Scoop, or winget first' }"
	@echo "✅ Make installation attempted. Please restart your terminal."
else
	@echo "This command is only for Windows systems"
endif

windows-check: ## Check if Windows environment is ready for make
ifeq ($(DETECTED_OS),Windows)
	@echo "🪟 Windows Environment Check:"
	@echo "============================="
	@where make >nul 2>&1 && echo "✅ Make is available" || echo "❌ Make not found - run 'make windows-setup'"
	@python --version >nul 2>&1 && echo "✅ Python found" || echo "❌ Python not found"
	@node --version >nul 2>&1 && echo "✅ Node.js found" || echo "❌ Node.js not found"
	@git --version >nul 2>&1 && echo "✅ Git found" || echo "❌ Git not found"
else
	@echo "This command is only for Windows systems"
endif 