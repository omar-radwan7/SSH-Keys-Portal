# 🚀 SSH Keys Portal - Quick Start

## ⚡ Zero-Dependency Setup

**No need to install Python, Node.js, or any dependencies manually!**

The Makefile handles everything automatically:

```bash
# Clone the repository
git clone https://github.com/omar-radwan7/SSH-Keys-Portal.git
cd SSH-Keys-Portal

# ONE COMMAND SETUP - Installs everything automatically!
make auto-setup

# Start development servers
make dev
```

That's it! 🎉

## 🔧 What `make auto-setup` Does Automatically:

✅ **Detects your OS** (Linux, macOS, Windows WSL)  
✅ **Installs Python3** (if not present)  
✅ **Installs Node.js & npm** (if not present)  
✅ **Installs Git** (if not present)  
✅ **Creates Python virtual environment**  
✅ **Installs all Python dependencies**  
✅ **Installs all Node.js dependencies**  
✅ **Initializes database**  
✅ **Ready to run!**

## 🌐 Access Your Application:

- **Backend API**: http://localhost:3000
- **Frontend App**: http://localhost:3001  
- **API Documentation**: http://localhost:3000/docs

## 📋 Common Commands:

```bash
make dev          # Start both servers
make stop         # Stop all servers
make restart      # Restart servers
make test         # Run all tests
make status       # Check service status
make clean        # Clean temporary files
make help         # Show all available commands
```

## 🎯 For New Contributors:

No setup instructions needed! Just:

1. Clone the repo
2. Run `make auto-setup`
3. Run `make dev`
4. Start coding! 🚀

## 💡 Benefits:

- **No manual installations** - Everything automated
- **Cross-platform** - Works on Linux, macOS, Windows WSL
- **Isolated environments** - Uses Python venv
- **One-command operations** - Start, stop, test, build
- **Consistent setup** - Same environment for all developers

---

**The Makefile eliminates all setup friction - anyone can contribute in minutes!** ⚡ 