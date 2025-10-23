# EchoHEIST Web App - Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Browser Console Errors

#### "Attempting to use a disconnected port object"

```
Uncaught Error: Attempting to use a disconnected port object
    at ni.postMessage (classifier.js:1:352291)
    at ni.handleHeartbeat (classifier.js:1:353967)
```

**Cause**: These errors are from browser extensions (like ad blockers, password managers, or other Chrome extensions), NOT from the EchoHEIST web app.

**Solution**:

- ✅ **Ignore these errors** - they don't affect EchoHEIST functionality
- 🔧 **Disable extensions temporarily** if they're causing issues:
  1. Open Chrome DevTools (F12)
  2. Go to Extensions tab
  3. Disable extensions one by one to identify the culprit
- 🧹 **Clear browser cache** if problems persist

#### "Failed to load resource"

```
echoheist:1 Failed to load resource
```

**Cause**: This usually indicates the web app server isn't running or there's a network issue.

**Solution**:

1. ✅ **Check if server is running**: Look for "EchoHEIST Web App is ready!" in terminal
2. 🔄 **Restart the server**: `npm run web`
3. 🌐 **Verify URL**: Make sure you're accessing `http://localhost:3000`
4. 🔌 **Check port availability**: Ensure port 3000 isn't blocked

### Server-Side Issues

#### "Port 3000 already in use"

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Or use the automated scripts
./run.sh  # Will automatically kill existing processes
```

#### "Could not read package.json"

```
Could not read package.json for app name and version: ENOENT: no such file or directory
```

**Solution**: This is now fixed in the latest version. The app will work even if package.json can't be read.

#### "Web interface not found"

```
Error: ENOENT: no such file or directory, stat 'dist/web/public/index.html'
```

**Solution**:

```bash
# Rebuild the project
npm run build

# Or use the installation script
./install.sh
```

### Installation Issues

#### "Node.js not found"

```
❌ Node.js is not installed!
```

**Solution**:

1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Install version 18 or higher
3. Restart your terminal
4. Verify: `node --version`

#### "Permission denied" (Unix-like systems)

```
chmod: Permission denied
```

**Solution**:

```bash
# Make scripts executable
chmod +x *.sh

# Or run with bash
bash install.sh
bash run.sh
```

#### PowerShell Execution Policy (Windows)

```
PowerShell execution policy error
```

**Solution**:

```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run with bypass
powershell -ExecutionPolicy Bypass -File install.ps1
```

### Download Issues

#### "No direct download link intercepted"

```
⚠️ No direct download link intercepted. This might not be a Guitar Pro tab
```

**Causes & Solutions**:

1. **Wrong URL type**: Make sure it's a Guitar Pro tab URL
   - ✅ Good: `https://tabs.ultimate-guitar.com/tab/artist/song-guitar-pro-123456`
   - ❌ Bad: `https://tabs.ultimate-guitar.com/tab/artist/song-chords-123456`

2. **Tab requires login**: Some tabs require authentication
   - Try a different tab URL
   - Check if the tab is publicly available

3. **Network issues**: Check your internet connection
   - Try refreshing the page
   - Check if Ultimate Guitar is accessible

#### "Download failed"

```
❌ Download failed: [error message]
```

**Solutions**:

1. **Check URL validity**: Ensure it's a valid Ultimate Guitar URL
2. **Try different tab**: Some tabs may have restrictions
3. **Check network**: Ensure stable internet connection
4. **Retry**: Click the download button again

### Performance Issues

#### Slow downloads

- **Check Chrome installation**: Install Chrome for better performance
- **Close other tabs**: Free up system resources
- **Check internet speed**: Ensure stable connection

#### Browser crashes

- **Update Chrome**: Use the latest version
- **Disable extensions**: Temporarily disable browser extensions
- **Clear cache**: Clear browser cache and cookies

## 🔧 Debug Mode

### Enable Verbose Logging

The web app already provides verbose logging in the browser interface. For additional server-side logging:

```bash
# Set debug log level
export LOG_LEVEL=debug
npm run web
```

### Check Server Logs

Look for these log messages in the terminal:

- ✅ `🚀 EchoHEIST Web App running on http://localhost:3000`
- ✅ `📁 Tabs will be saved to: [directory]`
- ✅ `Browser launched successfully`
- ✅ `Captured download request`

### Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Monitor requests during download
4. Check Console tab for any errors

## 🆘 Getting Help

### Before Asking for Help

1. ✅ **Check this troubleshooting guide**
2. ✅ **Try the automated scripts**: `./install.sh` and `./run.sh`
3. ✅ **Verify prerequisites**: Node.js 18+, Chrome/Chromium
4. ✅ **Check server logs**: Look for error messages in terminal

### Information to Provide

When reporting issues, include:

- Operating system and version
- Node.js version (`node --version`)
- Browser and version
- Complete error messages
- Steps to reproduce the issue

### Quick Fixes

```bash
# Complete reset
rm -rf node_modules dist
npm install
npm run build
npm run web

# Or use the automated installer
./install.sh
./run.sh
```

## ✅ Success Indicators

Your EchoHEIST web app is working correctly when you see:

- 🌐 Server running on http://localhost:3000
- 🎯 Web interface loads without errors
- 📊 Real-time progress updates during download
- 📥 File download completes successfully
- 🎉 "Download process completed successfully!" message

The browser console errors you mentioned are from extensions and can be safely ignored!
