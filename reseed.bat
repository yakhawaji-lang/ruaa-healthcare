@echo off
title RU-MD Reseed
cd /d "%~dp0server"
echo Re-seeding the database with clean service slugs...
call npm run seed
if errorlevel 1 (
  echo [ERROR] Reseed failed. Make sure MySQL is running in XAMPP.
  pause
  exit /b 1
)
echo.
echo Done. Now reload http://localhost:4000 in your browser.
timeout /t 4 /nobreak >nul
