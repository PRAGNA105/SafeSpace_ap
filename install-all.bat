@echo off
TITLE SafeSpace - Dependency Installer
COLOR 0E

echo ===================================================
echo   📦 SafeSpace - Installing Dependencies
echo ===================================================
echo.
echo This might take a few minutes. Please wait...
echo.

:: 1. Install Frontend Dependencies
echo [1/2] Installing Frontend dependencies (Root folder)...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Failed to install frontend dependencies.
    pause
    exit /b %ERRORLEVEL%
)

:: 2. Install Node.js Backend Dependencies
echo.
echo [2/2] Installing Node.js Backend dependencies (backend-node folder)...
cd backend-node
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Failed to install backend-node dependencies.
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo ===================================================
echo   ✅ All dependencies installed successfully!
echo ===================================================
echo.
echo 🚀 You can now run 'start-all.bat' to launch the app.
echo.
pause
