# install_all_apks.ps1 - Automated Marksman APK Installer & Environment Configurator
param(
    [string]$Target = "release",
    [string]$DeviceId = ""
)

$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) {
    Write-Error "ADB not found at $adb. Ensure Android SDK platform-tools is installed."
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Marksman Android Deployment & Reverse Bridge Setup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Detect connected devices
$rawDevices = & $adb devices
$deviceList = @()
foreach ($line in ($rawDevices -split "`r?`n")) {
    if ($line -match '^([a-zA-Z0-9_\-:]+)\s+device$') {
        $deviceList += $matches[1]
    }
}

if ($DeviceId -ne "") {
    $deviceList = @($DeviceId)
}

if ($deviceList.Count -eq 0) {
    Write-Error "No connected Android devices or emulators found."
    exit 1
}

Write-Host "Detected active devices: $($deviceList -join ', ')" -ForegroundColor Green

# 2. Determine APK paths
if ($Target -eq "release") {
    $shooterApk = "release_apks\Marksman_ShooterApp_v1.0_release.apk"
    $rangeApk   = "release_apks\Marksman_RangeManagement_v1.0_release.apk"
    $cameraApk  = "release_apks\Marksman_TargetCamera_v1.0_release.apk"
} else {
    $shooterApk = "release_apks\Marksman_ShooterApp_v1.0_debug.apk"
    $rangeApk   = "release_apks\Marksman_RangeManagement_v1.0_debug.apk"
    $cameraApk  = "release_apks\Marksman_TargetCamera_v1.0_debug.apk"
}

foreach ($dev in $deviceList) {
    $avdName = & $adb -s $dev emu avd name 2>$null
    Write-Host "`n----------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host "Configuring Device [$dev] ($avdName)..." -ForegroundColor Cyan
    Write-Host "----------------------------------------------------------" -ForegroundColor DarkCyan

    # Setup ADB reverse port forwardings
    Write-Host "[1/4] Setting up ADB reverse port forwarding to host services..." -ForegroundColor Yellow
    & $adb -s $dev reverse tcp:3001 tcp:3001
    & $adb -s $dev reverse tcp:3002 tcp:3002
    & $adb -s $dev reverse tcp:3003 tcp:3003
    & $adb -s $dev reverse tcp:8081 tcp:8081
    Write-Host "  -> Ports 3001, 3002, 3003, 8081 forwarded to Windows host!" -ForegroundColor Green

    # Install APKs
    Write-Host "`n[2/4] Installing Marksman Shooter App ($shooterApk)..." -ForegroundColor Yellow
    & $adb -s $dev install -r $shooterApk

    Write-Host "`n[3/4] Installing Marksman Range Management ($rangeApk)..." -ForegroundColor Yellow
    & $adb -s $dev install -r $rangeApk

    Write-Host "`n[4/4] Installing Marksman Target Camera ($cameraApk)..." -ForegroundColor Yellow
    & $adb -s $dev install -r $cameraApk

    Write-Host "`n[OK] All Marksman APKs installed successfully on $dev!" -ForegroundColor Green
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  Launch Commands" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Shooter App:       adb -s <device> shell monkey -p com.marksman.shooting -c android.intent.category.LAUNCHER 1"
Write-Host "  Range Management:  adb -s <device> shell monkey -p com.marksman.rangeapp -c android.intent.category.LAUNCHER 1"
Write-Host "  Target Camera:     adb -s <device> shell monkey -p com.marksman.targetcamera -c android.intent.category.LAUNCHER 1"
