# Flutter mobile UI migration

Status: mobile screen port implemented, with controlled service/widget verification. Device acceptance and production cutover remain outstanding. See FLUTTER_SCREEN_PORT_VERIFICATION.md.

## Scope and baselines

EatInformed baseline: `1e66c9adf72ced8decaea8de9191ce24f4e6a649`.
GymMane reference: `9fa8e4c37f7fcfb15ac72c5e5fe2b56209fe5446`.
Branch: `migration/flutter-ui`.

Only mobile presentation and its client adapters change. Keep Expo in `mobile/`, Next.js, Firebase Auth, Firestore, NVIDIA, API schemas and account ownership. New client lives in `flutter_app/` with a separate Android application ID for side-by-side acceptance testing. No server rules, records, secrets or deployment configuration are migrated.

## Source inventory and architecture comparison

EatInformed inspected: mobile/src/App.tsx, navigation/types.ts, api/client.ts, api/scan-request.ts, lib/auth.ts, lib/history.ts, theme/{colors,tokens,motion,animations}, screens/{Onboarding,Auth,Home,History,Scan,Guide,Result,Profile}Screen.tsx, components/{ProfileReveal,FoodPassportModal,NameTicker,FloatingNavBar,SettingsSheet,EditProfileSheet}. Current API request, scan, auth, profile and history handlers and shared analysis schema were also read to preserve transport behavior.

GymMane inspected at the pinned reference: lib/screens/profile_screen.dart, recap_screen.dart; widgets/name_ticker.dart, entrance.dart, scroll_away.dart, glass.dart, liquid_notch.dart, rolling_text.dart, shimmer.dart; theme/app_theme.dart; app/gymmane_app.dart, app_shell.dart; LICENSE, ADDITIONAL_TERMS.md and CREDITS.md. Its global workout state and Dart server are not port targets.

Expo currently mixes core Animated, Reanimated, gesture handlers and per-screen state. Flutter will use native controllers, slivers, measured transforms, repaint boundaries and feature repositories. Do not mechanically translate widgets or transplant GymMane's global state.

## Licensing boundary

EatInformed is MIT. GymMane is GPL-3.0-only with an additional appropriate-legal-notice attribution requirement, `Based on GymMane by InlitX`. Attribution alone does not satisfy GPL redistribution requirements. Its exercise art has separate CC BY-SA provenance; Nunito uses SIL OFL.

Implementation policy: independently authored Flutter code from behavioral specifications, existing EatInformed identity, platform fonts and Flutter Material icons. No GymMane source, shader, font or artwork is included. Any future direct reuse needs a separate license review. A source reference is not a license compatibility determination.

## Motion reference specification

Values below describe inspected GymMane behavior, not device-verified equivalence.

| Effect | Reference behavior | EatInformed adaptation and acceptance |
|---|---|---|
| Entrance | 560 ms easeOutCubic; 40 ms plus 70 ms stagger capped at index 7; 22 logical-pixel rise; 0.97 initial scale | Once per screen lifetime; reduced motion renders settled state; no replay on every tab visit |
| Profile pull | At scroll <=0.5, accumulated pointer deltas; decreasing resistance; 210 resisted-pixel reach | Explicit vertical intent and top eligibility; preserve normal scrolling; threshold tests cover below/at/above reach |
| Pull progress | pull/reach clamped to 0..1; content translates by 0.55*pull and fades | One shared timeline for content, avatar, ticker and reveal; no independent thresholds |
| Ticker | Canvas text, 118 default font size, 38 logical pixels/sec; repeating measured spans; elapsed phase retained on pause | Active only while visible, foreground and motion allowed; no semantic repetition; pause without jumping |
| Pull typography | Reveal starts at 15%; ease-in opacity; scale 1.3 to 1 with easeOutCubic | Preserve coordinated layering; confirm readability on Android |
| Avatar | 86 to 150 reference size; entry phase then curved travel; 1.06 activation pop, 260 ms easeOutBack | Measure real source/destination; use current avatar; hide duplicate source; no copied orbital implementation |
| Unarmed release | 320 ms easeOutCubic spring-back appearance | Interruptible return; pointer cancel always cancels, even if armed |
| Recap navigation | 380 ms enter, 300 ms reverse fade | Passport same-scene overlay with actual backdrop blur and dimming; Back, backdrop and close share dismissal |
| Header blur | sigma 14*pull progress; banner scale up to 1.35 | Limit blur bounds and profile raster cost before expanding effects |
| ScrollAway | depth .08, follow .18, dim .45, lead 64; measured card/viewport geometry | Use sliver position and transforms; no repeated layout measuring every frame |
| Glass sheets | .92 entry scale; underlying sheet displacement up to 36; overscroll close at 72 | Focus/touch isolation, platform Back, dynamic text and safe area acceptance |
| Liquid | 650 ms enter, 450 ms exit | Defer until core flows pass; independently authored only if justified |
| Shimmer | 1300 ms, one pass | No fake upload or AI progress |

GymMane's pointer-cancel-to-release behavior and global text scale cap are deliberately not adopted. The unidentified blue scrolling effect is unresolved; do not invent a match.

## Screen-by-screen implementation sequence

| Order | Screen/feature | Data and implementation | Required evidence |
|---|---|---|---|
| 0 | Foundation | Config, typed API transport, secure session interface, auth state, theme/motion tokens, lifecycle, tests, isolated CI APK | Analyze/unit/widget tests; artifact pinned to commit |
| 1 | Welcome and Auth | Deliberate entrance; real guest/email flows, restore session; Google through existing code/verifier bridge | Guest/member/logout/restore; browser callback and ownership tests |
| 2 | Home | Sliver dashboard, real history aggregates, staggered cards; unknown ratings stay unknown | Empty/loaded/error/offline, tab return, text scaling |
| 3 | History | Account-scoped paginated records; actual totals; deletion/export clearly distinguished | Pagination, switch accounts, network failure, export, confirmed deletion |
| 4 | Guide | EatInformed NOVA and additive reference content with sheets and measured layout | Search, keyboard/semantics, long text, no clinical claims |
| 5 | Scan | Dedicated route hides floating navigation; safe-area camera controls; full gallery image; orientation/compression | Physical capture, gallery edge text, preview geometry, permission denial, button hitboxes |
| 6 | Results | Typed actual scan; nullable estimates; nutrition basis/units; evidence warnings | Fixture rendering, real-provider authorized flow, unknown fields, navigation and share |
| 7 | Profile and Passport | Sliver header and coordinated pull controller; real profile/history; actual blur; measured avatar travel | Pull/cancel/repeat/background/Back/blur video; modest physical device frame timings |
| 8 | Settings and Onboarding | System/light/AMOLED, haptics, account preferences, handle reservation through existing endpoint | Persistence, guest locks, server handle conflicts, sign out, keyboard and Back |
| 9 | Parity acceptance | All screens on same immutable APK artifact; existing Expo retained | End-to-end device workflow, API regressions and rollback exercise |

## Foundation boundaries

Use Flutter ChangeNotifier/ValueNotifier, Navigator and framework animation/rendering primitives first. Keep transport injectable for tests, secure storage behind an interface, and features dependent on repositories rather than raw HTTP. No paid provider request is made from Flutter. No provider key belongs in dart-define or assets.

Existing backend authentication remains Firebase. The client can use existing verified `/api/auth/mobile` guest/email/refresh/link operations without provisioning another Firebase project or embedding a server credential. Google uses the existing exact callback and one-use verifier exchange; the parallel app cannot claim Expo's callback simultaneously until callback ownership is tested.

Theme supports ThemeMode.system/light/dark with black dark scaffold, semantic surface/text/status colors and no global text-scale cap. Reduce motion disables travel/stagger/loops. Profile-mode frame measurements are required before any smoothness claim.

## Existing-contract constraints

POST /api/scan: image data URI, verified bearer identity, stable Idempotency-Key. Pending 409 must continue the same operation. Guest quota is 4 accepted scans/7200 seconds; members retain configured policy. Accepted work currently counts even on failure. Do not silently change refund behavior.
GET /api/scan?quota=true, GET/PATCH /api/profile, GET /api/history?cursor=..., DELETE /api/history?id=... remain unchanged. Preserve schemaVersion, requestId and machine codes. History total currently means retained scans, not lifetime activity. Existing avatars/handle-onboarding persistence have known gaps; migration must surface them rather than invent data.

## Risks and gates

- Local secure sessions cannot simply be copied from Expo. Reauthenticate and load server-owned history.
- Google callback, Android signing and app ID must be verified before production identity adoption.
- Camera crop precision requires actual sensor/preview testing, not a screenshot.
- Blur/shaders can increase raster work. Measure profile mode on physical hardware.
- Flutter alone does not repair backend/profile contract defects. Report compatibility blockers without changing server schemas.
- Current public website remains Next.js; Flutter Web is out of this UI-only mobile scope.
- No production release, database migration, record deletion or credential change is authorized.

## Reporting

Each feature records changed files, executed tests, results, commit and unresolved work. Use VERIFIED only for executed assertions; IMPLEMENTED, UNVERIFIED for missing runtime proof. No compilation-only gesture/blur/performance PASS.

## Foundation implementation notes

The separate client uses Flutter 3.50.0 / Dart 3.14.0 and the official material_ui package introduced by the SDK's component separation. Its package is `com.eatinformed.preview.eatinformed_mobile`, distinct from Expo. Auth, profile and scan endpoints are not modified. Tests inject HTTP and storage boundaries; mock credentials never go to production. Foundation welcome/email/guest and the small authenticated boundary are not full screen parity. Platform secure-storage behavior, live auth, Google callbacks and release smoothness remain device acceptance work.
