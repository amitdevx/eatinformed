# Authentication synchronization diagnosis — 2026-11-16

Live read-only diagnostic: POST /api/auth/mobile with an empty object returned HTTP503 auth_unavailable, requestId da1e44a3-b694-4161-8ffb-3e7a50bfe119. The request did not create a user or submit credentials. This branch means adminAuth is null. GET /api/scan returned liveness OK; it did not establish authentication readiness. Browser Firebase client sign-in can work independently while server authentication remains unavailable.

Production prerequisite: configure a valid server-only Firebase Admin credential for the SAME Firebase project as NEXT_PUBLIC_FIREBASE_PROJECT_ID and API key. Supported: FIREBASE_SERVICE_ACCOUNT_JSON; or FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY and FIREBASE_PROJECT_ID; or GOOGLE_APPLICATION_CREDENTIALS file. See .env.example. Enable Anonymous, Email/Password and Google providers as needed. Never publish private keys. No production environment, credentials or deployment were modified.

Client defects repaired: hidden guest failures; onboarding generic error masking; success/Back navigation racing root auth switch; popup opened automatically without a browser gesture; web sign-in swallowing cookie endpoint failure; secure-storage failure pretending session persistence succeeded; onboarding proceeding after save failure. Existing accounts must sign in rather than sign up again. No automatic account merge occurs.

Tests added: the same email/password account signs in through mobile route while its browser cookie stays valid; duplicate signup gives actionable account_exists; browser-to-app code verifies same UID, rejects a wrong verifier and cannot be reused. Production guest and Google end-to-end remain blocked by deployed configuration. No passwords from the user message were used or logged.

Animation verification is limited to typechecking/bundling and navigation logic. Native gesture/haptic/blur smoothness is NOT TESTED without a device. This change does not claim all animations are correct.

Account profile restoration: mobile sign-in/refresh/Google exchange responses now include the account-owned display name, handle and allergen preferences when Firestore is reachable, so a second client can restore saved preferences. Avatar uploads remain outside this repair.

Additional finding: the old deployment logged neither skipped initialization (no recognized variable) nor auth-route 503 responses. Added firebase_configuration_missing and request-correlated auth_request_failed events; initialization failures include safe code only. The owner reports credentials configured and no matching logs. Exact credential variable name and Production scope are still needed; this report does not assume the credential itself is absent.

Verification: 9/9 unit/security tests and 9/9 Firebase emulator tests passed, including simultaneous browser/mobile use and code exchange tests. Native navigation transitions, blur and haptics remain unverified on a device. Auth navigator reset includes UID and guest/member state so guest upgrade and account changes also close the auth screen.

Build verification: web production build completed successfully. First browser smoke attempt timed out starting its localhost server under host I/O pressure before any page assertions ran; the server-start budget was increased to 180 seconds for a rerun. This is an infrastructure timeout, not a layout PASS. Unit and integration runs are recorded above. The live 503 remains unresolved without a deployment/configuration change and its runtime evidence.

Owner supplied the Vercel variable-name list: it has public Firebase settings but no Firebase Admin credential variable and no NVIDIA_API_KEY. This confirms the configuration prerequisite was absent from that list and explains skipped Admin initialization with no old log entry. See PRODUCTION_SETUP.md for the required server-only setup. Production remains blocked until the owner supplies these environment settings and authorizes a deployment; no credential was requested in chat.

Final executed results: unit/security 9/9; Firebase integration 9/9; browser viewport smoke 3/3; web/backend and mobile typechecks passed; lint zero errors with one existing hook-dependency warning; web production build passed; Android Hermes export passed (6.2 MB). The tests use isolated emulators and synthetic credentials, not the owner's account/password. Production login is not marked fixed until required server environment is supplied and the resulting deployment is tested. Native animation feel and gestures still need device testing.
