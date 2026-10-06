@echo off
cd /d "%~dp0"

if not exist "node_modules" (
  echo Detection Lens is not set up yet.
  echo Run setup_windows.bat first.
  pause
  exit /b 1
)

set WRANGLER_LOG_PATH=.wrangler\wrangler.log
echo Starting Detection Lens at http://127.0.0.1:4173
call npx vite --host 127.0.0.1 --port 4173
pause
