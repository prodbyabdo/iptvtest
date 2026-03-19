@echo off
REM IPTV Pro Player - Quick Setup Verification (Windows)

echo.
echo ==================================================
echo   IPTV Pro Player - Setup Verification
echo ==================================================
echo.

setlocal enabledelayedexpansion
set missing=0

for %%f in (
  "iptv-pro-player.html"
  "football-api.js"
  "omdb-api.js"
  "server.py"
  "RUN_IPTV.bat"
  "README.md"
  "API_REFERENCE.md"
) do (
  if exist %%f (
    for /f %%s in ('powershell -Command "(Get-Item %%f).Length / 1KB | ForEach-Object {[math]::Round($_)}"') do set size=%%s
    echo.   [✓] %%f  (!size! KB^)
  ) else (
    echo.   [✗] %%f  (MISSING^)
    set /a missing=!missing!+1
  )
)

echo.
echo ==================================================

if !missing! equ 0 (
  echo.   Status: OK - All files found!
  echo.
  echo.   Next Steps:
  echo.   1. START THE APP: Run RUN_IPTV.bat (Recommended)
  echo.   2. Enter your IPTV credentials in the settings (⚙️ icon).
  echo.   3. Save and enjoy!
  echo.
  echo   The backend server is REQUIRED for secure streaming.
) else (
  echo.   Status: ERROR - Missing !missing! file(s)
  echo.
  echo.   Please ensure all files are in the same directory:
  echo.   - iptv-pro-player.html
  echo.   - football-api.js
  echo.   - omdb-api.js
  echo.
)

echo ==================================================
echo.

pause
