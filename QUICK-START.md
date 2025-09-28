# SSH Keys Portal - Quick Start Guide

## Universal Cross-Platform Setup

**One command works on ALL platforms - the Makefile handles everything!**

## Quick Commands

### Windows Users:
```cmd
git clone https://github.com/omar-radwan7/SSH-Keys-Portal.git
cd SSH-Keys-Portal
bootstrap-windows.bat
```

### Linux/macOS/Git Bash Users:
```bash
git clone https://github.com/omar-radwan7/SSH-Keys-Portal.git
cd SSH-Keys-Portal
chmod +x bootstrap.sh && ./bootstrap.sh
```

**That's it! Your SSH Keys Portal will be running at:**
- **Backend API**: http://localhost:3000
- **Frontend App**: http://localhost:3001
- **API Documentation**: http://localhost:3000/docs

---

### Prerequisites (Auto-guided if missing):
- **Python 3.7+** 
- **Node.js 16+** 
- **Git** 

## Super Simple Setup

### Windows
```cmd
git clone https://github.com/omar-radwan7/SSH-Keys-Portal.git
cd SSH-Keys-Portal
bootstrap-windows.bat
```

### Linux/macOS/Git Bash
```bash
git clone https://github.com/omar-radwan7/SSH-Keys-Portal.git
cd SSH-Keys-Portal
chmod +x bootstrap.sh && ./bootstrap.sh
```

**That's it!**

## What the Bootstrap Does:

1. **Installs `make`** (if missing) - via Chocolatey (Windows) or package manager (Linux/macOS)
2. **Uses the cross-platform Makefile** - automatically detects your OS
3. **Runs `make install`** - installs all dependencies with OS-specific optimizations
4. **Runs `make dev`** - starts both servers using platform-appropriate commands
5. **Ready!** - Everything running with one command

## The Cross-Platform Makefile Magic:

- **Auto-detects Windows/macOS/Linux** and uses the right commands  
- **Windows**: Uses `python`, `pip`, `taskkill`, Windows paths  
- **macOS/Linux**: Uses `python3`, `pip3`, `fuser`, Unix paths  
- **Same commands everywhere**: `make dev`, `make stop`, `make status`  
- **Platform-specific optimizations** built-in  
- **No duplicate scripts needed**  

## Access Your Application

Once running:

- **Backend API**: http://localhost:3000
- **Frontend App**: http://localhost:3001  
- **API Documentation**: http://localhost:3000/docs

## Daily Development Commands

**These work on ALL platforms:**

```bash
make dev          # Start both servers
make stop         # Stop all servers
make status       # Check if running
make logs         # View logs
make clean        # Clean temp files
make help         # Show all commands
make info         # Show platform info
```

## For New Contributors

**Zero friction setup:**

1. **Clone**: `git clone <repo> && cd SSH-Keys-Portal`
2. **Bootstrap**: `./bootstrap.sh` (Unix) or `bootstrap-windows.bat` (Windows)
3. **Develop**: Use `make dev` daily
4. **Contribute**: Same workflow for everyone!

## Alternative: If You Already Have Make

```bash
git clone https://github.com/omar-radwan7/SSH-Keys-Portal.git
cd SSH-Keys-Portal
make install      # Install dependencies
make dev          # Start servers
```

## Key Benefits

- **One Bootstrap Command** - Installs make, then uses Makefile
- **True Cross-Platform** - Same experience everywhere
- **Smart OS Detection** - Makefile automatically adapts
- **Zero Configuration** - Works out of the box
- **No Duplication** - One Makefile, multiple bootstrap options
- **Automatic Dependencies** - Handles Python, Node.js, packages
- **Consistent Workflow** - Same commands for all developers

## Troubleshooting

### Bootstrap failed?
```bash
# Manual make installation:
# Windows: choco install make
# macOS: brew install make  
# Linux: sudo apt-get install make

# Then use the Makefile directly:
make install && make dev
```

### Services not starting?
```bash
make stop          # Stop everything
make clean         # Clean temp files
make install       # Reinstall dependencies
make dev           # Start fresh
make status        # Check what's running
```

## Why This Approach?

**Before**: Separate scripts for each platform → duplication, maintenance nightmare  
**After**: Bootstrap installs `make` → Universal cross-platform Makefile does everything  

**Result**: 
- One source of truth (the Makefile)
- Automatic OS detection and optimization
- Same commands work everywhere
- Easy to maintain and extend
- New features added once, work everywhere

---

**The bootstrap just enables the cross-platform Makefile - then everything is universal!**

**Supported**: Windows 10/11, macOS 10.15+, Linux (Ubuntu, Debian, CentOS, Arch, etc.) 