#!/bin/bash
# SSH Keys Portal - Universal Bootstrap Script
# ===========================================
# Installs make, then uses the cross-platform Makefile for everything else

set -e

echo ""
echo "SSH Keys Portal - Universal One-Command Setup"
echo "============================================="
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]]; then
    OS="Windows (Git Bash)"
else
    OS="Unknown"
fi

echo "Detected: $OS"
echo ""

# Check if make exists
echo "Checking for make..."
if command -v make >/dev/null 2>&1; then
    echo "make found: $(make --version | head -n1)"
    echo ""
    echo "Using cross-platform Makefile..."
    make help
    echo ""
    echo "Running setup..."
    make install
    echo ""
    echo "Starting servers..."
    make dev
else
    echo "make not found - installing..."
    echo ""
    
    if [[ "$OS" == "macOS" ]]; then
        if command -v brew >/dev/null 2>&1; then
            brew install make
        else
            echo "Installing Homebrew first..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            brew install make
        fi
        
    elif [[ "$OS" == "Linux" ]]; then
        if command -v apt-get >/dev/null 2>&1; then
            sudo apt-get update && sudo apt-get install -y make
        elif command -v yum >/dev/null 2>&1; then
            sudo yum install -y make
        elif command -v dnf >/dev/null 2>&1; then
            sudo dnf install -y make
        elif command -v pacman >/dev/null 2>&1; then
            sudo pacman -S make --noconfirm
        else
            echo "Please install make manually, then run: make install && make dev"
            exit 1
        fi
        
    elif [[ "$OS" == "Windows (Git Bash)" ]]; then
        echo "Git Bash should include make"
        
    else
        echo "Unsupported OS. Please install make manually."
        exit 1
    fi
    
    echo "make installed!"
    echo ""
    echo "Now using cross-platform Makefile..."
    make install
    echo ""
    make dev
fi

echo ""
echo "Setup complete! The cross-platform Makefile is now handling everything:"
echo ""
echo "Your application:"
echo "  Backend:  http://localhost:3000"
echo "  Frontend: http://localhost:3001"
echo "  API Docs: http://localhost:3000/docs"
echo ""
echo "Daily commands (work on ALL platforms):"
echo "  make dev     - Start servers"
echo "  make stop    - Stop servers"
echo "  make status  - Check status"
echo "  make help    - Show all commands"
echo ""
echo "The Makefile automatically detects your OS and uses the right commands!" 