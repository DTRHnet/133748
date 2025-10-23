#!/bin/bash

# Universal EchoHEIST Launcher
# Detects OS and runs appropriate installation/run scripts

set -e

echo "🎸 EchoHEIST Universal Launcher"
echo "==============================="
echo ""

# Detect operating system
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="windows"
fi

echo "🔍 Detected operating system: $OS"
echo ""

# Check if this is a fresh installation
if [ ! -d "node_modules" ] || [ ! -d "dist" ]; then
    echo "📦 First time setup detected. Running installation..."
    echo ""
    
    if [[ "$OS" == "windows" ]]; then
        if command -v powershell &> /dev/null; then
            echo "🚀 Using PowerShell installer..."
            powershell -ExecutionPolicy Bypass -File install.ps1
        else
            echo "🚀 Using Batch installer..."
            install.bat
        fi
    else
        echo "🚀 Using Bash installer..."
        chmod +x install.sh
        ./install.sh
    fi
    echo ""
fi

# Start the application
echo "🚀 Starting EchoHEIST Web App..."
echo ""

if [[ "$OS" == "windows" ]]; then
    if command -v powershell &> /dev/null; then
        echo "🚀 Using PowerShell runner..."
        powershell -ExecutionPolicy Bypass -File run.ps1
    else
        echo "🚀 Using Batch runner..."
        run.bat
    fi
else
    echo "🚀 Using Bash runner..."
    chmod +x run.sh
    ./run.sh
fi
