@echo off
REM SSH Keys Portal - Windows Setup Script (Fixed)
REM ===============================================

setlocal enabledelayedexpansion

if "%1"=="auto-setup" goto auto_setup
if "%1"=="dev" goto dev
if "%1"=="dev-backend" goto dev_backend
if "%1"=="dev-frontend" goto dev_frontend
if "%1"=="install" goto install
if "%1"=="test" goto test
if "%1"=="clean" goto clean
if "%1"=="help" goto help
if "%1"=="" goto help

:help
echo.
echo SSH Keys Portal - Windows Commands:
echo ====================================
echo.
echo setup-windows.bat auto-setup    - Full automated setup (installs everything)
echo setup-windows.bat dev           - Start both backend and frontend
echo setup-windows.bat dev-backend   - Start backend only
echo setup-windows.bat dev-frontend  - Start frontend only
echo setup-windows.bat install       - Install dependencies
echo setup-windows.bat test          - Run tests
echo setup-windows.bat clean         - Clean temporary files
echo setup-windows.bat help          - Show this help
echo.
echo Prerequisites for Windows:
echo - Python 3.11+ (https://python.org) - CHECK "Add Python to PATH"
echo - Node.js 18+ (https://nodejs.org)
echo - Git (https://git-scm.com)
echo.
echo IMPORTANT: Run this script from the SSH-Keys-Portal root directory!
echo.
goto end

:auto_setup
echo.
echo Starting fully automated setup...
echo ===================================
call :check_location
call :check_python
call :check_node
call :check_git
call :install_deps
echo.
echo Setup complete! Run: setup-windows.bat dev
goto end

:check_location
if not exist "backend-py" (
    echo ERROR: backend-py directory not found!
    echo Please run this script from the SSH-Keys-Portal root directory
    echo Current directory: %CD%
    exit /b 1
)
if not exist "frontend" (
    echo ERROR: frontend directory not found!
    echo Please run this script from the SSH-Keys-Portal root directory
    echo Current directory: %CD%
    exit /b 1
)
goto :eof

:check_python
echo Checking Python installation...
set PYTHON_CMD=

REM Try python command
python --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=python
    python --version
    echo Python found!
    goto :eof
)

REM Try python3 command
python3 --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=python3
    python3 --version
    echo Python3 found!
    goto :eof
)

REM Try py launcher
py --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=py
    py --version
    echo Python launcher found!
    goto :eof
)

echo ERROR: Python not found in PATH!
echo.
echo Please install Python 3.11+ from https://python.org
echo IMPORTANT: Check "Add Python to PATH" during installation
echo.
echo If Python is already installed:
echo 1. Uninstall and reinstall with "Add to PATH" option
echo 2. Or manually add Python to your PATH environment variable
echo.
exit /b 1

:check_node
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found!
    echo Please install Node.js 18+ from https://nodejs.org
    exit /b 1
) else (
    node --version
    npm --version
    echo Node.js and npm found!
)
goto :eof

:check_git
echo Checking Git installation...
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git not found!
    echo Please install Git from https://git-scm.com
    exit /b 1
) else (
    git --version
    echo Git found!
)
goto :eof

:install_deps
echo Installing dependencies...
echo ==========================

REM Backend setup
echo Setting up Python backend...
cd backend-py

if not exist venv (
    echo Creating Python virtual environment...
    %PYTHON_CMD% -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        echo Make sure Python is properly installed and in PATH
        cd ..
        exit /b 1
    )
)

echo Activating virtual environment and installing dependencies...
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    if errorlevel 1 (
        echo ERROR: Failed to upgrade pip
        cd ..
        exit /b 1
    )
    if exist requirements-windows.txt (
        echo Using Windows-specific requirements...
        pip install -r requirements-windows.txt
    ) else (
        echo Using standard requirements...
        pip install -r requirements.txt
    )
    if errorlevel 1 (
        echo ERROR: Failed to install Python dependencies
        echo.
        echo If you see PostgreSQL-related errors, this is normal on Windows.
        echo The application will use SQLite database instead.
        cd ..
        exit /b 1
    )
) else (
    echo ERROR: Virtual environment activation script not found
    cd ..
    exit /b 1
)
cd ..

REM Frontend setup
echo Setting up Node.js frontend...
cd frontend
echo Installing npm dependencies...
npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node.js dependencies
    cd ..
    exit /b 1
)
cd ..

echo Dependencies installed successfully!
goto :eof

:install
call :check_location
call :check_python
call :install_deps
goto end

:dev
echo Starting development servers...
echo ===============================
start "Backend Server" cmd /k "cd /d %CD%\backend-py && call venv\Scripts\activate.bat && python run.py"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd /d %CD%\frontend && npm start"
echo.
echo Development servers starting...
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:3001
echo API Docs: http://localhost:3000/docs
goto end

:dev_backend
echo Starting backend server...
cd backend-py
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    python run.py
) else (
    echo ERROR: Virtual environment not found. Please run 'setup-windows.bat install' first
    exit /b 1
)
goto end

:dev_frontend
echo Starting frontend server...
cd frontend
npm start
goto end

:test
echo Running tests...
echo ================

REM Backend tests
echo Running backend tests...
cd backend-py
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    python -m pytest tests/ -v
) else (
    echo ERROR: Virtual environment not found. Please run 'setup-windows.bat install' first
    cd ..
    exit /b 1
)
cd ..

REM Frontend tests
echo Running frontend tests...
cd frontend
npm test
cd ..
goto end

:clean
echo Cleaning temporary files...
echo ===========================
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
for /d /r . %%d in (.pytest_cache) do @if exist "%%d" rd /s /q "%%d"
del /s /q *.pyc >nul 2>&1
echo Cleanup complete!
goto end

:end
