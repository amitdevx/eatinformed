# Flutter foundation verification

Branch: `migration/flutter-ui`.
Existing app baseline: `1e66c9adf72ced8decaea8de9191ce24f4e6a649`.
Plan commit: `5eb18bf`.
Reference GymMane revision: `9fa8e4c37f7fcfb15ac72c5e5fe2b56209fe5446`.

## Changed scope

New `flutter_app/` contains a native Android/iOS project, configuration, typed session and JSON transport, secure storage adapter, auth repository/controller, framework-based navigation, semantic themes and motion tokens, an entrance primitive, content constraints, an EatInformed vector mark and opt-in bounded frame metrics.

The welcome/email/guest view and authenticated account boundary are a first foundation slice, not a completed migration. API requests target the existing contract. Paid provider calls, account data and production service configuration were not changed. The Expo app and Next.js source remain intact.

New `.github/workflows/flutter-mobile.yml` verifies the pinned Flutter 3.50.0 SDK, formatting, analysis and tests before building a profile APK for arm64/x64. It records commit and checksum provenance. It uses a separate Android preview application ID and test signing, not production release signing.

## Executed checks

| Check | Result | Meaning |
|---|---|---|
| Flutter 3.50.0 / Dart 3.14.0 bootstrap | VERIFIED | Official pinned framework revision ab2912035e160d9cad6306df307576da6128ebdb |
| Dependency resolution with `--enforce-lockfile` | VERIFIED | Current locked dependencies resolved |
| `flutter analyze --fatal-infos` | VERIFIED | Exit 0; no issues |
| `flutter test --reporter expanded` | VERIFIED | Exit 0; 20 tests passed |
| Initial narrow/large-text test | VERIFIED defect and correction | First run overflowed 248 pixels; flexible brand layout corrected it; current test passes at 320x720 and text scale 2 |
| Framework Material import compatibility | VERIFIED defect and correction | Analyzer flagged deprecated flutter/material.dart; official material_ui dependency/imports used; analysis now clean |
| `git diff --check` | VERIFIED | No whitespace errors |

Test coverage includes guest request schema, error status/code/request ID, invalid JSON, untrusted URL rejection, cancellation and timeout abortion, invalid session claims, restoration, identity-preserving refresh, fail-closed guest errors, logout races, secure-storage channel adapter behavior, guest navigation/logout, narrow large-text layout, reduced motion and dark appearance switching.

HTTP and platform storage boundaries are mocked in these tests. No arbitrary test token was submitted to a protected deployed endpoint. Native storage encryption and production auth are not proven by mocked adapter tests.

## Remaining acceptance work

| Feature | Status |
|---|---|
| Android/iOS project and foundation | IMPLEMENTED, UNVERIFIED on device |
| GitHub-built profile APK | NOT STARTED at local verification checkpoint |
| Live Flutter guest/email authentication | NOT STARTED |
| Google, signup/linking and full onboarding | NOT STARTED |
| Home, History, Guide, Results and full Profile ports | NOT STARTED |
| Camera/gallery scan workflow | NOT STARTED |
| Passport gesture, avatar travel, ticker and actual blur | NOT STARTED |
| Preference persistence and export/share ports | NOT STARTED |
| Profile-mode frame measurements | NOT STARTED; measurement helper is not a measurement |
| Waydroid testing | BLOCKED: session is stopped; no ADB device connected |
| Physical Android camera/haptic/performance testing | BLOCKED: no physical device connected |

No new Waydroid session was started. No local APK was compiled. No screen or animation is declared equivalent based on compilation or widget tests.
