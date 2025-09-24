@echo off
REM SSH Keys Portal - Windows Setup Script
REM =======================================

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
echo SSH Keys Portal - Windows Commands:
echo ====================================
echo.
echo setup.bat auto-setup    - Full automated setup (installs everything)
echo setup.bat dev           - Start both backend and frontend
echo setup.bat dev-backend   - Start backend only
echo setup.bat dev-frontend  - Start frontend only
echo setup.bat install       - Install dependencies
echo setup.bat test          - Run tests
echo setup.bat clean         - Clean temporary files
echo setup.bat help          - Show this help
echo.
echo Prerequisites for Windows:
echo - Python 3.11+ (https://python.org)
echo - Node.js 18+ (https://nodejs.org)
echo - Git (https://git-scm.com)
goto end

:auto_setup
echo Starting fully automated setup...
echo ===================================
call :check_python
call :check_node
call :check_git
call :install
echo.
echo Setup complete! Run: setup.bat dev
goto end

:check_python
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python 3.11+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation
    exit /b 1
) else (
    python --version
    echo Python found!
)
goto :eof

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

:install
echo Installing dependencies...
echo ==========================

REM Backend setup
echo Setting up Python backend...
cd backend-py
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)
echo Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..

REM Frontend setup
echo Setting up Node.js frontend...
cd frontend
echo Installing npm dependencies...
npm install
cd ..

echo Dependencies installed successfully!
goto end

:dev
echo Starting development servers...
echo ===============================
start "Backend Server" cmd /k "cd backend-py && call venv\Scripts\activate.bat && python run.py"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm start"
echo.
echo Development servers starting...
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:3001
echo API Docs: http://localhost:3000/docs
goto end

:dev_backend
echo Starting backend server...
cd backend-py
call venv\Scripts\activate.bat
python run.py
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
call venv\Scripts\activate.bat
python -m pytest tests/ -v
cd ..

REM Frontend tests
echo Running frontend tests...
cd frontend
npm test
cd ..
goto end

:clean
echo Cleaning temporary files...
echo ==========================
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
for /d /r . %%d in (.pytest_cache) do @if exist "%%d" rd /s /q "%%d"
del /s /q *.pyc >nul 2>&1
echo Cleanup complete!
goto end

:end 