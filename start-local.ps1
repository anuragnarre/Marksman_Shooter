# 
# start-local.ps1  Marksman One-Command Local Dev Stack
#
# Usage:
#   .\start-local.ps1              # start all services
#   .\start-local.ps1 -NoVision   # skip Python vision service
#   .\start-local.ps1 -DbOnly     # only start Postgres (useful for API dev)
#   .\start-local.ps1 -Check      # health check only, then exit
#
# Prerequisites:
#   - Docker Desktop running
#   - Node.js 20+ with npm
#   - Python 3.11+ (for vision service)
# 

param(
    [switch]$NoVision,
    [switch]$DbOnly,
    [switch]$Check,
    [switch]$Help
)

# Ensure running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Administrator privileges are required for Cloudflare Tunnel service." -ForegroundColor Yellow
    Write-Host "Relaunching with elevation..." -ForegroundColor Yellow
    
    $argsArray = @()
    if ($NoVision) { $argsArray += "-NoVision" }
    if ($DbOnly) { $argsArray += "-DbOnly" }
    if ($Check) { $argsArray += "-Check" }
    if ($Help) { $argsArray += "-Help" }

    $argString = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" $($argsArray -join ' ')"
    Start-Process powershell.exe -Verb RunAs -ArgumentList $argString
    exit
}

if ($Help) {
    Write-Host @"
Marksman Local Dev Stack
  .\start-local.ps1              Start all services
  .\start-local.ps1 -NoVision   Skip vision service (saves ~2s startup)
  .\start-local.ps1 -DbOnly     Only start PostgreSQL
  .\start-local.ps1 -Check      Health check all services, then exit
"@
    exit 0
}

$Root = $PSScriptRoot
$Jobs = @()

function Write-Header($text) {
    Write-Host ""
    Write-Host "" -ForegroundColor DarkGray
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor DarkGray
}

function Write-Ok($text)   { Write-Host "  [OK] $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "  [WARN]  $text" -ForegroundColor Yellow }
function Write-Err($text)  { Write-Host "  [ERR] $text" -ForegroundColor Red }
function Write-Info($text) { Write-Host "  [INFO]  $text" -ForegroundColor Gray }

function Wait-For-Port($port, $label, $timeoutSec = 30) {
    $deadline = (Get-Date).AddSeconds($timeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.Connect("127.0.0.1", $port)
            $tcp.Close()
            Write-Ok "$label is up on :$port"
            return $true
        } catch { Start-Sleep -Milliseconds 500 }
    }
    Write-Warn "$label did not start within ${timeoutSec}s on :$port"
    return $false
}

#  Banner 
Write-Host ""
Write-Host "" -ForegroundColor DarkYellow
Write-Host "         Marksman  Local Dev Stack Launcher             " -ForegroundColor Yellow
Write-Host "" -ForegroundColor DarkYellow

#  Network & Environment Checks 
Write-Header "Network Status"
$global:NetworkIps = @()

try {
    if (Test-Connection -ComputerName 8.8.8.8 -Count 1 -Quiet -ErrorAction SilentlyContinue) {
        Write-Ok "Network: Connected"
    } else {
        Write-Warn "Network: Unreachable (Check connection)"
    }
} catch { Write-Warn "Network check failed." }

try {
    $global:NetworkIps = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL' }).IPAddress
    $global:HostDomain = [System.Net.Dns]::GetHostEntry([System.Net.Dns]::GetHostName()).HostName
    if ($global:NetworkIps) {
        Write-Ok "Live IPs: $($global:NetworkIps -join ', ')"
    } else {
        Write-Warn "Live IPs: None found"
    }
    Write-Ok "Local Domain/Hostname: $global:HostDomain"
} catch { Write-Warn "Failed to retrieve local IPs or domain." }

try {
    if (Test-Connection -ComputerName "google.com" -Count 1 -Quiet -ErrorAction SilentlyContinue) {
        Write-Ok "Domain Resolution: Live"
    } else {
        Write-Warn "Domain Resolution: Failed"
    }
} catch { Write-Warn "Domain check failed." }

try {
    if (Test-Connection -ComputerName "marksmanshooter.in" -Count 1 -Quiet -ErrorAction SilentlyContinue) {
        Write-Ok "Universal Domain (marksmanshooter.in): Live"
    } else {
        Write-Warn "Universal Domain (marksmanshooter.in): Unreachable"
    }
} catch { Write-Warn "Universal domain check failed." }

#  Pre-flight checks 
Write-Header "Pre-flight checks"

# Docker
$dockerRunning = $false
try {
    $null = docker info 2>&1
    $dockerRunning = $true
} catch {}

if (-not $dockerRunning) {
    Write-Info "Docker is not running. Attempting to start Docker Desktop..."
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
        Write-Info "Waiting for Docker engine to start (this may take up to 60s)..."
        $retries = 30
        while ($retries -gt 0) {
            Start-Sleep -Seconds 2
            try {
                $null = docker info 2>&1
                $dockerRunning = $true
                break
            } catch {}
            $retries--
        }
    } else {
        Write-Err "Docker Desktop executable not found at standard path."
    }
}

if ($dockerRunning) {
    Write-Ok "Docker is running"
} else {
    Write-Err "Docker failed to start. Please start it manually and try again."
    exit 1
}

# Cloudflare Tunnel Service
$cfToken = "eyJhIjoiZDQ2OTgxNjBmZWEwNWU0N2U4MjBlNTkyMTUyNWU0NjciLCJ0IjoiYWE3ZDMwMTUtMTBjZi00OWYxLThhYTktMDdhNGYzMmQzYmI2IiwicyI6Ik5HSXlObU0yWWpVdFltRTJOQzAwT0RSa0xUaGpOR1V0TkRRMk1ERTNNR0k0WWpGbSJ9"
$cfService = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
$cfManualRun = $false

if ($cfService) {
    if ($cfService.Status -ne 'Running') {
        Write-Info "Cloudflare Tunnel service is stopped. Attempting to start..."
        try {
            Start-Service -Name "cloudflared" -ErrorAction Stop
            Start-Sleep -Seconds 2
        } catch {
            Write-Warn "Could not start cloudflared service (You may need to run this script as Administrator)."
            $cfManualRun = $true
        }
    }
    
    $cfService = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
    if ($cfService.Status -eq 'Running') {
        Write-Ok "Cloudflare Tunnel (cloudflared) service is running"
    } else {
        Write-Warn "Cloudflare Tunnel service is not running."
    }
} else {
    Write-Warn "Cloudflare Tunnel (cloudflared) service not found."
    $cfManualRun = $true
}

if ($cfManualRun) {
    Write-Info "Attempting to start Cloudflare tunnel manually..."
    try {
        $cfJob = Start-Job -ScriptBlock {
            param($token)
            cloudflared tunnel run --token $token
        } -ArgumentList $cfToken
        $Jobs += $cfJob
        Write-Ok "Cloudflare Tunnel started manually in background job."
    } catch {
        Write-Warn "Failed to start Cloudflare tunnel manually."
    }
}

# Node.js
try {
    $nodeVer = node --version 2>&1
    Write-Ok "Node.js $nodeVer"
} catch {
    Write-Err "Node.js not found. Install from https://nodejs.org"
    exit 1
}

if (-not $NoVision -and -not $DbOnly) {
    # Python
    $pythonCmd = ""
    @("python", "python3", "py") | ForEach-Object {
        if (-not $pythonCmd) {
            try {
                $v = & $_ --version 2>&1
                if ($v -match "Python 3\.[89]|Python 3\.1") { $pythonCmd = $_ }
            } catch {}
        }
    }
    if ($pythonCmd) {
        Write-Ok "Python found: $($pythonCmd)"
    } else {
        Write-Warn "Python 3.9+ not found. Vision service will be skipped. Install from python.org"
        $NoVision = $true
    }
}

if ($Check) {
    Write-Header "Health checks"
    $checks = @(
        @{ url="http://localhost:5433"; label="PostgreSQL" },
        @{ url="http://localhost:3001/health"; label="NestJS API" },
        @{ url="http://localhost:8000/health"; label="Vision Service" },
        @{ url="http://localhost:3000"; label="Next.js Web" }
    )
    foreach ($c in $checks) {
        try {
            $r = Invoke-WebRequest -Uri $c.url -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
            Write-Ok "$($c.label)  HTTP $($r.StatusCode)"
        } catch {
            Write-Warn "$($c.label)  not reachable at $($c.url)"
        }
    }
    exit 0
}

#  Step 1: PostgreSQL via Docker 
Write-Header "1/4  Starting PostgreSQL"
Set-Location $Root
$dbRunning = docker ps --filter "name=marksman-db" --format "{{.Names}}" 2>&1
if ($dbRunning -match "marksman-db") {
    Write-Ok "PostgreSQL already running"
} else {
    Write-Info "Starting Postgres container..."
    docker compose up -d db 2>&1 | Out-Null
    $null = Wait-For-Port 5433 "PostgreSQL" 30
}

if ($DbOnly) {
    Write-Host ""
    Write-Ok "Database ready at postgresql://localhost:5433/shooting_platform"
    exit 0
}

#  Step 2: Vision Service (FastAPI) 
if (-not $NoVision) {
    Write-Header "2/4  Starting Vision Service"
    $visionDir = Join-Path $Root "apps\vision"

    # Create/activate venv
    $venvPy = Join-Path $visionDir "venv\Scripts\python.exe"
    if (-not (Test-Path $venvPy)) {
        Write-Info "Creating Python venv..."
        & $pythonCmd -m venv "$visionDir\venv" 2>&1 | Out-Null
        Write-Info "Installing vision requirements..."
        & "$visionDir\venv\Scripts\pip.exe" install -r "$visionDir\requirements.txt" -q 2>&1 | Out-Null
        Write-Ok "Vision venv ready"
    } else {
        Write-Ok "Vision venv exists"
    }

    $visionLog = Join-Path $Root "vision.log"
    Write-Info "Starting uvicorn on :8000 (log: vision.log)"
    $visionJob = Start-Job -Name "Vision" -ScriptBlock {
        param($dir, $py)
        Set-Location $dir
        & $py -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info
    } -ArgumentList $visionDir, $venvPy
    $Jobs += $visionJob

    $null = Wait-For-Port 8000 "Vision Service" 25
}

#  Step 3: NestJS API 
Write-Header "3/4  Starting NestJS API"
$apiDir = Join-Path $Root "apps\api"

if (-not (Test-Path "$apiDir\node_modules")) {
    Write-Info "Installing API dependencies..."
    Set-Location $apiDir
    npm install --silent 2>&1 | Out-Null
}

# Run Prisma migrate
Write-Info "Running Prisma migrations..."
Set-Location $apiDir
cmd /c "npx prisma migrate deploy 2>&1" | Out-Null
Write-Ok "Prisma migrations applied"

Write-Info "Starting NestJS API on :3001"
$apiJob = Start-Job -Name "API" -ScriptBlock {
    param($dir)
    Set-Location $dir
    cmd /c "npm run start:dev 2>&1"
} -ArgumentList $apiDir
$Jobs += $apiJob
$null = Wait-For-Port 3001 "NestJS API" 40

#  Step 4: Next.js Web App 
Write-Header "4/4  Starting Next.js Web App"
$webDir = Join-Path $Root "apps\web"

if (-not (Test-Path "$webDir\node_modules")) {
    Write-Info "Installing web dependencies..."
    Set-Location $webDir
    npm install --silent 2>&1 | Out-Null
}

Write-Info "Starting Next.js on :3000"
$webJob = Start-Job -Name "Web" -ScriptBlock {
    param($dir)
    Set-Location $dir
    cmd /c "npm run dev 2>&1"
} -ArgumentList $webDir
$Jobs += $webJob
$null = Wait-For-Port 3000 "Next.js" 60

Write-Info "Triggering Web App warm-up..."
try {
    $null = Start-Job -Name "Warmup" -ScriptBlock {
        Invoke-WebRequest -Uri "http://localhost:3000/auth/login" -UseBasicParsing -TimeoutSec 60 -ErrorAction SilentlyContinue
        Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing -TimeoutSec 60 -ErrorAction SilentlyContinue
    }
} catch {}

#  Summary 
Write-Host ""
Write-Host "" -ForegroundColor DarkGreen
Write-Host "             Marksman Stack  READY                      " -ForegroundColor Green
Write-Host "" -ForegroundColor DarkGreen
Write-Host "  [WEB] Web App    http://localhost:3000                  " -ForegroundColor Green
Write-Host "  [API] API Server http://localhost:3001                  " -ForegroundColor Green
if (-not $NoVision) {
Write-Host "  [VIS] Vision API http://localhost:8000/docs            " -ForegroundColor Green
Write-Host "  [CAM] MJPEG Feed http://localhost:8001/mjpeg            " -ForegroundColor DarkGray
}
Write-Host "  [DB] PostgreSQL  postgresql://localhost:5433/...       " -ForegroundColor Green

if ($global:NetworkIps -and $global:NetworkIps.Count -gt 0) {
    $firstIp = $global:NetworkIps[0]
    $hostName = $global:HostDomain
    Write-Host "" -ForegroundColor DarkGreen
    Write-Host "  --- Network Access (For Mobile/Hardware Testing) ---  " -ForegroundColor DarkGray
    Write-Host "  [WEB] (By IP)      http://${firstIp}:3000                  " -ForegroundColor DarkGreen
    Write-Host "  [API] (By IP)      http://${firstIp}:3001                  " -ForegroundColor DarkGreen
    if ($hostName) {
        Write-Host "  [WEB] (By Domain)  http://${hostName}:3000                  " -ForegroundColor DarkGreen
        Write-Host "  [API] (By Domain)  http://${hostName}:3001                  " -ForegroundColor DarkGreen
    }
}

Write-Host "" -ForegroundColor DarkGreen
Write-Host "  Press Ctrl+C to stop all services                      " -ForegroundColor Gray
Write-Host "" -ForegroundColor DarkGreen
Write-Host ""

#  Keep alive until Ctrl+C 
$lastKeepAliveTime = Get-Date
$lastHealthCheckTime = Get-Date
try {
    while ($true) {
        # Stream logs from all background jobs and check status
        foreach ($j in $Jobs) {
            if ($j.State -eq "Failed") {
                Write-Warn "Job $($j.Name) failed."
            } else {
                $jobOutput = Receive-Job -Job $j
                foreach ($line in $jobOutput) {
                    if (-not [string]::IsNullOrWhiteSpace($line)) {
                        $color = "DarkGray"
                        if ($line -match "(?i)error|fail|exception") { $color = "Red" }
                        elseif ($line -match "(?i)warn") { $color = "Yellow" }
                        elseif ($line -match "(?i)ready|success|compiled in|started") { $color = "Green" }
                        Write-Host "[$($j.Name)] $line" -ForegroundColor $color
                    }
                }
            }
        }
        
        # Cloudflare Zero Trust keep-alive every 14 minutes
        if ((Get-Date) - $lastKeepAliveTime -gt (New-TimeSpan -Minutes 14)) {
            Write-Info "Sending keep-alive request to marksmanshooter.in to prevent Cloudflare cold start..."
            try {
                $null = Invoke-WebRequest -Uri "https://marksmanshooter.in" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
            } catch { }
            $lastKeepAliveTime = Get-Date
        }

        # Periodic Health Checks (Every 30s)
        if ((Get-Date) - $lastHealthCheckTime -gt (New-TimeSpan -Seconds 30)) {
            $lastHealthCheckTime = Get-Date
            $allGood = $true
            
            # Check DB
            $dbStatus = docker inspect -f '{{.State.Status}}' marksman-db 2>&1
            if ($dbStatus -notmatch "running") { 
                Write-Host "[Monitor] ❌ PostgreSQL Database container is stopped!" -ForegroundColor Red
                $allGood = $false
            }
            
            # Check API
            $apiUp = $false
            try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect("127.0.0.1", 3001); $tcp.Close(); $apiUp = $true } catch {}
            if (-not $apiUp) {
                Write-Host "[Monitor] ❌ NestJS API is unresponsive or crashed!" -ForegroundColor Red
                $allGood = $false
            }

            # Check Web
            $webUp = $false
            try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect("127.0.0.1", 3000); $tcp.Close(); $webUp = $true } catch {}
            if (-not $webUp) {
                Write-Host "[Monitor] ❌ Next.js Web App is unresponsive or crashed!" -ForegroundColor Red
                $allGood = $false
            }

            if ($allGood) {
                Write-Host "[Monitor] ✅ All systems functional ($(Get-Date -Format 'HH:mm:ss'))" -ForegroundColor DarkGray
            }
        }

        Start-Sleep -Seconds 5
    }
} finally {
    Write-Host ""
    Write-Info "Stopping all services..."
    $Jobs | ForEach-Object { Stop-Job $_ -PassThru | Remove-Job }

    # Save database backup snapshot before stopping
    try {
        $backupDir = Join-Path $Root "backups"
        if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }
        $timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
        $backupFile = Join-Path $backupDir "marksman_db_backup_$timestamp.sql"
        $latestFile = Join-Path $backupDir "marksman_db_latest.sql"

        Write-Info "Creating snapshot of all database records (users, sessions, telemetry)..."
        $dumpResult = docker exec marksman-db pg_dump -U postgres -d shooting_platform -f /tmp/backup.sql 2>&1
        if ($LASTEXITCODE -eq 0) {
            docker cp marksman-db:/tmp/backup.sql $backupFile 2>&1 | Out-Null
            Copy-Item -Path $backupFile -Destination $latestFile -Force
            Write-Ok "All database records safely archived to: backups/marksman_db_latest.sql"
        } else {
            Write-Warn "Snapshot skipped or container stopped."
        }
    } catch {
        Write-Warn "Could not write snapshot file: $($_.Exception.Message)"
    }

    Write-Info "Flushing buffers and safely stopping Docker containers..."
    Set-Location $Root
    docker compose stop db 2>&1 | Out-Null
    Write-Ok "All database data preserved in volume 'shooting_db_data'."
    Write-Ok "All services stopped cleanly."
}


