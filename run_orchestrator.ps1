<#
.SYNOPSIS
  Marksman Platform - Single-Script Full Ecosystem Deployer & Supervisor
  Automated Pre-flight Checks, Docker/Postgres Startup, Monorepo Builds,
  Service Supervision, Cloudflare Zero Trust Bridge & Live Health Diagnostics.
#>
param(
    [ValidateSet("Prod", "Dev")]
    [string]$Mode = "Prod",
    [switch]$Rebuild,
    [switch]$Detach,
    [switch]$Stop,
    [switch]$NoTunnel,
    [switch]$SkipDbPush,
    [switch]$BuildOnly,
    [switch]$VerifyOnly
)

$ErrorActionPreference = "Continue"
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$rootDir = $PSScriptRoot
$logDir = Join-Path $rootDir "logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
$pidFile = Join-Path $logDir "orchestrator.pids.json"
$tunnelTokenFile = Join-Path $env:USERPROFILE ".cloudflared\marksman_tunnel_token.txt"

# ANSI Colors
$esc = [char]27
$cReset  = "$esc[0m"
$cBold   = "$esc[1m"
$cGreen  = "$esc[92m"
$cRed    = "$esc[91m"
$cYellow = "$esc[93m"
$cCyan   = "$esc[96m"
$cWhite  = "$esc[97m"
$cGray   = "$esc[90m"
$cBgBlue = "$esc[44m"

function Test-InteractiveConsole {
    if ($Detach -or $BuildOnly -or $VerifyOnly -or $Stop) { return $false }
    if (-not [Environment]::UserInteractive) { return $false }
    try {
        if ([Console]::IsInputRedirected -or [Console]::IsOutputRedirected) { return $false }
        $null = [Console]::KeyAvailable
        return $true
    } catch {
        return $false
    }
}

function Print-Banner {
    if (Test-InteractiveConsole) {
        try { Clear-Host } catch {}
    }
    Write-Host "$cCyan$cBold"
    Write-Host " ==========================================================================="
    Write-Host "   MARKSMAN PLATFORM - SINGLE-SCRIPT DEPLOYER & CLOUDFLARE BRIDGE [$($Mode.ToUpper())]"
    Write-Host "   Official Production Domain: https://marksmanshooter.in"
    Write-Host " ===========================================================================$cReset"
    Write-Host ""
}

function Stop-ProcessTree ([int]$ProcessId) {
    if ($ProcessId -gt 0 -and $ProcessId -ne $PID) {
        & taskkill.exe /F /T /PID $ProcessId 2>$null | Out-Null
    }
}

function Test-PortListening ([int]$port) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

function Get-HttpStatusCode ([string]$url, [int]$timeoutSec = 3) {
    if ([string]::IsNullOrWhiteSpace($url)) { return 0 }
    try {
        $resp = Invoke-WebRequest -Uri $url -TimeoutSec $timeoutSec -UseBasicParsing -MaximumRedirection 3 -ErrorAction Stop
        return [int]$resp.StatusCode
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            return [int]$_.Exception.Response.StatusCode
        }
        return 0
    }
}

function Test-HttpHealth ([string]$url, [int]$timeoutSec = 3, [bool]$strict200 = $false) {
    $code = Get-HttpStatusCode $url $timeoutSec
    if ($strict200) {
        return ($code -eq 200)
    }
    return ($code -ge 200 -and $code -lt 400)
}

function Invoke-StopAll {
    Write-Host "${cYellow}[*] Stopping Marksman services...${cReset}"
    if (Test-Path $pidFile) {
        try {
            $saved = Get-Content $pidFile -Raw | ConvertFrom-Json
            foreach ($entry in @($saved.pids)) {
                if ($entry.pid -and ([int]$entry.pid -gt 0)) {
                    Write-Host "  -> Stopping tracked $($entry.name) (PID $($entry.pid))"
                    Stop-ProcessTree ([int]$entry.pid)
                }
            }
        } catch {
            Write-Host "  ${cYellow}[WARN] Could not parse ${pidFile}: $($_.Exception.Message)${cReset}"
        }
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    }

    foreach ($port in @(3000, 3001, 3002, 3003, 8000)) {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            if ($c.OwningProcess -gt 0 -and $c.OwningProcess -ne $PID) {
                Write-Host "  -> Stopping listener on :$port (PID $($c.OwningProcess))"
                Stop-ProcessTree $c.OwningProcess
            }
        }
    }

    $cfProcs = Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe'" -ErrorAction SilentlyContinue
    foreach ($cfp in $cfProcs) {
        if ($cfp.CommandLine -and ($cfp.CommandLine -like "*marksman_tunnel_token*")) {
            Write-Host "  -> Stopping Marksman cloudflared (PID $($cfp.ProcessId))"
            Stop-ProcessTree ([int]$cfp.ProcessId)
        }
    }

    Write-Host "${cGreen}[OK] Marksman stop sequence complete.${cReset}"
}

if ($Stop) {
    Print-Banner
    Invoke-StopAll
    exit 0
}

function Wait-DockerPgReady ([string]$containerName) {
    if ([string]::IsNullOrWhiteSpace($containerName)) { return $true }
    Write-Host "  ${cYellow}[*] Waiting for PostgreSQL pg_isready inside '$containerName'...${cReset}" -NoNewline
    for ($p = 0; $p -lt 30; $p++) {
        docker exec $containerName pg_isready -U postgres -d shooting_platform 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ${cGreen}[READY]${cReset}"
            return $true
        }
        Start-Sleep -Seconds 1
    }
    Write-Host " ${cRed}[TIMEOUT]${cReset}"
    return $false
}

function Ensure-Postgres {
    Write-Host "${cWhite}[*] Checking PostgreSQL on port 5433...${cReset}" -NoNewline
    if (Test-PortListening 5433) {
        Write-Host " ${cGreen}[ALREADY LISTENING]${cReset}"
        if (Get-Command docker -ErrorAction SilentlyContinue) {
            docker info 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $running = @(docker ps --format "{{.Names}}" 2>$null)
                if ($running -contains "marksman-db") {
                    return (Wait-DockerPgReady "marksman-db")
                } elseif ($running -contains "marksman-postgres") {
                    return (Wait-DockerPgReady "marksman-postgres")
                }
            }
        }
        return $true
    }

    # Check for native Windows PostgreSQL service if installed
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pgService) {
        $pgStartedOk = ($pgService.Status -eq 'Running')
        if (-not $pgStartedOk) {
            Write-Host " ${cYellow}[Starting Windows Service $($pgService.Name)...]${cReset}" -NoNewline
            try {
                Start-Service -Name $pgService.Name -ErrorAction Stop
                $pgStartedOk = $true
            } catch {
                Write-Host " ${cYellow}[Requesting UAC elevation for $($pgService.Name)...]${cReset}" -NoNewline
                try {
                    Start-Process -FilePath "powershell.exe" -Verb RunAs -ArgumentList "-NoProfile -Command `"Start-Service -Name '$($pgService.Name)'`"" -Wait -ErrorAction Stop
                    $pgService.Refresh()
                    if ($pgService.Status -eq 'Running') {
                        $pgStartedOk = $true
                    }
                } catch {
                    Write-Host " ${cYellow}[UAC CANCELLED - falling back to Docker]${cReset}"
                }
            }
        }
        if ($pgStartedOk) {
            for ($i = 0; $i -lt 15; $i++) {
                Start-Sleep -Seconds 1
                if (Test-PortListening 5433) {
                    $pgReadyExe = "C:\PostgreSQL16\bin\pg_isready.exe"
                    if (Test-Path $pgReadyExe) {
                        & $pgReadyExe -h 127.0.0.1 -p 5433 2>$null | Out-Null
                        if ($LASTEXITCODE -eq 0) {
                            Write-Host " ${cGreen}[STARTED]${cReset}"
                            return $true
                        }
                    } else {
                        Write-Host " ${cGreen}[STARTED]${cReset}"
                        return $true
                    }
                }
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
                $sysWsl = "C:\Windows\System32\wsl.exe"
                $wslOk = $true
                if (Test-Path $sysWsl) {
                    & $sysWsl --version 2>$null | Out-Null
                    if ($LASTEXITCODE -ne 0) {
                        $wslOk = $false
                        Write-Host ""
                        Write-Host "  ${cYellow}[WARN] System32 wsl.exe failed - Docker Desktop WSL2 engine may fail; fix WSL App Execution Alias or start postgresql-16 as Administrator.${cReset}"
                    }
                }
                $maxDockerPolls = if ($wslOk) { 45 } else { 15 }
                $timeoutLabel = if ($wslOk) { "90s" } else { "30s" }
                Write-Host ""
                Write-Host "  ${cYellow}[*] Starting Docker Desktop daemon (up to $timeoutLabel)...${cReset}" -NoNewline
                Start-Process $dockerExe
                for ($d = 0; $d -lt $maxDockerPolls; $d++) {
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
            $containerName = ""
            $existingContainers = @(docker ps -a --format "{{.Names}}" 2>$null)
            if ($existingContainers -contains "marksman-db") {
                $containerName = "marksman-db"
                Write-Host "  ${cYellow}[*] Starting existing container 'marksman-db'...${cReset}" -NoNewline
                docker start marksman-db 2>$null | Out-Null
            } elseif ($existingContainers -contains "marksman-postgres") {
                $containerName = "marksman-postgres"
                Write-Host "  ${cYellow}[*] Starting existing container 'marksman-postgres'...${cReset}" -NoNewline
                docker start marksman-postgres 2>$null | Out-Null
            } else {
                $containerName = "marksman-postgres"
                Write-Host "  ${cYellow}[*] Creating Docker Postgres container...${cReset}" -NoNewline
                Push-Location $rootDir
                docker compose up -d db 2>$null | Out-Null
                Pop-Location
            }

            $portUp = $false
            for ($i = 0; $i -lt 20; $i++) {
                Start-Sleep -Seconds 1
                if (Test-PortListening 5433) {
                    $portUp = $true
                    Write-Host " ${cGreen}[PORT 5433 OPEN]${cReset}"
                    break
                }
            }
            if ($portUp) {
                return (Wait-DockerPgReady $containerName)
            }
        }
    }

    Write-Host " ${cRed}[FAILED: PostgreSQL not ready on 5433]${cReset}"
    return $false
}

function Ensure-MonorepoArtifacts ([string]$appDir, [string]$label, [bool]$dbOnline) {
    if (-not (Test-Path $appDir)) {
        Write-Host "  ${cRed}[ERROR] Missing workspace directory: $appDir${cReset}"
        return $false
    }

    $nodeModulesDir = Join-Path $appDir "node_modules"
    $sharedDist = Join-Path $appDir "packages\shared-types\dist\index.js"
    $prismaClient = Join-Path $appDir "node_modules\.prisma\client\index.js"
    $apiDir = Join-Path $appDir "apps\api"
    $apiEnv = Join-Path $apiDir ".env"
    $apiDist = Join-Path $apiDir "dist\main.js"
    $webDir = Join-Path $appDir "apps\web"
    $webBuildId = Join-Path $webDir ".next\BUILD_ID"
    $webServerMarker = Join-Path $webDir ".next\.marksman-server-mode"

    if (-not (Test-Path $nodeModulesDir)) {
        Write-Host "  -> Installing npm dependencies for $label... " -NoNewline
        Push-Location $appDir
        & npm.cmd install > (Join-Path $logDir "$($label -replace '\s+','-')-install.log") 2>&1
        $ok = ($LASTEXITCODE -eq 0)
        Pop-Location
        if ($ok) { Write-Host "${cGreen}[OK]${cReset}" } else { Write-Host "${cRed}[FAIL]${cReset}"; return $false }
    }

    if (-not (Test-Path $apiEnv)) {
        Write-Host "  ${cYellow}[WARN] Missing $apiEnv (copy from apps/api/.env.example before public deploy).${cReset}"
    }

    if ($Rebuild -or (-not (Test-Path $sharedDist))) {
        Write-Host "  -> Building shared-types for $label... " -NoNewline
        Push-Location $appDir
        & npm.cmd run build:shared > (Join-Path $logDir "$($label -replace '\s+','-')-shared.log") 2>&1
        $ok = ($LASTEXITCODE -eq 0)
        Pop-Location
        if ($ok) { Write-Host "${cGreen}[OK]${cReset}" } else { Write-Host "${cRed}[FAIL]${cReset}"; return $false }
    }

    if ($Rebuild -or (-not (Test-Path $prismaClient))) {
        if (Test-Path $apiDir) {
            Write-Host "  -> Generating Prisma Client for $label... " -NoNewline
            Push-Location $apiDir
            & npx.cmd prisma generate > (Join-Path $logDir "$($label -replace '\s+','-')-prisma-gen.log") 2>&1
            $ok = ($LASTEXITCODE -eq 0)
            Pop-Location
            if ($ok) { Write-Host "${cGreen}[OK]${cReset}" } else { Write-Host "${cRed}[FAIL]${cReset}"; return $false }
        }
    }

    if ($dbOnline -and (-not $SkipDbPush) -and (Test-Path $apiDir)) {
        Write-Host "  -> Syncing database schema for $label... " -NoNewline
        Push-Location $apiDir
        & npx.cmd prisma db push --skip-generate > (Join-Path $logDir "$($label -replace '\s+','-')-db-push.log") 2>&1
        $ok = ($LASTEXITCODE -eq 0)
        Pop-Location
        if ($ok) { Write-Host "${cGreen}[SYNCED]${cReset}" } else { Write-Host "${cYellow}[WARN - see logs]${cReset}" }
    }

    if ($Mode -eq "Prod") {
        if ($Rebuild -or (-not (Test-Path $apiDist))) {
            Write-Host "  -> Building NestJS API ($label)... " -NoNewline
            Push-Location $apiDir
            & npm.cmd run build > (Join-Path $logDir "$($label -replace '\s+','-')-api-build.log") 2>&1
            $ok = ($LASTEXITCODE -eq 0) -and (Test-Path $apiDist)
            Pop-Location
            if ($ok) { Write-Host "${cGreen}[OK]${cReset}" } else { Write-Host "${cRed}[FAIL - see logs]${cReset}"; return $false }
        }

        $needWebBuild = $Rebuild -or (-not (Test-Path $webBuildId)) -or (-not (Test-Path $webServerMarker))
        if ($needWebBuild -and (Test-Path $webDir)) {
            Write-Host "  -> Building Next.js Web server bundle ($label, NEXT_EXPORT=false)... " -NoNewline
            $prevNextExport = $env:NEXT_EXPORT
            $ok = $false
            Push-Location $webDir
            try {
                $env:NEXT_EXPORT = "false"
                & npm.cmd run build > (Join-Path $logDir "$($label -replace '\s+','-')-web-build.log") 2>&1
                $ok = ($LASTEXITCODE -eq 0) -and (Test-Path $webBuildId)
                if ($ok) {
                    Set-Content -Path $webServerMarker -Value (Get-Date).ToString("o") -Encoding ASCII
                }
            } finally {
                if ($null -eq $prevNextExport) {
                    Remove-Item Env:\NEXT_EXPORT -ErrorAction SilentlyContinue
                } else {
                    $env:NEXT_EXPORT = $prevNextExport
                }
                Pop-Location
            }
            if ($ok) { Write-Host "${cGreen}[OK]${cReset}" } else { Write-Host "${cRed}[FAIL - see logs]${cReset}"; return $false }
        }
    }

    return $true
}

function Ensure-VisionEnv {
    $visionDir = Join-Path $rootDir "Shooter_App\apps\vision"
    $candidates = @(
        (Join-Path $visionDir "venv\Scripts\python.exe"),
        (Join-Path $visionDir ".venv\Scripts\python.exe")
    )
    $pyCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pyCmd) { $candidates += $pyCmd.Source }

    foreach ($cand in $candidates) {
        if ($cand -and (Test-Path $cand)) {
            & $cand -c "import fastapi, uvicorn, cv2" 2>$null
            if ($LASTEXITCODE -eq 0) {
                return $cand
            }
        }
    }

    if ($pyCmd -and (Test-Path (Join-Path $visionDir "requirements.txt"))) {
        $venvDir = Join-Path $visionDir "venv"
        $venvPy = Join-Path $venvDir "Scripts\python.exe"
        Write-Host "  -> Bootstrapping Vision Python venv & dependencies... " -NoNewline
        Push-Location $visionDir
        if (-not (Test-Path $venvPy)) {
            & $pyCmd.Source -m venv $venvDir > (Join-Path $logDir "vision-venv.log") 2>&1
        }
        if (Test-Path $venvPy) {
            & $venvPy -m pip install -r requirements.txt >> (Join-Path $logDir "vision-venv.log") 2>&1
            & $venvPy -c "import fastapi, uvicorn, cv2" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Pop-Location
                Write-Host "${cGreen}[OK]${cReset}"
                return $venvPy
            }
        }
        Pop-Location
        Write-Host "${cRed}[FAIL]${cReset}"
    }

    return $null
}

# ─────────────────────────────────────────────────────────────────────────────
# Service Definitions
# ─────────────────────────────────────────────────────────────────────────────
$visionPy = if ($VerifyOnly) {
    $vp = Join-Path $rootDir "Shooter_App\apps\vision\venv\Scripts\python.exe"
    if (Test-Path $vp) { $vp } else { "python" }
} else {
    Ensure-VisionEnv
}

$shooterApiCmd = if ($Mode -eq "Prod") { "node dist/main" } else { "npm.cmd run start:dev" }
$rangeApiCmd   = if ($Mode -eq "Prod") { "node dist/main" } else { "npm.cmd run start:dev" }
$shooterWebCmd = if ($Mode -eq "Prod") { "set `"NEXT_EXPORT=false`" && npm.cmd run start" } else { "set `"NEXT_EXPORT=false`" && npm.cmd run dev" }
$rangeWebCmd   = if ($Mode -eq "Prod") { "set `"NEXT_EXPORT=false`" && npm.cmd run start" } else { "set `"NEXT_EXPORT=false`" && npm.cmd run dev" }

$services = @(
    @{
        Name          = "Shooter API"
        LogFile       = Join-Path $logDir "shooter-api.log"
        Port          = 3001
        Domain        = "api.marksmanshooter.in"
        PublicUrl     = "https://api.marksmanshooter.in/health"
        Type          = "Node/NestJS"
        WorkDir       = Join-Path $rootDir "Shooter_App\apps\api"
        Command       = "cmd.exe"
        CmdLine       = $shooterApiCmd
        HealthUrl     = "http://127.0.0.1:3001/health"
        HealthStrict  = $true
        Process       = $null
        Owned         = $false
        Status        = "STOPPED"
    },
    @{
        Name          = "Range Ops API"
        LogFile       = Join-Path $logDir "range-api.log"
        Port          = 3003
        Domain        = "range-api.marksmanshooter.in"
        PublicUrl     = "https://range-api.marksmanshooter.in/health"
        Type          = "Node/NestJS"
        WorkDir       = Join-Path $rootDir "Range_Management\apps\api"
        Command       = "cmd.exe"
        CmdLine       = $rangeApiCmd
        HealthUrl     = "http://127.0.0.1:3003/health"
        HealthStrict  = $true
        Process       = $null
        Owned         = $false
        Status        = "STOPPED"
    },
    @{
        Name          = "Target Vision Engine"
        LogFile       = Join-Path $logDir "vision.log"
        Port          = 8000
        Domain        = "vision.marksmanshooter.in"
        PublicUrl     = "https://vision.marksmanshooter.in/health"
        Type          = "Python/FastAPI"
        WorkDir       = Join-Path $rootDir "Shooter_App\apps\vision"
        Command       = "cmd.exe"
        CmdLine       = if ($visionPy) { "`"$visionPy`" -m uvicorn main:app --host 0.0.0.0 --port 8000" } else { "" }
        HealthUrl     = "http://127.0.0.1:8000/health"
        HealthStrict  = $true
        Process       = $null
        Owned         = $false
        Status        = "STOPPED"
    },
    @{
        Name          = "Shooter Web Portal"
        LogFile       = Join-Path $logDir "shooter-web.log"
        Port          = 3000
        Domain        = "marksmanshooter.in"
        PublicUrl     = "https://marksmanshooter.in"
        Type          = "Next.js"
        WorkDir       = Join-Path $rootDir "Shooter_App\apps\web"
        Command       = "cmd.exe"
        CmdLine       = $shooterWebCmd
        HealthUrl     = "http://127.0.0.1:3000"
        HealthStrict  = $false
        Process       = $null
        Owned         = $false
        Status        = "STOPPED"
    },
    @{
        Name          = "Range Management Web"
        LogFile       = Join-Path $logDir "range-web.log"
        Port          = 3002
        Domain        = "range.marksmanshooter.in"
        PublicUrl     = "https://range.marksmanshooter.in"
        Type          = "Next.js"
        WorkDir       = Join-Path $rootDir "Range_Management\apps\web"
        Command       = "cmd.exe"
        CmdLine       = $rangeWebCmd
        HealthUrl     = "http://127.0.0.1:3002"
        HealthStrict  = $false
        Process       = $null
        Owned         = $false
        Status        = "STOPPED"
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
    Name    = "Cloudflare Zero Trust Tunnel"
    LogFile = Join-Path $logDir "cloudflared.log"
    Domain  = "*.marksmanshooter.in"
    Type    = "Cloudflared"
    Command = "cmd.exe"
    CmdLine = if ($cfExe) { "`"$cfExe`" tunnel run --token-file `"$tunnelTokenFile`"" } else { "" }
    Process = $null
    Owned   = $false
    Status  = "STOPPED"
}

function Run-HttpProbe ([bool]$includePublic = $true) {
    Write-Host ""
    Write-Host "${cCyan}--- Local Service Health Check ---${cReset}"
    $allLocalOk = $true
    foreach ($svc in $services) {
        $code = Get-HttpStatusCode $svc.HealthUrl 4
        $ok = if ($svc.HealthStrict) { $code -eq 200 } else { $code -ge 200 -and $code -lt 400 }
        if ($ok) {
            Write-Host "  ${cGreen}[OK $code]${cReset} $($svc.Name) -> $($svc.HealthUrl)"
        } else {
            Write-Host "  ${cRed}[FAIL $code]${cReset} $($svc.Name) -> $($svc.HealthUrl)"
            $allLocalOk = $false
        }
    }

    if ($includePublic -and (-not $NoTunnel)) {
        Write-Host ""
        Write-Host "${cCyan}--- Public HTTPS Edge Check ---${cReset}"
        foreach ($svc in $services) {
            $pubCode = Get-HttpStatusCode $svc.PublicUrl 6
            $pubOk = if ($svc.HealthStrict) { $pubCode -eq 200 } else { $pubCode -ge 200 -and $pubCode -lt 400 }
            if ($pubOk) {
                Write-Host "  ${cGreen}[OK $pubCode]${cReset} $($svc.PublicUrl)"
            } else {
                Write-Host "  ${cYellow}[WARN $pubCode]${cReset} $($svc.PublicUrl) (check DNS CNAME / tunnel)"
            }
        }
    }

    return $allLocalOk
}

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
    if (Test-InteractiveConsole) {
        Write-Host "${cWhite}  Commands: ${cBold}[R]${cReset} Refresh | ${cBold}[H]${cReset} HTTP Health Probe | ${cBold}[O]${cReset} Open Site | ${cBold}[Q]${cReset} Stop Owned & Exit${cReset}"
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Execution
# ─────────────────────────────────────────────────────────────────────────────
Print-Banner

if ($VerifyOnly) {
    Render-StatusDashboard
    $okLocal = Run-HttpProbe (-not $NoTunnel)
    if ($okLocal) { exit 0 } else { exit 1 }
}

if ($BuildOnly) {
    Write-Host "${cWhite}[*] BuildOnly mode: verifying monorepo builds [$Mode] and Vision Python env...${cReset}"
    $shooterReady = Ensure-MonorepoArtifacts (Join-Path $rootDir "Shooter_App") "Shooter App" $false
    $rangeReady   = Ensure-MonorepoArtifacts (Join-Path $rootDir "Range_Management") "Range Ops" $false
    $visionReady  = (-not [string]::IsNullOrWhiteSpace($visionPy))
    Write-Host ""
    Write-Host "  Shooter App build: $(if ($shooterReady) { "${cGreen}[OK]${cReset}" } else { "${cRed}[FAIL]${cReset}" })"
    Write-Host "  Range Ops build:   $(if ($rangeReady)   { "${cGreen}[OK]${cReset}" } else { "${cRed}[FAIL]${cReset}" })"
    Write-Host "  Vision Python env: $(if ($visionReady)  { "${cGreen}[OK: $visionPy]${cReset}" } else { "${cRed}[FAIL]${cReset}" })"
    if ($shooterReady -and $rangeReady -and $visionReady) { exit 0 } else { exit 1 }
}

# Step 1: PostgreSQL Check
$pgReady = Ensure-Postgres
if (-not $pgReady) {
    Write-Host "${cRed}[!] Critical: PostgreSQL could not be started on port 5433.${cReset}"
    if (Test-InteractiveConsole) {
        Write-Host "${cYellow}Press any key to proceed anyway, or Ctrl+C to abort...${cReset}"
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } else {
        exit 1
    }
}

# Step 2: Shared-Types, Prisma & Production Builds
Write-Host ""
Write-Host "${cWhite}[*] Verifying Monorepo Artifacts & Builds [$Mode]...${cReset}"
$shooterReady = Ensure-MonorepoArtifacts (Join-Path $rootDir "Shooter_App") "Shooter App" $pgReady
$rangeReady   = Ensure-MonorepoArtifacts (Join-Path $rootDir "Range_Management") "Range Ops" $pgReady
if ((-not $shooterReady) -or (-not $rangeReady)) {
    Write-Host "${cRed}[!] Critical: Monorepo build/setup failed. See logs in $logDir.${cReset}"
    if (-not (Test-InteractiveConsole)) { exit 1 }
}

# Step 3: Tunnel Check
Write-Host ""
if ($NoTunnel) {
    Write-Host "${cYellow}[*] Cloudflare Tunnel skipped (-NoTunnel).${cReset}"
} else {
    Write-Host "${cWhite}[*] Checking Cloudflare Tunnel...${cReset}" -NoNewline
    if ($cfExe -and (Test-Path $tunnelTokenFile)) {
        Write-Host " ${cGreen}[READY: $cfExe]${cReset}"
    } elseif (-not $cfExe) {
        Write-Host " ${cYellow}[MISSING BINARY: cloudflared.exe not found]${cReset}"
    } else {
        Write-Host " ${cRed}[MISSING TOKEN: $tunnelTokenFile]${cReset}"
    }
}

Write-Host ""
Write-Host "${cBold}${cWhite}--- Launching Services & Verifying HTTP Health (logs: .\logs\*.log) ---${cReset}"

function Start-ManagedProcess ($svc) {
    if ($svc.Port -and (Test-PortListening $svc.Port)) {
        if (Test-HttpHealth $svc.HealthUrl 3 $svc.HealthStrict) {
            $svc.Status = "RUNNING (Attached)"
            $svc.Owned = $false
            Write-Host "  -> $($svc.Name) on port $($svc.Port): ${cGreen}[ALREADY HEALTHY]${cReset}"
            return
        }
    }

    if (-not (Test-Path $svc.WorkDir)) {
        $svc.Status = "MISSING DIR"
        Write-Host "  -> $($svc.Name): ${cRed}[ERROR: Directory missing ($($svc.WorkDir))]${cReset}"
        return
    }
    if ([string]::IsNullOrWhiteSpace($svc.CmdLine)) {
        $svc.Status = "MISSING RUNTIME"
        Write-Host "  -> $($svc.Name): ${cRed}[ERROR: Missing command/runtime]${cReset}"
        return
    }

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $svc.Command
    $psi.Arguments = "/s /c `"$($svc.CmdLine) > `"$($svc.LogFile)`" 2>&1`""
    $psi.WorkingDirectory = $svc.WorkDir
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    try {
        $proc = [System.Diagnostics.Process]::Start($psi)
        $svc.Process = $proc
        $svc.Owned = $true
        $svc.Status = "STARTING"
        Write-Host "  -> Launching $($svc.Name) (:$( $svc.Port ))... " -NoNewline

        $online = $false
        for ($s = 0; $s -lt 90; $s++) {
            Start-Sleep -Milliseconds 500
            if ($proc.HasExited) { break }
            if ($svc.Port -and (Test-PortListening $svc.Port)) {
                if (Test-HttpHealth $svc.HealthUrl 2 $svc.HealthStrict) {
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
            Write-Host "${cGreen}[HEALTHY on :$($svc.Port)]${cReset}"
        } else {
            $svc.Status = "TIMEOUT"
            Write-Host "${cYellow}[TIMEOUT waiting for HTTP health (PID: $($proc.Id)) | see $($svc.LogFile)]${cReset}"
        }
    } catch {
        $svc.Status = "ERROR: $($_.Exception.Message)"
        Write-Host "${cRed}[ERROR: $($_.Exception.Message)]${cReset}"
    }
}

foreach ($svc in $services) {
    Start-ManagedProcess $svc
}

if ((-not $NoTunnel) -and $cfExe -and (Test-Path $tunnelTokenFile)) {
    Write-Host "  -> Launching $($tunnelService.Name)... " -NoNewline
    $existingCf = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
    if ($existingCf) {
        $tunnelService.Status = "RUNNING (Attached)"
        $tunnelService.Owned = $false
        Write-Host "${cGreen}[ALREADY RUNNING (PID: $($existingCf[0].Id))]${cReset}"
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

            $registered = $false
            for ($t = 0; $t -lt 40; $t++) {
                Start-Sleep -Milliseconds 500
                if ($tProc.HasExited) { break }
                if (Test-Path $tunnelService.LogFile) {
                    $cfLog = Get-Content $tunnelService.LogFile -Raw -ErrorAction SilentlyContinue
                    if ($cfLog -match "Registered tunnel connection") {
                        $registered = $true
                        break
                    }
                }
            }

            if ($tProc.HasExited) {
                $tunnelService.Status = "CRASHED"
                Write-Host "${cRed}[TUNNEL EXITED $($tProc.ExitCode) | see $($tunnelService.LogFile)]${cReset}"
            } elseif ($registered) {
                $tunnelService.Status = "CONNECTED (Registered)"
                Write-Host "${cGreen}[REGISTERED WITH CLOUDFLARE EDGE]${cReset}"
            } else {
                $tunnelService.Status = "RUNNING (Connecting)"
                Write-Host "${cYellow}[RUNNING - awaiting edge registration | see $($tunnelService.LogFile)]${cReset}"
            }
        } catch {
            $tunnelService.Status = "ERROR"
            Write-Host "${cRed}[TUNNEL ERROR: $($_.Exception.Message)]${cReset}"
        }
    }
}

# Persist PID tracking for clean -Stop across sessions
$trackedPids = @()
foreach ($svc in $services) {
    if ($svc.Owned -and $svc.Process -and (-not $svc.Process.HasExited)) {
        $trackedPids += @{ name = $svc.Name; port = $svc.Port; pid = $svc.Process.Id }
    }
}
if ($tunnelService.Owned -and $tunnelService.Process -and (-not $tunnelService.Process.HasExited)) {
    $trackedPids += @{ name = $tunnelService.Name; port = 0; pid = $tunnelService.Process.Id }
}
@{
    startedAt = (Get-Date).ToString("o")
    mode = $Mode
    pids = $trackedPids
} | ConvertTo-Json -Depth 4 | Set-Content -Path $pidFile -Encoding UTF8

if ($Detach) {
    Render-StatusDashboard
    $allOk = Run-HttpProbe (-not $NoTunnel)
    Write-Host ""
    Write-Host "${cCyan}[*] Detached deployment active. PIDs saved to $pidFile.${cReset}"
    Write-Host "${cCyan}[*] Verify anytime: .\run_orchestrator.ps1 -VerifyOnly | Stop anytime: .\run_orchestrator.ps1 -Stop${cReset}"
    if ($allOk) { exit 0 } else { exit 1 }
}

if (-not (Test-InteractiveConsole)) {
    Render-StatusDashboard
    $allOk = Run-HttpProbe (-not $NoTunnel)
    Write-Host "${cYellow}[!] Non-interactive console detected; leaving services running in detached mode. Run '.\run_orchestrator.ps1 -Stop' to stop.${cReset}"
    if ($allOk) { exit 0 } else { exit 1 }
}

# ─────────────────────────────────────────────────────────────────────────────
# Interactive Live Monitoring Loop (with guaranteed cleanup in finally)
# ─────────────────────────────────────────────────────────────────────────────
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
                    $null = Run-HttpProbe (-not $NoTunnel)
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
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    Write-Host "${cGreen}[OK] All launched service trees cleanly stopped.${cReset}"
}
