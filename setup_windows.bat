@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo Detection Lens - First-time setup
echo ========================================

where python >nul 2>nul
if errorlevel 1 (
  echo ERROR: Python is not installed or is not available in PATH.
  echo Install Python 3.11 or newer, then run this file again.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or is not available in PATH.
  echo Install Node.js 22.13 or newer, then run this file again.
  pause
  exit /b 1
)

echo.
echo [1/4] Creating the Python environment...
if not exist "backend\venv\Scripts\python.exe" (
  python -m venv backend\venv
  if errorlevel 1 goto :failed
)

echo [2/4] Installing FastAPI and NLP packages...
call "backend\venv\Scripts\activate.bat"
python -m pip install --upgrade pip
if errorlevel 1 goto :failed
python -m pip install -r backend\requirements.txt
if errorlevel 1 goto :failed

echo [3/4] Installing frontend packages...
call npm install
if errorlevel 1 goto :failed

echo [4/4] Connecting the frontend to FastAPI...
> .env.local echo NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000

echo.
echo Setup completed successfully.
echo Next, start run_backend.bat and run_frontend.bat.
pause
exit /b 0

:failed
echo.
echo Setup failed. Read the error above, then try again.
pause
exit /b 1
