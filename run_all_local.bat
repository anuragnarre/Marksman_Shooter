@echo off
title Marksman Tactical Ecosystem - Master Orchestrator
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_orchestrator.ps1"
pause
