@echo off
REM Kill Klaserie Camps development processes (Windows batch launcher)
powershell -ExecutionPolicy Bypass -File "%~dp0kill-dev.ps1"
