@echo off
title Marksman - Range Management App (Web :3002 ^| API :3003)
echo ===================================================
echo   Starting Marksman Range Management App
echo   - Web UI: http://localhost:3002
echo   - API:    http://localhost:3003
echo ===================================================
echo.
start "Range API (:3003)" cmd /k "cd /d %~dp0Range_Management\apps\api && npm run start:dev"
start "Range Web (:3002)" cmd /k "cd /d %~dp0Range_Management\apps\web && npm run dev"
echo Range Management App started in separate windows!
