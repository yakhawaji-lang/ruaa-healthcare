@echo off
title RU-MD - Clean stray Ruaa + push
cd /d "%~dp0"
echo Removing stray nested "Ruaa" from git tracking (kept on disk)...
git rm -r --cached Ruaa
git add -A
git commit -m "Remove stray nested Ruaa repo from tracking"
git push origin main
echo.
echo Done.
pause
