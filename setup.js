#!/usr/bin/env node

/**
 * Cross-platform setup script for 133748
 * Handles dependency installation, configuration, and platform-specific setup
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Platform detection
const platform = os.platform();
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';
const isLinux = platform === 'linux';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Check if a command exists
async function commandExists(command) {
  try {
    if (isWindows) {
      execSync(`where ${command}`, { stdio: 'ignore' });
    } else {
      execSync(`which ${command}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

// Get Chrome/Chromium executable path
async function findChromeExecutable() {
  const possiblePaths = [];

  if (isWindows) {
    possiblePaths.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Users\\' +
        os.userInfo().username +
        '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    );
  } else if (isMac) {
    possiblePaths.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
    );
  } else if (isLinux) {
    possiblePaths.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
      '/opt/google/chrome/chrome'
    );
  }

  for (const chromePath of possiblePaths) {
    try {
      await fs.access(chromePath);
      return chromePath;
    } catch {
      continue;
    }
  }

  return null;
}

// Install system dependencies
async function installSystemDependencies() {
  logStep('1', 'Checking system dependencies...');

  const missingDeps = [];

  // Check for Node.js
  if (!(await commandExists('node'))) {
    missingDeps.push('Node.js');
  } else {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    logSuccess(`Node.js found: ${nodeVersion}`);
  }

  // Check for npm
  if (!(await commandExists('npm'))) {
    missingDeps.push('npm');
  } else {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    logSuccess(`npm found: ${npmVersion}`);
  }

  // Check for curl
  if (!(await commandExists('curl'))) {
    missingDeps.push('curl');
  } else {
    logSuccess('curl found');
  }

  // Check for Chrome/Chromium
  const chromePath = await findChromeExecutable();
  if (!chromePath) {
    missingDeps.push('Chrome/Chromium browser');
    logWarning('Chrome/Chromium not found. Puppeteer may not work properly.');
  } else {
    logSuccess(`Chrome/Chromium found: ${chromePath}`);
  }

  if (missingDeps.length > 0) {
    logError(`Missing dependencies: ${missingDeps.join(', ')}`);
    log('Please install the missing dependencies and run setup again.', 'yellow');
    return false;
  }

  return true;
}

// Install npm dependencies
async function installNpmDependencies() {
  logStep('2', 'Installing npm dependencies...');

  try {
    log('Running npm install...', 'blue');
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    logSuccess('npm dependencies installed successfully');
    return true;
  } catch (error) {
    logError(`Failed to install npm dependencies: ${error.message}`);
    return false;
  }
}

// Build the project
async function buildProject() {
  logStep('3', 'Building the project...');

  try {
    log('Running npm run build...', 'blue');
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    logSuccess('Project built successfully');
    return true;
  } catch (error) {
    logError(`Failed to build project: ${error.message}`);
    return false;
  }
}

// Create configuration
async function createConfiguration() {
  logStep('4', 'Creating configuration...');

  try {
    const configDir = path.join(__dirname, 'config');
    const configFile = path.join(configDir, 'default.conf');

    // Ensure config directory exists
    await fs.mkdir(configDir, { recursive: true });

    // Check if config already exists
    try {
      await fs.access(configFile);
      logSuccess('Configuration file already exists');
      return true;
    } catch {
      // Config doesn't exist, create it
    }

    // Get user's home directory
    const homeDir = os.homedir();
    const tabsDir = path.join(homeDir, 'Tabs');
    const logDir = path.join(homeDir, '.cache', '133748');
    const tmpDir = isWindows ? path.join(os.tmpdir(), '133748') : '/tmp';

    // Create directories
    await fs.mkdir(tabsDir, { recursive: true });
    await fs.mkdir(logDir, { recursive: true });

    // Find Chrome executable
    const chromePath = await findChromeExecutable();

    // Create config content
    const configContent = `# 133748 Configuration File
# This file is automatically generated. Modify with care.

# --- General Settings ---
# Directory where downloaded tabs will be saved.
tabs_dir = ${tabsDir}

# Directory for application logs.
log_dir = ${logDir}

# Log level for console and file output (debug, info, warn, error, silent).
log_level = debug

# --- Scraper Settings ---
# Maximum number of concurrent downloads.
concurrent_downloads = 3

# Timeout for network requests in milliseconds.
request_timeout_ms = 15000

# Delay between fetching successive search result pages in milliseconds.
page_delay_ms = 1000

# Maximum number of search result pages to fetch during a search operation.
max_search_pages = 10

# Minimum number of results expected on a page after the first to continue pagination.
min_results_per_page_threshold = 5

# Path to a specific Chrome/Chromium executable (optional).
${chromePath ? `chrome_path = ${chromePath}` : '# chrome_path = /usr/bin/google-chrome-stable'}

# --- FZF / TUI Settings ---
# Should the TUI automatically launch if no command is given? (true/false)
auto_launch_tui = false

# --- Development / Internal ---
# Directory for temporary files.
tmp_dir = ${tmpDir}
`;

    await fs.writeFile(configFile, configContent);
    logSuccess(`Configuration created at: ${configFile}`);
    return true;
  } catch (error) {
    logError(`Failed to create configuration: ${error.message}`);
    return false;
  }
}

// Create run scripts
async function createRunScripts() {
  logStep('5', 'Creating run scripts...');

  try {
    // Create Windows batch file
    if (isWindows) {
      const batchContent = `@echo off
REM 133748 Run Script for Windows
echo Starting 133748...

REM Check if dist directory exists
if not exist "dist" (
    echo Building project first...
    call npm run build
    if errorlevel 1 (
        echo Build failed!
        pause
        exit /b 1
    )
)

REM Run the application
node dist/index.js %*
pause
`;
      await fs.writeFile(path.join(__dirname, 'run.bat'), batchContent);
      logSuccess('Created run.bat for Windows');
    }

    // Create Unix shell script
    const shellContent = `#!/bin/bash
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
`;
    await fs.writeFile(path.join(__dirname, 'run.sh'), shellContent);

    // Make shell script executable
    if (!isWindows) {
      execSync('chmod +x run.sh', { cwd: __dirname });
    }
    logSuccess('Created run.sh for Unix-like systems');

    return true;
  } catch (error) {
    logError(`Failed to create run scripts: ${error.message}`);
    return false;
  }
}

// Test the installation
async function testInstallation() {
  logStep('6', 'Testing installation...');

  try {
    // Test if the built files exist
    const distIndex = path.join(__dirname, 'dist', 'index.js');
    await fs.access(distIndex);
    logSuccess('Built files found');

    // Test configuration
    const configFile = path.join(__dirname, 'config', 'default.conf');
    await fs.access(configFile);
    logSuccess('Configuration file accessible');

    // Test basic functionality
    log('Testing basic functionality...', 'blue');
    execSync('node dist/index.js --help', { stdio: 'pipe', cwd: __dirname });
    logSuccess('Basic functionality test passed');

    return true;
  } catch (error) {
    logError(`Installation test failed: ${error.message}`);
    return false;
  }
}

// Main setup function
async function main() {
  log('133748 Cross-Platform Setup', 'bright');
  log('============================', 'bright');
  log(`Platform: ${platform}`, 'blue');
  log(`Node.js: ${process.version}`, 'blue');
  log('');

  const steps = [
    installSystemDependencies,
    installNpmDependencies,
    buildProject,
    createConfiguration,
    createRunScripts,
    testInstallation,
  ];

  for (const step of steps) {
    const success = await step();
    if (!success) {
      logError('Setup failed. Please check the errors above and try again.');
      process.exit(1);
    }
    log('');
  }

  log('Setup completed successfully!', 'green');
  log('');
  log('Usage:', 'bright');
  if (isWindows) {
    log('  run.bat search "metallica one"', 'cyan');
    log('  run.bat search "dream theater" --json', 'cyan');
    log('  run.bat search "plini" --tui', 'cyan');
  } else {
    log('  ./run.sh search "metallica one"', 'cyan');
    log('  ./run.sh search "dream theater" --json', 'cyan');
    log('  ./run.sh search "plini" --tui', 'cyan');
  }
  log('');
  log('For more information, see README.md', 'blue');
}

// Run setup
main().catch((error) => {
  logError(`Setup failed with error: ${error.message}`);
  process.exit(1);
});
