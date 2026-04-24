# Requires -Version 3.0
$ErrorActionPreference = "Stop"

Write-Host "[Backport] Installing Backport CLI..." -ForegroundColor Cyan

# Define installation path
$installPath = "$env:USERPROFILE\.backport"
if (!(Test-Path $installPath)) {
    New-Item -ItemType Directory -Path $installPath -Force | Out-Null
}

$cliScriptPath = "$installPath\cli.js"
$launcherPath = "$installPath\backport.cmd"

# Download the bundled JavaScript
Write-Host "[Backport] Downloading CLI script..." -ForegroundColor Gray
Invoke-WebRequest -Uri "https://backport.in/cli.js" -OutFile $cliScriptPath -UseBasicParsing

# Create the batch wrapper explicitly using node
$cmdContent = "@ECHO OFF`nnode `"$cliScriptPath`" %*"
Set-Content -Path $launcherPath -Value $cmdContent

# Add to User PATH if not already present
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$installPath*") {
    Write-Host "[Backport] Adding $installPath to User PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("PATH", "$userPath;$installPath", "User")
    $env:PATH = "$env:PATH;$installPath"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "   Backport CLI Installed Successfully!   " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Please restart your terminal if 'backport' is not recognized." -ForegroundColor Yellow
Write-Host "Run 'backport init' to get started." -ForegroundColor White
Write-Host ""
