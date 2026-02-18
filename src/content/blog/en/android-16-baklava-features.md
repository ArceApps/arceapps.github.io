---
title: "Android 16 Baklava: Features and Privacy"
description: "Everything developers need to know about Android 16 (Baklava). Privacy updates, Health Connect, and roadmap for API adoption."
pubDate: 2025-06-21
heroImage: "/images/placeholder-article-baklava.svg"
tags: ["Android", "Android 16", "Baklava", "Features", "Roadmap", "Privacy", "Health Connect"]
reference_id: "be5f8f27-9428-4735-a643-d081c334aeee"
---
## 🥧 What's New in Android 16 (Baklava)?

Android 16, code-named "Baklava," continues Google's trend of focusing on privacy, security, and incremental refinement. While not as disruptive as Android 12 (Material You), it introduces several key APIs and behavioral changes developers must address.

## 🔒 Privacy & Permissions

### Photo Picker Enhancements
The Photo Picker is now mandatory for accessing media. `READ_EXTERNAL_STORAGE` is officially deprecated for most use cases.
- **Why**: User privacy. Apps no longer need broad storage access.
- **Action**: Migrate to `PickVisualMedia` contract.

### Health Connect Integration
Health Connect is now a core system service in Android 16, pre-installed on all devices.
- **API**: Unified read/write permissions for health data (steps, heart rate, sleep).
- **Migration**: Apps using Google Fit must migrate to Health Connect.

## 🛠️ Developer Productivity

### Predictive Back Gesture
Predictive Back is enabled by default. Apps must handle back navigation correctly.
- **Action**: Use `OnBackPressedDispatcher`.
- **UI**: Ensure custom transitions look good with the "peek" animation.

### Background Work Optimization
New restrictions on exact alarms and foreground services to save battery.
- **WorkManager**: Continues to be the recommended solution for deferrable background tasks.
- **Foreground Service Types**: All foreground services must declare a specific type in the manifest.

## 📅 Roadmap to Target SDK 35

1.  **Preview**: Available now for Pixel.
2.  **Beta**: Expected in April 2025.
3.  **Platform Stability**: June 2025.
4.  **Final Release**: August/September 2025.

## ⚠️ Breaking Changes

- **Broadcast Receivers**: Strict limitations on implicit broadcasts.
- **Non-SDK Interfaces**: More restricted greylist APIs moved to blacklist.
- **Theme**: Subtle changes to dynamic color algorithms.

## 🚀 Preparing Your App

1.  **Audit Permissions**: Remove unused permissions.
2.  **Test Predictive Back**: Enable developer option and test navigation flows.
3.  **Update Dependencies**: Bump AGP, Kotlin, and Jetpack libraries.
4.  **Target SDK**: Update `targetSdk` to 35 and fix compilation errors.

## 🏁 Conclusion

Android 16 Baklava is a refinement release. Focus on privacy (Photo Picker, Health Connect) and modern navigation (Predictive Back). Start testing early to avoid surprises.
