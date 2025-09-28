# 🚀 SSH Keys Portal - Quick Start Guide

## 🌍 Cross-Platform Setup (Windows, macOS, Linux)

**Works on ALL platforms with automatic OS detection!**

### Prerequisites (Auto-detected & guided):
- **Python 3.7+** (will guide you to install if missing)
- **Node.js 16+** (will guide you to install if missing)
- **Git** (for cloning the repository)

## ⚡ One-Command Setup

```bash
# Clone the repository
git clone https://github.com/omar-radwan7/SSH-Keys-Portal.git
cd SSH-Keys-Portal

# Install all dependencies (detects your OS automatically)
make install

# Start development servers
make dev
```

**That's it! 🎉**

## 🔍 What `make install` Does Automatically:

✅ **Detects your operating system** (Windows, macOS, Linux)  
✅ **Checks for Python & Node.js** (guides installation if missing)  
✅ **Creates Python virtual environment**  
✅ **Installs all backend dependencies** (FastAPI, uvicorn, etc.)  
✅ **Installs all frontend dependencies** (React, TypeScript, etc.)  
✅ **Platform-specific optimizations**  
✅ **Ready to develop!**

## 🌐 Access Your Application

Once `make dev` is running:

- **🐍 Backend API**: http://localhost:3000
- **⚛️ Frontend App**: http://localhost:3001  
- **📚 API Documentation**: http://localhost:3000/docs

## 🛠️ Essential Commands

### Development
```bash
make dev          # Start both backend and frontend
make stop         # Stop all services
make status       # Check if services are running
```

### Maintenance
```bash
make logs         # View application logs
make clean        # Clean temporary files
make help         # Show all available commands
```

### Platform-Specific (if needed)
```bash
make install-windows  # Windows-specific setup
make install-macos    # macOS-specific setup  
make install-linux    # Linux-specific setup
```

## 📋 Platform-Specific Notes

### 🪟 Windows
- Uses `python` and `pip` commands
- Automatically handles Windows paths
- Uses `taskkill` for process management
- Works with PowerShell and Command Prompt

### 🍎 macOS
- Uses `python3` and `pip3` commands
- Compatible with Homebrew installations
- Uses Unix-style process management
- Supports both Intel and Apple Silicon

### 🐧 Linux
- Uses `python3` and `pip3` commands
- Compatible with apt, yum, and other package managers
- Uses `fuser` for port management
- Tested on Ubuntu, Debian, CentOS, Arch

## 🚀 For New Contributors

**Zero setup friction!** Just:

1. **Clone**: `git clone <repo-url> && cd SSH-Keys-Portal`
2. **Install**: `make install`
3. **Develop**: `make dev`
4. **Code**: Start contributing! 🎯

## ✨ Key Benefits

- **🌍 True Cross-Platform** - Same commands on Windows, macOS, Linux
- **🔍 Smart Detection** - Automatically detects your OS and tools
- **⚡ Zero Configuration** - Works out of the box
- **🛡️ Isolated Environment** - Uses Python virtual environments
- **🔄 Consistent Experience** - Same workflow for all developers
- **📦 Dependency Management** - Handles all package installations
- **🚦 Service Management** - Easy start/stop/status checking

## 🐛 Troubleshooting

### Services not starting?
```bash
make stop          # Stop any running services
make clean         # Clean temporary files
make install       # Reinstall dependencies
make dev           # Start fresh
```

### Check what's running:
```bash
make status        # Shows service status
make logs          # Shows application logs
```

### Platform-specific issues:
```bash
make info          # Shows detected OS and configuration
make help          # Shows all available commands
```

## 🎯 Development Workflow

```bash
# Daily development cycle
make dev           # Start servers (morning)
make status        # Check everything is running
# ... develop your features ...
make logs          # Check for any issues
make stop          # Stop servers (end of day)
```

---

**🚀 The cross-platform Makefile eliminates ALL setup friction - anyone can contribute in minutes on ANY operating system!** ⚡

**Supported Platforms**: Windows 10/11, macOS 10.15+, Linux (Ubuntu, Debian, CentOS, Arch, etc.) 