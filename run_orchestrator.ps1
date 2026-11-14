<#
.SYNOPSIS
  Marksman Platform - Master Ecosystem Orchestrator
  Automated Pre-flight Checks, Service Supervision, Cloudflare Tunnel & Diagnostics.
#>

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$rootDir = $PSScriptRoot
$tunnelTokenFile = "$env:USERPROFILE\.cloudflared\marksman_tunnel_token.txt"

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
    Write-Host "   MARKSMAN PLATFORM — FULL ECOSYSTEM SUPERVISOR & CLOUDFLARE BRIDGE"
    Write-Host "   Official Production Domain: https://marksmanshooter.in"
    Write-Host " ===========================================================================$cReset"
    Write-Host ""
}

# ─────────────────────────────────────────────────────────────────────────────
# Pre-Flight Checks & Service Readiness
# ─────────────────────────────────────────────────────────────────────────────
function Test-PortListening ($port) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

function Ensure-Postgres {
    Write-Host "$cWhite[*] Checking PostgreSQL on port 5433...$cReset" -NoNewline
    if (Test-PortListening 5433) {
        Write-Host " $cGreen[ALREADY ACTIVE]$cReset"
        return $true
    }

    # Check for native Windows service
    $pgService = Get-Service -Name "postgresql-16" -ErrorAction SilentlyContinue
    if ($pgService) {
        Write-Host " $cYellow[Starting Windows Service postgresql-16...]$cReset" -NoNewline
        Start-Service -Name "postgresql-16" -ErrorAction SilentlyContinue
        for ($i = 0; $i -lt 15; $i++) {
            Start-Sleep -Seconds 1
            if (Test-PortListening 5433) {
                Write-Host " $cGreen[STARTED]$cReset"
                return $true
            }
        }
    }

    # Fallback to docker compose
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Host " $cYellow[Starting Docker Postgres Container...]$cReset" -NoNewline
        docker compose up -d db 2>$null | Out-Null
        for ($i = 0; $i -lt 15; $i++) {
            Start-Sleep -Seconds 1
            if (Test-PortListening 5433) {
                Write-Host " $cGreen[STARTED VIA DOCKER]$cReset"
                return $true
            }
        }
    }

    Write-Host " $cRed[FAILED: PostgreSQL not listening on 5433]$cReset"
    return $false
}

function Kill-PortOwner ($port) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        if ($c.OwningProcess -and $c.OwningProcess -ne 0 -and $c.OwningProcess -ne $PID) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Service Definitions
# ─────────────────────────────────────────────────────────────────────────────
$services = @(
    @{
        Name        = "Shooter API"
        Port        = 3001
        Domain      = "api.marksmanshooter.in"
        Type        = "Node/NestJS"
        WorkDir     = Join-Path $rootDir "Shooter_App\apps\api"
        Command     = "npm.cmd"
        Args        = @("run", "start:dev")
        HealthUrl   = "http://127.0.0.1:3001/auth/login"
        Process     = $null
        Status      = "STOPPED"
    },
    @{
        Name        = "Range Ops API"
        Port        = 3003
        Domain      = "range-api.marksmanshooter.in"
        Type        = "Node/NestJS"
        WorkDir     = Join-Path $rootDir "Range_Management\apps\api"
        Command     = "npm.cmd"
        Args        = @("run", "start:dev")
        HealthUrl   = "http://127.0.0.1:3003/auth/login"
        Process     = $null
        Status      = "STOPPED"
    },
    @{
        Name        = "Target Vision Engine"
        Port        = 8000
        Domain      = "vision.marksmanshooter.in"
        Type        = "Python/FastAPI"
        WorkDir     = Join-Path $rootDir "Shooter_App\apps\vision"
        Command     = (Join-Path $rootDir "Shooter_App\apps\vision\venv\Scripts\python.exe")
        Args        = @("-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000")
        HealthUrl   = "http://127.0.0.1:8000/docs"
        Process     = $null
        Status      = "STOPPED"
    },
    @{
        Name        = "Shooter Web Portal"
        Port        = 3000
        Domain      = "marksmanshooter.in"
        Type        = "Next.js"
        WorkDir     = Join-Path $rootDir "Shooter_App\apps\web"
        Command     = "npm.cmd"
        Args        = @("run", "dev")
        HealthUrl   = "http://127.0.0.1:3000"
        Process     = $null
        Status      = "STOPPED"
    },
    @{
        Name        = "Range Management Web"
        Port        = 3002
        Domain      = "range.marksmanshooter.in"
        Type        = "Next.js"
        WorkDir     = Join-Path $rootDir "Range_Management\apps\web"
        Command     = "npm.cmd"
        Args        = @("run", "dev")
        HealthUrl   = "http://127.0.0.1:3002"
        Process     = $null
        Status      = "STOPPED"
    }
)

$tunnelService = @{
    Name        = "Cloudflare Zero Trust Tunnel"
    Domain      = "*.marksmanshooter.in"
    Type        = "Cloudflared"
    Command     = "cloudflared.exe"
    Args        = @("tunnel", "run", "--token-file", $tunnelTokenFile)
    Process     = $null
    Status      = "STOPPED"
}

# ─────────────────────────────────────────────────────────────────────────────
# Execution & Monitoring
# ─────────────────────────────────────────────────────────────────────────────
Print-Banner

# Step 1: PostgreSQL Check
$pgReady = Ensure-Postgres
if (-not $pgReady) {
    Write-Host "$cRed[!] Critical: PostgreSQL could not be started. Backend APIs will fail to connect.$cReset"
    Write-Host "$cYellowPress any key to proceed anyway, or Ctrl+C to abort...$cReset"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Step 2: Tunnel Token Check
Write-Host "$cWhite[*] Checking Cloudflare Tunnel Token...$cReset" -NoNewline
if (Test-Path $tunnelTokenFile) {
    Write-Host " $cGreen[PRESENT: $tunnelTokenFile]$cReset"
} else {
    Write-Host " $cRed[MISSING: $tunnelTokenFile]$cReset"
    Write-Host "$cYellow[!] Tunnel cannot run without the saved token.$cReset"
}

Write-Host ""
Write-Host "$cBold$cWhite--- Launching Services & Health Verifications ---$cReset"

# Start Background Service helper
function Start-ManagedProcess ($svc) {
    # If already listening on port, mark attached
    if ($svc.Port -and (Test-PortListening $svc.Port)) {
        $svc.Status = "RUNNING (Attached)"
        Write-Host "  -> $($svc.Name) on port $($svc.Port): $cGreen[ALREADY RUNNING]$cReset"
        return
    }

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $svc.Command
    $psi.Arguments = $svc.Args -join " "
    $psi.WorkingDirectory = $svc.WorkDir
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true

    try {
        $proc = [System.Diagnostics.Process]::Start($psi)
        $svc.Process = $proc
        $svc.Status = "STARTING"
        Write-Host "  -> Launching $($svc.Name)... " -NoNewline

        # Wait briefly and verify
        $online = $false
        for ($s = 0; $s -lt 12; $s++) {
            Start-Sleep -Milliseconds 600
            if ($proc.HasExited) { break }
            if ($svc.Port -and (Test-PortListening $svc.Port)) {
                $online = $true
                break
            }
        }

        if ($proc.HasExited) {
            $svc.Status = "CRASHED (Exit: $($proc.ExitCode))"
            Write-Host "$cRed[CRASHED - Exit Code $($proc.ExitCode)]$cReset"
        } elseif ($online) {
            $svc.Status = "RUNNING"
            Write-Host "$cGreen[ONLINE on port $($svc.Port)]$cReset"
        } else {
            $svc.Status = "RUNNING (Initializing...)"
            Write-Host "$cYellow[INITIALIZING (PID: $($proc.Id))]$cReset"
        }
    } catch {
        $svc.Status = "ERROR: $($_.Exception.Message)"
        Write-Host "$cRed[ERROR: $($_.Exception.Message)]$cReset"
    }
}

# Launch all 5 application services
foreach ($svc in $services) {
    Start-ManagedProcess $svc
}

# Launch Cloudflare Tunnel
if (Test-Path $tunnelTokenFile) {
    Write-Host "  -> Launching $($tunnelService.Name)... " -NoNewline
    # Check if already running
    $existingCf = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
    if ($existingCf) {
        $tunnelService.Status = "RUNNING (Attached)"
        Write-Host "$cGreen[ALREADY CONNECTED (PID: $($existingCf[0].Id))]$cReset"
    } else {
        $tPsi = New-Object System.Diagnostics.ProcessStartInfo
        $tPsi.FileName = $tunnelService.Command
        $tPsi.Arguments = $tunnelService.Args -join " "
        $tPsi.UseShellExecute = $false
        $tPsi.CreateNoWindow = $true
        $tProc = [System.Diagnostics.Process]::Start($tPsi)
        $tunnelService.Process = $tProc
        Start-Sleep -Seconds 2
        if ($tProc.HasExited) {
            $tunnelService.Status = "CRASHED"
            Write-Host "$cRed[TUNNEL FAILED TO CONNECT]$cReset"
        } else {
            $tunnelService.Status = "CONNECTED (QUIC Edge)"
            Write-Host "$cGreen[CONNECTED TO CLOUDFLARE EDGE]$cReset"
        }
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Interactive Live Monitoring Loop
# ─────────────────────────────────────────────────────────────────────────────
function Render-StatusDashboard {
    Write-Host ""
    Write-Host "$cBgBlue$cWhite$cBold                               LIVE SYSTEM STATUS                                $cReset"
    Write-Host "$cGray┌─────────────────────────────┬────────┬─────────────────────────────┬──────────────────┐$cReset"
    Write-Host "$cGray│$cBold$cWhite Service                     $cGray│$cBold$cWhite Port   $cGray│$cBold$cWhite Public Domain                $cGray│$cBold$cWhite Live Status       $cGray│$cReset"
    Write-Host "$cGray├─────────────────────────────┼────────┼─────────────────────────────┼──────────────────┤$cReset"

    # Database
    $dbStat = if (Test-PortListening 5433) { "$cGreen[ RUNNING ]$cReset" } else { "$cRed[ STOPPED ]$cReset" }
    Write-Host ("$cGray│$cWhite {0,-27} $cGray│$cCyan {1,-6} $cGray│$cWhite {2,-27} $cGray│ {3,-26}$cGray│$cReset" -f "PostgreSQL Database", "5433", "Local Database", $dbStat)

    # Core services
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
        Write-Host ("$cGray│$cWhite {0,-27} $cGray│$cCyan {1,-6} $cGray│$cWhite {2,-27} $cGray│ {3,-26}$cGray│$cReset" -f $svc.Name, ":$($svc.Port)", $svc.Domain, $formattedStat)
    }

    # Tunnel
    $tunProc = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
    $tunStat = if ($tunProc) { "$cGreen[ CONNECTED ]$cReset" } else { "$cRed[ DISCONNECTED ]$cReset" }
    Write-Host ("$cGray│$cWhite {0,-27} $cGray│$cCyan {1,-6} $cGray│$cWhite {2,-27} $cGray│ {3,-26}$cGray│$cReset" -f "Cloudflare Tunnel", "Edge", "marksmanshooter.in", $tunStat)
    Write-Host "$cGray└─────────────────────────────┴────────┴─────────────────────────────┴──────────────────┘$cReset"
    Write-Host ""
    Write-Host "$cWhite  Commands: $cBold[R]$cReset Refresh status | $cBold[O]$cReset Open marksmanshooter.in in browser | $cBold[Q]$cReset Stop all & Exit$cReset"
}

# Main event loop
try {
    while ($true) {
        Render-StatusDashboard

        # Check for key press with 3-second timeout
        $counter = 0
        while ($counter -lt 30) {
            if ([Console]::KeyAvailable) {
                $key = [Console]::ReadKey($true).Key
                if ($key -eq [ConsoleKey]::Q) {
                    throw "USER_QUIT"
                }
                if ($key -eq [ConsoleKey]::R) {
                    Print-Banner
                    break
                }
                if ($key -eq [ConsoleKey]::O) {
                    Start-Process "https://marksmanshooter.in"
                }
            }
            Start-Sleep -Milliseconds 100
            $counter++
        }
    }
} catch {
    Write-Host ""
    Write-Host "$cYellow[*] Stopping all Marksman services and Cloudflare Tunnel...$cReset"
    foreach ($svc in $services) {
        if ($svc.Process -and -not $svc.Process.HasExited) {
            Write-Host "  -> Stopping $($svc.Name)..." -NoNewline
            Stop-Process -Id $svc.Process.Id -Force -ErrorAction SilentlyContinue
            Write-Host " $cGreen[STOPPED]$cReset"
        }
    }
    if ($tunnelService.Process -and -not $tunnelService.Process.HasExited) {
        Write-Host "  -> Stopping Cloudflare Tunnel..." -NoNewline
        Stop-Process -Id $tunnelService.Process.Id -Force -ErrorAction SilentlyContinue
        Write-Host " $cGreen[STOPPED]$cReset"
    }
    Write-Host "$cGreen[OK] All services cleanly stopped.$cReset"
}

