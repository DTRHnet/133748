# Fix Windows Babel installation issues
Write-Host "🛠️ EchoHEIST Windows Fix Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 Checking for incorrect Babel installation..." -ForegroundColor Blue
Write-Host ""

# Check if incorrect babel package is installed
try {
    $babelCheck = npm list babel 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "❌ Found incorrect 'babel' package installed" -ForegroundColor Red
        Write-Host ""
        Write-Host "🗑️ Removing incorrect Babel package..." -ForegroundColor Yellow
        npm uninstall babel
        Write-Host ""
    }
} catch {
    # Package not found, which is good
}

Write-Host "🧹 Cleaning up dependencies..." -ForegroundColor Blue
Write-Host ""

# Remove node_modules and package-lock.json
if (Test-Path "node_modules") {
    Write-Host "Removing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ Removed node_modules" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Write-Host "Removing package-lock.json..." -ForegroundColor Yellow
    Remove-Item "package-lock.json"
    Write-Host "✅ Removed package-lock.json" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Installing correct dependencies..." -ForegroundColor Blue

try {
    npm install
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Write-Host ""
    Write-Host "Trying with legacy peer deps..." -ForegroundColor Yellow
    try {
        npm install --legacy-peer-deps
        Write-Host "✅ Dependencies installed with legacy peer deps" -ForegroundColor Green
    } catch {
        Write-Host "❌ Still failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "🔨 Building project..." -ForegroundColor Blue

try {
    npm run build
    Write-Host "✅ Project built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build project" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🎉 Fix complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Available commands:" -ForegroundColor Cyan
Write-Host "  npm run web        - Start the web app" -ForegroundColor White
Write-Host "  npm run dev:web    - Start the web app (alias)" -ForegroundColor White
Write-Host "  npm run build:web  - Build web app" -ForegroundColor White
Write-Host "  npm run start:web  - Start built web app" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Try running: npm run web" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to continue"
