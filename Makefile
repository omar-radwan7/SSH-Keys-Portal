# SSH Keys Portal - Cross-Platform Makefile
# ==========================================
# Works on Windows, macOS, and Linux

.PHONY: dev stop status install help clean

# Detect operating system
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
    PYTHON := python
    PIP := pip
    VENV_ACTIVATE := backend-py\venv\Scripts\activate
    VENV_PYTHON := backend-py\venv\Scripts\python
    VENV_PIP := backend-py\venv\Scripts\pip
    KILL_CMD := taskkill /F /PID
    PORT_KILL := netstat -ano | findstr :3000 && for /f "tokens=5" %a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %a || echo "Port 3000 clear"
    MKDIR := mkdir
    RM := del /Q
    RMDIR := rmdir /S /Q
    SEPARATOR := \\
else
    UNAME_S := $(shell uname -s)
    ifeq ($(UNAME_S),Linux)
        DETECTED_OS := Linux
    endif
    ifeq ($(UNAME_S),Darwin)
        DETECTED_OS := macOS
    endif
    PYTHON := python3
    PIP := pip3
    VENV_ACTIVATE := backend-py/venv/bin/activate
    VENV_PYTHON := backend-py/venv/bin/python
    VENV_PIP := backend-py/venv/bin/pip
    KILL_CMD := kill -9
    PORT_KILL := fuser -k 3000/tcp 2>/dev/null || true; fuser -k 3001/tcp 2>/dev/null || true
    MKDIR := mkdir -p
    RM := rm -f
    RMDIR := rm -rf
    SEPARATOR := /
endif

help: ## Show this help message
	@echo "SSH Keys Portal - Cross-Platform Commands"
	@echo "========================================"
	@echo "Detected OS: $(DETECTED_OS)"
	@echo ""
	@echo "Available commands:"
	@echo "  make dev     - Start both backend and frontend"
	@echo "  make stop    - Stop all services"
	@echo "  make status  - Check service status"
	@echo "  make install - Install dependencies"
	@echo "  make clean   - Clean temporary files"
	@echo ""

dev: stop ## Start both backend and frontend in development mode
	@echo "🔥 Starting development servers on $(DETECTED_OS)..."
ifeq ($(DETECTED_OS),Windows)
	@powershell -NoProfile -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','cd backend-py && venv\\Scripts\\activate && python run.py >> ..\\backend.log 2>&1' -WindowStyle Hidden"
	@powershell -NoProfile -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','cd frontend && set PORT=3001 && set BROWSER=none && npm start >> ..\\frontend.log 2>&1' -WindowStyle Hidden"
else
	@cd backend-py && . venv/bin/activate && nohup python run.py > ../backend.log 2>&1 & echo $$! > ../backend.pid
	@cd frontend && PORT=3001 nohup npm start > ../frontend.log 2>&1 & echo $$! > ../frontend.pid
endif
	@echo "✅ Development servers started!"
	@echo "🐍 Backend:  http://localhost:3000"
	@echo "⚛️  Frontend: http://localhost:3001"

stop: ## Stop all development servers
	@echo "🔪 Stopping servers on $(DETECTED_OS)..."
ifeq ($(DETECTED_OS),Windows)
	@-taskkill /F /IM python.exe /T 2>nul || echo "No Python processes found"
	@-taskkill /F /IM node.exe /T 2>nul || echo "No Node processes found"
	@-cmd /c for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a 2>nul
	@-cmd /c for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a 2>nul
else
	@-if [ -f backend.pid ]; then kill -9 $$(cat backend.pid) 2>/dev/null || true; rm -f backend.pid; fi
	@-if [ -f frontend.pid ]; then kill -9 $$(cat frontend.pid) 2>/dev/null || true; rm -f frontend.pid; fi
	@-fuser -k 3000/tcp 2>/dev/null || true
	@-fuser -k 3001/tcp 2>/dev/null || true
endif
	@echo "✅ Servers stopped"

status: ## Check service status
	@echo "📊 Service Status on $(DETECTED_OS):"
	@echo "============================"
ifeq ($(DETECTED_OS),Windows)
	@powershell -NoProfile -Command "Write-Host 'Backend (port 3000): ' -NoNewline; try { $resp = Invoke-WebRequest -UseBasicParsing 'http://localhost:3000/health' -TimeoutSec 2; if ($resp.StatusCode -eq 200) { Write-Host '✅ Running' } else { Write-Host '❌ Down' } } catch { Write-Host '❌ Down' }"
	@powershell -NoProfile -Command "Write-Host 'Frontend (port 3001): ' -NoNewline; try { $resp = Invoke-WebRequest -UseBasicParsing 'http://localhost:3001' -TimeoutSec 2; if ($resp.StatusCode -eq 200) { Write-Host '✅ Running' } else { Write-Host '❌ Down' } } catch { Write-Host '❌ Down' }"
else
	@printf "Backend (port 3000): " && curl -s http://localhost:3000/health >/dev/null 2>&1 && echo "✅ Running" || echo "❌ Down"
	@printf "Frontend (port 3001): " && curl -s http://localhost:3001 >/dev/null 2>&1 && echo "✅ Running" || echo "❌ Down"
endif

install: ## Install all dependencies
	@echo "📦 Installing dependencies on $(DETECTED_OS)..."
	@echo "Creating Python virtual environment..."
ifeq ($(DETECTED_OS),Windows)
	@cd backend-py && $(PYTHON) -m venv venv
	@cd backend-py && venv\Scripts\activate && pip install --upgrade pip
	@cd backend-py && venv\Scripts\activate && pip install fastapi uvicorn pydantic-settings sqlalchemy ldap3 PyJWT email-validator passlib cryptography paramiko python-multipart bcrypt
else
	@cd backend-py && $(PYTHON) -m venv venv
	@cd backend-py && . venv/bin/activate && pip install --upgrade pip
	@cd backend-py && . venv/bin/activate && pip install fastapi uvicorn pydantic-settings sqlalchemy ldap3 PyJWT email-validator passlib cryptography paramiko python-multipart bcrypt
endif
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "✅ All dependencies installed successfully!"

clean: ## Clean temporary files and caches
	@echo "🧹 Cleaning temporary files on $(DETECTED_OS)..."
ifeq ($(DETECTED_OS),Windows)
	@-del /S /Q *.pyc 2>nul || echo ""
	@-for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /S /Q "%%d" 2>nul || echo ""
	@-for /d /r . %%d in (.pytest_cache) do @if exist "%%d" rmdir /S /Q "%%d" 2>nul || echo ""
	@-del /Q backend.log frontend.log backend.pid frontend.pid 2>nul || echo ""
else
	@-find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@-find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@-find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@-rm -f backend.log frontend.log backend.pid frontend.pid 2>/dev/null || true
endif
	@echo "✅ Cleanup complete"

# Platform-specific installation helpers
install-windows: ## Install on Windows
	@echo "Installing for Windows..."
	@powershell -Command "if (!(Get-Command python -ErrorAction SilentlyContinue)) { echo 'Please install Python from https://python.org' }"
	@powershell -Command "if (!(Get-Command node -ErrorAction SilentlyContinue)) { echo 'Please install Node.js from https://nodejs.org' }"
	@$(MAKE) install

install-macos: ## Install on macOS
	@echo "Installing for macOS..."
	@command -v python3 >/dev/null 2>&1 || { echo "Please install Python3: brew install python3"; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo "Please install Node.js: brew install node"; exit 1; }
	@$(MAKE) install

install-linux: ## Install on Linux
	@echo "Installing for Linux..."
	@command -v python3 >/dev/null 2>&1 || { echo "Please install Python3: sudo apt-get install python3 python3-pip python3-venv"; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo "Please install Node.js: sudo apt-get install nodejs npm"; exit 1; }
	@$(MAKE) install

# Development helpers
logs: ## Show application logs
	@echo "📄 Application logs:"
ifeq ($(DETECTED_OS),Windows)
	@if exist backend.log type backend.log
	@if exist frontend.log type frontend.log
else
	@if [ -f backend.log ]; then echo "=== Backend Logs ==="; tail -20 backend.log; fi
	@if [ -f frontend.log ]; then echo "=== Frontend Logs ==="; tail -20 frontend.log; fi
endif

info: ## Show project information
	@echo "SSH Keys Portal - Project Information"
	@echo "===================================="
	@echo "OS: $(DETECTED_OS)"
	@echo "Python: $(PYTHON)"
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  1. make install    # Install dependencies"
	@echo "  2. make dev        # Start development servers"
	@echo "  3. make status     # Check if running"
	@echo ""
	@echo "🌐 URLs:"
	@echo "  Backend API:    http://localhost:3000"
	@echo "  Frontend App:   http://localhost:3001"
	@echo "  API Docs:       http://localhost:3000/docs"
	@echo ""
	@echo "🛠️  Commands:"
	@echo "  make stop       # Stop servers"
	@echo "  make logs       # View logs"
	@echo "  make clean      # Clean temp files"
