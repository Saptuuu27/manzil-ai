@echo off
title Building Android App...

REM Add the bundled Node to the system PATH for this script
SET "NODE_DIR=%~dp0node-v20.11.1-win-x64"
SET "PATH=%NODE_DIR%;%PATH%"

echo ========================================
echo   Preparing Android App (Capacitor)
echo ========================================
echo.

cd frontend

echo [1/3] Building the web app...
call npm run build

echo.
echo [2/3] Adding Android platform (if missing)...
call npx cap add android

echo.
echo [3/3] Syncing files to Android project...
call npx cap sync android

echo.
echo ========================================
echo  DONE! Opening Android Studio...
echo ========================================
call npx cap open android

pause
