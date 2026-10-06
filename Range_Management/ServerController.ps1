Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$projectDir = "C:\Users\sriesh\Desktop\Marksman\Version_2_Range_Ops"

# Create the form
$form = New-Object System.Windows.Forms.Form
$form.Text = "Marksman Server Controller"
$form.Size = New-Object System.Drawing.Size(400,350)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(24, 24, 27) # Dark theme
$form.ForeColor = [System.Drawing.Color]::White

# Title Label
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "Marksman Server Control"
$titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
$titleLabel.Location = New-Object System.Drawing.Point(20, 20)
$titleLabel.Size = New-Object System.Drawing.Size(350, 40)
$titleLabel.ForeColor = [System.Drawing.Color]::FromArgb(245, 166, 35) # Amber
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
$startButton.Text = "▶ START SERVER & TUNNEL"
$startButton.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$startButton.Location = New-Object System.Drawing.Point(20, 120)
$startButton.Size = New-Object System.Drawing.Size(340, 40)
$startButton.BackColor = [System.Drawing.Color]::FromArgb(0, 229, 160) # Green
$startButton.ForeColor = [System.Drawing.Color]::Black
$startButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($startButton)

# Stop Button
$stopButton = New-Object System.Windows.Forms.Button
$stopButton.Text = "⏹ STOP EVERYTHING"
$stopButton.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$stopButton.Location = New-Object System.Drawing.Point(20, 180)
$stopButton.Size = New-Object System.Drawing.Size(340, 40)
$stopButton.BackColor = [System.Drawing.Color]::FromArgb(255, 77, 109) # Red
$stopButton.ForeColor = [System.Drawing.Color]::White
$stopButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($stopButton)

# Log Output
$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Location = New-Object System.Drawing.Point(20, 240)
$logBox.Size = New-Object System.Drawing.Size(340, 50)
$logBox.Multiline = $true
$logBox.ReadOnly = $true
$logBox.BackColor = [System.Drawing.Color]::FromArgb(10, 10, 12)
$logBox.ForeColor = [System.Drawing.Color]::LightGray
$logBox.Text = "Ready."
$form.Controls.Add($logBox)

# Functions
$startButton.Add_Click({
    $statusLabel.Text = "Status: STARTING..."
    $statusLabel.ForeColor = [System.Drawing.Color]::Yellow
    $logBox.Text = "Starting Backend, Frontend, and Cloudflare..."
    
    # Start API
    Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c cd `"$projectDir\apps\api`" && npm run start:prod"
    # Start Web
    Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c cd `"$projectDir\apps\web`" && npm run dev"
    # Start Cloudflared loop (Auto-reconnects on internet drop)
    $tunnelScript = @"
    :loop
    cloudflared.exe tunnel --config `"$projectDir\config.yml`" run
    echo Internet dropped or tunnel crashed. Restarting in 5 seconds...
    timeout /t 5
    goto loop
"@
    Set-Content -Path "$projectDir\tunnel-loop.bat" -Value $tunnelScript
    Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c `"$projectDir\tunnel-loop.bat`""
    
    $statusLabel.Text = "Status: RUNNING"
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(0, 229, 160)
    $logBox.Text = "All services are running! Cloudflare tunnel will auto-restart if internet drops."
})

$stopButton.Add_Click({
    $statusLabel.Text = "Status: STOPPING..."
    $logBox.Text = "Killing Node.js and Cloudflared..."
    
    # Kill all node and cloudflared processes
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Stop-Process -Name "cloudflared" -Force -ErrorAction SilentlyContinue
    Stop-Process -Name "cmd" -Force -ErrorAction SilentlyContinue
    
    $statusLabel.Text = "Status: STOPPED"
    $statusLabel.ForeColor = [System.Drawing.Color]::Red
    $logBox.Text = "All services stopped."
})

$form.ShowDialog()
