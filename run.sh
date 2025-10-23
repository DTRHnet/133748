#!/bin/bash

# EchoHEIST Web App Runner Script
# Cross-platform script to start the web application

set -e  # Exit on any error

echo "🎸 EchoHEIST Web App"
echo "===================="
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

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not found. Running installation..."
    echo ""
    ./install.sh
    echo ""
fi

# Check if project is built
if [ ! -d "dist" ]; then
    echo "🔨 Building project..."
    npm run build
    echo ""
fi

# Check if port 3000 is in use
PORT_IN_USE=false
if command -v lsof &> /dev/null; then
    if lsof -i :3000 &> /dev/null; then
        PORT_IN_USE=true
    fi
elif command -v netstat &> /dev/null; then
    if netstat -an | grep -q ":3000.*LISTEN"; then
        PORT_IN_USE=true
    fi
fi

if [ "$PORT_IN_USE" = true ]; then
    echo "⚠️  Port 3000 is already in use."
    echo "   Trying to kill existing processes..."
    
    # Try to kill processes on port 3000
    if command -v lsof &> /dev/null; then
        lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    elif command -v netstat &> /dev/null && command -v taskkill &> /dev/null; then
        # Windows
        for pid in $(netstat -ano | findstr :3000 | awk '{print $5}' | sort -u); do
            taskkill /F /PID $pid 2>/dev/null || true
        done
    fi
    
    sleep 2
fi

# Set environment variables
export NODE_ENV=production
export PORT=${PORT:-3000}

echo "🚀 Starting EchoHEIST Web App..."
echo "🌐 Web interface: http://localhost:$PORT"
echo "📁 Tabs directory: ~/Tabs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the web app
npm run web
