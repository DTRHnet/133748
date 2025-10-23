@echo off
setlocal enabledelayedexpansion

REM Fix Windows Babel installation issues
echo 🛠️ EchoHEIST Windows Fix Script
echo ================================
echo.

echo 🔍 Checking for incorrect Babel installation...
echo.

REM Check if incorrect babel package is installed
npm list babel >nul 2>&1
if not errorlevel 1 (
    echo ❌ Found incorrect 'babel' package installed
    echo.
    echo 🗑️ Removing incorrect Babel package...
    npm uninstall babel
    echo.
)

echo 🧹 Cleaning up dependencies...
echo.

REM Remove node_modules and package-lock.json
if exist "node_modules" (
    echo Removing node_modules...
    rmdir /s /q "node_modules"
    echo ✅ Removed node_modules
)

if exist "package-lock.json" (
    echo Removing package-lock.json...
    del "package-lock.json"
    echo ✅ Removed package-lock.json
)

echo.
echo 📦 Installing correct dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    echo.
    echo Trying with legacy peer deps...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo ❌ Still failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo 🔨 Building project...
call npm run build
if errorlevel 1 (
    echo ❌ Failed to build project
    pause
    exit /b 1
)

echo.
echo 🎉 Fix complete!
echo.
echo 📋 Available commands:
echo   npm run web        - Start the web app
echo   npm run dev:web    - Start the web app (alias)
echo   npm run build:web  - Build web app
echo   npm run start:web  - Start built web app
echo.
echo 🚀 Try running: npm run web
echo.
pause
