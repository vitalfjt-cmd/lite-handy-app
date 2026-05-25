# Lite App V3 - Native Version

This version of the Lite App is configured as a **Native App** using [Capacitor](https://capacitorjs.com/).

## Getting Started

### 1. Prerequisites
- **Android**: Install [Android Studio](https://developer.android.com/studio).
- **iOS**: Install [Xcode](https://developer.apple.com/xcode/) (requires macOS).

### 2. Development Workflow

#### Build and Sync
Whenever you change the web code (src), you need to build and sync it to the native platforms:
```bash
npm run cap:sync
```

#### Open in Native IDE
To run the app on a physical device or emulator, open the project in the respective IDE:
```bash
# For Android
npm run cap:open:android

# For iOS
npm run cap:open:ios
```

### 3. Native Features Implemented
- **Safe Area Handling**: The UI automatically adjusts for notches and home indicators (using `env(safe-area-inset-*)`).
- **Native Look & Feel**:
  - Text selection is disabled (`user-select: none`).
  - Gray tap highlight is removed.
  - Overflow is handled at the body level to prevent elastic scrolling issues.

## Folder Structure
- `/android`: Android Studio project.
- `/ios`: Xcode project.
- `/dist`: Built web assets (synchronized to native platforms).
- `capacitor.config.ts`: Capacitor configuration.
