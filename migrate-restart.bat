@echo off
title RU-MD Migrate + Restart
cd /d "%~dp0"
echo ==================================================
echo    RU-MD - migrate (no seed) + rebuild + restart
echo    Your existing data is preserved.
echo ==================================================
echo.

echo [1/4] Stopping running server...
taskkill /F /IM node.exe >nul 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Applying database migrations...
cd /d "%~dp0server"
call npm run migrate
if errorlevel 1 ( echo [ERROR] Migration failed. Is MySQL running in XAMPP? & pause & exit /b 1 )

echo [3/4] Rebuilding the site...
cd /d "%~dp0"
call npm run build
if errorlevel 1 ( echo [ERROR] Build failed. & pause & exit /b 1 )

echo [4/4] Starting server on http://localhost:4000 ...
start "" http://localhost:4000/admin/insurers
cd /d "%~dp0server"
call npm start
pause
