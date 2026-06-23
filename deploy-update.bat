@echo off
title RU-MD - Build + Push update to GitHub
cd /d "%~dp0"
echo ==================================================
echo   RU-MD update: build front-end, commit, push
echo ==================================================
echo.
echo [1/3] Building front-end (vite)...
call npm run build
if errorlevel 1 (
  echo.
  echo [ERROR] Build failed. Fix the error above and run again.
  pause
  exit /b 1
)
echo.
echo [2/3] Committing changes...
git add -A
git commit -m "Responsive mobile/tablet improvements"
echo.
echo [3/3] Pushing to GitHub (a sign-in window may appear)...
git push origin main
echo.
echo ==================================================
echo   Done. Next: redeploy on Hostinger (panel Deploy
echo   button) OR it auto-deploys, then test rumd.me.
echo ==================================================
pause
