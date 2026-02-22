@echo off
echo ============================================
echo   Revit MCP Installer
echo ============================================
echo.
echo Installing Revit MCP...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0install.ps1"
echo.
pause
