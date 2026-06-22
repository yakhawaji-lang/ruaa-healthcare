@echo off
title RU-MD Rebuild
cd /d "%~dp0"
echo Rebuilding the front-end...
call npm run build
if errorlevel 1 (
  echo [ERROR] Build failed.
  pause
  exit /b 1
)
echo.
echo Done. Now reload http://localhost:4000/admin in your browser.
timeout /t 4 /nobreak >nul
