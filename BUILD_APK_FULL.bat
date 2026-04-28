@echo off
title Manzil AI - Full APK Builder
color 0A

SET "ROOT=%~dp0"
SET "NODE_DIR=%ROOT%node-v20.11.1-win-x64"
SET "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
SET "ANDROID_HOME=C:\Users\sapta\AppData\Local\Android\Sdk"
SET "ANDROID_SDK_ROOT=%ANDROID_HOME%"
SET "PATH=%NODE_DIR%;%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo.
echo ============================================================
echo   MANZIL AI - Full APK Build Pipeline
echo ============================================================
echo.

REM ---- Verify Tools ----
echo [CHECK] Verifying Node...
node --version
IF ERRORLEVEL 1 (echo ERROR: Node not found && pause && exit /b 1)

echo [CHECK] Verifying Java...
java -version
IF ERRORLEVEL 1 (echo ERROR: Java not found && pause && exit /b 1)

echo.
echo ============================================================
echo   STEP 1: Building React Web App (Vite)
echo ============================================================
cd "%ROOT%frontend"
call npm run build
IF ERRORLEVEL 1 (echo ERROR: Web build failed && pause && exit /b 1)
echo [OK] Web build complete. dist/ is ready.

echo.
echo ============================================================
echo   STEP 2: Syncing Web Assets to Android (Capacitor)
echo ============================================================
call npx cap sync android
IF ERRORLEVEL 1 (echo ERROR: Capacitor sync failed && pause && exit /b 1)
echo [OK] Assets synced to android/app/src/main/assets/public/

echo.
echo ============================================================
echo   STEP 3: Building Debug APK with Gradle
echo ============================================================
cd "%ROOT%frontend\android"
call gradlew.bat assembleDebug --no-daemon --stacktrace
IF ERRORLEVEL 1 (echo ERROR: Gradle build failed. See output above. && pause && exit /b 1)

echo.
echo ============================================================
echo   SUCCESS! APK is ready at:
echo   frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo ============================================================
echo.

REM Open the output folder
explorer "%ROOT%frontend\android\app\build\outputs\apk\debug"

pause
