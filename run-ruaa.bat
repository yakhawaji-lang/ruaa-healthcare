@echo off
title RU-MD - Ruaa Home Healthcare
cd /d "%~dp0"
echo ==================================================
echo    RU-MD  -  Ruaa Home Healthcare  Launcher
echo ==================================================
echo.

REM ---------- 0) Check Node.js ----------
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found in PATH.
  echo Please install Node.js 18+ from https://nodejs.org and run this again.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do echo Node.js %%v detected.
echo.

REM ---------- 1) Start XAMPP MySQL if not already running ----------
echo [1/5] Checking MySQL (XAMPP)...
tasklist /FI "IMAGENAME eq mysqld.exe" | find /I "mysqld.exe" >nul
if errorlevel 1 (
  set "XAMPP=C:\xampp"
  if exist "C:\xampp\mysql\bin\mysqld.exe" (
    echo Starting MySQL from C:\xampp ...
    start "" /B "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini"
    echo Waiting for MySQL to start...
    timeout /t 8 /nobreak >nul
  ) else (
    echo [!] XAMPP not found at C:\xampp.
    echo     Please start MySQL manually from the XAMPP Control Panel, then press any key.
    pause
  )
) else (
  echo MySQL is already running.
)
echo.

REM ---------- 2) Server dependencies + .env ----------
echo [2/5] Installing server dependencies...
cd /d "%~dp0server"
if not exist .env copy .env.example .env >nul
if not exist node_modules (
  call npm install --no-audit --no-fund
) else (
  echo Server dependencies already installed.
)
echo.

REM ---------- 3) Create DB + tables + seed content ----------
echo [3/5] Setting up database (migrate + seed)...
call npm run setup
if errorlevel 1 (
  echo [ERROR] Database setup failed. Make sure MySQL is running in XAMPP.
  pause
  exit /b 1
)
echo.

REM ---------- 4) Frontend dependencies + production build ----------
echo [4/5] Installing frontend and building the site...
cd /d "%~dp0"
if not exist node_modules (
  call npm install --no-audit --no-fund
) else (
  echo Frontend dependencies already installed.
)
call npm run build
if errorlevel 1 (
  echo [ERROR] Front-end build failed.
  pause
  exit /b 1
)
echo.

REM ---------- 5) Launch ----------
echo [5/5] Starting RU-MD server on http://localhost:4000
echo.
echo    Website : http://localhost:4000
echo    Admin   : http://localhost:4000/admin
echo    Login   : admin@rumd.me  /  Admin@12345
echo.
echo (Keep this window open. Press Ctrl+C to stop the server.)
echo.
start "" http://localhost:4000
cd /d "%~dp0server"
call npm start
pause
