@echo off
SETLOCAL
TITLE SafeSpace - System Launcher
COLOR 0B
SET "ROOT_DIR=%~dp0"

echo ===================================================
echo   🚀 SafeSpace - Starting All Services
echo ===================================================
echo.

:: Check for node_modules
if not exist "%ROOT_DIR%node_modules\" (
    echo ❌ ERROR: node_modules not found in root directory!
    echo Please run 'install-all.bat' first to install dependencies.
    echo.
    pause
    exit /b 1
)

if not exist "%ROOT_DIR%backend-node\node_modules\" (
    echo ❌ ERROR: node_modules not found in backend-node directory!
    echo Please run 'install-all.bat' first to install dependencies.
    echo.
    pause
    exit /b 1
)

:: 1. Start PHP Backend
echo [1/3] Launching PHP Backend on http://localhost:8000...
start "SafeSpace - PHP Backend" cmd /k "echo Starting PHP Server... && cd /d %ROOT_DIR%backend && php -S localhost:8000"

:: 2. Start Node.js Backend
echo [2/3] Launching Node.js Backend on http://localhost:5001...
start "SafeSpace - Node.js Backend" cmd /k "echo Starting Node.js Server... && cd /d %ROOT_DIR%backend-node && npm start"

:: 3. Start Frontend
echo [3/3] Launching React Frontend on http://localhost:5173...
start "SafeSpace - Frontend" cmd /k "echo Starting Vite/React Frontend... && cd /d %ROOT_DIR% && npm run dev"

echo.
echo ===================================================
echo   ✅ All terminals opened successfully!
echo ===================================================
echo.
echo ⏳ Please wait about 10 seconds for everything to load.
echo.
echo 📱 Main App:           http://localhost:5173
echo 👨‍💼 Admin Dashboard:   http://localhost:5173/admin
echo 🔑 Admin Token:       admin_secret_token_12345
echo.
echo ⚠️  Keep all three black windows open while using the app!
echo.
echo ===================================================
pause

