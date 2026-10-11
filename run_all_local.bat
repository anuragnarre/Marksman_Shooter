@echo off
title Marksman Pro - Full Local Ecosystem Launcher
echo ===================================================
echo     MARKSMAN PRO - FULL LOCAL ECOSYSTEM LAUNCHER
echo ===================================================
echo.
echo [1/4] Checking PostgreSQL database on port 5433...
netstat -ano | findstr 5433 >nul
if %errorlevel% neq 0 (
    echo [INFO] PostgreSQL not detected on port 5433.
    echo [INFO] Attempting to start Docker PostgreSQL container...
    docker compose up -d db 2>nul
) else (
    echo [OK] PostgreSQL is active on port 5433.
)
echo.
echo [2/4] Launching Shooter App (Web :3000, API :3001)...
start "Shooter API (:3001)" cmd /k "cd /d %~dp0Shooter_App\apps\api && npm run start:dev"
start "Shooter Web (:3000)" cmd /k "cd /d %~dp0Shooter_App\apps\web && npm run dev"
echo.
echo [3/4] Launching Range Management App (Web :3002, API :3003)...
start "Range API (:3003)" cmd /k "cd /d %~dp0Range_Management\apps\api && npm run start:dev"
start "Range Web (:3002)" cmd /k "cd /d %~dp0Range_Management\apps\web && npm run dev"
echo.
echo [4/4] Launching Target Camera App (Expo Metro :8081)...
start "Target Camera App (:8081)" cmd /k "cd /d %~dp0Target_Camera_App && npx expo start"
echo.
echo ===================================================
echo All services started in separate terminal windows:
echo - Shooter Web:          http://localhost:3000
echo - Shooter API:          http://localhost:3001
echo - Range Management Web: http://localhost:3002
echo - Range Management API: http://localhost:3003
echo - Target Camera App:    Expo Metro on :8081
echo ===================================================
pause
