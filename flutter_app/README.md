# EatInformed Flutter mobile

Mobile presentation migration on `migration/flutter-ui`. The Expo application in `../mobile/` remains the production mobile implementation. Next.js, Firebase services, Firestore and NVIDIA remain unchanged.

Read [the migration plan](../docs/FLUTTER_UI_MIGRATION_PLAN.md) for source references, screen order, licensing boundaries and acceptance gates.

## Toolchain

Flutter 3.50.0 stable, Dart 3.14.0. The official material_ui package is used because the installed SDK deprecates flutter/material.dart. CI pins Flutter's official `3.50.0` tag. Dependencies are locked in pubspec.lock. Native Android APK compilation runs in GitHub Actions, not on this workstation.

```sh
flutter pub get --enforce-lockfile
flutter analyze --fatal-infos
flutter test --reporter expanded
```

The API origin defaults to `https://eatinformed.amitdevx.tech`. Override only with an HTTPS origin using `--dart-define=EATINFORMED_API_ORIGIN=https://your-test-host.example`. Never put a provider key or service-account credential in the application.

## Screen port scope

The preview now includes Welcome, Google/email/guest authentication adapters, onboarding, Home, History, camera/gallery Scan, Results, NOVA Guide and additive dictionary, Profile, Food Passport, profile editing, and Settings. It uses the existing API for identity, user profiles, quotas and saved reports. The original sample reports are explicitly marked and never added to history.

Motion uses native Flutter controllers, slivers, measured scroll depth, one-shot entrances, lifecycle-aware canvas typography, value transitions and a continuous Profile/Passport timeline. It contains no copied GymMane implementation or assets. Some reference effects remain deferred and device fidelity is not yet established.

See [screen verification](../docs/FLUTTER_SCREEN_PORT_VERIFICATION.md) for executed tests, root causes, feature limits and device gates. Custom profile photos remain local because the existing profile API has no avatar upload contract. Existing accounts should sign in rather than create another account. The separate preview does not import Expo's encrypted session; it restores the existing account's server-owned history after authentication.

## Device acceptance

Download the immutable GitHub artifact matching the commit and verify SHA256SUMS. Install beside `com.eatinformed.app`. Confirm the foreground preview package before interaction. Use the existing Waydroid session; do not restart it automatically. Profile mode and physical Android hardware are required for representative frame, haptic and camera evidence. Unit/widget tests do not establish visual equivalence or production readiness.

FrameMetrics accepts the observed refresh rate and reports a bounded sample's build/raster p95 and over-budget count. It makes no claim until actual timings are captured. It must be stopped when recording ends.

## Licensing

This implementation contains no GymMane code, shaders, artwork or fonts. It independently implements selected behavioral specifications. GymMane's GPL-3.0-only/additional attribution and per-asset licenses must be reviewed before any future direct reuse. Platform fonts and Flutter's Material icon set are used here.

Native project notes: Android INTERNET permission is declared in the main manifest, cleartext is disabled and cloud backup is disabled for the session store. The profile APK is signed for testing only. Android uses the existing EatInformed leaf and magnifier as a vector icon. iOS launch/icon assets remain generated foundation assets pending its screen and device pass.
