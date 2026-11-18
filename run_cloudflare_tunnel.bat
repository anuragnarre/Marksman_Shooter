@echo off
title Marksman Cloudflare Tunnel
set "TOKEN_FILE=%USERPROFILE%\.cloudflared\marksman_tunnel_token.txt"
set "CF_EXE=cloudflared"

where cloudflared >nul 2>&1
if errorlevel 1 (
    if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
        set "CF_EXE=C:\Program Files (x86)\cloudflared\cloudflared.exe"
    ) else if exist "C:\Program Files\cloudflared\cloudflared.exe" (
        set "CF_EXE=C:\Program Files\cloudflared\cloudflared.exe"
    ) else (
        echo [ERR] cloudflared.exe not found on PATH or standard install directories.
        pause
        exit /b 1
    )
)

if not exist "%TOKEN_FILE%" (
    echo [ERR] Tunnel token file not found: "%TOKEN_FILE%"
    pause
    exit /b 1
)

echo ===================================================
echo   Starting Marksman Secure Cloudflare Tunnel
echo   Routing:
echo     - api.marksmanshooter.in       -^> http://localhost:3001
echo     - range-api.marksmanshooter.in -^> http://localhost:3003
echo     - vision.marksmanshooter.in    -^> http://localhost:8000
echo ===================================================
"%CF_EXE%" tunnel run --token-file "%TOKEN_FILE%"
pause
