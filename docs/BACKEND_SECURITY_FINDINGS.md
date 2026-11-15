# EatInformed: Backend Security Findings & Vulnerability Report

**Audit Target**: `src/app/api/scan/route.ts`, `src/app/api/auth/[...action]/route.ts`, `src/ai/flows/product-analysis.ts`, `src/components/features/ImageUploadForm.tsx`  
**Severity Scale**: Critical, High, Medium, Low  
**Date**: November 15, 2026  

---

## 1. Vulnerability Findings Matrix

| Finding ID | Severity | Category | Component | Description | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | **Critical** | Authentication Bypass | `src/app/api/scan/route.ts` | Arbitrary client string or test prefix (`test_member_`, `test_guest_`) recognized as valid identity. | FIX PLANNED |
| **SEC-002** | **Critical** | Backdoor / Test Bypass | `src/app/api/scan/route.ts` | `x-eatinformed-client: test` header bypasses IP limiter and returns fake successful analysis. | FIX PLANNED |
| **SEC-003** | **Critical** | Unauthenticated Access | `ImageUploadForm.tsx` / `product-analysis.ts` | Direct import of `'use server'` `analyzeProduct` enables public Server Action invocation bypassing `/api/scan` auth & quota. | FIX PLANNED |
| **SEC-004** | **Critical** | Broken Guest Auth | `mobile/src/lib/auth.ts` & `src/app/api/auth/` | Silent fallback to unverified timestamp tokens (`guest_session_${Date.now()}`) when backend auth fails. | FIX PLANNED |
| **SEC-005** | **High** | Rate Limit Bypass | `src/lib/quota.ts` | In-memory `Map` quota storage fails to synchronize across serverless instances or survivable restarts. | FIX PLANNED |
| **SEC-006** | **High** | Quota Premature Charge | `src/app/api/scan/route.ts` | Quota was consumed before payload parsing and image validation, risking unfair quota loss. | FIX PLANNED |
| **SEC-007** | **High** | Information Disclosure | `src/app/api/scan/route.ts` | Unsanitized error messages and provider stack traces returned in HTTP 500 error responses. | FIX PLANNED |
| **SEC-008** | **High** | Improper Input Validation | `src/app/api/scan/route.ts` | Image validation relies solely on regex prefix (`data:image/...`), without inspecting magic bytes or dimensions. | FIX PLANNED |
| **SEC-009** | **High** | AI Data Distortion | `src/ai/flows/product-analysis.ts` | Missing NOVA group defaults to 4; missing rating defaults to 2.5; dietary suitability defaults to false. | FIX PLANNED |
| **SEC-010** | **Medium** | Cross-Account Data Leak | `mobile/src/lib/history.ts` | Global shared AsyncStorage key (`eatinformed_mobile_history_v2`) without user partition. | FIX PLANNED |

---

## 2. In-Depth Vulnerability Analysis

### SEC-001: Authentication Token Verification & Test Prefix Backdoor
- **Location**: `src/lib/quota.ts:164-170`, `src/app/api/scan/route.ts:72-74`
- **Root Cause**: The verifier permitted tokens starting with `test_member_` or `test_guest_` to pass without cryptographic verification or environment boundary checks. Additionally, Firebase verification did not enforce explicit revocation checks.
- **Remediation**:
  1. Remove `test_member_` and `test_guest_` prefixes from runtime token verification.
  2. For guest users: Require cryptographically signed HMAC-SHA256 tokens (`guest_${b64}.${sig}`) with temporal validity checks, or Firebase anonymous ID tokens.
  3. For registered members: Call `adminAuth.verifyIdToken(token, true)` with revocation checking enabled, falling back to `verifySessionCookie(token, true)`.
  4. Fail closed with HTTP 401 (`code: 'auth_required'` or `'token_invalid'`).

### SEC-002: Public Request Header Fast-Path (`x-eatinformed-client: test`)
- **Location**: `src/app/api/scan/route.ts:130, 234-257`
- **Root Cause**: An HTTP header `x-eatinformed-client: test` caused the endpoint to bypass the IP burst limiter and return a synthetic product analysis `{ productName: 'Automated Test Label', rating: 4.5 }`. Anyone sending this header could bypass security controls.
- **Remediation**:
  Completely excise `clientType === 'test'` checks from `src/app/api/scan/route.ts`. Production request handlers must never mock AI responses based on client-controllable headers.

### SEC-003: Public Server Action Bypass on Web Scans
- **Location**: `src/components/features/ImageUploadForm.tsx:9, 402`
- **Root Cause**: `ImageUploadForm.tsx` imported `analyzeProduct` directly from `src/ai/flows/product-analysis.ts`, which has `'use server'` at the top. Next.js creates an unauthenticated public RPC endpoint for all `'use server'` exports, completely bypassing `/api/scan` rate limiting, token verification, and quota limits.
- **Remediation**:
  1. Refactor `ImageUploadForm.tsx` to submit scans via HTTP `fetch('/api/scan')` with Authorization headers (`Bearer ${idToken}`).
  2. Enforce authentication and quota checks on all web scans identically to mobile.

### SEC-004: Silent Fallback to Unverified Guest Tokens
- **Location**: `mobile/src/lib/auth.ts:172-182`, `src/app/api/auth/[...action]/route.ts:59-66`
- **Root Cause**: When Firebase guest registration timed out or encountered errors, mobile code generated a dummy `guest_session_${Date.now()}` token. When submitted to the server, it produced unexpected auth failures or inconsistent behavior.
- **Remediation**:
  1. In `src/app/api/auth/[...action]/route.ts`, issue cryptographically signed HMAC tokens if Firebase API key is unavailable, or return HTTP 503.
  2. In `mobile/src/lib/auth.ts`, fail loudly and show a user-recoverable error when guest creation fails rather than proceeding with a bogus token.
