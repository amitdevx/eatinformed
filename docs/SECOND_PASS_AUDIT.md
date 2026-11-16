# Second pass audit — 2026-11-16

Baseline cd7c3d7. This audit explicitly rejects the claim that the complete original request was finished. Security foundations passed isolated tests; many native effects and production journeys remain unverified.

| Finding | Root cause | Repair | Status |
|---|---|---|---|
| Missing NVIDIA key consumed allowance | configuration checked inside paid-work stage | preflight before reserve | FIX IMPLEMENTED |
| Crashed operations remained pending forever | no stale operation transition | after 120 seconds, transactional interrupted tombstone, no re-execution or extra charge | FIX IMPLEMENTED |
| Mobile accepted malformed results | shallow field checks only | shared runtime schema and stable scan ID required | FIX IMPLEMENTED |
| Result could be hidden by history fetch failure | scan success awaited another backend list call | cache committed response locally; cache failure cannot suppress Result navigation | FIX IMPLEMENTED |
| Server errors hidden behind old history | broad offline fallback | fallback only on transport failure; clear-all requires server list | FIX IMPLEMENTED |
| Full History still capped at 20 | screen imported recent helper | screen loads durable full ledger | FIX IMPLEMENTED |
| Profile errors silent, success haptic premature | catch logged only | visible recoverable error, success only after write | FIX IMPLEMENTED |
| Onboarding created guest accounts | automatic guest call on completion | explicit signed-out state and user choice | FIX IMPLEMENTED |
| Passport pan cancelled itself during open | enabled depended on visible | keep gesture enabled until finalized | FIX IMPLEMENTED; native runtime NOT TESTED |
| Reduced-motion card still sprang in | entrance ignored reduced motion | immediate entrance under reduced motion | FIX IMPLEMENTED |
| APK CI missed shared schema dependencies | installed mobile dependencies only | root npm ci and schema/lockfile workflow triggers | FIX IMPLEMENTED; hosted CI NOT TESTED |

Still incomplete: Google guest upgrade on mobile does not preserve the guest UID; no authorized cross-account migration; local legacy-history import needs explicit ownership workflow; avatars remain local; full history cache/paging is not bounded efficiently; account-switch races need device coverage; signup abuse and system spending controls need deployment configuration; complete request deadline does not cover slow auth/database reads; no protected readiness dashboard; model evidence/interpretation and allergen categories are not fully structured. Remaining dependency advisories require compatibility review.

Motion gaps: original avatar remains visible behind traveller; exact avatar-to-card continuity needs work; Android Back now uses the same reverse animation as close/backdrop; ticker can restart after visibility changes; rolling numbers are scale pulses rather than digit reels; many sheets still use core Animated/PanResponder; progressive edge blur, liquid morphing, layered recession, screen-wide lifecycle/reduced motion and verified 120Hz performance are not implemented. Exact blue reference effect is unidentified. No side-by-side recordings or physical-device performance evidence exists.

ADB has no connected device; no local Android SDK configuration was found. These are blockers to native runtime verification, not evidence that interaction is correct. No production configuration changed and no records deleted.

Verification: 8/8 unit/security and 7/7 Firebase emulator integration cases passed. Both TypeScript checks passed. Lint has zero errors and two warnings. The interrupted-operation repair is INTEGRATION VERIFIED; other client changes are STATIC VERIFIED pending native runtime. The preflight is STATIC VERIFIED.

REGRESSION discovered during Android bundle verification: the shared runtime schema could not resolve outside Metro's project root. Added the repository parent as a watch folder in mobile/metro.config.js. TypeScript did not catch this; bundling must pass before commit.

Web production build and all three public-page browser viewport checks passed again. This does not close the remaining native, production or full-motion gaps above.

Second-pass Android export after Metro repair exited 0: 6.1 MB Hermes bytecode bundle generated. Runtime native behavior still NOT TESTED. Final checks for this repair set: unit 8/8, Firebase integration 7/7, browser 3/3, both typechecks, lint (two warnings), production web build and Android export passed.
