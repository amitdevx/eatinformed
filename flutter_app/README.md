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

## Foundation scope

Implemented: configuration, safe JSON transport, typed verified session, encrypted local storage adapter, restoration/refresh, email sign-in and guest adapters, auth-state navigation, light/dark/system themes, safe-area scroll layout, one-shot entrances, lifecycle-aware decorative typography, and bounded opt-in frame metrics.

The authenticated account boundary is intentionally small. It is not the finished Home or Profile screen. Google, signup/linking, full onboarding, camera/scanning, history/results, Guide, Passport, preference persistence and export are subsequent ports. No sample scan or rating is used to disguise an incomplete feature.

The preview has a separate Android package and session store. It will not automatically import Expo credentials or local records. Sign in with the existing Firebase account and restore server-owned history when that feature is ported. Existing-user signup is not sign-in.

## Device acceptance

Download the immutable GitHub artifact matching the commit and verify SHA256SUMS. Install beside `com.eatinformed.app`. Confirm the foreground preview package before interaction. Use the existing Waydroid session; do not restart it automatically. Profile mode and physical Android hardware are required for representative frame, haptic and camera evidence. Unit/widget tests do not establish visual equivalence or production readiness.

FrameMetrics accepts the observed refresh rate and reports a bounded sample's build/raster p95 and over-budget count. It makes no claim until actual timings are captured. It must be stopped when recording ends.

## Licensing

This implementation contains no GymMane code, shaders, artwork or fonts. It independently implements selected behavioral specifications. GymMane's GPL-3.0-only/additional attribution and per-asset licenses must be reviewed before any future direct reuse. Platform fonts and Flutter's Material icon set are used here.

Native project notes: Android INTERNET permission is declared in the main manifest, cleartext is disabled and cloud backup is disabled for the session store. The profile APK is signed for testing only. Android uses the existing EatInformed leaf and magnifier as a vector icon. iOS launch/icon assets remain generated foundation assets pending its screen and device pass.
