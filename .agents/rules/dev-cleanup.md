---
description: Automatically clean up development background services
---

# Dev Cleanup Rule

When the user asks to "cleanup", "close", "shutdown", or "stop services", you must immediately run the following PowerShell command to stop background development services (like SQL, WSL, Docker, Netbird, Cloudflare, Codex) and ensure they are set to Manual startup to preserve PC performance.

```powershell
$servicesToClean = "sql", "netbird", "cloudflare", "warp", "docker", "codex", "pgsql", "postgres", "mysql"
$regex = ($servicesToClean -join "|")
$services = Get-Service | Where-Object { $_.Name -match $regex -or $_.DisplayName -match $regex }

foreach ($svc in $services) {
    if ($svc.StartType -eq 'Automatic') {
        try {
            Set-Service -Name $svc.Name -StartupType Manual -ErrorAction SilentlyContinue
            Write-Host "Changed $($svc.Name) to Manual startup."
        } catch { }
    }
    if ($svc.Status -eq 'Running') {
        try {
            Stop-Service -Name $svc.Name -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped service: $($svc.Name)."
        } catch { }
    }
}
wsl --shutdown
Write-Host "Cleanup complete."
```
