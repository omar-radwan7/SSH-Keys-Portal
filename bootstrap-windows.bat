@echo off
REM SSH Keys Portal - Windows Bootstrap
REM ===================================
REM Installs make, then uses the cross-platform Makefile

echo.
echo SSH Keys Portal - Windows Bootstrap
echo ===================================
echo.

REM Check if make exists
echo Checking for make...
where make >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo make found - using cross-platform Makefile
    goto use_makefile
)

echo make not found - installing via Chocolatey...
echo.

REM Install Chocolatey if needed
where choco >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing Chocolatey package manager...
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
)

REM Install make
echo Installing make...
choco install make -y

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Failed to install make automatically.
    echo.
    echo Alternative options:
    echo   1. Use Git Bash: ./bootstrap.sh
    echo   2. Use existing script: setup-windows.bat install
    echo   3. Install make manually, then run: make install && make dev
    echo.
    pause
    exit /b 1
)

:use_makefile
echo.
echo Using cross-platform Makefile (detects Windows automatically)...
make help
echo.

echo Running setup...
make install

if %ERRORLEVEL% NEQ 0 (
    echo Setup failed
    pause
    exit /b 1
)

echo.
echo Starting servers...
make dev

echo.
echo Setup complete! The cross-platform Makefile handled everything:
echo.
echo Your application:
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:3001
echo   API Docs: http://localhost:3000/docs
echo.
echo Daily commands (work on ALL platforms):
echo   make dev     - Start servers
echo   make stop    - Stop servers
echo   make status  - Check status
echo   make help    - Show all commands
echo.
echo The Makefile automatically detected Windows and used the right commands!
echo.
pause 