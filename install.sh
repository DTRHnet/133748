#!/bin/bash

# EchoHEIST Web App Installation Script
# Cross-platform installation for all operating systems

set -e  # Exit on any error

echo "🎸 EchoHEIST Web App Installer"
echo "================================"
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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Recommended version: Node.js 18 or higher"
    echo ""
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: Node.js version $NODE_VERSION detected. Recommended: Node.js 18 or higher"
    echo ""
fi

echo "✅ Node.js $(node --version) found"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    echo "Please install npm or reinstall Node.js"
    exit 1
fi

echo "✅ npm $(npm --version) found"
echo ""

# Check for Chrome/Chromium
CHROME_FOUND=false
if [[ "$OS" == "linux" ]]; then
    if command -v google-chrome &> /dev/null || command -v chromium-browser &> /dev/null || command -v chromium &> /dev/null; then
        CHROME_FOUND=true
    fi
elif [[ "$OS" == "macos" ]]; then
    if [ -d "/Applications/Google Chrome.app" ] || [ -d "/Applications/Chromium.app" ]; then
        CHROME_FOUND=true
    fi
elif [[ "$OS" == "windows" ]]; then
    if [ -f "C:/Program Files/Google/Chrome/Application/chrome.exe" ] || [ -f "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe" ]; then
        CHROME_FOUND=true
    fi
fi

if [ "$CHROME_FOUND" = true ]; then
    echo "✅ Chrome/Chromium browser found"
else
    echo "⚠️  Chrome/Chromium not found. Puppeteer will use its bundled Chromium."
    echo "   For better performance, consider installing Chrome/Chromium."
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Build the project
echo "🔨 Building the project..."
npm run build
echo ""

# Create tabs directory
echo "📁 Creating tabs directory..."
mkdir -p ~/Tabs 2>/dev/null || mkdir -p ./Tabs
echo "✅ Tabs directory created"
echo ""

# Make scripts executable (Unix-like systems)
if [[ "$OS" != "windows" ]]; then
    chmod +x run.sh 2>/dev/null || true
    chmod +x echoHEIST.sh 2>/dev/null || true
fi

echo "🎉 Installation completed successfully!"
echo ""
echo "🚀 To start the web app, run:"
echo "   ./run.sh"
echo ""
echo "   Or manually:"
echo "   npm run web"
echo ""
echo "🌐 The web app will be available at: http://localhost:3000"
echo ""
echo "📝 For more information, see: WEB_APP_GUIDE.md"
