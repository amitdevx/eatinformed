# Flutter UI mapping, 18 November 2026

This register applies the owner's [three-way mapping](</home/amitdevx/Downloads/EatInformed_GymMane_Three_Way_UI_Motion_Mapping_2026-11-18.md>) to the current Flutter migration. It records source-backed differences and actual test evidence; it does not assert visual parity.

## Source baselines

| Source | Revision checked | Authority |
| --- | --- | --- |
| GymMane `main` | `ffecd1980e8649a47d4d5bb92724b3a591ad71a9` remote; local checkout `6bf6fb8dc161be92598e6719349828f35707eee0` | Motion and visual behavior. The remote changes to Settings since local checkout add fitness-specific quick tiles, watch, and help; none belong in EatInformed. |
| EatInformed `master` | `1e66c9adf72ced8decaea8de9191ce24f4e6a649` | Mobile product structure, labels and actions. |
| EatInformed `migration/flutter-ui` | `4bec211c8e223820007a06f2ebf6d586eb6546f6` before this repair | Flutter code and API integration. |

GymMane is GPL-3.0-only with additional attribution terms. This branch uses independently written Flutter behavior and does not copy GymMane source or artwork. Nunito is distributed with its OFL notice.

## Screen and component matrix

| Area | GymMane pattern | RN product source | Flutter target and action | State |
| --- | --- | --- | --- | --- |
| App shell | `app_shell.dart`: floating glass navigation and liquid selection | `FloatingNavBar.tsx`: Home, History, Scan, Guide, Profile | `app/mobile_shell.dart`, `design/widgets/floating_navigation.dart`: keep destinations and center Scan; compare drag/tap on device | KEEP, visual comparison pending |
| Edge blur and sheets | `glass.dart`: progressive edge and modal glass | `GlassSurface.tsx`, Settings and Guide sheets | `design/widgets/edge_blur.dart`, `surfaces.dart`: keep fallback strips; compact native glass selection sheet added for theme | RESTYLE, device blur pending |
| Settings | `settings_screen.dart`: grouped settings rows, purposeful icons and sheets | `SettingsSheet.tsx`: theme/haptics, dietary links or flags, export, cache, ping, sign-out | `features/settings/settings_screen.dart`: rename false protection links, retain persisted controls, correct role label, show package version | FIX; widget and Waydroid guest flow verified |
| Home | `home_screen.dart`, `entrance.dart`, `scroll_away.dart`: selective depth and entrances | `HomeScreen.tsx`: hero, rating ring, actions, trend, samples, NOVA | `features/home/home_screen.dart`: real scan/rated counts, icon shortcuts, sample rating and NOVA, distinct title hierarchy; no invented cache metric. Device screenshot exposed a shortcut wrapping defect; equal-width quick links are implemented for the next APK. | RESTYLE; final layout needs device retest |
| Authentication | `onboarding_screen.dart`: contextual steps and progress | `SignedOutScreen.tsx`, `OnboardingScreen.tsx` | `features/auth/sign_in_screen.dart`, `onboarding/onboarding_screen.dart`: preserve auth contract; show action-specific waiting text and disable duplicate requests | FIX, widget verified; OAuth device pending |
| History | selective scroll depth and list entrances | `HistoryScreen.tsx`: 30-day activity, filters, delete | `features/history/`: retain account records, cache distinction, confirmations | KEEP, more device states pending |
| Scan | camera choreography only; no GymMane food flow | `ScanScreen.tsx`: camera/gallery, preview, quota, analyze | `features/scan/scan_screen.dart`: full screen, nav hidden; physical camera/crop still pending | KEEP, device camera blocked |
| Results | staged sections and glass details | `ResultScreen.tsx`: nullable rating, NOVA, nutrition, ingredients, allergens, share | `features/results/result_screen.dart`: preserve unknown values and API contract | KEEP, real scan pending |
| Guide | glass detail sheets | `GuideScreen.tsx`: NOVA and additive dictionary | `features/library/guide_screen.dart`: preserve bundled data and search, no false registry count | KEEP, sheet/device pending |
| Profile and Passport | `profile_screen.dart`, `recap_screen.dart`, `name_ticker.dart`: resisted pull, avatar path, ticker | `ProfileScreen.tsx`, `FoodPassportModal.tsx`: real identity, metrics, share | `features/profile/`: deliberate pull opened Passport; Android Back closed it and a second pull reopened it in Waydroid. Exact avatar path, blur and timing pending. | Functional gesture VERIFIED in Waydroid; visual parity pending |
| Onboarding | page entrance and progress | `OnboardingScreen.tsx`: name/handle, avatar, review | `features/onboarding/onboarding_screen.dart`: three post-auth stages and guest lock; still visually sparse | RESTYLE pending |

## Settings parity and copy/icon decisions

| Control | RN source behavior | Correct Flutter behavior | Status |
| --- | --- | --- | --- |
| Interface Theme | System/Dark/Light local preference | Persisted System/Dark/Light choice in compact glass sheet; current Dark is AMOLED black | FIX |
| Haptic Tactile Feedback | Local switch | Persisted switch; existing haptic call sites still need full audit | KEEP |
| Strict Allergen Alerts | Local switch without proven scan-result integration | `Allergen preferences` opens profile customization or guest upgrade; no protection claim | FIX |
| Offline Additive Protection | Local switch without actual cache-policy effect | `Additive dictionary` opens bundled reference | FIX |
| Export Scan History (JSON) | Share history | Fetch full server history then share JSON | KEEP |
| Clear Local Scan Cache | Confirm and remove local cache | Confirm and clear account-scoped local cache only | KEEP |
| Backend AI Health Check | API ping mislabeled AI health | `Backend reachability`; ping says only API reachable | FIX |
| Clinical Additive Registry | Hard-coded 12,400+ claim | Omitted; bundled dictionary has 22 entries | REMOVE |
| Sign-out | Member versus guest wording | `Sign Out of EatInformed` or `Exit Guest Mode`, then confirmation | FIX |
| Version and notices | Expo config version | Installed Flutter package version/build and open-source notices | ADD |
| Wallpaper, cover photo, blur/performance toggles | No RN product feature | Keep absent until storage, removal, fallback and actual effects are implemented | BLOCKED product scope |

Icon meanings: Home house; History history clock; Scan frame; Guide open book; Profile user circle; theme paintbrush; haptics vibration; allergen preferences shield; additive dictionary book; export download; local cache trash; API reachability pulse; sign-out exit. Home sample metadata uses a star for the *AI estimate* and an explicit NOVA label. These choices preserve RN destinations without importing fitness content.

## Motion and verification notes

- Retain GymMane-derived reference values already represented in Flutter: 560 ms entrance with 22 px rise and 0.97 scale, 380 ms route entrance, 210 resisted Profile reach, 320 ms return, and measured scroll depth. These are source specifications, not device parity proof.
- The compact theme sheet uses the existing `GlassSurface` and a local transparent Material layer so selection ink remains visible. It does not alter Guide or Result sheet sizing.
- Settings and Home changes have no backend schema or credential changes. The only new package is `package_info_plus` for the installed version and build number.
- Auth entry now distinguishes email sign-in, account creation, Google waiting and guest creation in its busy label; startup reports session restoration. A widget test holds the guest request pending and confirms its button is disabled. It does not prove a live Google callback or account creation.
- Current source and widget tests do not prove physical camera framing, haptics, blur, frame pacing, Google sign-in, real-provider scans, or a three-way GymMane runtime comparison. The prior GymMane APK exited with Android `LOW_MEMORY` in Waydroid.

## Android evidence and remaining comparison work

GitHub Actions run `44255052495` built profile APK for commit `e08865e6a68c29440def56f1124ec54ce5662ce0`. Artifact `14405992231` included matching `commit.txt`; its `SHA256SUMS` check passed. The installed package and foreground activity were `com.eatinformed.preview.eatinformed_mobile`, not the production React Native package. Waydroid was already started by the owner. At a temporary 400 x 864 viewport, the guest onboarding flow reached [Home](flutter-ui-evidence/eatinformed-e08865e-home.png), [Settings](flutter-ui-evidence/eatinformed-e08865e-settings.png), the [theme sheet](flutter-ui-evidence/eatinformed-e08865e-theme.png), and [Food Passport](flutter-ui-evidence/eatinformed-e08865e-passport-test2.png). The `e08865e` Home screenshot records the shortcut wrapping defect corrected after this build; it must not be presented as the corrected final layout.

In that installed build, Allergen preferences led a guest to the account-upgrade screen, Additive dictionary opened Guide, package version displayed `0.1.0 (10)`, and the first deliberate long Profile pull opened Passport. Android Back closed it; another long pull reopened it. A shorter pull did not open Passport. The Profile stat row is intentionally horizontally scrollable and follows the React Native four-stat order, although the final item is partially visible until swiped. This evidence establishes route and gesture behavior in Waydroid, not motion matching, true backdrop blur, haptic output, camera framing, frame rate, or a real provider scan. GymMane and RN were not rendered in equivalent runtime states, so the three-way visual comparison remains open.
