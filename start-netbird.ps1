# start-netbird.ps1

param(
    [switch]$NoVision,
    [switch]$Help
)

if ($Help) {
    Write-Host "Marksman Netbird Host Launcher"
    Write-Host "  .\start-netbird.ps1"
    exit 0
}

$Root = $PSScriptRoot

try {
    $statusOutput = (netbird status 2>&1) -join "`n"
    if ($statusOutput -match "NetBird IP: ([\d\.]+)/") {
        $nbIp = $matches[1]
    } else {
        throw "Could not parse NetBird IP."
    }
} catch {
    Write-Host "  [ERR] Netbird is not running or not connected!" -ForegroundColor Red
    exit 1
}

$nbHost = "marksman"
try {
    if ($statusOutput -match "FQDN: ([\w\.\-]+)") {
        $nbHost = $matches[1]
    }
} catch {}

Write-Host "Netbird IPv4 : $nbIp" -ForegroundColor Green
Write-Host "Netbird FQDN : $nbHost" -ForegroundColor Green

$webEnvPath = Join-Path $Root "apps\web\.env.local"
$envLines = @(
    "NEXT_PUBLIC_API_URL=/api",
    "NEXT_PUBLIC_WS_URL=",
    "NEXT_PUBLIC_VISION_URL=/vision",
    "NEXT_PUBLIC_STREAM_URL=/stream",
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID=dummy"
)
Set-Content -Path $webEnvPath -Value ($envLines -join "`n") -Encoding UTF8
Write-Host "  [OK] Updated .env.local" -ForegroundColor Green

$env:CORS_ORIGINS = "http://localhost:3000,http://${nbIp}:3000,http://${nbHost}:3000,http://127.0.0.1:3000"

$localScript = Join-Path $Root "start-local.ps1"
if ($NoVision) {
    & $localScript -NoVision
} else {
    & $localScript
}
