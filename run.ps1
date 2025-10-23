# EchoHEIST Web App Runner Script for PowerShell
# Cross-platform script to start the web application

Write-Host 'EchoHEIST Web App' -ForegroundColor Cyan
Write-Host '====================' -ForegroundColor Cyan
Write-Host ''

# Check if dependencies are installed
if (-not (Test-Path 'node_modules')) {
    Write-Host 'Dependencies not found. Running installation...' -ForegroundColor Red
    Write-Host ''
    & '.\install.ps1'
    Write-Host ''
}

# Check if project is built
if (-not (Test-Path 'dist')) {
    Write-Host 'Building project...' -ForegroundColor Blue
    npm run build
    Write-Host ''
}

# Set environment variables
$env:NODE_ENV = 'production'
$env:PORT = '3000'

Write-Host 'Starting EchoHEIST Web App...' -ForegroundColor Green
Write-Host 'Web interface: http://localhost:' + $env:PORT -ForegroundColor Cyan
Write-Host 'Tabs directory: ' + $env:USERPROFILE + '\Tabs' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Press Ctrl+C to stop the server' -ForegroundColor Yellow
Write-Host ''

# Start the web app
try {
    npm run serve
} catch {
    Write-Host 'Failed to start the web app' -ForegroundColor Red
    Write-Host 'Error: ' + $_.Exception.Message -ForegroundColor Red
    Read-Host 'Press Enter to exit'
}
