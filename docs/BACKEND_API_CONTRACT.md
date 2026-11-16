# API contract v1

POST /api/scan: Firebase ID token in Bearer Authorization, or separately verified HttpOnly session cookie. Same-origin browser mutations only. Strict JSON `{image: data URI}`; body <=4 MiB, decoded image <=3 MiB. Required Idempotency-Key: 16–128 alphanumeric, underscore or hyphen characters. JPEG/PNG/WebP only; full decode, 6000px edge /25MP caps, single frame, EXIF orientation, metadata removal.

Success: actual validated analysis, status success, schemaVersion 1, scanId, requestId and quota. Ratings and NOVA may be null. Dietary and ingredient flags may be null. Nutrition preserves raw text, units and separate perServing/per100g/per100mL fields. Rating is an unvalidated AI heuristic on the existing 0–5 scale, not a clinical score.

Errors: status error, stable code, safe error, requestId. HTTP 400 invalid input; 401 credentials; 403 origin/ownership; 409 pending/conflicting idempotency; 410 deleted replay; 413 size; 415 media; 422 unreadable/no food label; 429 quota; 502 provider/output; 503 unavailable configuration/provider; 504 timeout; 500 unexpected persistence/internal failure.

Quota: 4 accepted guest scans over 7200 seconds. Members default to 50/3600 seconds, configurable with MEMBER_QUOTA_LIMIT. Atomic UID document admission. Every event expires independently. Admission follows auth and full validation. Accepted provider work counts on failure; no refunds. Same key/payload replays completed response; pending returns 409 and never fabricated success. Different payload returns 409. Metadata: limit, remaining, windowSeconds, nextAvailableAt, retryAfterSeconds, isGuest; legacy field aliases retained.

GET /api/scan: process liveness only. `?quota=true` requires authentication. GET /api/history: pages of 100 with cursor and accurate retained totalScans. DELETE /api/history?id=scanId deletes the caller's record and replaces replay product data with a tombstone. Profile PATCH validates name, handle, allergen preferences; handle claims are transactional. Avatars remain local references, not trusted backend assets.

Mobile sessions use Firebase ID/refresh tokens stored in SecureStore. Legacy custom guest sessions require a new login. Email guest upgrades link the same UID. Existing-account conflicts keep histories separate. Google bridge returns only a one-use code to an exact app callback and requires its SHA-256 verifier. Expired unused exchanges need an operational TTL policy; no TTL or rules were deployed.
