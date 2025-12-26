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
  echo   Next Steps:
  echo.   1. Double-click iptv-pro-player.html to open in browser
  echo.   2. Click Settings (⚙️ icon in top-right)
  echo.   3. Enter your IPTV credentials:
  echo.      - Server URL (e.g., http://vipxtv.net:80)
  echo.      - Username
  echo.      - Password
  echo.   4. Enter your API keys:
  echo.      - Football API Key (from RapidAPI)
  echo.      - OMDb API Key (from omdbapi.com)
  echo.   5. Click "Save Settings"
  echo.   6. Refresh the page (Ctrl+R)
  echo.   7. Start streaming!
  echo.
  echo   For detailed setup, see: README.md
  echo.   For API details, see: API_REFERENCE.md
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
