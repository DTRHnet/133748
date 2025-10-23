# EchoHEIST Web App Installation Script for PowerShell
# Cross-platform installation for Windows PowerShell

Write-Host "🎸 EchoHEIST Web App Installer" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Recommended version: Node.js 18 or higher" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed!" -ForegroundColor Red
    Write-Host "Please install npm or reinstall Node.js" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check for Chrome
$chromeFound = $false
$chromePaths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $chromeFound = $true
        break
    }
}

if ($chromeFound) {
    Write-Host "✅ Chrome browser found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Chrome not found. Puppeteer will use its bundled Chromium." -ForegroundColor Yellow
    Write-Host "   For better performance, consider installing Chrome." -ForegroundColor Yellow
}

Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
try {
    npm install
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Build the project
Write-Host "🔨 Building the project..." -ForegroundColor Blue
try {
    npm run build
    Write-Host "✅ Project built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build project" -ForegroundColor Red
    Write-Host "This might be due to missing dependencies. Trying to install them..." -ForegroundColor Yellow
    try {
        npm install --force
        npm run build
        Write-Host "✅ Project built successfully after dependency reinstall" -ForegroundColor Green
    } catch {
        Write-Host "❌ Still failed to build project" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""

# Create tabs directory
Write-Host "📁 Creating tabs directory..." -ForegroundColor Blue
$tabsDir = "$env:USERPROFILE\Tabs"
if (-not (Test-Path $tabsDir)) {
    New-Item -ItemType Directory -Path $tabsDir -Force | Out-Null
}
Write-Host "✅ Tabs directory created at: $tabsDir" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Installation completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To start the web app, run:" -ForegroundColor Cyan
Write-Host "   .\run.ps1" -ForegroundColor White
Write-Host ""
Write-Host "   Or manually:" -ForegroundColor Cyan
Write-Host "   npm run web" -ForegroundColor White
Write-Host ""
Write-Host "🌐 The web app will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 For more information, see: WEB_APP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to continue"
