# Security findings and defect register

| Severity | Source/function | Baseline behavior/root cause | Corrective change | Status / remaining risk |
|---|---|---|---|---|
| Critical | quota.ts / auth route | hardcoded/public signing fallback authorized synthetic guests | remove custom tokens; Firebase Admin only | FIX IMPLEMENTED; emulator tests |
| Critical | product-analysis.ts exports | use server exposed expensive functions | internal module, centralized scan service | STATIC VERIFIED |
| Critical | quota.ts admission | JSON file and Map local to process | Firestore UID transaction | INTEGRATION VERIFIED in Firebase emulator |
| High | quota.ts refund | removed latest unrelated event | explicit accepted-work accounting; no refunds | FIX IMPLEMENTED |
| High | scan route idempotency | local result-only cache, no payload binding | durable operation hash/state/replay | FIX IMPLEMENTED |
| High | mobile-auth redirect | arbitrary URL received tokens | exact callback + one-use verifier exchange | FIX IMPLEMENTED; real Google journey NOT TESTED |
| High | nim.ts parser | repaired truncated JSON into success | strict parsing; truncation rejection | STATIC VERIFIED; unit tests |
| High | AI flow errors | provider exceptions became unreadable | typed safe provider errors | FIX IMPLEMENTED; emulator route tests |
| High | image validation | metadata only and permissive base64 | bounded streamed body, canonical base64, full decoder | STATIC VERIFIED; decoder tests |
| High | history clients | unscoped web and email-prefix mobile collisions; truncated totals | UID-owned durable server history and scoped cache | FIX IMPLEMENTED; legacy history intentionally not auto-assigned |
| High | result UI | missing values became zero; mixed nutrition bases | nullable shared contract, explicit unit comparisons | FIX IMPLEMENTED; device rendering NOT TESTED |
| Medium | logout | GET mutation and global revocation | POST cookie removal only | STATIC VERIFIED |
| Medium | profile | login overwrote creation/name; stale account profile | account API, preserved creation, clear before loads | FIX IMPLEMENTED |
| Medium | Profile gesture | nested responders and mismatched motion ranges | coordinated native gesture, shared progress and blur target | FIX IMPLEMENTED; Android runtime BLOCKED |

Public test-header shortcut was already removed at baseline. No new bypass was introduced. Confirmed findings are based on source; no production exploitation is claimed.
