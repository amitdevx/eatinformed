# Flutter mobile screen port verification

Date: 17 November 2026. Branch: `migration/flutter-ui`.

This is the mobile presentation port, not a backend or website migration. Expo remains available. No production data, security rules, credentials or deployments were changed in this work.

## Screen and behavior matrix

| Area | Implemented behavior and files | Evidence | Status and limits |
|---|---|---|---|
| Welcome/auth | `features/auth`: email sign-in, registration, guest entry, authenticated guest-to-email linking, existing Google verifier bridge, recoverable errors, secure restoration | Auth controller, secure store, callback state/challenge and guest link tests; widget guest entry/logout | VERIFIED for controlled HTTP/storage tests. Native browser callback and live accounts IMPLEMENTED, UNVERIFIED |
| Onboarding | `features/onboarding`: introduction, real avatar/name/handle, guest customization lock, review, per-UID completion, Back/Next | Connected onboarding journey test | VERIFIED in widgets; native picker and server handle conflicts need runtime acceptance |
| Home | `features/home`: current account, saved-report aggregates, seven-day activity, scan shortcuts, original three clearly marked samples | Connected navigation and content fixture tests | VERIFIED in widgets. No samples become saved scans |
| History | `features/history`, `core/data`: full cursor traversal, repeated products, nullable ratings, filters, real activity, confirmed deletion, UID cache | Pagination, account-change response rejection and connected empty state tests | VERIFIED for controlled service/widget tests. Native offline restart/export/delete integration IMPLEMENTED, UNVERIFIED |
| Guide | `features/library`, `assets/content`: all four NOVA groups and 22 additive records, search and detail sheets | Content load, E407 search/detail, 320-pixel width and 200% text test | VERIFIED in widgets. Imported educational wording is existing EatInformed content, not newly validated medical guidance |
| Scan | `features/scan`: dedicated navigation route, camera/gallery, full-image preview without implicit crop, EXIF rotation, bounded JPEG preparation, actual quota, cancellation and same-key retry | Route isolation, complete edge/aspect preservation, EXIF, malformed-image, pending retry/cancel/provider failure tests | VERIFIED at controlled transport/image/widget boundaries. Camera sensor/preview, permissions and real scan workflow IMPLEMENTED, UNVERIFIED |
| Results | `features/results`: overview, ingredients/reference sheets, nutrition with original bases, null estimates, personal allergen evidence, text/JSON sharing | Schema rejection/null tests; whole-phrase evidence matches; narrow/large-text report test | VERIFIED in widgets and models. Native share sheet and live provider output IMPLEMENTED, UNVERIFIED |
| Profile/Passport | `features/profile`: collapsing sliver, current avatar/handle, saved-scan statistics, real achievements/activity, measured avatar travel, shared reveal/blur/ticker timeline, single threshold haptic, same-scene Passport | Pull/open/close/repeat, short/horizontal/cancel, scroll-top, reduced motion and Android Back widget assertions | VERIFIED for widget state/gesture assertions. Android blur rendering, haptics, visual comparison and profile timings IMPLEMENTED, UNVERIFIED |
| Settings | `features/settings`: persistent System/Light/AMOLED themes and haptics, profile/allergens, offline reference, JSON export, cache clearing, confirmed history deletion, process reachability and logout | Theme/identity and confirmed logout widget tests | VERIFIED for those assertions. Native exports, OS persistence and deletion against an isolated account IMPLEMENTED, UNVERIFIED |

## Motion architecture

Native controllers, slivers and measured transforms replace Expo animation implementation. `Entrance` retains the inspected 560 ms/22-point/.97-scale stagger specification. `ScrollDepth` derives effects from actual viewport geometry. `RollingValue` transitions only actual displayed values. `NameTicker` paints measured text with retained phase and stops while hidden, backgrounded or reduced-motion.

Profile uses one controller: 0..1 is pull progress, 1..2 is Passport opening. The source/destination avatar rectangles are measured. Content translation, opacity, typography, avatar travel and backdrop blur derive from this timeline. Pointer cancellation returns home. Hidden overlays exclude semantics and touch input. A real Flutter BackdropFilter blurs underlying scene pixels; this is an implementation statement, not Android visual verification.

The independently authored resistance curve reaches 210 resisted points after approximately 332.5 points of raw travel. It is not copied GymMane gesture code. Avatar destination is the actual Passport layout rather than a copied orbit. Native bottom sheets are used; liquid morphing, shader medals, progressive edge shaders and a confirmed match for the unidentified blue effect are NOT STARTED. This port does not claim every GymMane effect or pixel equivalence.

## Confirmed defects corrected during execution

| Reproduction / root cause | Correction | Executed evidence | Remaining limitation |
|---|---|---|---|
| Sliver layoutExtent 190 exceeded header paintExtent 98; child sized only to its row | Header fills the current sliver constraints, with a viable collapsed extent | Connected shell and Passport widget tests | Native visual acceptance outstanding |
| Passport route semantics lacked explicit child nodes; invisible card was discoverable | Explicit route semantics and exclusion while closed; background semantics disabled during reveal | Widget tests mount, open and dismiss without framework exceptions | TalkBack focus review outstanding |
| Interrupted controller futures could remain pending | Cancellable ticker futures with controlled cancellation | Pointer cancellation and repeated opening tests | OS interruption on hardware outstanding |
| Additive E-number boundary escaping was wrong | Escaped code with actual regex word boundaries | Guide/reference tests and static analysis | Broad alias matching not a clinical classifier |
| A new request after pending/error could double charge | Immutable image/idempotency operation retained for retry; pending responses never treated as success | Same payload/key, pending cancellation and 504 tests | Operation key is not persisted across process death; check History before starting another accepted scan |
| Unknown NOVA could lower a displayed percentage | Report classified counts separately; no numerical classification assigned to unknown scans | Nullable model assertions and static inspection | Statistics represent retained records, or explicitly labelled recent offline cache |
| Account switch could apply a stale profile result | Profile updates check expected UID; API requests reject changed identity | Account change rejection tests | Live cross-account runtime acceptance outstanding |

## Executed checks

- `node flutter_app/tool/sync-content.cjs`: 22 additives, four NOVA groups, three samples, copied from EatInformed's own TypeScript data.
- `flutter analyze --fatal-infos`: no issues in the screen port pass.
- `flutter test --concurrency=2 --reporter expanded`: 49 tests passed on the final pre-commit source, including both share choices and the full journey at 320 pixels and 200% text. Log retained locally at `/home/amitdevx/.cache/eatinformed/full-port-tests.log`.
- `git diff --check`: clean in the screen port pass.
- `waydroid status`: Session STOPPED. `adb devices`: no connected devices. Device acceptance is BLOCKED in this environment; no new Waydroid session was started.

The tests inject provider-independent HTTP responses at the client transport boundary. Test sessions, example food reports and synthetic image bytes never went to the live backend. These tests do not prove real Firebase/Firestore/NVIDIA integration, server quota concurrency or production readiness. Existing backend tests and contracts were not rewritten.

## Follow-up parity and accessibility check

The source comparison found that Expo supports text summaries and JSON files from Results. Both choices are now present; native share failures show a recoverable message. A widget test opens both choices and dismisses the sheet with Android Back. Native sheet delivery remains unverified.

The expanded connected journey at 320 pixels and 200% text reproduced horizontal overflow in Home activity rows and vertical overflow in the scanner instruction area. Activity labels now flex above their progress track, and unknown ratings use a neutral track. Scanner instructions, waiting content and errors scroll within available space. Onboarding step changes reset their scroll container. The connected journey now executes without layout exceptions at this size and text scale.

The compiled full-screen APK was also inspected. Its package and ABIs were correct, but the camera dependency merged microphone and legacy storage permissions despite still-only capture with audio disabled. The preview manifest explicitly removes those unused permissions. Gallery selection uses system-granted URI access and sharing uses an app-cache FileProvider. The final merged manifest must be rechecked after the next CI build; device camera/gallery/share tests remain required.

The scroll-depth follow-up corrects upward drift to downward travel proportional to the measured card height, with the reference .18 follow fraction and .08 depth. Opacity eases out as a card leaves the viewport. A foreground tint replaces the color-filter layer. Two focused widget tests check positive measured travel, scale/dimming and static reduced-motion behavior. Pixel equivalence and native frame cost remain unverified.

## Release gates

Obtain the GitHub Actions profile APK for the exact UI commit, verify provenance and digest, then test the preview package beside Expo in an existing Android session. Verify actual Google callbacks with both apps installed, existing-account history, guest quota, readable camera/gallery labels, same-key retry, results and restart, TalkBack, larger fonts, actual blur, haptics, repeated gestures and lifecycle interruption. Record physical-device build/raster timings in profile mode. Retain Expo until those gates pass.

Custom uploaded avatars remain local, explicitly disclosed in the editor, because the existing profile endpoint has no avatar upload contract. Google photos use the existing account photo. Guest email registration links the UID; signing in to another existing/Google account does not silently merge guest data. Server changes require a separate compatibility decision.

## Licensing

No GymMane source, artwork, shaders or fonts were copied. Motion was independently implemented from the audited behavioral specification. Static NOVA/additive/sample content and the leaf icon belong to the existing EatInformed application. Framework components and third-party packages retain their package licenses and Flutter's generated notices. Direct reuse of GymMane remains subject to GPL/additional terms review.
