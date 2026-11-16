# Implementation plan

See REPAIR_PLAN_2026-11-16.md for the dependency order. Authentication and centralized scan enforcement precede persistence and clients; strict AI validation precedes unknown-state rendering. Tests precede local commit. Production configuration, rules deployment, destructive migrations and rollout remain owner-controlled.

Outstanding: real Google upgrade journey, trustworthy real-label accuracy corpus, physical Android gesture/blur/haptics/performance, crash recovery for pending operations, anonymous signup abuse controls, production dependency readiness and monitoring. Legacy unowned local histories remain untouched; an explicit ownership-confirmed migration is needed.
