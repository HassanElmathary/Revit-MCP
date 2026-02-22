@echo off
echo ============================================
echo   Revit MCP Uninstaller
echo ============================================
echo.
echo Uninstalling Revit MCP...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0uninstall.ps1"
echo.
pause
