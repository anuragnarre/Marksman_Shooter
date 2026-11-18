#
# start-tailscale.ps1 - Marksman Deployment & Hosting over Tailscale VPN
#
# Usage:
#   .\start-tailscale.ps1              # Launch entire stack bound to Tailscale IP
#   .\start-tailscale.ps1 -NoVision    # Skip vision service
#

param(
    [switch]$NoVision,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Marksman Tailscale Host & Deploy Launcher
  .\start-tailscale.ps1             Start all services configured for Tailscale VPN
  .\start-tailscale.ps1 -NoVision   Skip vision service
"@
    exit 0
}

$Root = $PSScriptRoot

# 1. Check Tailscale availability
try {
    $tsIp = (tailscale ip -4 2>&1).Trim()
    if ($tsIp -notmatch '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$') {
        throw "Invalid IP"
    }
} catch {
    Write-Host "  [ERR] Tailscale is not running or not connected!" -ForegroundColor Red
    Write-Host "  Please install/start Tailscale and log in before running this script." -ForegroundColor Yellow
    exit 1
}

# 2. Get Tailscale status / hostname
$tsHost = "desktop-rmch6n7"
try {
    $statusLine = (tailscale status 2>&1) | Select-Object -First 1
    if ($statusLine -match '\s+([a-zA-Z0-9\-]+)\s+') {
        $tsHost = $matches[1]
    }
} catch {}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     MARKSMAN - TAILSCALE VPN DEPLOYMENT LAUNCHER           " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Tailscale IPv4 : $tsIp" -ForegroundColor Green
Write-Host "  Tailscale Host : $tsHost" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

# 3. Preserve existing Google Client ID if configured in apps/web/.env.local
$webEnvPath = Join-Path $Root "apps\web\.env.local"
$googleClientId = '""'
if (Test-Path $webEnvPath) {
    $match = Select-String -Path $webEnvPath -Pattern '^\s*NEXT_PUBLIC_GOOGLE_CLIENT_ID=(.+)$' | Select-Object -First 1
    if ($match) {
        $googleClientId = $match.Matches.Groups[1].Value.Trim()
    }
}

$envContent = @"
NEXT_PUBLIC_API_URL=http://${tsIp}:3001
NEXT_PUBLIC_WS_URL=http://${tsIp}:3001
NEXT_PUBLIC_VISION_URL=http://${tsIp}:8000
NEXT_PUBLIC_STREAM_URL=http://${tsIp}:3001/stream
NEXT_PUBLIC_GOOGLE_CLIENT_ID=${googleClientId}
"@

Set-Content -Path $webEnvPath -Value $envContent -Encoding UTF8
Write-Host "  [OK] Updated apps/web/.env.local with Tailscale IP ($tsIp)" -ForegroundColor Green

# 4. Set environment variables for API CORS
$env:CORS_ORIGINS = "http://localhost:3000,http://${tsIp}:3000,http://${tsHost}:3000,http://127.0.0.1:3000"

Write-Host ""
Write-Host "  [ACCESS LINKS] Any device connected to your Tailscale VPN can open:" -ForegroundColor Cyan
Write-Host "  -> Web App    : http://${tsIp}:3000  (or http://${tsHost}:3000)" -ForegroundColor Yellow
Write-Host "  -> API Server : http://${tsIp}:3001" -ForegroundColor Yellow
Write-Host "  -> Vision API : http://${tsIp}:8000/docs" -ForegroundColor Yellow
Write-Host ""

# 5. Delegate to start-local.ps1
$localScript = Join-Path $Root "start-local.ps1"
if ($NoVision) {
    & $localScript -NoVision
} else {
    & $localScript
}
