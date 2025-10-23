@echo off
setlocal enabledelayedexpansion

REM EchoHEIST Web App Runner Script for Windows
REM Cross-platform script to start the web application

echo 🎸 EchoHEIST Web App
echo ====================
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo ❌ Dependencies not found. Running installation...
    echo.
    call install.bat
    echo.
)

REM Check if project is built
if not exist "dist" (
    echo 🔨 Building project...
    call npm run build
    echo.
)

REM Check if port 3000 is in use and try to kill processes
echo 🔍 Checking if port 3000 is available...
netstat -ano | findstr :3000 >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Port 3000 is already in use.
    echo    Trying to kill existing processes...
    
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        set pid=%%a
        if not "!pid!"=="0" (
            taskkill /F /PID !pid! >nul 2>&1
        )
    )
    
    timeout /t 2 /nobreak >nul
)

REM Set environment variables
set NODE_ENV=production
set PORT=3000

echo 🚀 Starting EchoHEIST Web App...
echo 🌐 Web interface: http://localhost:%PORT%
echo 📁 Tabs directory: %USERPROFILE%\Tabs
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the web app
call npm run web
