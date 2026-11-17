# Verification evidence

Run local checks from flutter_app and retain exit codes:

    flutter analyze --fatal-infos
    flutter test --reporter expanded

CI builds profile APKs for arm64 and x64. These artifacts use a preview package, not the production Expo identity. Native compilation is intentionally not part of the local command list.

Before input, verify an existing Waydroid session and foreground application:

    waydroid status
    adb devices
    adb -s DEVICE shell dumpsys activity activities

Do not launch a new Waydroid session automatically. Installation, navigating a launcher, or sending a gesture is not proof that the intended UI responded. Capture the visible state and verify the result.

Record test revision, GitHub run ID, artifact digest, APK package/version and foreground package. Haptics, camera sensor geometry and representative raster timing require physical Android hardware. Never manufacture these measurements from widget tests.
