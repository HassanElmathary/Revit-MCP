# ============================================
# Revit MCP Installer Script
# ============================================

$ErrorActionPreference = "Stop"

# --- Configuration ---
$AppName = "RevitMCP"
$InstallDir = "$env:ProgramFiles\$AppName"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$SupportedVersions = @("2020","2021","2022","2023","2024","2025","2026")

# --- Helper Functions ---
function Write-Banner {
    Write-Host ""
    Write-Host "  =========================================" -ForegroundColor Cyan
    Write-Host "       Revit MCP Installer v1.0.0" -ForegroundColor White
    Write-Host "    AI-Powered Tools for Autodesk Revit" -ForegroundColor Gray
    Write-Host "  =========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-InstalledRevitVersions {
    $found = @()
    foreach ($year in $SupportedVersions) {
        $revitPath = "$env:ProgramFiles\Autodesk\Revit $year"
        if (Test-Path $revitPath) {
            $found += $year
        }
    }
    return $found
}

function Install-AddinForRevit {
    param([string]$Year)
    
    $addinsDir = "$env:ProgramData\Autodesk\Revit\Addins\$Year"
    $pluginDir = "$addinsDir\RevitMCP"
    
    # Create directories
    if (!(Test-Path $addinsDir)) { New-Item -ItemType Directory -Path $addinsDir -Force | Out-Null }
    if (!(Test-Path $pluginDir)) { New-Item -ItemType Directory -Path $pluginDir -Force | Out-Null }
    
    # Copy plugin DLLs
    Copy-Item "$InstallDir\plugin\*" -Destination $pluginDir -Recurse -Force
    
    # Create .addin manifest
    $addinContent = @"
<?xml version="1.0" encoding="utf-8"?>
<RevitAddIns>
  <AddIn Type="Application">
    <Name>Revit MCP Plugin</Name>
    <Assembly>$pluginDir\RevitMCPPlugin.dll</Assembly>
    <FullClassName>RevitMCPPlugin.Core.Application</FullClassName>
    <ClientId>A1B2C3D4-E5F6-7890-ABCD-EF1234567890</ClientId>
    <VendorId>RevitMCP</VendorId>
    <VendorDescription>AI-Powered Revit MCP Plugin</VendorDescription>
  </AddIn>
</RevitAddIns>
"@
    Set-Content -Path "$addinsDir\RevitMCP.addin" -Value $addinContent -Encoding UTF8
    Write-Host "    [OK] Installed for Revit $Year" -ForegroundColor Green
}

# ============================================
# MAIN INSTALLER LOGIC
# ============================================

Write-Banner

# Check admin rights
if (-not (Test-Admin)) {
    Write-Host "  [!] Administrator rights required." -ForegroundColor Yellow
    Write-Host "      Restarting as Administrator..." -ForegroundColor Gray
    Write-Host ""
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Definition)`"" -Verb RunAs
    exit
}

# --- Step 1: Detect Revit versions ---
Write-Host "  [1/4] Detecting installed Revit versions..." -ForegroundColor Yellow
$installedVersions = Get-InstalledRevitVersions

if ($installedVersions.Count -eq 0) {
    Write-Host ""
    Write-Host "  [!] No Revit installation found (2020-2026)." -ForegroundColor Red
    Write-Host "      The MCP Server will still be installed." -ForegroundColor Gray
    Write-Host "      You can manually add Revit plugin later." -ForegroundColor Gray
    Write-Host ""
    $selectedVersions = @()
} else {
    Write-Host ""
    Write-Host "  Found Revit versions:" -ForegroundColor White
    for ($i = 0; $i -lt $installedVersions.Count; $i++) {
        Write-Host "    [$($i+1)] Revit $($installedVersions[$i])" -ForegroundColor Cyan
    }
    Write-Host "    [A] All versions" -ForegroundColor Cyan
    Write-Host ""
    
    $choice = Read-Host "  Select versions to install for (e.g. 1,2 or A for all)"
    
    if ($choice -eq "A" -or $choice -eq "a") {
        $selectedVersions = $installedVersions
    } else {
        $indices = $choice -split "," | ForEach-Object { [int]$_.Trim() - 1 }
        $selectedVersions = @()
        foreach ($idx in $indices) {
            if ($idx -ge 0 -and $idx -lt $installedVersions.Count) {
                $selectedVersions += $installedVersions[$idx]
            }
        }
    }
}

# --- Step 2: Copy files to Program Files ---
Write-Host ""
Write-Host "  [2/4] Installing MCP Server to $InstallDir..." -ForegroundColor Yellow

if (Test-Path $InstallDir) {
    Remove-Item $InstallDir -Recurse -Force
}
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

# Copy Node.js runtime
Write-Host "    Copying Node.js runtime..." -ForegroundColor Gray
Copy-Item "$ScriptDir\nodejs" -Destination "$InstallDir\nodejs" -Recurse -Force

# Copy MCP Server
Write-Host "    Copying MCP Server..." -ForegroundColor Gray
Copy-Item "$ScriptDir\server" -Destination "$InstallDir\server" -Recurse -Force

# Copy Plugin files
Write-Host "    Copying Plugin files..." -ForegroundColor Gray
Copy-Item "$ScriptDir\plugin" -Destination "$InstallDir\plugin" -Recurse -Force

Write-Host "    [OK] Files installed" -ForegroundColor Green

# --- Step 3: Install Revit plugin ---
Write-Host ""
Write-Host "  [3/4] Installing Revit plugin..." -ForegroundColor Yellow

if ($selectedVersions.Count -eq 0) {
    Write-Host "    [SKIP] No Revit versions selected" -ForegroundColor Gray
} else {
    foreach ($ver in $selectedVersions) {
        Install-AddinForRevit -Year $ver
    }
}

# --- Step 4: Create start script & MCP config ---
Write-Host ""
Write-Host "  [4/4] Creating startup scripts..." -ForegroundColor Yellow

$nodePath = "$InstallDir\nodejs\node.exe"
$serverPath = "$InstallDir\server\build\index.js"

# Create start-mcp-server.bat
$startBat = @"
@echo off
echo Starting Revit MCP Server...
"$nodePath" "$serverPath"
"@
Set-Content -Path "$InstallDir\start-mcp-server.bat" -Value $startBat

# Create MCP client config example
$mcpConfig = @"
{
  "mcpServers": {
    "revit-mcp": {
      "command": "$($nodePath -replace '\\', '\\\\')",
      "args": ["$($serverPath -replace '\\', '\\\\')"],
      "env": {
        "GOOGLE_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
"@
Set-Content -Path "$InstallDir\mcp-config-example.json" -Value $mcpConfig

Write-Host "    [OK] Startup scripts created" -ForegroundColor Green

# --- Done ---
Write-Host ""
Write-Host "  =========================================" -ForegroundColor Green
Write-Host "       Installation Complete!" -ForegroundColor White
Write-Host "  =========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Installed to: $InstallDir" -ForegroundColor Gray
Write-Host ""
Write-Host "  Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Open Revit - you'll see the 'Revit MCP' tab" -ForegroundColor White
Write-Host "  2. Click 'Settings' to enter your Google API Key" -ForegroundColor White
Write-Host "     Get a key at: https://aistudio.google.com/apikey" -ForegroundColor Cyan
Write-Host "  3. Click 'Start MCP Service' to begin" -ForegroundColor White
Write-Host ""
Write-Host "  For AI client (Claude, Cursor, etc.) config, see:" -ForegroundColor Gray
Write-Host "  $InstallDir\mcp-config-example.json" -ForegroundColor Cyan
Write-Host ""
