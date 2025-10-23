# EchoHEIST Web App - Installation Guide

## 🚀 Quick Start (All Operating Systems)

### Option 1: Universal Launcher (Recommended)

```bash
# Make executable and run
chmod +x launch.sh
./launch.sh
```

### Option 2: Manual Installation

#### Windows

```cmd
# Using Command Prompt
install.bat
run.bat

# Using PowerShell
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

## 📋 Prerequisites

### Required

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **npm** - Comes with Node.js

### Recommended

- **Chrome/Chromium** - For better performance (Puppeteer will use bundled Chromium if not found)

## 🔧 Installation Process

The installation scripts will automatically:

1. ✅ **Check Prerequisites**

   - Verify Node.js and npm are installed
   - Check for Chrome/Chromium browser
   - Display version information

2. 📦 **Install Dependencies**

   - Install all required npm packages
   - Handle any dependency conflicts

3. 🔨 **Build Project**

   - Compile TypeScript/JavaScript files
   - Copy static web files
   - Generate distribution files

4. 📁 **Setup Directories**
   - Create tabs directory (`~/Tabs` or `%USERPROFILE%\Tabs`)
   - Set up log directories
   - Configure file permissions

## 🌐 Starting the Web App

After installation, the web app will be available at:
**http://localhost:3000**

### Features Available:

- 🎯 **URL Input** - Paste Ultimate Guitar tab URLs
- 📊 **Real-time Progress** - Live updates during download
- 📥 **File Download** - Automatic file serving when complete
- 🔍 **Verbose Logging** - Detailed step-by-step output

## 🛠️ Troubleshooting

### Common Issues

#### Port 3000 Already in Use

```bash
# The scripts will automatically try to kill existing processes
# If that fails, manually kill processes:
# Windows:
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# macOS/Linux:
lsof -i :3000
kill -9 <PID>
```

#### Node.js Not Found

- Install Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal/command prompt
- Verify with: `node --version`

#### Permission Denied (Unix-like systems)

```bash
# Make scripts executable
chmod +x *.sh
```

#### PowerShell Execution Policy (Windows)

```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Manual Installation

If the scripts fail, you can install manually:

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Start the web app
npm run web
```

## 📁 File Structure After Installation

```
133748-1/
├── dist/                    # Built files
│   └── web/
│       ├── server.js        # Web server
│       └── public/
│           └── index.html   # Web interface
├── node_modules/            # Dependencies
├── ~/Tabs/                  # Downloaded files (created automatically)
├── install.sh/.bat/.ps1     # Installation scripts
├── run.sh/.bat/.ps1         # Run scripts
└── launch.sh                # Universal launcher
```

## 🔄 Updates

To update EchoHEIST:

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

## 🆘 Getting Help

1. **Check the logs** - The web interface shows detailed error messages
2. **Verify prerequisites** - Ensure Node.js and Chrome are installed
3. **Check port availability** - Make sure port 3000 is free
4. **Review configuration** - Check `config/default.conf` for settings

## 🎯 Usage Examples

### Download a Guitar Pro Tab

1. Open http://localhost:3000
2. Paste URL: `https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157`
3. Click "Download Guitar Pro File"
4. Watch real-time progress
5. Download the file when complete

### Command Line Alternative

```bash
# Still works with the original CLI
npm run search "metallica one"
node dist/index.js grab "https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157"
```

## 🎉 Success!

Once installed, you'll have:

- ✅ **Web-based interface** for easy tab downloading
- ✅ **Real-time progress tracking** with verbose output
- ✅ **Automatic file serving** when downloads complete
- ✅ **Cross-platform compatibility** on Windows, macOS, and Linux
- ✅ **Simple installation** with automated scripts
