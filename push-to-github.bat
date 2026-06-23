@echo off
title RU-MD - Push to GitHub
cd /d "%~dp0"
echo ==================================================
echo    Pushing RU-MD project to GitHub
echo    Repo: yakhawaji-lang/ruaa-healthcare
echo ==================================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git is not installed or not in PATH.
  echo Install Git from https://git-scm.com/download/win then run again.
  pause
  exit /b 1
)

if not exist ".git" git init
git add -A
git commit -m "Production prep + new services + deploy config"
git branch -M main
git remote remove origin >nul 2>nul
git remote add origin https://github.com/yakhawaji-lang/ruaa-healthcare.git
echo.
echo Pushing... (a GitHub sign-in window may open — approve it)
git push -u origin main
echo.
echo If you see "Everything up-to-date" or branch 'main' set up to track, it worked.
pause
