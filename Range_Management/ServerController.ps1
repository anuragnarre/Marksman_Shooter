Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$projectDir = $PSScriptRoot
$script:ManagedProcesses = New-Object System.Collections.ArrayList

function Stop-ProcessTree([int]$PidToKill) {
    if ($PidToKill -gt 0) {
        & taskkill.exe /F /T /PID $PidToKill 2>$null | Out-Null
    }
}

# Create the form
$form = New-Object System.Windows.Forms.Form
$form.Text = "Marksman Range Server Controller"
$form.Size = New-Object System.Drawing.Size(400, 350)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(24, 24, 27)
$form.ForeColor = [System.Drawing.Color]::White

# Title Label
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "Marksman Range Control"
$titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
$titleLabel.Location = New-Object System.Drawing.Point(20, 20)
$titleLabel.Size = New-Object System.Drawing.Size(350, 40)
$titleLabel.ForeColor = [System.Drawing.Color]::FromArgb(245, 166, 35)
$form.Controls.Add($titleLabel)

# Status Label
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "Status: STOPPED"
$statusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Regular)
$statusLabel.Location = New-Object System.Drawing.Point(20, 70)
$statusLabel.Size = New-Object System.Drawing.Size(350, 30)
$statusLabel.ForeColor = [System.Drawing.Color]::Red
$form.Controls.Add($statusLabel)

# Start Button
$startButton = New-Object System.Windows.Forms.Button
$startButton.Text = "[START] RANGE SERVER & TUNNEL"
$startButton.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$startButton.Location = New-Object System.Drawing.Point(20, 120)
$startButton.Size = New-Object System.Drawing.Size(340, 40)
$startButton.BackColor = [System.Drawing.Color]::FromArgb(0, 229, 160)
$startButton.ForeColor = [System.Drawing.Color]::Black
$startButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($startButton)

# Stop Button
$stopButton = New-Object System.Windows.Forms.Button
$stopButton.Text = "[STOP] RANGE SERVICES"
$stopButton.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$stopButton.Location = New-Object System.Drawing.Point(20, 180)
$stopButton.Size = New-Object System.Drawing.Size(340, 40)
$stopButton.BackColor = [System.Drawing.Color]::FromArgb(255, 77, 109)
$stopButton.ForeColor = [System.Drawing.Color]::White
$stopButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($stopButton)

# Log Output
$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Location = New-Object System.Drawing.Point(20, 240)
$logBox.Size = New-Object System.Drawing.Size(340, 60)
$logBox.Multiline = $true
$logBox.ReadOnly = $true
$logBox.BackColor = [System.Drawing.Color]::FromArgb(10, 10, 12)
$logBox.ForeColor = [System.Drawing.Color]::LightGray
$logBox.Text = "Ready. Working directory: $projectDir"
$form.Controls.Add($logBox)

# Handlers
$startButton.Add_Click({
    $statusLabel.Text = "Status: STARTING..."
    $statusLabel.ForeColor = [System.Drawing.Color]::Yellow
    $logBox.Text = "Starting Range Backend (:3003), Frontend (:3002), and Cloudflare Tunnel..."

    $pApi = Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$projectDir\apps\api`" && npm.cmd run start:dev" -PassThru
    $pWeb = Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$projectDir\apps\web`" && npm.cmd run dev" -PassThru
    if ($pApi) { [void]$script:ManagedProcesses.Add($pApi) }
    if ($pWeb) { [void]$script:ManagedProcesses.Add($pWeb) }

    $tokenFile = "$env:USERPROFILE\.cloudflared\marksman_tunnel_token.txt"
    $cfCmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if (-not $cfCmd -and (Test-Path "C:\Program Files (x86)\cloudflared\cloudflared.exe")) {
        $cfExe = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
    } elseif ($cfCmd) {
        $cfExe = $cfCmd.Source
    } else {
        $cfExe = $null
    }

    if ($cfExe -and (Test-Path $tokenFile)) {
        $pCf = Start-Process -WindowStyle Hidden -FilePath $cfExe -ArgumentList "tunnel", "run", "--token-file", "`"$tokenFile`"" -PassThru
        if ($pCf) { [void]$script:ManagedProcesses.Add($pCf) }
        $logBox.Text = "Range API (:3003), Range Web (:3002), and Cloudflare Tunnel started."
    } else {
        $logBox.Text = "Range API (:3003) and Range Web (:3002) started. Tunnel skipped (missing cloudflared or token file)."
    }

    $statusLabel.Text = "Status: RUNNING"
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(0, 229, 160)
})

$stopButton.Add_Click({
    $statusLabel.Text = "Status: STOPPING..."
    $logBox.Text = "Stopping Range Management process trees..."

    foreach ($p in $script:ManagedProcesses) {
        try {
            if ($p -and -not $p.HasExited) {
                Stop-ProcessTree $p.Id
            }
        } catch {}
    }
    $script:ManagedProcesses.Clear()

    foreach ($port in @(3002, 3003)) {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            if ($c.OwningProcess -gt 0 -and $c.OwningProcess -ne $PID) {
                Stop-ProcessTree $c.OwningProcess
            }
        }
    }

    $statusLabel.Text = "Status: STOPPED"
    $statusLabel.ForeColor = [System.Drawing.Color]::Red
    $logBox.Text = "Range Management services stopped cleanly."
})

[void]$form.ShowDialog()
