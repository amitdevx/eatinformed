# EatInformed: Backend Defect Register

**Reference Revision**: `cf0f5a1`  
**Tracking Date**: November 15, 2026  

---

## Defect Register

| Defect ID | Severity | File / Location | Actual Behavior | Expected Behavior | Root Cause | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-001** | Critical | `src/app/api/scan/route.ts:234` | Header `x-eatinformed-client: test` returns fake product analysis without calling AI. | Real AI processing or isolated test mock injection. Public header must not bypass runtime AI. | Debug/test shortcut left in production endpoint code. | FIX PLANNED |
| **DEF-002** | Critical | `src/app/api/scan/route.ts:148` | Any string starting with `test_member_` or `test_guest_` bypassed token verification. | Only cryptographically verified Firebase ID tokens/session cookies or HMAC guest tokens accepted. | Hardcoded test token prefix check in `verifyUserToken`. | FIX PLANNED |
| **DEF-003** | Critical | `src/components/features/ImageUploadForm.tsx:402` | Web scans call `analyzeProduct()` directly via Server Action, bypassing `/api/scan` quota. | Web scans submit to `/api/scan` with user's Firebase token and consume quota. | Direct Server Action import in client component. | FIX PLANNED |
| **DEF-004** | High | `src/app/api/scan/route.ts:165` | `consumeQuotaSlot` called before request body JSON is parsed or validated. | Validate body and image first; reserve quota immediately before calling AI. | Incorrect step sequencing in POST handler. | FIX PLANNED |
| **DEF-005** | High | `src/app/api/scan/route.ts:282` | If AI fails, error message is raw exception string and status is 500 without structured error schema. | Structured error schema `{ error, code, slotRefunded, requestId }` with appropriate status (502, 503, 504). | Generic catch block with direct `error.message` output. | FIX PLANNED |
| **DEF-006** | High | `src/ai/flows/product-analysis.ts:245` | Missing NOVA group defaults to 4; missing rating defaults to 2.5; pros/cons assume NOVA 4. | Missing values return `null` (Unknown); no false negative pros/cons generated. | Hardcoded `?? 4` and `?? 2.5` fallback logic. | FIX PLANNED |
| **DEF-007** | High | `src/ai/flows/product-analysis-types.ts:10` | Zod schema transforms `null` to `4` for `novaGroup` and `false` for dietary suitability. | Nullable fields (`novaGroup: z.number().nullable()`, `isVegan: z.boolean().nullable()`). | Over-eager Zod default transformations. | FIX PLANNED |
| **DEF-008** | High | `src/app/api/scan/route.ts:208` | Only regex check on data URI; no magic byte verification or Sharp image decode test. | Validate image magic bytes (PNG/JPEG/WEBP) and decode with Sharp before AI call. | Naive string prefix validation. | FIX PLANNED |
| **DEF-009** | Medium | `mobile/src/lib/history.ts:8` | Scan history is stored under a single global key `eatinformed_mobile_history_v2`, capped at 20 items. | History is partitioned by user ID/handle; separate recent cache from full durable ledger. | Static storage key and 20-item array truncation. | FIX PLANNED |
| **DEF-010** | Medium | `mobile/src/lib/auth.ts:176` | Failed guest creation falls back to `guest_session_${Date.now()}`. | Throw an explicit error to alert the user that guest auth failed. | Silent fallback to unauthenticated timestamp token. | FIX PLANNED |
