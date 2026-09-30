# mobile-dev.ps1
# Run as Administrator on Windows to expose the WSL2 dev server to your LAN.
# Usage: Right-click -> "Run with PowerShell" (as Admin), or:
#   powershell -ExecutionPolicy Bypass -File mobile-dev.ps1

$PORTS = @(3000, 3001)

# 1. Get current WSL2 internal IP
$wslIp = wsl hostname -I | ForEach-Object { $_.Trim().Split(' ')[0] }
if (-not $wslIp) {
    Write-Error "Could not detect WSL2 IP. Make sure WSL2 is running."
    exit 1
}

# 2. Get Windows LAN IP (first non-loopback, non-169, non-172 IPv4)
$lanIp = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.|172\.)' } |
    Sort-Object PrefixLength |
    Select-Object -First 1 -ExpandProperty IPAddress

foreach ($PORT in $PORTS) {
    # 3. Remove stale portproxy rule
    netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=$PORT 2>$null | Out-Null

    # 4. Add fresh portproxy: Windows 0.0.0.0:PORT -> WSL2 IP:PORT
    netsh interface portproxy add v4tov4 `
        listenaddress=0.0.0.0 `
        listenport=$PORT `
        connectaddress=$wslIp `
        connectport=$PORT

    # 5. Open Windows Firewall inbound rule (idempotent)
    $ruleName = "WSL2 Dev Server Port $PORT"
    Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    New-NetFirewallRule `
        -DisplayName $ruleName `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort $PORT `
        -Action Allow `
        -Profile Any | Out-Null
}

# 6. Print access info
Write-Host ""
Write-Host "  Port forwarding active" -ForegroundColor Green
Write-Host "  WSL2 IP  : $wslIp" -ForegroundColor DarkGray
Write-Host "  Ports    : 3000 (web), 3001 (api)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Open on your phone:" -ForegroundColor Cyan
Write-Host "  http://$lanIp`:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Make sure your phone is on the same Wi-Fi network." -ForegroundColor DarkGray
Write-Host ""
Write-Host "  To remove forwarding when done:" -ForegroundColor DarkGray
Write-Host "  netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=3000" -ForegroundColor DarkGray
Write-Host "  netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=3001" -ForegroundColor DarkGray
Write-Host ""
