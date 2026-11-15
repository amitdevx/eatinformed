# EatInformed: Backend Implementation Plan

**Objective**: Systematic repair of authentication, public test bypasses, guest quota enforcement, image validation, AI pipeline accuracy, and account-scoped persistence.  
**Execution Order**: Dependency-aware, strictly following P0 -> P1 -> P2 priorities.  

---

## Phase 1: Security & Gatekeeping (P0)

### 1.1 Remove Public Test Bypasses (`src/app/api/scan/route.ts`)
- Delete `clientType === 'test'` check in `src/app/api/scan/route.ts`.
- Delete IP burst limiter bypass for `clientType === 'test'`.
- Remove hardcoded `test_member_` and `test_guest_` token backdoors from `src/lib/quota.ts`.

### 1.2 Cryptographic Authentication & Token Verification (`src/lib/quota.ts`, `src/app/api/scan/route.ts`)
- Require real Firebase verification (`adminAuth.verifyIdToken(token, true)` with revocation check, or `adminAuth.verifySessionCookie(cookie, true)`).
- For guests, enforce HMAC-SHA256 signature verification and 30-day temporal check via `verifyGuestToken(token)`.
- If unauthenticated, reject immediately with HTTP 401 (`code: 'auth_required'` or `'token_invalid'`).

### 1.3 Secure Web Scan Entry Point (`src/components/features/ImageUploadForm.tsx`)
- Refactor `ImageUploadForm.tsx` to stop importing `analyzeProduct` directly.
- Submit scans via `POST /api/scan` using the current user's Firebase ID token in `Authorization: Bearer <idToken>`.
- Display server-enforced quota countdown and rate limit errors on the web interface.

### 1.4 Secure Guest Authentication Flow (`src/app/api/auth/[...action]/route.ts`, `mobile/src/lib/auth.ts`)
- In `src/app/api/auth/[...action]/route.ts`: Issue cryptographically signed HMAC guest tokens with UUID.
- In `mobile/src/lib/auth.ts`: Remove bogus local timestamp fallback in `signInAsGuest()`; throw clear recoverable errors if server authentication fails.

---

## Phase 2: Quota & Image Validation (P1)

### 2.1 Reorder Request Processing Pipeline (`src/app/api/scan/route.ts`)
- Execution order:
  1. IP burst limiter check (HTTP 429).
  2. Authentication & token verification (HTTP 401).
  3. JSON body parsing & schema validation (HTTP 400).
  4. Image magic byte inspection & Sharp decode limits (HTTP 400 / 415).
  5. Idempotency check: if scan already completed for identical idempotency key, return existing result without recharging.
  6. Atomic quota check & slot reservation (HTTP 429).
  7. AI inference execution.
  8. If AI inference fails, execute immediate slot refund.

### 2.2 Defensive Image Validation (`src/lib/image-validation.ts` or `src/app/api/scan/route.ts`)
- Inspect header bytes for PNG (`89 50 4E 47`), JPEG (`FF D8 FF`), WEBP (`52 49 46 46`).
- Sharp metadata inspection: verify buffer decodes, dimensions <= 6000x6000px, total pixels <= 25,000,000.

---

## Phase 3: AI Pipeline Accuracy & Structured Output (P1)

### 3.1 Eliminate Misleading Defaults (`src/ai/flows/product-analysis-types.ts`, `src/ai/flows/product-analysis.ts`)
- Update schema:
  - `novaGroup`: `z.number().min(1).max(4).nullable()` (defaults to `null` if unavailable).
  - `rating`: `z.number().min(0).max(5).nullable()` (defaults to `null` if unavailable).
  - `isVegetarian`: `z.boolean().nullable()` (defaults to `null` - unknown).
  - `isVegan`: `z.boolean().nullable()` (defaults to `null` - unknown).
  - `isGlutenFree`: `z.boolean().nullable()` (defaults to `null` - unknown).
- Remove automatic generation of ultra-processed cons when NOVA was never extracted.
- Remove em-dashes `—` from fallback text.

### 3.2 Strict JSON Truncation Detection (`src/ai/nim.ts`)
- If model response is cut off mid-stream or lacks closing structure, fail closed or retry cleanly rather than inventing synthetic closing tags on truncated sentences.

---

## Phase 4: Account-Scoped Persistence (P1)

### 4.1 Account-Isolated Mobile History (`mobile/src/lib/history.ts`)
- Derive storage keys from user identity: `eatinformed_history_${userId}`.
- Implement durable history ledger (`eatinformed_ledger_${userId}`) separate from the 20-item recent cache.
- Ensure yearly statistics, clean ratio, and export functions compute over the full durable ledger.
- Use collision-resistant UUIDs for scan records.

---

## Phase 5: Verification & Testing (P0-P2)

### 5.1 Comprehensive Automated Test Suite (`tests/quota-and-security.test.ts`)
- Test real sliding-window quota across 2 hours.
- Test rejection of unauthenticated tokens, forged HMAC tokens, expired tokens.
- Test rejection of `x-eatinformed-client: test` bypass.
- Test image validation on valid, corrupted, and oversized images.
- Test nullable AI schema outputs.
- Test slot refund on AI failure.
