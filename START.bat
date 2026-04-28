@echo off
title Manzil AI — Starting...

REM Add bundled Node to the system PATH for this script session
SET "NODE_DIR=%~dp0node-v20.11.1-win-x64"
SET "PATH=%NODE_DIR%;%PATH%"

echo.
echo ========================================
echo   MANZIL AI — Starting Servers
echo ========================================
echo.

REM ── Start Backend ──────────────────────────────────────────────
echo [1/2] Starting Backend on http://localhost:5000 ...
start "Manzil AI — Backend" cmd /k "title Manzil AI BACKEND && cd /d %~dp0backend && node server.js"

REM Small delay so backend is up before frontend tries to proxy
timeout /t 2 /nobreak >nul

REM ── Start Frontend ─────────────────────────────────────────────
echo [2/2] Starting Frontend on http://localhost:5173 ...
start "Manzil AI — Frontend" cmd /k "title Manzil AI FRONTEND && cd /d %~dp0frontend && npm run dev"

timeout /t 4 /nobreak >nul

REM ── Open browser ───────────────────────────────────────────────
echo.
echo Opening http://localhost:5173 in your browser...
start http://localhost:5173

echo.
echo ========================================
echo  Both servers are running!
echo  Backend  → http://localhost:5000
echo  Frontend → http://localhost:5173
echo  Health   → http://localhost:5000/api/health
echo ========================================
echo.
echo Close the two black CMD windows to stop the servers.
pause
