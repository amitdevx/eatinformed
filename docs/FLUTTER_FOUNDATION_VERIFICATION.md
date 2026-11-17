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
| GitHub-built profile APK | VERIFIED for foundation commit ffb573c; build and checksum only |
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

## GitHub artifact verification

Run https://github.com/amitdevx/eatinformed/actions/runs/44078334331 completed successfully for `ffb573c6bf4fe64bf3bfc95fd24c8bba51c8197a`. Hosted formatting, analysis and all 20 foundation tests passed before profile compilation.

Artifact `14326825007`, `eatinformed-flutter-profile-ffb573c6bf4fe64bf3bfc95fd24c8bba51c8197a`, downloaded through the GitHub connector. ZIP SHA-256 `5544be6228172af37ab4174987a92d05e7f7f13454f41a58860f8860ee1fa3ca` matches GitHub. Included commit.txt matches the tested revision. APK SHA-256 `95eec1c1a745cb2da5831b0f33eee7386e8ff679a0808d92123ee7e7a7b8ce45` matches the included checksum manifest.

Decoded the APK's binary AndroidManifest.xml: package `com.eatinformed.preview.eatinformed_mobile`, version 0.1.0/code 1, label EatInformed Preview, allowBackup=false, usesCleartextTraffic=false. This verifies artifact identity, not runtime behavior. Download retained at `/home/amitdevx/.cache/eatinformed/artifacts/ffb573c-profile/app-profile.apk` on the test host. No APK was compiled locally or installed into a new session.

## Background typography primitive

Added independently authored `lib/design/motion/name_ticker.dart` and `test/name_ticker_test.dart`. Measured text repeats on a canvas through repaint notifications, with alternating row direction. Frame callbacks pause on hidden state, disabled TickerMode, app backgrounding and reduced motion; offset survives pause/resume. Text-layout changes preserve fractional phase. The decorative painter owns no touches or semantic reading order. Controllers, notifier, painter and lifecycle observer are disposed.

Initial analysis detected the installed SDK's deprecated TickerMode.of API. Updated to TickerMode.valuesOf(context).enabled. The subsequent full widget/unit suite passed: 22 tests, 0 failures. The two additional tests assert idle behavior under visibility/reduced-motion gates and lifecycle start/stop/disposal. They do not prove on-device seamlessness, frame rate or Passport integration. This primitive is not yet connected to a ported Profile screen and is not part of the downloaded foundation APK.
