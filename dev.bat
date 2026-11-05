@echo off
REM Starts HealthyPockets: the Python API (port 8000) and the Next.js site (port 3000).
REM Both restart/refresh automatically when you save a file. Press Ctrl+C to stop.
cd /d "%~dp0"

REM HealthyPockets is privacy-first, so switch off Next.js's anonymous usage tracking.
set NEXT_TELEMETRY_DISABLED=1

where py >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Install it from https://www.python.org/downloads/ and try again.
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install it from https://nodejs.org/ and try again.
  exit /b 1
)

REM First run: install everything that is missing.
py -c "import fastapi, uvicorn, multipart, pandas" >nul 2>nul
if errorlevel 1 (
  echo Installing Python packages...
  py -m pip install -r backend\requirements.txt || exit /b 1
)
if not exist node_modules (
  echo Installing the dev runner...
  call npm install || exit /b 1
)
if not exist frontend\node_modules (
  echo Installing the website packages...
  call npm --prefix frontend install || exit /b 1
)

echo.
echo   Website:  http://127.0.0.1:3000
echo   API:      http://127.0.0.1:8000/docs
echo.
call npm run dev
