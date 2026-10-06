@echo off
cd /d "%~dp0backend"

if not exist "venv\Scripts\python.exe" (
  echo Detection Lens is not set up yet.
  echo Run setup_windows.bat first.
  pause
  exit /b 1
)

call "venv\Scripts\activate.bat"
echo Starting FastAPI at http://127.0.0.1:8000
echo API documentation: http://127.0.0.1:8000/docs
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause
