# install_all_apks.ps1 - Automated Marksman APK Installer & Environment Configurator
param(
    [ValidateSet("release", "debug")]
    [string]$Target = "release",
    [string]$DeviceId = ""
)

$rootDir = $PSScriptRoot
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) {
    $adbCmd = Get-Command adb -ErrorAction SilentlyContinue
    if ($adbCmd) {
        $adb = $adbCmd.Source
    } else {
        Write-Error "ADB not found at $adb or in PATH. Ensure Android SDK platform-tools is installed."
        exit 1
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Marksman Android Deployment & Reverse Bridge Setup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Detect connected devices
$rawDevices = & $adb devices
$deviceList = @()
foreach ($line in ($rawDevices -split "`r?`n")) {
    if ($line -match '^([a-zA-Z0-9_\-:.\[\]]+)\s+device$') {
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

# 2. Determine APK paths (matches official v1.0.0 release & debug filenames)
if ($Target -eq "release") {
    $shooterApk = Join-Path $rootDir "release_apks\Marksman_Shooter_v1.0.apk"
    $rangeApk   = Join-Path $rootDir "release_apks\Marksman_Range_v1.0.apk"
    $cameraApk  = Join-Path $rootDir "release_apks\Marksman_Target_Camera_v1.0.apk"
} else {
    $shooterApk = Join-Path $rootDir "release_apks\Marksman_Shooter_v1.0_debug.apk"
    $rangeApk   = Join-Path $rootDir "release_apks\Marksman_Range_v1.0_debug.apk"
    $cameraApk  = Join-Path $rootDir "release_apks\Marksman_Target_Camera_v1.0_debug.apk"
}

foreach ($apk in @($shooterApk, $rangeApk, $cameraApk)) {
    if (-not (Test-Path $apk)) {
        Write-Warning "APK not found on disk: $apk"
    }
}

foreach ($dev in $deviceList) {
    $avdName = & $adb -s $dev emu avd name 2>$null | Select-Object -First 1
    Write-Host "`n----------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host "Configuring Device [$dev] ($avdName)..." -ForegroundColor Cyan
    Write-Host "----------------------------------------------------------" -ForegroundColor DarkCyan

    # Setup ADB reverse port forwardings for all Marksman services
    Write-Host "[1/4] Setting up ADB reverse port forwarding to host services..." -ForegroundColor Yellow
    foreach ($p in @(3000, 3001, 3002, 3003, 8000, 8081)) {
        & $adb -s $dev reverse "tcp:$p" "tcp:$p"
    }
    Write-Host "  -> Ports 3000, 3001, 3002, 3003, 8000, 8081 forwarded to Windows host!" -ForegroundColor Green

    # Install APKs
    if (Test-Path $shooterApk) {
        Write-Host "`n[2/4] Installing Marksman Shooter App ($shooterApk)..." -ForegroundColor Yellow
        & $adb -s $dev install -r "$shooterApk"
    }

    if (Test-Path $rangeApk) {
        Write-Host "`n[3/4] Installing Marksman Range Management ($rangeApk)..." -ForegroundColor Yellow
        & $adb -s $dev install -r "$rangeApk"
    }

    if (Test-Path $cameraApk) {
        Write-Host "`n[4/4] Installing Marksman Target Camera ($cameraApk)..." -ForegroundColor Yellow
        & $adb -s $dev install -r "$cameraApk"
    }

    Write-Host "`n[OK] Marksman APK installation finished on $dev!" -ForegroundColor Green
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  Launch Commands" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Shooter App:       adb -s <device> shell monkey -p com.marksman.shooting -c android.intent.category.LAUNCHER 1"
Write-Host "  Range Management:  adb -s <device> shell monkey -p com.marksman.rangeapp -c android.intent.category.LAUNCHER 1"
Write-Host "  Target Camera:     adb -s <device> shell monkey -p com.anonymous.Target_Camera_App -c android.intent.category.LAUNCHER 1"
