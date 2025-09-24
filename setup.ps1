# SSH Keys Portal - PowerShell Setup Script
# ==========================================

param(
    [Parameter(Position=0)]
    [ValidateSet("auto-setup", "dev", "dev-backend", "dev-frontend", "install", "test", "clean", "help", "")]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "SSH Keys Portal - PowerShell Commands:" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host ".\setup.ps1 auto-setup    - Full automated setup (installs everything)" -ForegroundColor Green
    Write-Host ".\setup.ps1 dev           - Start both backend and frontend" -ForegroundColor Green
    Write-Host ".\setup.ps1 dev-backend   - Start backend only" -ForegroundColor Green
    Write-Host ".\setup.ps1 dev-frontend  - Start frontend only" -ForegroundColor Green
    Write-Host ".\setup.ps1 install       - Install dependencies" -ForegroundColor Green
    Write-Host ".\setup.ps1 test          - Run tests" -ForegroundColor Green
    Write-Host ".\setup.ps1 clean         - Clean temporary files" -ForegroundColor Green
    Write-Host ".\setup.ps1 help          - Show this help" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prerequisites for Windows:" -ForegroundColor Yellow
    Write-Host "- Python 3.11+ (https://python.org)" -ForegroundColor Yellow
    Write-Host "- Node.js 18+ (https://nodejs.org)" -ForegroundColor Yellow
    Write-Host "- Git (https://git-scm.com)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Access your application at:" -ForegroundColor Magenta
    Write-Host "- Frontend: http://localhost:3001" -ForegroundColor Magenta
    Write-Host "- Backend:  http://localhost:3000" -ForegroundColor Magenta
    Write-Host "- API Docs: http://localhost:3000/docs" -ForegroundColor Magenta
}

function Test-Python {
    Write-Host "Checking Python installation..." -ForegroundColor Yellow
    try {
        $pythonVersion = python --version 2>$null
        if ($pythonVersion) {
            Write-Host "✅ $pythonVersion" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ Python not found!" -ForegroundColor Red
        Write-Host "Please install Python 3.11+ from https://python.org" -ForegroundColor Red
        Write-Host "Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Red
        return $false
    }
    return $false
}

function Test-Node {
    Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
    try {
        $nodeVersion = node --version 2>$null
        $npmVersion = npm --version 2>$null
        if ($nodeVersion -and $npmVersion) {
            Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
            Write-Host "✅ npm $npmVersion" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ Node.js not found!" -ForegroundColor Red
        Write-Host "Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
        return $false
    }
    return $false
}

function Test-Git {
    Write-Host "Checking Git installation..." -ForegroundColor Yellow
    try {
        $gitVersion = git --version 2>$null
        if ($gitVersion) {
            Write-Host "✅ $gitVersion" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ Git not found!" -ForegroundColor Red
        Write-Host "Please install Git from https://git-scm.com" -ForegroundColor Red
        return $false
    }
    return $false
}

function Install-Dependencies {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    Write-Host "==========================" -ForegroundColor Cyan
    
    # Backend setup
    Write-Host "Setting up Python backend..." -ForegroundColor Yellow
    Set-Location backend-py
    
    if (-not (Test-Path "venv")) {
        Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
        python -m venv venv
    }
    
    Write-Host "Activating virtual environment and installing dependencies..." -ForegroundColor Yellow
    & "venv\Scripts\Activate.ps1"
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    Set-Location ..
    
    # Frontend setup
    Write-Host "Setting up Node.js frontend..." -ForegroundColor Yellow
    Set-Location frontend
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install
    Set-Location ..
    
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
}

function Start-AutoSetup {
    Write-Host "Starting fully automated setup..." -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan
    
    $pythonOk = Test-Python
    $nodeOk = Test-Node  
    $gitOk = Test-Git
    
    if ($pythonOk -and $nodeOk -and $gitOk) {
        Install-Dependencies
        Write-Host ""
        Write-Host "🎉 Setup complete! Run: .\setup.ps1 dev" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Setup failed. Please install missing prerequisites." -ForegroundColor Red
        exit 1
    }
}

function Start-Dev {
    Write-Host "Starting development servers..." -ForegroundColor Cyan
    Write-Host "===============================" -ForegroundColor Cyan
    
    # Start backend in new window
    Start-Process powershell -ArgumentList "-Command", "cd '$PWD\backend-py'; & 'venv\Scripts\Activate.ps1'; python run.py" -WindowStyle Normal
    
    # Wait a moment then start frontend
    Start-Sleep -Seconds 3
    Start-Process powershell -ArgumentList "-Command", "cd '$PWD\frontend'; npm start" -WindowStyle Normal
    
    Write-Host ""
    Write-Host "Development servers starting..." -ForegroundColor Green
    Write-Host "Backend:  http://localhost:3000" -ForegroundColor Magenta
    Write-Host "Frontend: http://localhost:3001" -ForegroundColor Magenta  
    Write-Host "API Docs: http://localhost:3000/docs" -ForegroundColor Magenta
}

function Start-Backend {
    Write-Host "Starting backend server..." -ForegroundColor Cyan
    Set-Location backend-py
    & "venv\Scripts\Activate.ps1"
    python run.py
}

function Start-Frontend {
    Write-Host "Starting frontend server..." -ForegroundColor Cyan
    Set-Location frontend
    npm start
}

function Start-Tests {
    Write-Host "Running tests..." -ForegroundColor Cyan
    Write-Host "================" -ForegroundColor Cyan
    
    # Backend tests
    Write-Host "Running backend tests..." -ForegroundColor Yellow
    Set-Location backend-py
    & "venv\Scripts\Activate.ps1"
    python -m pytest tests/ -v
    Set-Location ..
    
    # Frontend tests
    Write-Host "Running frontend tests..." -ForegroundColor Yellow
    Set-Location frontend
    npm test
    Set-Location ..
}

function Clean-Files {
    Write-Host "Cleaning temporary files..." -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan
    
    Get-ChildItem -Path . -Recurse -Name "__pycache__" -Directory | Remove-Item -Recurse -Force
    Get-ChildItem -Path . -Recurse -Name ".pytest_cache" -Directory | Remove-Item -Recurse -Force
    Get-ChildItem -Path . -Recurse -Name "*.pyc" -File | Remove-Item -Force
    
    Write-Host "✅ Cleanup complete!" -ForegroundColor Green
}

# Main command dispatcher
switch ($Command) {
    "auto-setup" { Start-AutoSetup }
    "dev" { Start-Dev }
    "dev-backend" { Start-Backend }
    "dev-frontend" { Start-Frontend }
    "install" { Install-Dependencies }
    "test" { Start-Tests }
    "clean" { Clean-Files }
    default { Show-Help }
} 