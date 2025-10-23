@echo off
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
