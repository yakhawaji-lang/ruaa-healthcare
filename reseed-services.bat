@echo off
title RU-MD Reseed Services
cd /d "%~dp0server"
echo Replacing the services catalog with the new list...
node db/seedServices.js
if errorlevel 1 (
  echo [ERROR] Reseed failed. Make sure MySQL is running in XAMPP.
  pause
  exit /b 1
)
echo.
echo Done. Reload http://localhost:4000 to see the new services.
timeout /t 4 /nobreak >nul
