#!/bin/bash
# 133748 Run Script for Unix-like systems

echo "Starting 133748..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "Building project first..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "Build failed!"
        exit 1
    fi
fi

# Run the application
node dist/index.js "$@"
