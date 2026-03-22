@echo off
title IPTV Pro Launcher
cd /d "%~dp0"

echo.
echo ==================================================
echo   IPTV Pro Player - Starting...
echo ==================================================
echo.

:: Try python, then py launcher (Windows Store Python uses 'py')
where python >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON=python
    goto :found
)

where py >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON=py
    goto :found
)

echo [ERROR] Python not found in PATH.
echo.
echo Fix options:
echo   1. Install Python from https://python.org
echo      Make sure to check "Add Python to PATH" during install
echo   2. Or run manually:
echo      - Open this folder in terminal
echo      - Type: python -m http.server 8000
echo      - Then open: http://localhost:8000/iptv-pro-player.html
echo.
pause
exit /b 1

:found
echo [OK] Found Python: %PYTHON%
echo.

:: Check if server.py exists - use it (has proxy + football API)
:: Otherwise fall back to built-in http.server
if exist "server.py" (
    echo [INFO] Starting server.py (full features: proxy, DLNA, football API^)
    echo [INFO] Server window will open separately - DO NOT close it.
    echo.
    start "IPTV Proxy Server - DO NOT CLOSE" cmd /k "%PYTHON% server.py"
) else (
    echo [INFO] server.py not found, using basic http.server
    echo [INFO] Note: proxy and football API features will not work.
    echo.
    start "IPTV Basic Server - DO NOT CLOSE" cmd /k "%PYTHON% -m http.server 8000"
)

:: Wait longer for server to start
echo Waiting for server to start...
timeout /t 4 /nobreak >nul

:: Verify server is actually up by trying to reach it
:: (Simple check - just wait and open)
echo Opening IPTV Player in browser...
echo.

:: IMPORTANT: Use localhost not 127.0.0.1 (avoids CORS mismatch)
start "" "http://localhost:8000/iptv-pro-player.html"

echo ==================================================
echo   Done! Player should open in your browser.
echo.
echo   If browser didn't open, go to:
echo   http://localhost:8000/iptv-pro-player.html
echo.
echo   To stop the server, close the "IPTV Proxy Server" window.
echo ==================================================
echo.
pause
