@echo off
REM Kill Oscillation development processes (Windows batch launcher)
powershell -ExecutionPolicy Bypass -File "%~dp0kill-dev.ps1"
