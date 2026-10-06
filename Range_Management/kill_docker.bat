@echo off
echo Force killing Docker Desktop and related services...
taskkill /F /IM "Docker Desktop.exe" /T
taskkill /F /IM "com.docker.service" /T
echo.
echo Docker processes have been terminated. You can now restart Docker Desktop.
pause
