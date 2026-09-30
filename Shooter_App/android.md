# 📱 Capacitor Android App Setup & Build Guide

This project uses **Capacitor** to convert a web application (Next.js / React / Vite) into a native Android app.

---

## 🚀 Prerequisites

Make sure you have installed:

* Node.js (v18+ recommended)
* npm / yarn
* Android Studio
* Java JDK (11 or higher)

---

## 📦 Installation

Install Capacitor dependencies:

```bash
npm install @capacitor/core @capacitor/cli
```

---

## ⚙️ Initialize Capacitor (First Time Only)

```bash
npx cap init
```

Fill details:

* **App Name**: Your App Name
* **App ID**: com.yourcompany.app

---

## 🏗️ Build Frontend

Before syncing, always build your frontend:

```bash
npm run build
```

---

## 📁 Configure Web Directory

Edit `capacitor.config.ts` or `capacitor.config.json`:

### For Next.js (static export)

```ts
webDir: 'out'
```

### For Vite / React

```ts
webDir: 'dist'
```

---

## 📲 Add Android Platform

```bash
npx cap add android
```

---

## 🔄 Sync Project

```bash
npx cap sync android
```

---

## 🧪 Run in Android Studio

```bash
npx cap open android
```

---

## 📦 Build APK (Debug)

### Option 1: Android Studio

* Go to:

  ```
  Build → Build APK(s)
  ```
* Output file:

  ```
  android/app/build/outputs/apk/debug/app-debug.apk
  ```

---

### Option 2: Command Line

```bash
cd android
./gradlew assembleDebug
```

APK location:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔐 Build Release APK (Production)

### Steps:

1. Open Android Studio
2. Go to:

   ```
   Build → Generate Signed Bundle / APK
   ```
3. Choose:

   * APK
   * Create or use existing **Keystore**
4. Select:

   * Build Variant: `release`

---

### Output:

```
android/app/release/app-release.apk
```

---

## 🏪 Build AAB (For Play Store)

Instead of APK:

```
Build → Generate Signed Bundle / APK → Android App Bundle (AAB)
```

Output:

```
android/app/release/app-release.aab
```

---

## ⚠️ Important Notes

* Always run `npm run build` before `cap sync`
* Keep UI mobile-friendly (most users are mobile)
* Debug APK = testing only
* Release APK = client delivery
* AAB = Play Store upload

---

## 🛠️ Useful Commands

```bash
# Sync project
npx cap sync

# Open Android Studio
npx cap open android

# Build frontend
npm run build

# Add platform
npx cap add android
```

---

## 🧠 Pro Tips

* Use **Vite** for better performance in mobile apps
* Optimize assets for faster load
* Use Capacitor plugins:

  * Camera
  * Storage
  * Push Notifications

---

## 👨‍💻 Author

**Ashwin Hingve**
Dual Mind Labs — Software Solutions Agency

---

## 📄 License

This project is licensed under the MIT License.
