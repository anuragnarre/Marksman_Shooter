@echo off
title Marksman Cloudflare Tunnel
echo ===================================================
echo   Starting Marksman Secure Cloudflare Tunnel
echo   Routing:
echo     - api.marksmanshooter.in       -^> http://localhost:3001
echo     - range-api.marksmanshooter.in -^> http://localhost:3003
echo     - vision.marksmanshooter.in    -^> http://localhost:8000
echo ===================================================
set /p TOKEN=<"%USERPROFILE%\.cloudflared\marksman_tunnel_token.txt"
cloudflared tunnel run --token %TOKEN%
pause

