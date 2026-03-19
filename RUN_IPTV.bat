@echo off
title IPTV Pro Launcher
echo.
echo ==================================================
echo   IPTV Pro Player - Starting Proxy Server...
echo ==================================================
echo.

:: Check for python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python to use the proxy server.
    pause
    exit /b
)

:: Start proxy server in a new window
start "IPTV Proxy Server" cmd /c "python server.py"

:: Wait a moment for server to start
timeout /t 2 /nobreak >nul

:: Open the player in the default browser via the server
echo Opening IPTV Player...
start http://localhost:8000/iptv-pro-player.html

echo.
echo ==================================================
echo   System is running! 
echo   DO NOT CLOSE the "IPTV Proxy Server" window.
echo ==================================================
echo.
pause
