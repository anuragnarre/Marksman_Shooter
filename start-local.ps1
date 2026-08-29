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

#  Pre-flight checks 
Write-Header "Pre-flight checks"

# Docker
try {
    $null = docker info 2>&1
    Write-Ok "Docker is running"
} catch {
    Write-Err "Docker is not running. Start Docker Desktop and try again."
    exit 1
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
    $visionJob = Start-Job -ScriptBlock {
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
$apiJob = Start-Job -ScriptBlock {
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
$webJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    cmd /c "npm run dev 2>&1"
} -ArgumentList $webDir
$Jobs += $webJob
$null = Wait-For-Port 3000 "Next.js" 60

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
Write-Host "" -ForegroundColor DarkGreen
Write-Host "  Press Ctrl+C to stop all services                      " -ForegroundColor Gray
Write-Host "" -ForegroundColor DarkGreen
Write-Host ""

#  Keep alive until Ctrl+C 
try {
    while ($true) {
        # Check if any job died unexpectedly
        foreach ($j in $Jobs) {
            if ($j.State -eq "Failed") {
                Write-Warn "Job $($j.Name) failed. Check logs with: Receive-Job -Id $($j.Id)"
            }
        }
        Start-Sleep -Seconds 5
    }
} finally {
    Write-Host ""
    Write-Info "Stopping all services..."
    $Jobs | ForEach-Object { Stop-Job $_ -PassThru | Remove-Job }
    Write-Info "Stopping Docker containers..."
    Set-Location $Root
    docker compose stop db 2>&1 | Out-Null
    Write-Ok "All services stopped."
}

