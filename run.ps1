# EchoHEIST Web App Runner Script for PowerShell
# Cross-platform script to start the web application

Write-Host "🎸 EchoHEIST Web App" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "❌ Dependencies not found. Running installation..." -ForegroundColor Red
    Write-Host ""
    & ".\install.ps1"
    Write-Host ""
}

# Check if project is built
if (-not (Test-Path "dist")) {
    Write-Host "🔨 Building project..." -ForegroundColor Blue
    npm run build
    Write-Host ""
}

# Check if port 3000 is in use and try to kill processes
Write-Host "🔍 Checking if port 3000 is available..." -ForegroundColor Blue
$portInUse = $false

try {
    $connections = netstat -ano | Select-String ":3000"
    if ($connections) {
        $portInUse = $true
        Write-Host "⚠️  Port 3000 is already in use." -ForegroundColor Yellow
        Write-Host "   Trying to kill existing processes..." -ForegroundColor Yellow
        
        foreach ($connection in $connections) {
            $parts = $connection.ToString() -split '\s+'
            $pid = $parts[-1]
            if ($pid -and $pid -ne "0") {
                try {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                } catch {
                    # Ignore errors when killing processes
                }
            }
        }
        
        Start-Sleep -Seconds 2
    }
} catch {
    # Ignore errors when checking port
}

# Set environment variables
$env:NODE_ENV = "production"
$env:PORT = "3000"

Write-Host "🚀 Starting EchoHEIST Web App..." -ForegroundColor Green
Write-Host "🌐 Web interface: http://localhost:$($env:PORT)" -ForegroundColor Cyan
Write-Host "📁 Tabs directory: $env:USERPROFILE\Tabs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the web app
try {
    npm run web
} catch {
    Write-Host "❌ Failed to start the web app" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
