@echo off
echo ========================================
echo Lexora Library Management System
echo Frontend Development Server
echo ========================================
echo.

cd /d "%~dp0client"

echo [1/3] Checking if node_modules exists...
if not exist "node_modules\" (
    echo Node modules not found. Installing dependencies...
    call npm install
    echo.
) else (
    echo Dependencies already installed.
    echo.
)

echo [2/3] Starting frontend server...
echo App will run on http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev

pause