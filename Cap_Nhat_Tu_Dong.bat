@echo off
setlocal
title Cap Nhat Gia Vang Tu Dong
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Update_World_Gold.ps1"
echo.
pause
