# ============================================
# Revit MCP Uninstaller Script
# ============================================

$ErrorActionPreference = "Stop"

$AppName = "RevitMCP"
$InstallDir = "$env:ProgramFiles\$AppName"
$SupportedVersions = @("2020","2021","2022","2023","2024","2025","2026")

function Write-Banner {
    Write-Host ""
    Write-Host "  =========================================" -ForegroundColor Cyan
    Write-Host "       Revit MCP Uninstaller" -ForegroundColor White
    Write-Host "  =========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

Write-Banner

# Check admin rights
if (-not (Test-Admin)) {
    Write-Host "  [!] Administrator rights required." -ForegroundColor Yellow
    Write-Host "      Restarting as Administrator..." -ForegroundColor Gray
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Definition)`"" -Verb RunAs
    exit
}

Write-Host "  Are you sure you want to uninstall Revit MCP? (Y/N)" -ForegroundColor Yellow
$confirm = Read-Host "  "
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "  Cancelled." -ForegroundColor Gray
    exit
}

# Remove Revit addin files
Write-Host ""
Write-Host "  [1/2] Removing Revit plugin registrations..." -ForegroundColor Yellow
foreach ($year in $SupportedVersions) {
    $addinFile = "$env:ProgramData\Autodesk\Revit\Addins\$year\RevitMCP.addin"
    $pluginDir = "$env:ProgramData\Autodesk\Revit\Addins\$year\RevitMCP"
    
    if (Test-Path $addinFile) {
        Remove-Item $addinFile -Force
        Write-Host "    [OK] Removed Revit $year addin" -ForegroundColor Green
    }
    if (Test-Path $pluginDir) {
        Remove-Item $pluginDir -Recurse -Force
    }
}

# Remove install directory
Write-Host ""
Write-Host "  [2/2] Removing installation files..." -ForegroundColor Yellow
if (Test-Path $InstallDir) {
    Remove-Item $InstallDir -Recurse -Force
    Write-Host "    [OK] Removed $InstallDir" -ForegroundColor Green
} else {
    Write-Host "    [SKIP] Install directory not found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "  =========================================" -ForegroundColor Green
Write-Host "       Uninstall Complete!" -ForegroundColor White
Write-Host "  =========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Revit MCP has been removed." -ForegroundColor Gray
Write-Host "  Please restart Revit if it is currently open." -ForegroundColor Gray
Write-Host ""
