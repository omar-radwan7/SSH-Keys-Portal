# Windows Setup Guide for SSH Keys Portal

## Quick Fix for Your Current Issues

### Problem 1: Python PATH Issues
Your Python installation exists but isn't properly configured in PATH. Here are the solutions:

**Option A: Use the Fixed Setup Script (Recommended)**
```bash
# From the SSH-Keys-Portal root directory:
.\setup-windows.bat auto-setup
```

**Option B: Fix Python PATH Manually**
1. Uninstall Python completely
2. Download Python 3.11+ from https://python.org
3. During installation, **CHECK "Add Python to PATH"**
4. Restart your command prompt
5. Run: `.\setup-windows.bat auto-setup`

### Problem 2: Running from Wrong Directory
You were trying to run `setup.bat` from the `frontend` directory. The setup scripts must be run from the **root directory** (`SSH-Keys-Portal`).

## Fixed Files Created

I've created several improved setup files:

1. **`setup-windows.bat`** - Fixed Windows batch script with better Python detection
2. **`requirements-windows.txt`** - Windows-compatible Python dependencies (uses SQLite instead of PostgreSQL)
3. **Updated `setup.bat`** - Improved original batch script
4. **Updated `setup.ps1`** - Enhanced PowerShell script

## Usage Instructions

### From SSH-Keys-Portal Root Directory:

```bash
# Full automated setup (recommended for first time)
.\setup-windows.bat auto-setup

# Start development servers
.\setup-windows.bat dev

# Start only backend
.\setup-windows.bat dev-backend

# Start only frontend  
.\setup-windows.bat dev-frontend

# Install dependencies only
.\setup-windows.bat install

# Run tests
.\setup-windows.bat test

# Clean temporary files
.\setup-windows.bat clean
```

### PowerShell Alternative:

```powershell
# Full automated setup
.\setup.ps1 auto-setup

# Start development
.\setup.ps1 dev
```

## Prerequisites

### Required Software:
- **Python 3.11+** from https://python.org
  - ⚠️ **IMPORTANT**: Check "Add Python to PATH" during installation
- **Node.js 18+** from https://nodejs.org
- **Git** from https://git-scm.com

### Verification Commands:
```bash
python --version    # Should show Python 3.11+
node --version      # Should show Node.js version
npm --version       # Should show npm version
git --version       # Should show git version
```

## Troubleshooting

### "Python not found" Error
- Uninstall and reinstall Python with "Add to PATH" option
- Or manually add Python to your PATH environment variable

### PostgreSQL/psycopg2 Errors
- The Windows setup automatically uses SQLite instead of PostgreSQL
- No action needed - this is normal for Windows development

### "Virtual environment not found" Error
- Run `.\setup-windows.bat install` first
- Delete `backend-py/venv` folder and try again

### Permission Errors
- Run Command Prompt or PowerShell as Administrator
- Check that you have write permissions to the project directory

## Development URLs

After running `.\setup-windows.bat dev`:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs

## Cross-Platform Alternative

If Windows batch files continue to cause issues, you can use the Makefile with WSL (Windows Subsystem for Linux):

1. Install WSL: `wsl --install`
2. Open WSL terminal
3. Navigate to your project
4. Run: `make auto-setup`

## File Structure

```
SSH-Keys-Portal/
├── setup-windows.bat      # Fixed Windows batch script (USE THIS)
├── setup.bat             # Original batch script (updated)
├── setup.ps1             # PowerShell script (alternative)
├── Makefile              # Cross-platform make script
├── backend-py/
│   ├── requirements-windows.txt  # Windows-specific dependencies
│   └── requirements.txt         # Standard dependencies
└── frontend/
```

## Next Steps

1. **Install Python properly** (with PATH option checked)
2. **Run from root directory**: `.\setup-windows.bat auto-setup`
3. **Start development**: `.\setup-windows.bat dev`
4. **Access your app**: http://localhost:3001

The setup should now work correctly on Windows!
