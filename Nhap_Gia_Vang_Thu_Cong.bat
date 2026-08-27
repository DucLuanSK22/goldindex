@echo off
setlocal
title Nhap Gia Vang Thu Cong
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Manual_Add_Price.ps1"
echo.
pause
