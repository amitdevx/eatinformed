# EatInformed: Backend Test Results

**Date**: November 15, 2026  
**Commit**: Targeted Backend Security & AI Accuracy Repair  
**Test Runner**: Node.js Test Runner via `npx tsx --test`  

---

## 1. Test Execution Summary

| Test Suite | Total Tests | Passed | Failed | Status |
| :--- | :--- | :--- | :--- | :--- |
| **`tests/quota-and-security.test.ts`** | 7 | 7 | 0 | **PASS (100%)** |
| **`tests/e2e-verification.ts`** | 34 | 34 | 0 | **PASS (100%)** |
| **TypeScript Compilation (`web`)** | Root project | 0 errors | 0 | **PASS (100%)** |
| **TypeScript Compilation (`mobile`)** | Expo project | 0 errors | 0 | **PASS (100%)** |
| **ESLint Audit** | Full codebase | 0 errors | 0 | **PASS (100%)** |

---

## 2. Detailed Test Cases (`tests/quota-and-security.test.ts`)

### 1. `Security: Cryptographic Guest Token Lifecycle` (PASS)
- Verifies generation of HMAC-SHA256 tokens (`guest_${b64}.${sig}`).
- Verifies correct decode of payload and UID.
- Confirms rejection of forged signatures (`invalid_signature_hex`).
- Confirms rejection of altered base64 payloads.
- Confirms rejection of arbitrary client strings and empty tokens.

### 2. `Security: verifyUserToken Rejects Backdoor Strings and Fabricated Tokens` (PASS)
- Confirms rejection of empty tokens with `code: 'missing_token'`.
- Confirms rejection of unverified arbitrary timestamp strings (`guest_arbitrary_timestamp_token_...`).
- Confirms removal and rejection of legacy backdoor prefixes (`test_member_`, `test_guest_`).
- Proves cryptographically signed guest tokens verify successfully with stable UID.

### 3. `Quota: 4 scans per 2-hour rolling sliding window enforcement` (PASS)
- Verifies inspection does not consume quota.
- Tests sequential quota consumption: Scans 1 to 4 succeed with remaining slots 3, 2, 1, 0.
- Verifies 5th scan within 2-hour window is rejected with `allowed: false`, `remaining: 0`, and positive `retryAfterSeconds`.
- Tests slot refund policy: calling `refundQuotaSlot` restores slot admission and permits retry.

### 4. `Endpoint Gatekeeping: /api/scan Rejects Missing Auth and Header Bypasses` (PASS)
- Verifies unauthenticated POST to `/api/scan` returns HTTP 401 with `code: 'missing_token'`.
- Verifies request with `x-eatinformed-client: test` returns HTTP 401 (proves removal of the test header backdoor from production).
- Verifies forged guest tokens return HTTP 401 Unauthorized.

### 5. `Validation: Image Magic Bytes and Sharp Dimension Limits` (PASS)
- Verifies empty image payloads fail with HTTP 400.
- Verifies spoofed text data with `data:image/jpeg;base64` header fails magic byte check with HTTP 415.
- Confirms authentic JPEG buffers (`FF D8 FF`) pass with format `'jpeg'`.
- Confirms authentic PNG buffers (`89 50 4E 47`) pass with format `'png'`.
- Confirms oversized images (>6000px) are rejected with `dimensions_exceeded`.

### 6. `AI Output Accuracy: Schema Rejects Fake Defaults and Preserves Nulls` (PASS)
- Verifies missing `novaGroup` in model output parses as `null` (Unknown), NOT defaulted to 4.
- Verifies missing `rating` parses as `null` (Unrated), NOT defaulted to 2.5 or 0.
- Verifies missing `isVegan`, `isVegetarian`, and `isGlutenFree` parse as `null`, NOT defaulted to false.
- Confirms explicit ratings and NOVA groups are preserved accurately when returned by AI models.

### 7. `Physics: Food Passport Pull-down Gesture Separation` (PASS)
- Tests raw pull threshold (`110pt`) decoupled from asymptotic rubber-band displacement (`95pt`).
- Tests rejection of horizontal drags (`|dx| >= |dy|`).
- Tests rejection when screen is scrolled down (`scrollY > 0`).

---

## 3. End-to-End Test Cases (`tests/e2e-verification.ts`)

- **NIM Configuration & Active Models**: 3 tests passed.
- **Robust Parser Edge Cases**: 7 tests passed (unescaped newlines, unclosed think tag, markdown fences, duplicate commas, colon quotes, escaped quotes).
- **Image OCR & Preparation**: 2 tests passed (JPEG data URI generation, 1400px resize).
- **Rate Limiting Burst Window**: 3 tests passed (20 req / 60s burst limit).
- **Auth Endpoints & Error Handling**: 6 tests passed (POST logout, GET logout, missing idToken 400, short password 400, anonymous guest session).
- **Google OAuth Failure Handling**: 3 tests passed (silent popup close, mobile cancel, mobile dismiss).
- **Cross-Platform Data & UI Synchronization**: 5 tests passed (sample Doritos 17 ingredients, Granola 9 ingredients, suitability badge mapping, salt conversion formula).
- **Scan Auth Gate & 4-Scan / 2-Hour Quota**: 5 tests passed (auth gating 401, test header rejection 401, 4 scans/2hr guest limit header inspection, 4-scan exhaustion, session purge on logout).
