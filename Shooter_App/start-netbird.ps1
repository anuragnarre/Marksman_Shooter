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
$googleClientId = '""'
if (Test-Path $webEnvPath) {
    $match = Select-String -Path $webEnvPath -Pattern '^\s*NEXT_PUBLIC_GOOGLE_CLIENT_ID=(.+)$' | Select-Object -First 1
    if ($match) {
        $googleClientId = $match.Matches.Groups[1].Value.Trim()
    }
}

$envLines = @(
    "NEXT_PUBLIC_API_URL=http://${nbIp}:3001",
    "NEXT_PUBLIC_WS_URL=http://${nbIp}:3001",
    "NEXT_PUBLIC_VISION_URL=http://${nbIp}:8000",
    "NEXT_PUBLIC_STREAM_URL=http://${nbIp}:3001/stream",
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID=${googleClientId}"
)
Set-Content -Path $webEnvPath -Value ($envLines -join "`n") -Encoding UTF8
Write-Host "  [OK] Updated apps/web/.env.local" -ForegroundColor Green

$env:CORS_ORIGINS = "http://localhost:3000,http://${nbIp}:3000,http://${nbHost}:3000,http://127.0.0.1:3000,http://marksmanshooter.in,https://marksmanshooter.in"

$localScript = Join-Path $Root "start-local.ps1"
if ($NoVision) {
    & $localScript -NoVision
} else {
    & $localScript
}
