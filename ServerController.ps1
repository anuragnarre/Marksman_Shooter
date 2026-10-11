Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$projectDir = $PSScriptRoot

# Create the form
$form = New-Object System.Windows.Forms.Form
$form.Text = "Marksman Ecosystem Controller"
$form.Size = New-Object System.Drawing.Size(460, 480)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(15, 23, 42) # Stitch Dark Slate
$form.ForeColor = [System.Drawing.Color]::White

# Title Label
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "Marksman Tactical Ecosystem"
$titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
$titleLabel.Location = New-Object System.Drawing.Point(20, 20)
$titleLabel.Size = New-Object System.Drawing.Size(400, 36)
$titleLabel.ForeColor = [System.Drawing.Color]::FromArgb(0, 229, 160) # Neon Teal
$form.Controls.Add($titleLabel)

# Subtitle
$subLabel = New-Object System.Windows.Forms.Label
$subLabel.Text = "Shooter App (:3000) • Range Ops (:3002) • Target Cam (:8081)"
$subLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)
$subLabel.Location = New-Object System.Drawing.Point(20, 56)
$subLabel.Size = New-Object System.Drawing.Size(400, 24)
$subLabel.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
$form.Controls.Add($subLabel)

# Status Label
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "SYSTEM STATUS: STANDBY"
$statusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$statusLabel.Location = New-Object System.Drawing.Point(20, 90)
$statusLabel.Size = New-Object System.Drawing.Size(400, 26)
$statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(239, 68, 68) # Red
$form.Controls.Add($statusLabel)

# Start All Button
$startAllBtn = New-Object System.Windows.Forms.Button
$startAllBtn.Text = "▶ START ALL APPLICATIONS"
$startAllBtn.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$startAllBtn.Location = New-Object System.Drawing.Point(20, 130)
$startAllBtn.Size = New-Object System.Drawing.Size(400, 42)
$startAllBtn.BackColor = [System.Drawing.Color]::FromArgb(0, 229, 160)
$startAllBtn.ForeColor = [System.Drawing.Color]::Black
$startAllBtn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($startAllBtn)

# Start Range Management Only Button
$startRangeBtn = New-Object System.Windows.Forms.Button
$startRangeBtn.Text = "🏢 START RANGE MANAGEMENT (:3002 / :3003)"
$startRangeBtn.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$startRangeBtn.Location = New-Object System.Drawing.Point(20, 182)
$startRangeBtn.Size = New-Object System.Drawing.Size(400, 36)
$startRangeBtn.BackColor = [System.Drawing.Color]::FromArgb(30, 41, 59)
$startRangeBtn.ForeColor = [System.Drawing.Color]::White
$startRangeBtn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($startRangeBtn)

# Start Shooter App Only Button
$startShooterBtn = New-Object System.Windows.Forms.Button
$startShooterBtn.Text = "🎯 START SHOOTER APP (:3000 / :3001)"
$startShooterBtn.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$startShooterBtn.Location = New-Object System.Drawing.Point(20, 226)
$startShooterBtn.Size = New-Object System.Drawing.Size(400, 36)
$startShooterBtn.BackColor = [System.Drawing.Color]::FromArgb(30, 41, 59)
$startShooterBtn.ForeColor = [System.Drawing.Color]::White
$startShooterBtn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($startShooterBtn)

# Stop All Button
$stopButton = New-Object System.Windows.Forms.Button
$stopButton.Text = "⏹ EMERGENCY CEASE FIRE / STOP ALL"
$stopButton.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$stopButton.Location = New-Object System.Drawing.Point(20, 274)
$stopButton.Size = New-Object System.Drawing.Size(400, 42)
$stopButton.BackColor = [System.Drawing.Color]::FromArgb(239, 68, 68)
$stopButton.ForeColor = [System.Drawing.Color]::White
$stopButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($stopButton)

# Log Output
$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Location = New-Object System.Drawing.Point(20, 330)
$logBox.Size = New-Object System.Drawing.Size(400, 90)
$logBox.Multiline = $true
$logBox.ReadOnly = $true
$logBox.BackColor = [System.Drawing.Color]::FromArgb(2, 6, 23)
$logBox.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
$logBox.Text = "Ready. Click 'START ALL APPLICATIONS' or select individual apps."
$form.Controls.Add($logBox)

# Handlers
$startAllBtn.Add_Click({
    $statusLabel.Text = "SYSTEM STATUS: LAUNCHING..."
    $statusLabel.ForeColor = [System.Drawing.Color]::Yellow
    $logBox.Text = "Launching Shooter App (:3000), Range Management (:3002), and Target Camera (:8081)..."

    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$projectDir\Shooter_App\apps\api`" && npm run start:dev"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$projectDir\Shooter_App\apps\web`" && npm run dev"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$projectDir\Range_Management\apps\api`" && npm run start:dev"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$projectDir\Range_Management\apps\web`" && npm run dev"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$projectDir\Target_Camera_App`" && npx expo start"

    $statusLabel.Text = "SYSTEM STATUS: RUNNING [HOT]"
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(0, 229, 160)
    $logBox.Text = "All ecosystem services active! Ports: 3000 (Shooter), 3002 (Range), 8081 (Target Camera)."
})

$startRangeBtn.Add_Click({
    $statusLabel.Text = "SYSTEM STATUS: LAUNCHING RANGE OPS..."
    $statusLabel.ForeColor = [System.Drawing.Color]::Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$projectDir\Range_Management\apps\api`" && npm run start:dev"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$projectDir\Range_Management\apps\web`" && npm run dev"
    $logBox.Text = "Range Management started on http://localhost:3002 (API :3003)"
})

$startShooterBtn.Add_Click({
    $statusLabel.Text = "SYSTEM STATUS: LAUNCHING SHOOTER APP..."
    $statusLabel.ForeColor = [System.Drawing.Color]::Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$projectDir\Shooter_App\apps\api`" && npm run start:dev"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$projectDir\Shooter_App\apps\web`" && npm run dev"
    $logBox.Text = "Shooter App started on http://localhost:3000 (API :3001)"
})

$stopButton.Add_Click({
    $statusLabel.Text = "SYSTEM STATUS: TERMINATING..."
    $logBox.Text = "Stopping all node processes..."
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    $statusLabel.Text = "SYSTEM STATUS: ALL STOPPED [COLD]"
    $statusLabel.ForeColor = [System.Drawing.Color]::Red
    $logBox.Text = "All servers and dev tasks terminated."
})

$form.ShowDialog()
