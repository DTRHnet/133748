# Windows Setup Guide for EchoHEIST

## 🪟 Windows-Specific Installation and Troubleshooting

This guide provides detailed instructions for setting up EchoHEIST on Windows systems.

## 📋 Prerequisites

### Required Software

1. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)

   - Choose the Windows Installer (.msi)
   - Make sure to check "Add to PATH" during installation
   - Verify installation: Open Command Prompt and run `node --version`

2. **npm** - Comes with Node.js

   - Verify: `npm --version`

3. **Git** (Optional but recommended) - Download from [git-scm.com](https://git-scm.com/)

### Recommended

- **Chrome/Chromium** - For better Puppeteer performance
- **PowerShell 5.1+** - For running PowerShell scripts
- **Windows 10/11** - For best compatibility

## 🚀 Installation Methods

### Method 1: Automated Scripts (Recommended)

#### Option A: PowerShell Script

```powershell
# Open PowerShell as Administrator (recommended)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\install.ps1
.\run.ps1
```

#### Option B: Command Prompt Script

```cmd
# Open Command Prompt
install.bat
run.bat
```

#### Option C: Universal Launcher

```bash
# If you have Git Bash or WSL
chmod +x launch.sh
./launch.sh
```

### Method 2: Manual Installation

#### Step 1: Clone Repository

```cmd
git clone https://github.com/DTRHnet/133748.git
cd 133748
```

#### Step 2: Install Dependencies

```cmd
npm install
```

#### Step 3: Build Project

```cmd
npm run build
```

#### Step 4: Start Web App

```cmd
npm run web
```

## 🔧 Windows-Specific Configuration

### Environment Variables

```cmd
# Set custom port
set PORT=8080
npm run web

# Set log level
set LOG_LEVEL=debug
npm run web
```

### PowerShell Environment Variables

```powershell
$env:PORT = "8080"
$env:LOG_LEVEL = "debug"
npm run web
```

### Configuration File

Edit `config/default.conf`:

```ini
# Windows-specific paths
tabs_dir = C:\Users\%USERNAME%\Tabs
log_dir = C:\Users\%USERNAME%\.cache\133748
chrome_path = C:\Program Files\Google\Chrome\Application\chrome.exe
```

## 🚨 Common Windows Issues

### PowerShell Execution Policy

**Error:** `execution of scripts is disabled on this system`

**Solution:**

```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node.js Not Found

**Error:** `'node' is not recognized as an internal or external command`

**Solutions:**

1. **Reinstall Node.js** with "Add to PATH" checked
2. **Restart Command Prompt/PowerShell**
3. **Add Node.js manually to PATH:**
   ```cmd
   setx PATH "%PATH%;C:\Program Files\nodejs"
   ```

### Build Failures

**Error:** `Failed to build project`

**Solutions:**

1. **Clear npm cache:**

   ```cmd
   npm cache clean --force
   ```

2. **Delete node_modules and reinstall:**

   ```cmd
   rmdir /s node_modules
   del package-lock.json
   npm install
   ```

3. **Install dependencies with legacy peer deps:**
   ```cmd
   npm install --legacy-peer-deps
   ```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solutions:**

1. **Kill processes on port 3000:**

   ```cmd
   netstat -ano | findstr :3000
   taskkill /F /PID <PID>
   ```

2. **Use different port:**
   ```cmd
   set PORT=8080
   npm run web
   ```

### Chrome/Chromium Issues

**Error:** `Failed to launch browser`

**Solutions:**

1. **Install Chrome:**

   - Download from [google.com/chrome](https://www.google.com/chrome/)
   - Install normally

2. **Set Chrome path in config:**

   ```ini
   chrome_path = C:\Program Files\Google\Chrome\Application\chrome.exe
   ```

3. **Use bundled Chromium:**
   - Puppeteer will use its bundled Chromium if Chrome is not found

### Antivirus Interference

**Issue:** Antivirus blocking Node.js or Puppeteer

**Solutions:**

1. **Add exclusions** for:

   - Project directory
   - Node.js installation directory
   - Chrome/Chromium directories

2. **Temporarily disable** real-time protection during installation

### Long Path Issues

**Error:** `ENAMETOOLONG` or path too long errors

**Solutions:**

1. **Enable long path support** (Windows 10/11):

   ```cmd
   # Run as Administrator
   reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1
   ```

2. **Use shorter project path:**
   - Move project to `C:\133748\` instead of deep nested paths

## 🛠️ Development Setup

### Visual Studio Code

1. **Install VS Code** from [code.visualstudio.com](https://code.visualstudio.com/)
2. **Install extensions:**
   - JavaScript (ES6) code snippets
   - Prettier - Code formatter
   - ESLint
   - GitLens

### Windows Subsystem for Linux (WSL)

If you prefer Linux environment on Windows:

```bash
# Install WSL2
wsl --install

# Use Linux scripts
chmod +x install.sh run.sh
./install.sh
./run.sh
```

## 📊 Performance Optimization

### Windows-Specific Optimizations

1. **Disable Windows Defender** real-time scanning for project folder
2. **Use SSD** for better I/O performance
3. **Close unnecessary applications** to free up memory
4. **Use Chrome** instead of bundled Chromium for better performance

### Memory Management

```cmd
# Monitor memory usage
tasklist /fi "imagename eq node.exe"

# Kill all Node.js processes if needed
taskkill /f /im node.exe
```

## 🔍 Debugging

### Enable Verbose Logging

```cmd
set LOG_LEVEL=debug
npm run web
```

### Check Node.js Version

```cmd
node --version
npm --version
```

### Verify Dependencies

```cmd
npm list
npm outdated
```

### Test WebSocket Connection

Open browser console and check for WebSocket connection errors.

## 📱 Mobile Testing on Windows

### Local Network Access

To test on mobile devices connected to the same network:

1. **Find your IP address:**

   ```cmd
   ipconfig
   ```

2. **Start with IP binding:**

   ```cmd
   set HOST=0.0.0.0
   npm run web
   ```

3. **Access from mobile:**
   - Use `http://YOUR_IP:3000` instead of `localhost:3000`

## 🆘 Getting Help

### Windows-Specific Resources

- **Node.js Windows Guide:** [nodejs.org/en/download/package-manager/#windows](https://nodejs.org/en/download/package-manager/#windows)
- **PowerShell Documentation:** [docs.microsoft.com/powershell](https://docs.microsoft.com/powershell)
- **Windows Command Reference:** [docs.microsoft.com/windows-server/administration/windows-commands](https://docs.microsoft.com/windows-server/administration/windows-commands)

### Common Commands Reference

```cmd
# Check Node.js installation
node --version
npm --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rmdir /s node_modules
npm install

# Kill processes on specific port
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Set environment variables
set PORT=8080
set LOG_LEVEL=debug
```

## ✅ Success Indicators

Your Windows installation is working when you see:

- ✅ Node.js and npm commands work in Command Prompt/PowerShell
- ✅ `npm run web` starts without errors
- ✅ Browser opens to `http://localhost:3000`
- ✅ Web interface loads and responds to input
- ✅ Downloads complete successfully

## 🎉 You're Ready!

Once everything is working, you can:

- Use the web interface at `http://localhost:3000`
- Run CLI commands from Command Prompt or PowerShell
- Test on mobile devices using your local IP address
- Customize configuration in `config/default.conf`

Happy downloading! 🎸
