# Repair plan — 2026-11-16

Baseline: `91cdbb9`; working tree clean. Local source audit, no production writes.

1. Close remaining public AI server actions, custom guest signatures, mixed credential verification and mobile OAuth redirect leakage. Preserve member quota at 50/hour.
2. Replace file quota with Firestore transactions: UID ownership, request-specific reservation, payload-bound idempotency, durable results, explicit failure accounting. Fail closed without configuration.
3. Bound request bytes and decode images fully. Enforce provider deadline, strict JSON and schema validation, preserve unknown food assessments.
4. Update web/mobile authentication, retries, user-scoped persistence and rendering. Add ownership rules and emulator integration tests.
5. Study local GymMane behavior and independently implement coordinated Profile gesture, avatar, ticker and Passport blur. Inspect remaining layouts and motion lifecycle.
6. Execute unit/integration/type/lint/build checks; attempt Android runtime and one live provider diagnostic where available. Record blocked checks explicitly. Commit tested groups locally; never push or deploy.

Confirmed baseline defects: hardcoded guest signing fallback; process-local quota/idempotency; refund removes unrelated last event; exported AI server actions; provider failures classified as unreadable; JSON truncation repair; boolean coercion; global web history; mobile email-prefix ownership collisions; unrestricted OAuth redirect; non-refreshing mobile credentials; GET logout revokes all sessions; profile 95-point visual cap versus 200-point interpolation; nested ScrollView responder competition; modal blur lacks an Android target.

Already repaired in baseline: public test-header success bypass removed; numeric/dietary top-level unknown defaults partly removed; basic image signature/dimension validation present. Do not report these as newly repaired.

Environment limits observed: no Firebase Admin/client project configuration in local `.env.local`; NVIDIA key present (value not printed); ADB has no attached devices. Firebase emulator and Android availability will be checked before assigning runtime status.
