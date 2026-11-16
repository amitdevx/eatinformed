# Test results — 2026-11-16

Executed: 8/8 unit/security tests passed. Covers rolling quota boundaries, strict parsing, nullable assessments, decoder validation, streamed body limits, auth/test-header rejection and whole-word allergen matching.

Executed live NVIDIA calibration: success; primary model nvidia/nemotron-3.5-super-vl-120b-a12b, one attempt, 13,830ms provider /13,965ms pipeline. Input was an explicitly synthetic oats label with known printed text. This checks connectivity and extraction mechanics, not medical accuracy or real packaging reliability.

Initial Firebase emulator run: 5/6 tests passed. Concurrency test failed with missing google-gax proto file during dependency replacement. Repeat suite running after install stabilized. Do not count concurrency PASS until final result is available. Emulator tokens are intentionally unsigned and do not establish production signature enforcement; production uses Firebase Admin's supported verifier. Revocation test uses emulator claims and is not a production revocation certificate.

Latest build, typecheck, lint, browser and Android status will be recorded in BACKEND_FINAL_VERIFICATION.md. Earlier standalone backend typecheck passed before subsequent edits. Unit suite passed again after changes. Android release build was attempted; no completed APK result. Waydroid session startup failed with DBus container-manager timeout; no attached ADB device. Mobile export interrupted to reduce host memory pressure. No device interaction or FPS measurements are claimed.

Repeat results: 6/6 Firebase emulator integration tests passed (263739ms). Actual Firestore concurrent admission, multiple store instances and fresh-process quota read passed. Mobile TypeScript passed. Lint passed with 0 errors and 2 pre-existing/new hook dependency warnings.

Final standalone web/backend typecheck exited 0. Production web build exited 0. Mobile typecheck exited 0 after correcting animated tab-bar style typing.

Browser smoke verification: 3/3 passed at 360/768/1440px, testing /, /check, /support and /login for horizontal overflow and runtime page errors. This does not exercise authenticated scans or Android gestures.

Android bundle verification: `npx expo export --platform android --max-workers 1` completed successfully, producing a 6 MB Hermes bytecode bundle and 17 assets. This validates bundling; actual native installation and gesture/blur execution remain BLOCKED.
