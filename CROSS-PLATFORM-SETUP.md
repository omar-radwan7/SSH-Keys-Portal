# Cross-Platform Setup Guide

## Why Use Makefile Instead of Multiple Scripts?

You're absolutely right! Using a single **Makefile** is much better than maintaining separate `.bat`, `.ps1`, and shell scripts because:

✅ **Single source of truth** - One file to maintain  
✅ **Cross-platform compatibility** - Works on Windows, macOS, and Linux  
✅ **Industry standard** - Used by most development projects  
✅ **Consistent commands** - Same commands work everywhere  
✅ **Better maintenance** - No need to sync multiple script files  

## Quick Start (Any Platform)

### 1. Install Make (Windows Only)

**Windows users need to install `make` first:**

#### Option A: Git Bash (Recommended - Already installed!)
Since you have Git installed, you already have Git Bash which includes make:
1. Open **Git Bash** (not Command Prompt or PowerShell)
2. Navigate to your project: `cd /c/Users/Omara/Desktop/SSH-Keys-Portal`
3. Run: `make auto-setup`

#### Option B: Install Make via Chocolatey
```bash
# Install Chocolatey first (if not installed)
# Run PowerShell as Administrator and paste:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Then install make
choco install make
```

#### Option C: WSL (Windows Subsystem for Linux)
```bash
wsl --install
# Restart computer, then use WSL terminal
```

### 2. Run the Setup

**Same commands work on all platforms:**

```bash
# Full automated setup
make auto-setup

# Start development servers
make dev

# Individual commands
make install        # Install dependencies only
make dev-backend    # Start backend only
make dev-frontend   # Start frontend only
make test          # Run tests
make clean         # Clean temporary files
```

## Platform-Specific Features

The Makefile automatically detects your platform and uses the right commands:

### Windows Detection
- Uses `python` instead of `python3`
- Uses Windows path separators (`\`)
- Uses `requirements-windows.txt` (without PostgreSQL)
- Uses Windows-specific virtual environment paths

### Linux/macOS Detection
- Uses `python3` and `pip3`
- Uses Unix path separators (`/`)
- Uses standard `requirements.txt`
- Uses Unix virtual environment paths

## Troubleshooting

### Windows: "make: command not found"
**Solution:** Use Git Bash instead of Command Prompt:
1. Right-click in your project folder
2. Select "Git Bash Here"
3. Run `make auto-setup`

### Windows: Python PATH Issues
The Makefile automatically tries multiple Python commands:
- `python` (standard Windows)
- `python3` (if installed as python3)
- `py` (Python launcher)

### PostgreSQL Errors on Windows
**No problem!** The Makefile uses `requirements-windows.txt` which uses SQLite instead of PostgreSQL for Windows development.

## Development Workflow

### Daily Development
```bash
make dev          # Start both frontend and backend
# Visit http://localhost:3001 for frontend
# Visit http://localhost:3000/docs for API docs
```

### Testing
```bash
make test         # Run all tests
make test-backend # Backend tests only
make test-frontend # Frontend tests only
```

### Maintenance
```bash
make clean        # Clean temporary files
make update       # Update dependencies
make status       # Check service status
```

## Why This Solution is Better

| Approach | Pros | Cons |
|----------|------|------|
| **Makefile (Our Choice)** | ✅ Single file<br>✅ Cross-platform<br>✅ Industry standard<br>✅ Easy to maintain | ⚠️ Windows needs make installed |
| Multiple Scripts | ✅ Works out-of-box on Windows | ❌ Multiple files to maintain<br>❌ Easy to get out of sync<br>❌ Platform-specific bugs |
| Docker Only | ✅ Completely isolated | ❌ Slower development<br>❌ Requires Docker knowledge |

## Getting Help

```bash
make help         # Show available commands
make info         # Detailed project information
make windows-setup # Windows-specific setup help (Windows only)
make windows-check # Check Windows environment (Windows only)
```

## Next Steps for You

Since you already have Git installed (which includes Git Bash), here's what to do:

1. **Open Git Bash** (not PowerShell or Command Prompt)
2. **Navigate to your project:**
   ```bash
   cd /c/Users/Omara/Desktop/SSH-Keys-Portal
   ```
3. **Run the setup:**
   ```bash
   make auto-setup
   ```
4. **Start development:**
   ```bash
   make dev
   ```

The Makefile will handle all the Python PATH issues and dependency problems automatically!

## File Structure

```
SSH-Keys-Portal/
├── Makefile                          # ✅ Cross-platform automation
├── backend-py/
│   ├── requirements.txt              # Linux/macOS dependencies
│   └── requirements-windows.txt      # Windows dependencies (no PostgreSQL)
├── setup.bat                         # ⚠️ Fallback only
├── setup.ps1                         # ⚠️ Fallback only
└── setup-windows.bat                 # ⚠️ Fallback only
```

**Recommendation:** Use the Makefile as your primary automation tool. The `.bat` and `.ps1` files are just fallbacks.
