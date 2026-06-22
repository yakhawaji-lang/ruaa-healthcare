@echo off
title RU-MD Update
cd /d "%~dp0"
echo ==================================================
echo    RU-MD - applying update (images feature)
echo ==================================================
echo.

REM 1) Stop the running server so new server code is picked up
echo [1/4] Stopping running server...
taskkill /F /IM node.exe >nul 2>nul
timeout /t 2 /nobreak >nul

REM 2) Migrate (adds image column) + seed (image defaults + banners)
echo [2/4] Updating database...
cd /d "%~dp0server"
call npm run setup
if errorlevel 1 ( echo [ERROR] Database update failed. Is MySQL running in XAMPP? & pause & exit /b 1 )

REM 3) Rebuild the front-end
echo [3/4] Rebuilding the site...
cd /d "%~dp0"
call npm run build
if errorlevel 1 ( echo [ERROR] Build failed. & pause & exit /b 1 )

REM 4) Restart the server
echo [4/4] Starting server on http://localhost:4000 ...
start "" http://localhost:4000/admin
cd /d "%~dp0server"
call npm start
pause
