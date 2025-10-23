# 133748 Run Script for Windows PowerShell
# Cross-platform launcher with enhanced error handling and debugging

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
    White = "White"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "[INFO] $Message" "Blue"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✓ $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠ $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "✗ $Message" "Red"
}

function Write-Debug {
    param([string]$Message)
    Write-ColorOutput "[DEBUG] $Message" "Cyan"
}

# Display header
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           133748 Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Display environment information
Write-Info "Environment Information:"
Write-Host "- Platform: Windows $([System.Environment]::OSVersion.Version)" -ForegroundColor White
Write-Host "- PowerShell: $($PSVersionTable.PSVersion)" -ForegroundColor White
Write-Host "- Current Directory: $(Get-Location)" -ForegroundColor White
Write-Host "- User: $([System.Environment]::UserName)" -ForegroundColor White
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Success "Node.js found: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed or not in PATH"
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "npm not found"
    }
    Write-Success "npm found: $npmVersion"
} catch {
    Write-Error "npm is not installed or not in PATH"
    Write-Host "Please install npm" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found"
    Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

# Check if dist directory exists
if (-not (Test-Path "dist")) {
    Write-Warning "dist directory not found"
    Write-Info "Building project first..."
    Write-Host ""
    
    # Install dependencies if node_modules doesn't exist
    if (-not (Test-Path "node_modules")) {
        Write-Info "Installing dependencies..."
        try {
            npm install
            Write-Success "Dependencies installed successfully"
        } catch {
            Write-Error "Failed to install dependencies"
            exit 1
        }
    }
    
    # Build the project
    Write-Info "Building project..."
    try {
        npm run build
        Write-Success "Build completed successfully"
    } catch {
        Write-Error "Build failed"
        Write-Host "Please check the build output above for errors" -ForegroundColor Yellow
        exit 1
    }
    Write-Host ""
}

# Check if the main entry point exists
if (-not (Test-Path "dist\index.js")) {
    Write-Error "dist\index.js not found"
    Write-Host "The build process may have failed" -ForegroundColor Yellow
    exit 1
}

# Check if config directory exists
if (-not (Test-Path "config")) {
    Write-Warning "config directory not found"
    Write-Info "Creating default configuration..."
    try {
        New-Item -ItemType Directory -Path "config" -Force | Out-Null
        Write-Success "Config directory created"
    } catch {
        Write-Error "Failed to create config directory"
        exit 1
    }
}

# Check if default config exists
if (-not (Test-Path "config\default.conf")) {
    Write-Warning "config\default.conf not found"
    Write-Host "Please run 'node setup.js' to create configuration" -ForegroundColor Yellow
    Write-Host ""
}

# Check for Chrome/Chromium
$chromePaths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$chromeFound = $false
foreach ($chromePath in $chromePaths) {
    if (Test-Path $chromePath) {
        Write-Success "Chrome/Chromium found: $chromePath"
        $chromeFound = $true
        break
    }
}

if (-not $chromeFound) {
    Write-Warning "Chrome/Chromium not found in common locations"
    Write-Host "Puppeteer may not work properly. Please install Chrome or Chromium." -ForegroundColor Yellow
    Write-Host ""
}

# Check for curl
try {
    $curlVersion = curl --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "curl not found"
    }
    Write-Success "curl found"
} catch {
    Write-Warning "curl not found in PATH"
    Write-Host "Download functionality may not work properly." -ForegroundColor Yellow
    Write-Host ""
}

# Display command being executed
$commandArgs = $Arguments -join " "
Write-Info "Executing: node dist/index.js $commandArgs"
Write-Host ""

# Run the application with error handling
try {
    if ($Arguments.Count -gt 0) {
        & node dist/index.js @Arguments
    } else {
        & node dist/index.js
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Application completed successfully"
    } else {
        Write-Error "Application exited with code $LASTEXITCODE"
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "- Check if all dependencies are installed: npm install" -ForegroundColor White
        Write-Host "- Rebuild the project: npm run build" -ForegroundColor White
        Write-Host "- Run setup: node setup.js" -ForegroundColor White
        Write-Host "- Check configuration: config\default.conf" -ForegroundColor White
        Write-Host "- View logs in: $env:USERPROFILE\.cache\133748\" -ForegroundColor White
        Write-Host "- Check if Chrome/Chromium is installed" -ForegroundColor White
        Write-Host "- Verify curl is available" -ForegroundColor White
        exit $LASTEXITCODE
    }
} catch {
    Write-Error "Failed to execute application: $($_.Exception.Message)"
    exit 1
}

Write-Host ""

