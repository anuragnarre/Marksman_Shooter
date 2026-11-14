# Marksman Ecosystem — Unified Android Application Packages (APKs)

This directory provides the compiled, production-ready Android APK packages for all three native mobile subsystems of the Marksman platform.

---

## 📦 APK Artifact Directory & Verification Checksums

| Application Subsystem | Variant | Package ID | File Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- | :--- |
| **Marksman Shooter App** | **Release (Signed)** | `com.marksman.shooting` | **9.70 MB** | `D5D05A1E6260928524C042BF2A8966382053BC56F7E673218A05B730C9F775F4` |
| **Marksman Shooter App** | Debug | `com.marksman.shooting` | 11.74 MB | `97E27889CE1B31CEFA7F149A93D11C8BD624CD413C5E86DC2F092E361D58FD2D` |
| **Marksman Range Management** | **Release (Signed)** | `com.marksman.rangeapp` | **9.62 MB** | `70D090EAAE6B9EAC292B29DC766BCB28192716496F411A1C98B4BCB02E8790DE` |
| **Marksman Range Management** | Debug | `com.marksman.rangeapp` | 11.60 MB | `88C781DEC471F5A6C08EBD937705C7A11B3429365B94E24EA62E17400849CAB4` |
| **Marksman Target Camera** | **Release (Standalone)** | `com.marksman.targetcamera` | **89.27 MB** | `04EBE10949DF59BB6FA2412AE96870EE507FF4C2F8EA74C2007C09499A61D9AC` |
| **Marksman Target Camera** | Debug | `com.marksman.targetcamera` | 155.64 MB | `16A49A59623BA71EE699EE292C0E882FD6163C8D52735E1E807665F2587B6CDB` |

---

## 🔑 Signing Credentials

Release APKs are signed with the project release keystore:
- **Keystore File:** `marksman.keystore` (RSA 2048-bit, 10,000-day validity)
- **Key Alias:** `marksman`
- **Store Password:** `marksman123`
- **Key Password:** `marksman123`

---

## 🚀 One-Line Installation & Run Commands

Connect your phone via USB (with USB Debugging enabled) or boot the Android Studio emulator (`Pixel_7_Play_Store`), then run:

### 1. Shooter App (`com.marksman.shooting`)
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r "release_apks\Marksman_ShooterApp_v1.0_release.apk"
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell monkey -p com.marksman.shooting -c android.intent.category.LAUNCHER 1
```

### 2. Range Management Operator App (`com.marksman.rangeapp`)
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r "release_apks\Marksman_RangeManagement_v1.0_release.apk"
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell monkey -p com.marksman.rangeapp -c android.intent.category.LAUNCHER 1
```

### 3. Target Camera Electronic Scoring Rig (`com.marksman.targetcamera`)
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r "release_apks\Marksman_TargetCamera_v1.0_release.apk"
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell monkey -p com.marksman.targetcamera -c android.intent.category.LAUNCHER 1
```

---

## 🌐 Local Development ADB Port Forwarding

When testing on an emulator or USB-connected phone against host NestJS backends, run:
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:3001 tcp:3001
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:3002 tcp:3002
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:3003 tcp:3003
```
