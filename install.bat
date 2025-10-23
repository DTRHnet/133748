@echo off
setlocal enabledelayedexpansion

REM EchoHEIST Web App Installation Script for Windows
REM Cross-platform installation for Windows systems

echo 🎸 EchoHEIST Web App Installer
echo ================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Recommended version: Node.js 18 or higher
    echo.
    pause
    exit /b 1
)

REM Get Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found
echo.

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed!
    echo Please install npm or reinstall Node.js
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% found
echo.

REM Check for Chrome
set CHROME_FOUND=false
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set CHROME_FOUND=true
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set CHROME_FOUND=true

if "%CHROME_FOUND%"=="true" (
    echo ✅ Chrome browser found
) else (
    echo ⚠️  Chrome not found. Puppeteer will use its bundled Chromium.
    echo    For better performance, consider installing Chrome.
)
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo.

REM Build the project
echo 🔨 Building the project...
call npm run build
if errorlevel 1 (
    echo ❌ Failed to build project
    echo.
    echo This might be due to missing dependencies. Trying to install them...
    call npm install --force
    call npm run build
    if errorlevel 1 (
        echo ❌ Still failed to build project
        pause
        exit /b 1
    )
)
echo.

REM Create tabs directory
echo 📁 Creating tabs directory...
if not exist "%USERPROFILE%\Tabs" mkdir "%USERPROFILE%\Tabs"
echo ✅ Tabs directory created
echo.

echo 🎉 Installation completed successfully!
echo.
echo 🚀 To start the web app, run:
echo    run.bat
echo.
echo    Or manually:
echo    npm run web
echo.
echo 🌐 The web app will be available at: http://localhost:3000
echo.
echo 📝 For more information, see: WEB_APP_GUIDE.md
echo.
pause
