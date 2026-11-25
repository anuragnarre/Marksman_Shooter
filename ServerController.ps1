Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$projectDir = $PSScriptRoot
$script:ManagedProcesses = New-Object System.Collections.ArrayList

function Stop-ProcessTree([int]$PidToKill) {
    if ($PidToKill -gt 0) {
        & taskkill.exe /F /T /PID $PidToKill 2>$null | Out-Null
    }
}

function Start-ServiceWindow([string]$WorkingDir, [string]$CmdLine) {
    if (-not (Test-Path $WorkingDir)) {
        return $null
    }
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "cmd.exe"
    $psi.Arguments = "/s /k `"cd /d `"$WorkingDir`" && $CmdLine`""
    $psi.WorkingDirectory = $WorkingDir
    $psi.UseShellExecute = $true
    $p = [System.Diagnostics.Process]::Start($psi)
    if ($p) { [void]$script:ManagedProcesses.Add($p) }
    return $p
}

# Create the form
$form = New-Object System.Windows.Forms.Form
$form.Text = "Marksman Ecosystem Controller"
$form.Size = New-Object System.Drawing.Size(460, 520)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(15, 23, 42)
$form.ForeColor = [System.Drawing.Color]::White

# Title Label
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "Marksman Tactical Ecosystem"
$titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
$titleLabel.Location = New-Object System.Drawing.Point(20, 20)
$titleLabel.Size = New-Object System.Drawing.Size(400, 36)
$titleLabel.ForeColor = [System.Drawing.Color]::FromArgb(0, 229, 160)
$form.Controls.Add($titleLabel)

# Subtitle
$subLabel = New-Object System.Windows.Forms.Label
$subLabel.Text = "Shooter (:3000/:3001) | Range (:3002/:3003) | Vision (:8000) | Cam (:8081)"
$subLabel.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Regular)
$subLabel.Location = New-Object System.Drawing.Point(20, 56)
$subLabel.Size = New-Object System.Drawing.Size(410, 24)
$subLabel.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
$form.Controls.Add($subLabel)

# Status Label
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "SYSTEM STATUS: STANDBY"
$statusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$statusLabel.Location = New-Object System.Drawing.Point(20, 90)
$statusLabel.Size = New-Object System.Drawing.Size(400, 26)
$statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(239, 68, 68)
$form.Controls.Add($statusLabel)

# Start Full Orchestrator Button
$orchBtn = New-Object System.Windows.Forms.Button
$orchBtn.Text = "[ORCHESTRATOR] LAUNCH FULL STACK + CLOUDFLARE"
$orchBtn.Font = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
$orchBtn.Location = New-Object System.Drawing.Point(20, 128)
$orchBtn.Size = New-Object System.Drawing.Size(400, 40)
$orchBtn.BackColor = [System.Drawing.Color]::FromArgb(0, 229, 160)
$orchBtn.ForeColor = [System.Drawing.Color]::Black
$orchBtn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($orchBtn)

# Start All Dev Windows Button
$startAllBtn = New-Object System.Windows.Forms.Button
$startAllBtn.Text = "[DEV WINDOWS] START ALL SERVICES"
$startAllBtn.Font = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
$startAllBtn.Location = New-Object System.Drawing.Point(20, 176)
$startAllBtn.Size = New-Object System.Drawing.Size(400, 36)
$startAllBtn.BackColor = [System.Drawing.Color]::FromArgb(30, 41, 59)
$startAllBtn.ForeColor = [System.Drawing.Color]::White
$startAllBtn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($startAllBtn)

# Start Range Management Only Button
$startRangeBtn = New-Object System.Windows.Forms.Button
$startRangeBtn.Text = "START RANGE MANAGEMENT (:3002 / :3003)"
$startRangeBtn.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$startRangeBtn.Location = New-Object System.Drawing.Point(20, 220)
$startRangeBtn.Size = New-Object System.Drawing.Size(400, 34)
$startRangeBtn.BackColor = [System.Drawing.Color]::FromArgb(30, 41, 59)
$startRangeBtn.ForeColor = [System.Drawing.Color]::White
$startRangeBtn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($startRangeBtn)

# Start Shooter App Only Button
$startShooterBtn = New-Object System.Windows.Forms.Button
$startShooterBtn.Text = "START SHOOTER APP (:3000 / :3001)"
$startShooterBtn.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$startShooterBtn.Location = New-Object System.Drawing.Point(20, 262)
$startShooterBtn.Size = New-Object System.Drawing.Size(400, 34)
$startShooterBtn.BackColor = [System.Drawing.Color]::FromArgb(30, 41, 59)
$startShooterBtn.ForeColor = [System.Drawing.Color]::White
$startShooterBtn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($startShooterBtn)

# Stop All Button
$stopButton = New-Object System.Windows.Forms.Button
$stopButton.Text = "[STOP] EMERGENCY CEASE FIRE / STOP LAUNCHED"
$stopButton.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$stopButton.Location = New-Object System.Drawing.Point(20, 308)
$stopButton.Size = New-Object System.Drawing.Size(400, 40)
$stopButton.BackColor = [System.Drawing.Color]::FromArgb(239, 68, 68)
$stopButton.ForeColor = [System.Drawing.Color]::White
$stopButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($stopButton)

# Log Output
$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Location = New-Object System.Drawing.Point(20, 362)
$logBox.Size = New-Object System.Drawing.Size(400, 100)
$logBox.Multiline = $true
$logBox.ReadOnly = $true
$logBox.BackColor = [System.Drawing.Color]::FromArgb(2, 6, 23)
$logBox.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
$logBox.Text = "Ready. Use ORCHESTRATOR for full pre-flight checks + Cloudflare Tunnel, or launch dev windows."
$form.Controls.Add($logBox)

# Handlers
$orchBtn.Add_Click({
    $orchPath = Join-Path $projectDir "run_orchestrator.ps1"
    $p = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$orchPath`" -Mode Prod" -PassThru
    if ($p) { [void]$script:ManagedProcesses.Add($p) }
    $statusLabel.Text = "SYSTEM STATUS: ORCHESTRATOR ACTIVE"
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(0, 229, 160)
    $logBox.Text = "Master Orchestrator (-Mode Prod) launched in terminal window."
})

$startAllBtn.Add_Click({
    $statusLabel.Text = "SYSTEM STATUS: LAUNCHING..."
    $statusLabel.ForeColor = [System.Drawing.Color]::Yellow
    $logBox.Text = "Launching Shooter (:3000/:3001), Range (:3002/:3003), Vision (:8000), and Target Camera (:8081)..."

    $null = Start-ServiceWindow "$projectDir\Shooter_App\apps\api" "npm.cmd run start:dev"
    $null = Start-ServiceWindow "$projectDir\Shooter_App\apps\web" "npm.cmd run dev"
    $null = Start-ServiceWindow "$projectDir\Range_Management\apps\api" "npm.cmd run start:dev"
    $null = Start-ServiceWindow "$projectDir\Range_Management\apps\web" "npm.cmd run dev"
    $visionPy = "$projectDir\Shooter_App\apps\vision\venv\Scripts\python.exe"
    if (Test-Path $visionPy) {
        $null = Start-ServiceWindow "$projectDir\Shooter_App\apps\vision" "`"$visionPy`" -m uvicorn main:app --host 0.0.0.0 --port 8000"
    }
    $null = Start-ServiceWindow "$projectDir\Target_Camera_App" "npx.cmd expo start"

    $statusLabel.Text = "SYSTEM STATUS: RUNNING [HOT]"
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(0, 229, 160)
    $logBox.Text = "All ecosystem service windows launched. Ensure Docker/PostgreSQL is running on port 5433."
})

$startRangeBtn.Add_Click({
    $statusLabel.Text = "SYSTEM STATUS: LAUNCHING RANGE OPS..."
    $statusLabel.ForeColor = [System.Drawing.Color]::Yellow
    $null = Start-ServiceWindow "$projectDir\Range_Management\apps\api" "npm.cmd run start:dev"
    $null = Start-ServiceWindow "$projectDir\Range_Management\apps\web" "npm.cmd run dev"
    $statusLabel.Text = "SYSTEM STATUS: RANGE OPS RUNNING"
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(0, 229, 160)
    $logBox.Text = "Range Management started on http://localhost:3002 (API :3003)"
})

$startShooterBtn.Add_Click({
    $statusLabel.Text = "SYSTEM STATUS: LAUNCHING SHOOTER APP..."
    $statusLabel.ForeColor = [System.Drawing.Color]::Yellow
    $null = Start-ServiceWindow "$projectDir\Shooter_App\apps\api" "npm.cmd run start:dev"
    $null = Start-ServiceWindow "$projectDir\Shooter_App\apps\web" "npm.cmd run dev"
    $statusLabel.Text = "SYSTEM STATUS: SHOOTER APP RUNNING"
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(0, 229, 160)
    $logBox.Text = "Shooter App started on http://localhost:3000 (API :3001)"
})

$stopButton.Add_Click({
    $statusLabel.Text = "SYSTEM STATUS: TERMINATING..."
    $logBox.Text = "Stopping launched Marksman process trees and ports..."

    foreach ($p in $script:ManagedProcesses) {
        try {
            if ($p -and -not $p.HasExited) {
                Stop-ProcessTree $p.Id
            }
        } catch {}
    }
    $script:ManagedProcesses.Clear()

    foreach ($port in @(3000, 3001, 3002, 3003, 8000, 8081)) {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            if ($c.OwningProcess -gt 0 -and $c.OwningProcess -ne $PID) {
                Stop-ProcessTree $c.OwningProcess
            }
        }
    }

    $orchPath = Join-Path $projectDir "run_orchestrator.ps1"
    if (Test-Path $orchPath) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $orchPath -Stop 2>$null | Out-Null
    }

    $statusLabel.Text = "SYSTEM STATUS: ALL STOPPED [COLD]"
    $statusLabel.ForeColor = [System.Drawing.Color]::Red
    $logBox.Text = "All Marksman servers terminated safely without killing unrelated terminal sessions."
})

[void]$form.ShowDialog()
