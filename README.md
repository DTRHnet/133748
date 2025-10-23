# 🎸 EchoHEIST - Ultimate Guitar Tab Downloader

[![Version](https://img.shields.io/badge/version-0.2.0--alpha--04-blue.svg)](https://github.com/DTRHnet/133748)
[![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

**EchoHEIST** is a powerful web application that bypasses authentication walls on Ultimate Guitar to download Guitar Pro files directly. It features a modern web interface with real-time progress tracking and verbose output.

## 🌟 Features

- 🌐 **Web-based Interface** - Modern, responsive design that works on all devices
- 📊 **Real-time Progress Tracking** - Live updates via WebSocket showing every step
- 🔍 **Verbose Logging** - Detailed step-by-step output of the download process
- 📱 **Mobile Optimized** - Fully responsive design with touch-friendly interface
- 🚀 **One-Click Installation** - Automated setup scripts for all operating systems
- 📥 **Automatic File Serving** - Direct download links when files are ready
- 🔧 **Cross-Platform** - Works on Windows, macOS, and Linux

## 🚀 Quick Start

### Option 1: Universal Launcher (Recommended)

```bash
# Works on all operating systems
chmod +x launch.sh
./launch.sh
```

### Option 2: OS-Specific Scripts

#### Windows

```cmd
# Command Prompt
install.bat
run.bat

# PowerShell
.\install.ps1
.\run.ps1
```

#### macOS/Linux

```bash
# Make scripts executable
chmod +x install.sh run.sh

# Install and run
./install.sh
./run.sh
```

### Option 3: Manual Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the web app
npm run web
```

## 📋 Prerequisites

### Required

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **npm** - Comes with Node.js

### Recommended

- **Chrome/Chromium** - For better performance (Puppeteer will use bundled Chromium if not found)

## 🎯 Usage

### Web Interface

1. **Start the app** using any of the methods above
2. **Open your browser** to `http://localhost:3000`
3. **Paste a URL** - Enter any Ultimate Guitar Guitar Pro tab URL
4. **Watch progress** - See real-time verbose output of the download process
5. **Download file** - Get your Guitar Pro file when complete

### Example URLs

```
https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157
https://tabs.ultimate-guitar.com/tab/dream-theater/pull-me-under-guitar-pro-123456
https://tabs.ultimate-guitar.com/tab/plini/every-piece-matters-guitar-pro-789012
```

## 💡 Usage Examples

### Web App Examples

```bash
# Start web app
npm run web
# Open http://localhost:3000 in browser
# Paste any Ultimate Guitar Guitar Pro URL
```

### CLI Examples

#### Basic Search

```bash
# Search for Metallica tabs
node dist/index.js search "metallica"

# Search for specific song
node dist/index.js search "metallica one"

# Search with multiple words
node dist/index.js search "dream theater pull me under"
```

#### Advanced Search

```bash
# Search with JSON output for scripting
node dist/index.js search "plini" --json | jq '.[0].url'

# Limit search to 3 pages
node dist/index.js search "tool" --max-pages 3

# Verbose output for debugging
node dist/index.js search "opeth" --verbose
```

#### Interactive TUI

```bash
# Launch interactive mode
node dist/index.js search "progressive metal" --tui

# Navigate with arrow keys, mark items with space, download with 'd'
```

#### Direct Downloads

```bash
# Download a specific tab
node dist/index.js grab "https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157"

# Download to custom directory
node dist/index.js grab "URL" --output ~/Music/GuitarPro

# Download with verbose logging
node dist/index.js grab "URL" --verbose
```

#### Batch Operations

```bash
# Search and save results to file
node dist/index.js search "jazz fusion" --json > jazz_tabs.json

# Process results with other tools
node dist/index.js search "metal" --json | grep "Guitar Pro" | jq -r '.url' | while read url; do
    node dist/index.js grab "$url"
done
```

#### Configuration Examples

```bash
# Use custom config file
node dist/index.js search "query" --config ~/.config/my_133748.conf

# Set log level via environment
LOG_LEVEL=debug node dist/index.js search "query"

# Set custom output directory
OUTPUT_DIR=~/Downloads/Tabs node dist/index.js grab "URL"
```

### Original Shell Script Examples

```bash
# Make executable
chmod +x echoHEIST.sh

# Download a tab
./echoHEIST.sh "https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157"

# Download with custom filename (modify script)
./echoHEIST.sh "https://tabs.ultimate-guitar.com/tab/dream-theater/pull-me-under-guitar-pro-123456"
```

### Command Line Interface (Original)

```bash
# Search for tabs
npm run search "metallica one"

# Download a specific tab
node dist/index.js grab "https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157"

# Interactive TUI mode
npm run search -- "plini" --tui
```

## 🛠️ Installation Methods

### Method 1: Automated Scripts (Easiest)

#### Universal Launcher

The `launch.sh` script automatically detects your operating system and runs the appropriate installer:

```bash
chmod +x launch.sh
./launch.sh
```

#### Windows Scripts

**Command Prompt:**

```cmd
install.bat
run.bat
```

**PowerShell:**

```powershell
.\install.ps1
.\run.ps1
```

#### macOS/Linux Scripts

```bash
chmod +x install.sh run.sh
./install.sh
./run.sh
```

### Method 2: Manual Installation

#### Step 1: Clone the Repository

```bash
git clone https://github.com/DTRHnet/133748.git
cd 133748
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Build the Project

```bash
npm run build
```

#### Step 4: Start the Web App

```bash
npm run web
```

### Method 3: Development Setup

#### Install Development Dependencies

```bash
npm install
```

#### Build and Watch for Changes

```bash
npm run build
npm run web
```

#### Run Tests

```bash
npm test
npm run test:integration
npm run test:unit
```

## 🌐 Running Options

### Web Application

```bash
# Start the web interface
npm run web

# Or use the run scripts
./run.sh          # macOS/Linux
run.bat           # Windows CMD
.\run.ps1         # Windows PowerShell
```

**Access at:** `http://localhost:3000`

### Command Line Interface

#### Basic Commands

```bash
# Search for tabs
npm run search "artist song"

# Download specific tab
node dist/index.js grab "URL"

# Interactive TUI
npm run search -- "query" --tui
```

#### Detailed CLI Usage

**Search Command:**

```bash
# Basic search
node dist/index.js search "metallica one"

# Search with options
node dist/index.js search "dream theater" --json
node dist/index.js search "plini" --tui
node dist/index.js search "tool" --max-pages 5
```

**Grab Command:**

```bash
# Download a single tab
node dist/index.js grab "https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157"

# Download with custom output directory
node dist/index.js grab "URL" --output ~/Downloads
```

**Available Options:**

```bash
# Search options
--json              # Output results in JSON format
--tui               # Launch interactive Terminal User Interface
--max-pages N       # Limit search to N pages (default: 10)
--output DIR        # Specify output directory for downloads
--verbose           # Enable verbose logging
--quiet             # Minimal output

# Global options
--config FILE       # Use alternate configuration file
--log-level LEVEL   # Set log level (debug, info, warn, error, silent)
--help              # Show help information
--version           # Print version information
```

#### Interactive TUI Mode

```bash
# Launch TUI with search
node dist/index.js search "query" --tui

# TUI Controls:
# ↑/↓ Arrow Keys    - Navigate up/down
# ←/→ Arrow Keys    - Expand/collapse items
# Enter/→           - Open URL in browser
# Space             - Mark item for download
# d                 - Download all marked items
# a                 - Expand/collapse all at current level
# 1,2,3,4           - Sort by Type, Artist, Song, Tab Type
# q/Esc             - Quit
```

#### Output Formats

**Hierarchical Text (Default):**

```
Metallica
├── One
│   ├── Guitar Pro (Official) - 4.5/5 ⭐
│   ├── Power Tab - 4.2/5 ⭐
│   └── Tab - 4.0/5 ⭐
└── Enter Sandman
    ├── Guitar Pro - 4.8/5 ⭐
    └── Tab - 4.3/5 ⭐
```

**JSON Output:**

```bash
node dist/index.js search "metallica" --json
```

```json
[
  {
    "artist": "Metallica",
    "song": "One",
    "type": "Guitar Pro",
    "rating": 4.5,
    "url": "https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157"
  }
]
```

#### Configuration Options

```bash
# Set log level
export LOG_LEVEL=debug
node dist/index.js search "query"

# Use custom config
node dist/index.js search "query" --config ~/.config/133748.conf

# Set output directory
node dist/index.js grab "URL" --output ~/Music/Tabs
```

### Original Shell Script

```bash
# Make executable and run
chmod +x echoHEIST.sh
./echoHEIST.sh "https://tabs.ultimate-guitar.com/tab/artist/song-guitar-pro-123456"
```

## 📱 Mobile Support

The web app is fully optimized for mobile devices:

- **Responsive Design** - Adapts to all screen sizes
- **Touch-Friendly** - Optimized for touch interactions
- **Enhanced Debug Window** - Larger, more readable log display
- **Mobile Browsers** - Works on iOS Safari, Android Chrome, and more

### Mobile Testing

Open `test-mobile.html` in your mobile browser to test compatibility features.

## ⚡ Quick Reference

### Most Common Commands

```bash
# Web App (Easiest)
npm run web                    # Start web interface
# Then open http://localhost:3000

# CLI Search
node dist/index.js search "artist song"    # Basic search
node dist/index.js search "query" --tui    # Interactive mode
node dist/index.js search "query" --json   # JSON output

# CLI Download
node dist/index.js grab "URL"              # Download specific tab

# Original Script
./echoHEIST.sh "URL"                       # Direct download
```

### Installation Commands

```bash
# Universal (Recommended)
./launch.sh

# OS-Specific
./install.sh && ./run.sh                   # macOS/Linux
install.bat && run.bat                     # Windows CMD
.\install.ps1 && .\run.ps1                 # Windows PowerShell

# Manual
npm install && npm run build && npm run web
```

## 🔧 Configuration

### Environment Variables

```bash
# Set custom port
export PORT=8080
npm run web

# Set log level
export LOG_LEVEL=debug
npm run web
```

### Configuration File

Edit `config/default.conf` to customize settings:

```ini
# Directory where downloaded tabs will be saved
tabs_dir = ~/Tabs

# Log level (debug, info, warn, error, silent)
log_level = info

# Request timeout in milliseconds
request_timeout_ms = 15000

# Path to Chrome executable (optional)
# chrome_path = /usr/bin/google-chrome-stable
```

## 🚨 Troubleshooting

### Common Issues

#### Port 3000 Already in Use

```bash
# The scripts automatically handle this, but if manual:
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

#### Node.js Not Found

- Install Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal
- Verify: `node --version`

#### Permission Denied (Unix)

```bash
chmod +x *.sh
```

#### PowerShell Execution Policy (Windows)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Browser Console Errors

The errors you see in browser console like:

```
Uncaught Error: Attempting to use a disconnected port object
```

These are from browser extensions (ad blockers, password managers, etc.) and **do not affect EchoHEIST functionality**. They can be safely ignored.

### Getting Help

1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Verify prerequisites are installed
3. Try the automated installation scripts
4. Check server logs in the terminal

## 📁 Project Structure

```
133748/
├── src/                    # Source code
│   ├── web/               # Web application
│   │   ├── server.js      # Express server
│   │   └── public/        # Web interface
│   ├── cmd/               # Command line tools
│   ├── internal/          # Internal modules
│   └── pkg/               # Shared packages
├── dist/                  # Built files
├── config/                # Configuration files
├── install.sh/.bat/.ps1   # Installation scripts
├── run.sh/.bat/.ps1       # Run scripts
├── launch.sh              # Universal launcher
└── echoHEIST.sh           # Original shell script
```

## 🧪 Testing

### Test the Web App

```bash
# Run the test suite
node test-web-app.js

# Test mobile compatibility
open test-mobile.html
```

### Test Different Methods

```bash
# Test web interface
npm run web

# Test CLI
npm run search "test query"

# Test original script
./echoHEIST.sh "https://tabs.ultimate-guitar.com/tab/test/test-guitar-pro-123456"
```

## 🔄 Updates

### Update the Application

```bash
# Pull latest changes
git pull

# Reinstall dependencies
npm install

# Rebuild project
npm run build

# Restart web app
npm run web
```

### Update Dependencies

```bash
npm update
npm run build
```

## 📊 Performance

### System Requirements

- **RAM**: 512MB minimum, 1GB recommended
- **Storage**: 100MB for application, additional space for downloaded tabs
- **Network**: Stable internet connection for downloading tabs

### Optimization Tips

- Install Chrome/Chromium for better Puppeteer performance
- Close unnecessary browser tabs to free up memory
- Use a stable internet connection for reliable downloads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ultimate Guitar** - For providing the tab platform
- **Puppeteer** - For browser automation capabilities
- **Express.js** - For the web server framework
- **Socket.IO** - For real-time communication

## 📞 Support

- **Documentation**: See [WEB_APP_GUIDE.md](WEB_APP_GUIDE.md)
- **Mobile Guide**: See [MOBILE_GUIDE.md](MOBILE_GUIDE.md)
- **Troubleshooting**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Installation**: See [INSTALLATION.md](INSTALLATION.md)

## 🎉 Success Indicators

Your EchoHEIST installation is working correctly when you see:

- ✅ Server running on `http://localhost:3000`
- ✅ Web interface loads without errors
- ✅ Real-time progress updates during download
- ✅ File download completes successfully
- ✅ "Download process completed successfully!" message

---

**Made with ❤️ by [DTRH.net](https://dtrh.net)**

_EchoHEIST - Because music should be accessible to everyone._
