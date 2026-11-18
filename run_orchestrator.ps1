<#
.SYNOPSIS
  Marksman Platform - Master Ecosystem Orchestrator
  Automated Pre-flight Checks, Docker/Postgres Startup, Service Supervision,
  Cloudflare Zero Trust Bridge & Live Health Diagnostics.
#>

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$rootDir = $PSScriptRoot
$logDir = Join-Path $rootDir "logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
$tunnelTokenFile = Join-Path $env:USERPROFILE ".cloudflared\marksman_tunnel_token.txt"

# ANSI Colors
$esc = [char]27
$cReset   = "$esc[0m"
$cBold    = "$esc[1m"
$cGreen   = "$esc[92m"
$cRed     = "$esc[91m"
$cYellow  = "$esc[93m"
$cCyan    = "$esc[96m"
$cWhite   = "$esc[97m"
$cGray    = "$esc[90m"
$cBgBlue  = "$esc[44m"

function Print-Banner {
    Clear-Host
    Write-Host "$cCyan$cBold"
    Write-Host " ==========================================================================="
    Write-Host "   MARKSMAN PLATFORM - FULL ECOSYSTEM SUPERVISOR & CLOUDFLARE BRIDGE"
    Write-Host "   Official Production Domain: https://marksmanshooter.in"
    Write-Host " ===========================================================================$cReset"
    Write-Host ""
}

function Stop-ProcessTree ([int]$ProcessId) {
    if ($ProcessId -gt 0) {
        & taskkill.exe /F /T /PID $ProcessId 2>$null | Out-Null
    }
}

function Test-PortListening ($port) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

function Test-HttpHealth ([string]$url, [int]$timeoutSec = 2) {
    if ([string]::IsNullOrWhiteSpace($url)) { return $false }
    try {
        $resp = Invoke-WebRequest -Uri $url -TimeoutSec $timeoutSec -UseBasicParsing -ErrorAction Stop
        return ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500)
    } catch {
        return $false
    }
}

function Ensure-Postgres {
    Write-Host "${cWhite}[*] Checking PostgreSQL on port 5433...${cReset}" -NoNewline
    if (Test-PortListening 5433) {
        Write-Host " ${cGreen}[ALREADY ACTIVE]${cReset}"
        return $true
    }

    # Check for native Windows PostgreSQL service if installed
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pgService) {
        Write-Host " ${cYellow}[Starting Windows Service $($pgService.Name)...]${cReset}" -NoNewline
        Start-Service -Name $pgService.Name -ErrorAction SilentlyContinue
        for ($i = 0; $i -lt 15; $i++) {
            Start-Sleep -Seconds 1
            if (Test-PortListening 5433) {
                Write-Host " ${cGreen}[STARTED]${cReset}"
                return $true
            }
        }
    }

    # Docker fallback (auto-starts Docker Desktop if closed)
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        $dockerReady = $false
        docker info 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $dockerReady = $true
        } else {
            $dockerExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
            if (Test-Path $dockerExe) {
                Write-Host ""
                Write-Host "  ${cYellow}[*] Starting Docker Desktop daemon (up to 60s)...${cReset}" -NoNewline
                Start-Process $dockerExe
                for ($d = 0; $d -lt 30; $d++) {
                    Start-Sleep -Seconds 2
                    docker info 2>$null | Out-Null
                    if ($LASTEXITCODE -eq 0) {
                        $dockerReady = $true
                        Write-Host " ${cGreen}[DOCKER READY]${cReset}"
                        break
                    }
                }
                if (-not $dockerReady) {
                    Write-Host " ${cRed}[DOCKER TIMEOUT]${cReset}"
                    return $false
                }
            }
        }

        if ($dockerReady) {
            # Reuse existing container (avoids port 5433 conflict between marksman-db & marksman-postgres)
            $existingContainers = @(docker ps -a --format "{{.Names}}" 2>$null)
            if ($existingContainers -contains "marksman-db") {
                Write-Host "  ${cYellow}[*] Starting existing container 'marksman-db'...${cReset}" -NoNewline
                docker start marksman-db 2>$null | Out-Null
            } elseif ($existingContainers -contains "marksman-postgres") {
                Write-Host "  ${cYellow}[*] Starting existing container 'marksman-postgres'...${cReset}" -NoNewline
                docker start marksman-postgres 2>$null | Out-Null
            } else {
                Write-Host "  ${cYellow}[*] Creating Docker Postgres container...${cReset}" -NoNewline
                Push-Location $rootDir
                docker compose up -d db 2>$null | Out-Null
                Pop-Location
            }

            for ($i = 0; $i -lt 20; $i++) {
                Start-Sleep -Seconds 1
                if (Test-PortListening 5433) {
                    Write-Host " ${cGreen}[STARTED VIA DOCKER]${cReset}"
                    return $true
                }
            }
        }
    }

    Write-Host " ${cRed}[FAILED: PostgreSQL not listening on 5433]${cReset}"
    return $false
}

function Ensure-MonorepoArtifacts ([string]$appDir, [string]$label, [bool]$dbOnline) {
    if (-not (Test-Path $appDir)) { return }
    $sharedDist = Join-Path $appDir "packages\shared-types\dist\index.js"
    $prismaClient = Join-Path $appDir "node_modules\.prisma\client\index.js"
    $apiDir = Join-Path $appDir "apps\api"

    if (-not (Test-Path $sharedDist)) {
        Write-Host "  -> Building shared-types for $label... " -NoNewline
        Push-Location $appDir
        & npm.cmd run build:shared 2>$null | Out-Null
        $ok = ($LASTEXITCODE -eq 0)
        Pop-Location
        if ($ok) { Write-Host "${cGreen}[OK]${cReset}" } else { Write-Host "${cYellow}[WARN]${cReset}" }
    }

    if (-not (Test-Path $prismaClient) -and (Test-Path $apiDir)) {
        Write-Host "  -> Generating Prisma Client for $label... " -NoNewline
        Push-Location $apiDir
        & npx.cmd prisma generate 2>$null | Out-Null
        $ok = ($LASTEXITCODE -eq 0)
        Pop-Location
        if ($ok) { Write-Host "${cGreen}[OK]${cReset}" } else { Write-Host "${cYellow}[WARN]${cReset}" }
    }

    if ($dbOnline -and (Test-Path $apiDir)) {
        Write-Host "  -> Verifying database schema for $label... " -NoNewline
        Push-Location $apiDir
        & npx.cmd prisma db push --skip-generate 2>$null | Out-Null
        $ok = ($LASTEXITCODE -eq 0)
        Pop-Location
        if ($ok) { Write-Host "${cGreen}[SYNCED]${cReset}" } else { Write-Host "${cYellow}[SKIPPED/WARN]${cReset}" }
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Service Definitions
# ─────────────────────────────────────────────────────────────────────────────
$visionPy = Join-Path $rootDir "Shooter_App\apps\vision\venv\Scripts\python.exe"
if (-not (Test-Path $visionPy)) {
    $pyCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pyCmd) { $visionPy = $pyCmd.Source }
}

$services = @(
    @{
        Name        = "Shooter API"
        LogFile     = Join-Path $logDir "shooter-api.log"
        Port        = 3001
        Domain      = "api.marksmanshooter.in"
        Type        = "Node/NestJS"
        WorkDir     = Join-Path $rootDir "Shooter_App\apps\api"
        Command     = "cmd.exe"
        CmdLine     = "npm.cmd run start:dev"
        HealthUrl   = "http://127.0.0.1:3001/health"
        Process     = $null
        Owned       = $false
        Status      = "STOPPED"
    },
    @{
        Name        = "Range Ops API"
        LogFile     = Join-Path $logDir "range-api.log"
        Port        = 3003
        Domain      = "range-api.marksmanshooter.in"
        Type        = "Node/NestJS"
        WorkDir     = Join-Path $rootDir "Range_Management\apps\api"
        Command     = "cmd.exe"
        CmdLine     = "npm.cmd run start:dev"
        HealthUrl   = "http://127.0.0.1:3003/health"
        Process     = $null
        Owned       = $false
        Status      = "STOPPED"
    },
    @{
        Name        = "Target Vision Engine"
        LogFile     = Join-Path $logDir "vision.log"
        Port        = 8000
        Domain      = "vision.marksmanshooter.in"
        Type        = "Python/FastAPI"
        WorkDir     = Join-Path $rootDir "Shooter_App\apps\vision"
        Command     = "cmd.exe"
        CmdLine     = "`"$visionPy`" -m uvicorn main:app --host 0.0.0.0 --port 8000"
        HealthUrl   = "http://127.0.0.1:8000/health"
        Process     = $null
        Owned       = $false
        Status      = "STOPPED"
    },
    @{
        Name        = "Shooter Web Portal"
        LogFile     = Join-Path $logDir "shooter-web.log"
        Port        = 3000
        Domain      = "marksmanshooter.in"
        Type        = "Next.js"
        WorkDir     = Join-Path $rootDir "Shooter_App\apps\web"
        Command     = "cmd.exe"
        CmdLine     = "npm.cmd run dev"
        HealthUrl   = "http://127.0.0.1:3000"
        Process     = $null
        Owned       = $false
        Status      = "STOPPED"
    },
    @{
        Name        = "Range Management Web"
        LogFile     = Join-Path $logDir "range-web.log"
        Port        = 3002
        Domain      = "range.marksmanshooter.in"
        Type        = "Next.js"
        WorkDir     = Join-Path $rootDir "Range_Management\apps\web"
        Command     = "cmd.exe"
        CmdLine     = "npm.cmd run dev"
        HealthUrl   = "http://127.0.0.1:3002"
        Process     = $null
        Owned       = $false
        Status      = "STOPPED"
    }
)

$cfExe = $null
$cfCmd = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($cfCmd) {
    $cfExe = $cfCmd.Source
} elseif (Test-Path "C:\Program Files (x86)\cloudflared\cloudflared.exe") {
    $cfExe = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
} elseif (Test-Path "C:\Program Files\cloudflared\cloudflared.exe") {
    $cfExe = "C:\Program Files\cloudflared\cloudflared.exe"
}

$tunnelService = @{
    Name        = "Cloudflare Zero Trust Tunnel"
    LogFile     = Join-Path $logDir "cloudflared.log"
    Domain      = "*.marksmanshooter.in"
    Type        = "Cloudflared"
    Command     = "cmd.exe"
    CmdLine     = if ($cfExe) { "`"$cfExe`" tunnel run --token-file `"$tunnelTokenFile`"" } else { "" }
    Process     = $null
    Owned       = $false
    Status      = "STOPPED"
}

# ─────────────────────────────────────────────────────────────────────────────
# Execution & Pre-flight
# ─────────────────────────────────────────────────────────────────────────────
Print-Banner

# Step 1: PostgreSQL Check (auto-starts Docker Desktop if needed)
$pgReady = Ensure-Postgres
if (-not $pgReady) {
    Write-Host "${cRed}[!] Critical: PostgreSQL could not be started. Backend APIs will fail to connect.${cReset}"
    Write-Host "${cYellow}Press any key to proceed anyway, or Ctrl+C to abort...${cReset}"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Step 2: Shared-Types & Prisma Pre-flight
Write-Host ""
Write-Host "${cWhite}[*] Verifying Monorepo Build & Prisma Schemas...${cReset}"
Ensure-MonorepoArtifacts (Join-Path $rootDir "Shooter_App") "Shooter App" $pgReady
Ensure-MonorepoArtifacts (Join-Path $rootDir "Range_Management") "Range Ops" $pgReady

# Step 3: Tunnel Token & Binary Check
Write-Host ""
Write-Host "${cWhite}[*] Checking Cloudflare Tunnel...${cReset}" -NoNewline
if ($cfExe -and (Test-Path $tunnelTokenFile)) {
    Write-Host " ${cGreen}[READY: $cfExe]${cReset}"
} elseif (-not $cfExe) {
    Write-Host " ${cYellow}[MISSING BINARY: cloudflared.exe not found]${cReset}"
} else {
    Write-Host " ${cRed}[MISSING TOKEN: $tunnelTokenFile]${cReset}"
}

Write-Host ""
Write-Host "${cBold}${cWhite}--- Launching Services & Health Verifications (logs: .\logs\*.log) ---${cReset}"

function Start-ManagedProcess ($svc) {
    if ($svc.Port -and (Test-PortListening $svc.Port)) {
        $svc.Status = "RUNNING (Attached)"
        $svc.Owned = $false
        Write-Host "  -> $($svc.Name) on port $($svc.Port): ${cGreen}[ALREADY RUNNING]${cReset}"
        return
    }

    if (-not (Test-Path $svc.WorkDir)) {
        $svc.Status = "MISSING DIR"
        Write-Host "  -> $($svc.Name): ${cRed}[ERROR: Directory missing ($($svc.WorkDir))]${cReset}"
        return
    }

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $svc.Command
    # /s /c strips only outer quotes so multiple inner quoted paths (with spaces) parse safely
    $psi.Arguments = "/s /c `"$($svc.CmdLine) > `"$($svc.LogFile)`" 2>&1`""
    $psi.WorkingDirectory = $svc.WorkDir
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    try {
        $proc = [System.Diagnostics.Process]::Start($psi)
        $svc.Process = $proc
        $svc.Owned = $true
        $svc.Status = "STARTING"
        Write-Host "  -> Launching $($svc.Name)... " -NoNewline

        $online = $false
        for ($s = 0; $s -lt 40; $s++) {
            Start-Sleep -Milliseconds 500
            if ($proc.HasExited) { break }
            if ($svc.Port -and (Test-PortListening $svc.Port)) {
                if (Test-HttpHealth $svc.HealthUrl 2) {
                    $online = $true
                    break
                }
                # Wait briefly for HTTP handler if socket just opened
                if ($s -ge 10) {
                    $online = $true
                    break
                }
            }
        }

        if ($proc.HasExited) {
            $svc.Status = "CRASHED (Exit: $($proc.ExitCode))"
            Write-Host "${cRed}[CRASHED - Exit $($proc.ExitCode) | see $($svc.LogFile)]${cReset}"
        } elseif ($online) {
            $svc.Status = "RUNNING"
            Write-Host "${cGreen}[ONLINE on :$($svc.Port)]${cReset}"
        } else {
            $svc.Status = "INITIALIZING"
            Write-Host "${cYellow}[INITIALIZING (PID: $($proc.Id))]${cReset}"
        }
    } catch {
        $svc.Status = "ERROR: $($_.Exception.Message)"
        Write-Host "${cRed}[ERROR: $($_.Exception.Message)]${cReset}"
    }
}

# Launch all 5 application services
foreach ($svc in $services) {
    Start-ManagedProcess $svc
}

# Launch Cloudflare Tunnel safely
if ($cfExe -and (Test-Path $tunnelTokenFile)) {
    Write-Host "  -> Launching $($tunnelService.Name)... " -NoNewline
    $existingCf = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
    if ($existingCf) {
        $tunnelService.Status = "RUNNING (Attached)"
        $tunnelService.Owned = $false
        Write-Host "${cGreen}[ALREADY CONNECTED (PID: $($existingCf[0].Id))]${cReset}"
    } else {
        try {
            $tPsi = New-Object System.Diagnostics.ProcessStartInfo
            $tPsi.FileName = $tunnelService.Command
            $tPsi.Arguments = "/s /c `"$($tunnelService.CmdLine) > `"$($tunnelService.LogFile)`" 2>&1`""
            $tPsi.UseShellExecute = $false
            $tPsi.CreateNoWindow = $true
            $tProc = [System.Diagnostics.Process]::Start($tPsi)
            $tunnelService.Process = $tProc
            $tunnelService.Owned = $true
            Start-Sleep -Seconds 2
            if ($tProc.HasExited) {
                $tunnelService.Status = "CRASHED"
                Write-Host "${cRed}[TUNNEL FAILED TO CONNECT | see $($tunnelService.LogFile)]${cReset}"
            } else {
                $tunnelService.Status = "CONNECTED (QUIC Edge)"
                Write-Host "${cGreen}[CONNECTED TO CLOUDFLARE EDGE]${cReset}"
            }
        } catch {
            $tunnelService.Status = "ERROR"
            Write-Host "${cRed}[TUNNEL ERROR: $($_.Exception.Message)]${cReset}"
        }
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Interactive Live Monitoring Loop (with guaranteed cleanup in finally)
# ─────────────────────────────────────────────────────────────────────────────
function Render-StatusDashboard {
    Write-Host ""
    Write-Host "${cBgBlue}${cWhite}${cBold}                               LIVE SYSTEM STATUS                                ${cReset}"
    Write-Host "${cGray}+-----------------------------+--------+-----------------------------+------------------+${cReset}"
    Write-Host "${cGray}|${cBold}${cWhite} Service                     ${cGray}|${cBold}${cWhite} Port   ${cGray}|${cBold}${cWhite} Public Domain               ${cGray}|${cBold}${cWhite} Live Status      ${cGray}|${cReset}"
    Write-Host "${cGray}+-----------------------------+--------+-----------------------------+------------------+${cReset}"

    $dbStat = if (Test-PortListening 5433) { "${cGreen}[ RUNNING ]${cReset}" } else { "${cRed}[ STOPPED ]${cReset}" }
    Write-Host ("${cGray}|${cWhite} {0,-27} ${cGray}|${cCyan} {1,-6} ${cGray}|${cWhite} {2,-27} ${cGray}| {3,-26}${cGray}|${cReset}" -f "PostgreSQL Database", "5433", "Local Database", $dbStat)

    foreach ($svc in $services) {
        $isListening = if ($svc.Port) { Test-PortListening $svc.Port } else { $false }
        $procDead = ($svc.Process -and $svc.Process.HasExited)

        $statColor = $cGreen
        $statLabel = "[ RUNNING ]"
        if ($procDead) {
            $statColor = $cRed
            $statLabel = "[ CRASHED ]"
        } elseif (-not $isListening) {
            $statColor = $cYellow
            $statLabel = "[ PENDING ]"
        }

        $formattedStat = "$statColor$statLabel$cReset"
        Write-Host ("${cGray}|${cWhite} {0,-27} ${cGray}|${cCyan} {1,-6} ${cGray}|${cWhite} {2,-27} ${cGray}| {3,-26}${cGray}|${cReset}" -f $svc.Name, ":$($svc.Port)", $svc.Domain, $formattedStat)
    }

    $tunProc = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
    $tunStat = if ($tunProc) { "${cGreen}[ CONNECTED ]${cReset}" } else { "${cRed}[ DISCONNECTED ]${cReset}" }
    Write-Host ("${cGray}|${cWhite} {0,-27} ${cGray}|${cCyan} {1,-6} ${cGray}|${cWhite} {2,-27} ${cGray}| {3,-26}${cGray}|${cReset}" -f "Cloudflare Tunnel", "Edge", "marksmanshooter.in", $tunStat)
    Write-Host "${cGray}+-----------------------------+--------+-----------------------------+------------------+${cReset}"
    Write-Host ""
    Write-Host "${cWhite}  Commands: ${cBold}[R]${cReset} Refresh | ${cBold}[H]${cReset} HTTP Health Probe | ${cBold}[O]${cReset} Open Site | ${cBold}[Q]${cReset} Stop Owned & Exit${cReset}"
}

function Run-HttpProbe {
    Write-Host ""
    Write-Host "${cCyan}--- HTTP Health Check ---${cReset}"
    foreach ($svc in $services) {
        $ok = Test-HttpHealth $svc.HealthUrl 3
        if ($ok) {
            Write-Host "  ${cGreen}[OK]${cReset} $($svc.Name) -> $($svc.HealthUrl)"
        } else {
            Write-Host "  ${cRed}[FAIL]${cReset} $($svc.Name) -> $($svc.HealthUrl)"
        }
    }
}

try {
    while ($true) {
        Render-StatusDashboard

        $counter = 0
        while ($counter -lt 40) {
            if ([Console]::KeyAvailable) {
                $key = [Console]::ReadKey($true).Key
                if ($key -eq [ConsoleKey]::Q) {
                    return
                }
                if ($key -eq [ConsoleKey]::R) {
                    Print-Banner
                    break
                }
                if ($key -eq [ConsoleKey]::H) {
                    Run-HttpProbe
                }
                if ($key -eq [ConsoleKey]::O) {
                    Start-Process "https://marksmanshooter.in"
                }
            }
            Start-Sleep -Milliseconds 100
            $counter++
        }
    }
} finally {
    Write-Host ""
    Write-Host "${cYellow}[*] Stopping Marksman service process trees...${cReset}"
    foreach ($svc in $services) {
        if ($svc.Owned -and $svc.Process -and -not $svc.Process.HasExited) {
            Write-Host "  -> Stopping $($svc.Name) (PID $($svc.Process.Id))..." -NoNewline
            Stop-ProcessTree $svc.Process.Id
            Write-Host " ${cGreen}[STOPPED]${cReset}"
        }
    }
    if ($tunnelService.Owned -and $tunnelService.Process -and -not $tunnelService.Process.HasExited) {
        Write-Host "  -> Stopping Cloudflare Tunnel (PID $($tunnelService.Process.Id))..." -NoNewline
        Stop-ProcessTree $tunnelService.Process.Id
        Write-Host " ${cGreen}[STOPPED]${cReset}"
    }
    Write-Host "${cGreen}[OK] All launched service trees cleanly stopped.${cReset}"
}
