# Test results — 2026-11-16

Executed: 8/8 unit/security tests passed. Covers rolling quota boundaries, strict parsing, nullable assessments, decoder validation, streamed body limits, auth/test-header rejection and whole-word allergen matching.

Executed live NVIDIA calibration: success; primary model nvidia/nemotron-3.5-super-vl-120b-a12b, one attempt, 13,830ms provider /13,965ms pipeline. Input was an explicitly synthetic oats label with known printed text. This checks connectivity and extraction mechanics, not medical accuracy or real packaging reliability.

Initial Firebase emulator run: 5/6 tests passed. Concurrency test failed with missing google-gax proto file during dependency replacement. Repeat suite running after install stabilized. Do not count concurrency PASS until final result is available. Emulator tokens are intentionally unsigned and do not establish production signature enforcement; production uses Firebase Admin's supported verifier. Revocation test uses emulator claims and is not a production revocation certificate.

Latest build, typecheck, lint, browser and Android status will be recorded in BACKEND_FINAL_VERIFICATION.md. Earlier standalone backend typecheck passed before subsequent edits. Unit suite passed again after changes. Android release build was attempted; no completed APK result. Waydroid session startup failed with DBus container-manager timeout; no attached ADB device. Mobile export interrupted to reduce host memory pressure. No device interaction or FPS measurements are claimed.

Repeat results: 6/6 Firebase emulator integration tests passed (263739ms). Actual Firestore concurrent admission, multiple store instances and fresh-process quota read passed. Mobile TypeScript passed. Lint passed with 0 errors and 2 pre-existing/new hook dependency warnings.

Final standalone web/backend typecheck exited 0. Production web build exited 0. Mobile typecheck exited 0 after correcting animated tab-bar style typing.

Browser smoke verification: 3/3 passed at 360/768/1440px, testing /, /check, /support and /login for horizontal overflow and runtime page errors. This does not exercise authenticated scans or Android gestures.

Android bundle verification: `npx expo export --platform android --max-workers 1` completed successfully, producing a 6 MB Hermes bytecode bundle and 17 assets. This validates bundling; actual native installation and gesture/blur execution remain BLOCKED.

## Second pass, 2026-11-16

Executed: 8/8 unit/security tests passed; 7/7 Firebase Auth/Firestore emulator integration tests passed, including the new interrupted-operation regression. Web/backend and mobile TypeScript passed. Lint passed with two hook dependency warnings. No additional live provider call was made. Native device checks remain BLOCKED (no ADB device, missing local SDK configuration). Second-pass production builds are recorded separately when complete.

Second-pass web production build exited 0, including all 15 generated pages. First second-pass Android export failed on shared schema resolution; Metro watch-folder configuration was added and is being verified. This regression must not be hidden behind the earlier successful typecheck.

Second-pass browser smoke run: 3/3 passed at 360, 768 and 1440px (41 seconds). Tested public pages have no horizontal overflow or page runtime errors. Authenticated web scans and native journeys are not covered by this smoke suite.

Second-pass Android export after Metro repair exited 0: 6.1 MB Hermes bytecode bundle generated. Runtime native behavior still NOT TESTED. Final checks for this repair set: unit 8/8, Firebase integration 7/7, browser 3/3, both typechecks, lint (two warnings), production web build and Android export passed.
