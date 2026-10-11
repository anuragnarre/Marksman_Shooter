@echo off
title Marksman - Shooter App (Web :3000 ^| API :3001)
echo ===================================================
echo   Starting Marksman Shooter App
echo   - Web UI: http://localhost:3000
echo   - API:    http://localhost:3001
echo ===================================================
echo.
start "Shooter API (:3001)" cmd /k "cd /d %~dp0Shooter_App\apps\api && npm run start:dev"
start "Shooter Web (:3000)" cmd /k "cd /d %~dp0Shooter_App\apps\web && npm run dev"
echo Shooter App started in separate windows!
