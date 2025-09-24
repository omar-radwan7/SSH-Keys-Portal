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
    
    # Try different Python commands
    $pythonCommands = @("python", "python3", "py")
    
    foreach ($cmd in $pythonCommands) {
        try {
            $pythonVersion = & $cmd --version 2>$null
            if ($pythonVersion) {
                Write-Host "✅ $pythonVersion (using '$cmd')" -ForegroundColor Green
                $global:PythonCommand = $cmd
                return $true
            }
        } catch {
            # Continue to next command
        }
    }
    
    # Check if Python is installed but not in PATH
    $pythonPaths = @(
        "$env:LOCALAPPDATA\Programs\Python\Python*\python.exe",
        "$env:PROGRAMFILES\Python*\python.exe",
        "$env:PROGRAMFILES(x86)\Python*\python.exe"
    )
    
    foreach ($path in $pythonPaths) {
        $foundPython = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($foundPython) {
            Write-Host "⚠️  Python found at: $($foundPython.FullName)" -ForegroundColor Yellow
            Write-Host "❌ But Python is not in your PATH!" -ForegroundColor Red
            Write-Host "Please add Python to your PATH or reinstall with 'Add to PATH' option" -ForegroundColor Red
            return $false
        }
    }
    
    Write-Host "❌ Python not found!" -ForegroundColor Red
    Write-Host "Please install Python 3.11+ from https://python.org" -ForegroundColor Red
    Write-Host "Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Red
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
    
    # Use detected Python command or default to 'python'
    if (-not $global:PythonCommand) {
        $global:PythonCommand = "python"
    }
    
    # Backend setup
    Write-Host "Setting up Python backend..." -ForegroundColor Yellow
    Set-Location backend-py
    
    if (-not (Test-Path "venv")) {
        Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
        try {
            & $global:PythonCommand -m venv venv
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to create virtual environment"
            }
        } catch {
            Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
            Set-Location ..
            exit 1
        }
    }
    
    Write-Host "Activating virtual environment and installing dependencies..." -ForegroundColor Yellow
    try {
        if (Test-Path "venv\Scripts\Activate.ps1") {
            & "venv\Scripts\Activate.ps1"
        } else {
            throw "Virtual environment activation script not found"
        }
        
        python -m pip install --upgrade pip
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to upgrade pip"
        }
        
        pip install -r requirements.txt
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install Python dependencies"
        }
    } catch {
        Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Set-Location ..
    
    # Frontend setup
    Write-Host "Setting up Node.js frontend..." -ForegroundColor Yellow
    Set-Location frontend
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    try {
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install npm dependencies"
        }
    } catch {
        Write-Host "❌ Failed to install Node.js dependencies" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
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