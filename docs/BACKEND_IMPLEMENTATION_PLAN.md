# Implementation plan

See REPAIR_PLAN_2026-11-16.md for the dependency order. Authentication and centralized scan enforcement precede persistence and clients; strict AI validation precedes unknown-state rendering. Tests precede local commit. Production configuration, rules deployment, destructive migrations and rollout remain owner-controlled.

Outstanding: real Google upgrade journey, trustworthy real-label accuracy corpus, physical Android gesture/blur/haptics/performance, crash recovery for pending operations, anonymous signup abuse controls, production dependency readiness and monitoring. Legacy unowned local histories remain untouched; an explicit ownership-confirmed migration is needed.

## Second-pass correction

See SECOND_PASS_AUDIT.md for confirmed incomplete repairs and the current remaining-work register. Stale pending scans settle to a 504 interrupted tombstone after 120 seconds when retried, preserving quota and preventing provider re-execution. Missing provider configuration is rejected before reservation. The complete original scope remains unfinished; no production-readiness claim is made.
