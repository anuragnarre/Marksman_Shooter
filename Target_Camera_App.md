# Target_Camera_App Context & Code Structure

## Overview
`Target_Camera_App` is a React Native mobile application built with Expo. It is designed to act as the camera interface at the target line on physical ranges. It captures images or streams video of the physical target and transmits it to the vision engine for live processing.

## Code Structure
```text
Target_Camera_App/
├── .expo/                        # Expo framework configuration cache
├── android/                      # Native Android project files (when ejected or built)
├── assets/                       # Static app assets, splash screens, icons
├── App.tsx                       # Main React Native entry component
├── app.json                      # Expo configuration file
├── package.json                  # Node dependencies (Expo, React Native, Camera libraries)
└── tsconfig.json                 # TypeScript compiler options
```

## Execution & Workflow
- **Prerequisites**: Node.js, Expo CLI (`npm install -g expo-cli`), and a mobile emulator (Android Studio / Xcode) or the Expo Go app on a physical device.
- **Starting the Dev Server**: Run `npm install` followed by `npx expo start` to launch the Metro bundler.
- **Running the App**: Scan the QR code displayed in the terminal using the Expo Go mobile app (or use `a` / `i` in the terminal to launch on an Android/iOS emulator).
- **Core Operations**: The app utilizes the device's camera hardware. It handles image capture and streaming protocols, pushing frames to the backend APIs or the vision engine (`/shots/live-frame` endpoints) for real-time OpenCV processing. Generates APK/AAB files via EAS (Expo Application Services) or local build scripts for deployment.
