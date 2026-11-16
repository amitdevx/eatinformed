# Android device check — 16 November 2026

## Artifact and environment

Tested revision: `c326e88add40449005510f507678f3c9575e7ab1`.
GitHub Actions run: https://github.com/amitdevx/eatinformed/actions/runs/43855668724
Artifact ID: `14222637313`, `eatinformed-android-apk`.
Downloaded ZIP SHA-256: `d912e0c673507ff49eea6c880c04d5787c8bfed7aae27e31a5bf3050b210aa99` (matched GitHub artifact digest).
Installed `app-release.apk` with `adb install -r`; package `com.eatinformed.app`, version 1.0.0, code 1.
Used the already-running Waydroid session, Android 13 x86_64, 1920×1048, density 180. Opened through the launcher. No local APK build or new Waydroid session.

Evidence resides in `/tmp/eatinformed-waydroid-evidence/` on the test host; temporary files are not durable repository artifacts. Screenshots contain a synthetic food label, not a verified commercial reference label.

## Observed behavior

| Check | Status | Evidence and limitation |
|---|---|---|
| Anonymous Firebase login | RUNTIME VERIFIED | Guest button advanced to onboarding in the installed release APK. |
| Onboarding completion | RUNTIME VERIFIED | Avatar/review steps advanced to Home. |
| Gallery without camera permission | RUNTIME VERIFIED | Selected the generated label using Android Photo Picker. |
| Full gallery image retained | REPRODUCED | `gallery-selected-no-camera.png`: selected image lost edge text; source applied a central viewfinder crop to gallery uploads. |
| Profile pull opens Passport/ticker | REPRODUCED | Two pull gestures, including grabber-origin pull, left Profile unchanged. `profile-pull-before.mp4`, `profile-during-pull.png`, `profile-after-pull.xml`. |
| Grabber tap opens Passport | REPRODUCED | `passport-tap-open.png` stayed on Profile. Settings tap worked, so not every Profile control was blocked. |
| Achievements Passport button | REPRODUCED | Tapping the button left Profile unchanged (`achievements-passport-tap.png`); its state setter was disconnected from ProfileReveal visibility. |
| Actual NVIDIA call | RUNTIME VERIFIED | Owner-supplied Vercel logs: first attempt timed out at 20,008 ms; second completed in 17,571 ms, finish reason stop, total tokens 4,229. |
| Successful analysis and history | REPRODUCED | Device displayed scan_in_progress; History remained 0. Backend ultimately returned 502. This scan did not succeed. |
| Google sign-in | REPRODUCED | HTTPS bridge opened in Jelly. Continuing opened Google home, not a completed account flow; bridge stayed Connecting. Back returned a controlled cancellation. No Google identity authenticated. |
| Member login and restart persistence | RUNTIME VERIFIED | Dedicated synthetic test account authenticated and restored after app force-stop/reopen through launcher. Auth screen incorrectly remained visible before restart (see below). |
| Blur, moving avatar, repeated Passport open/close | NOT TESTED | Passport did not open in the baseline build. |
| Physical haptics and animation performance | NOT TESTED | Waydroid cannot establish physical-device behavior. |

## Scan failure timeline

Owner-provided production logs, IST:

- 17:16:44.96: provider attempt 1 failed after 20,008 ms.
- 17:17:02.36: duplicate request `966ab602-c335-4f71-b542-be89c28e0aff` returned `scan_in_progress` at quota admission.
- 17:17:02.91: provider attempt 2 returned content, finish reason `stop`.
- 17:17:03.56: original request `d6bd7d2c-3a7a-4e97-86fc-73638ed284ea` completed HTTP 502 after 39,473 ms.

The mobile retry arrived before completion and treated 409 as terminal, hiding the subsequent 502. The logs do not identify the final 502 code. Invalid JSON, schema mismatch, and missing evidence remain hypotheses, not confirmed causes. Do not weaken validation to force success.

## Corrective changes following this check

Status: FIX IMPLEMENTED; new APK device verification still required.

- Preserve full camera/gallery label boundaries while resizing/compressing.
- Use app-local touch coordinates for reveal eligibility in letterboxed windows.
- Coordinate native scroll simultaneously; explicitly fail ineligible/tap-only pan recognition.
- Share Passport visibility between its grabber, gesture, and Achievements button.
- Poll pending operations within a bounded deadline using the original idempotency key; preserve that key across manual transport retries.
- Keep backend status/code/request ID available to the app, including quota failures.
- Log final scan error code/stage, correlate provider calls with request ID, and log schema issue paths without raw provider text or images.

The viewport experiment temporarily set 540×960; Android System UI became unresponsive while host I/O pressure was high. Restored the original physical size (verified `wm size`: 1920×1048, no override). Repeated Wait attempts did not recover System UI. No app/Waydroid restart or data clearing was used. Subsequent gesture tests under this obstruction would be invalid.

## Local regression results for corrective changes

- `npm test`: 13 tests passed, 0 failed. Includes the observed network → pending → terminal-provider-error sequence, pending → success, terminal auth/quota/conflict responses, and bounded polling.
- `npm run test:integration`: 9 tests passed, 0 failed, using isolated Firebase Auth/Firestore emulators and a mocked paid AI boundary. No live NVIDIA success is implied.
- Root and mobile TypeScript checks passed.
- ESLint passed with one existing missing-effect-dependency warning in `ImageUploadForm.tsx`.
- `git diff --check` passed.

The System UI dialog cleared after selecting its Close app action (System UI only); the EatInformed process and existing Waydroid session remained running. Original viewport remained restored. Device checks resumed afterward.

## Additional auth/navigation defect

Status: REPRODUCED in baseline APK; FIX IMPLEMENTED in follow-up source.

The synthetic test account returned `account_exists` on registration retry. Signing in with its credentials finished without an error but left Auth visible. Pressing Back returned to the launcher. Force-stopping only EatInformed and reopening it through the launcher loaded Home with the persisted session. Thus authentication success was not reliably transitioning the navigator; this is separate from a backend credential failure.

React Navigation retains shared screens across auth branches unless their navigation key changes. The shared Auth route now belongs to a group keyed by verified account/guest status. OAuth callbacks are filtered out of the screen router and remain owned by Expo's pending authentication session. References: [authentication flow](https://reactnavigation.org/docs/auth-flow/) and [link filtering](https://reactnavigation.org/docs/configuring-links/).

Normal Profile scrolling was verified after System UI recovery (`profile-normal-scroll.png`). Google bridge/cancellation evidence: `google-browser-handoff.png`, `google-return-from-popup.png`, `google-cancelled-app.png`. The synthetic registered test account is retained; no user records were deleted. Its random test credentials are stored only in a private temporary host file, not this repository.

## Account sync and cache-deletion mismatch

A single authorized full-image production request using the synthetic registered account returned HTTP 200 in 38,836 ms, request `80d327bf-ff37-439b-a0ea-a8e9ad22ae15`. It contained one ingredient and five nutrients; quota changed from 50 to 49. Android then loaded that record into History (`member-history-server-sync.png`). This is live-provider/backend/history evidence; it is not a successful repaired-APK gallery-to-result test.

Settings advertised a local cache wipe but invoked `clearAllHistory`, which deletes durable account history. Status: STATIC VERIFIED defect; FIX IMPLEMENTED by a UID-scoped AsyncStorage-only cache removal. No saved records were deleted to reproduce it. History's separate account deletion confirmation now explains its cross-device effect. Settings also displays the configured app version rather than hardcoded build 42. Device verification of these changes is pending the remote APK.
