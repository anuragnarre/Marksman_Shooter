# start-public.ps1
# Starts the Marksman stack and a stable public tunnel using localtunnel.

Write-Host "Starting Marksman Stack..." -ForegroundColor Cyan

function Test-Port {
    param($port)
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $port)
        $tcp.Close()
        return $true
    } catch { return $false }
}

if (-not (Test-Port 3000)) {
    Write-Host "Local services are not running. Starting them in a new window..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File .\start-netbird.ps1"
    Write-Host "Waiting for stack to boot (this may take a minute)..." -ForegroundColor Cyan
    while (-not (Test-Port 3000)) { Start-Sleep -Seconds 2 }
    Write-Host "Local services are up!" -ForegroundColor Green
} else {
    Write-Host "Local services are already running." -ForegroundColor Green
}

# 2. Ensure SSH key for localhost.run exists
$keyPath = "$HOME\.ssh\lhr_key"
if (-not (Test-Path $keyPath)) {
    Write-Host "Generating persistent SSH key for public tunnel..." -ForegroundColor Yellow
    if (-not (Test-Path "$HOME\.ssh")) { mkdir -Force "$HOME\.ssh" | Out-Null }
    ssh-keygen -t ed25519 -f $keyPath -N '""' | Out-Null
}

$url = "https://1c1d224d098426.lhr.life"

Write-Host "`n========================================================" -ForegroundColor Yellow
Write-Host "🚀 Starting Public Tunnel..." -ForegroundColor Yellow
Write-Host "Your static public URL is: $url" -ForegroundColor Green
Write-Host "Users can visit this link directly with no warning popups." -ForegroundColor Green
Write-Host "========================================================`n" -ForegroundColor Yellow

# Use localhost.run for a clean, stable URL with auto-reconnect
while ($true) {
    ssh -i $keyPath -o StrictHostKeyChecking=no -R 80:127.0.0.1:3000 localhost.run
    Write-Host "Tunnel disconnected. Reconnecting in 5 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}
