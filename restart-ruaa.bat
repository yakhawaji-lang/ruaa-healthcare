@echo off
title RU-MD Restart
cd /d "%~dp0"
echo ==================================================
echo    RU-MD - Restart (rebuild + restart server)
echo    (No database changes - your data is untouched)
echo ==================================================
echo.

REM 1) Stop the running server so new server code is picked up
echo [1/3] Stopping running server...
taskkill /F /IM node.exe >nul 2>nul
timeout /t 2 /nobreak >nul

REM 2) Rebuild the front-end
echo [2/3] Rebuilding the site...
call npm run build
if errorlevel 1 ( echo [ERROR] Build failed. & pause & exit /b 1 )

REM 3) Restart the server
echo [3/3] Starting server on http://localhost:4000 ...
start "" http://localhost:4000/admin/insurers
cd /d "%~dp0server"
call npm start
pause
