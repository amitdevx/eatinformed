# EatInformed System Defect Register

> **Status Reference:** `ROOT CAUSE IDENTIFIED` | `FIX IMPLEMENTED` | `RUNTIME VERIFIED` | `BLOCKED`  
> **Last Updated:** November 15, 2026  

---

## Defect Register Summary

| Defect ID | Subsystem | Severity | Status | Short Description |
| :--- | :--- | :--- | :--- | :--- |
| **DEF-01** | Navigation | High | ROOT CAUSE IDENTIFIED | FloatingNavBar FAB circle top half clipped by `GlassSurface` `overflow: 'hidden'`. |
| **DEF-02** | Scan / Camera | Critical | ROOT CAUSE IDENTIFIED | Bottom camera controls (shutter & gallery) covered by FloatingNavBar. |
| **DEF-03** | History | High | ROOT CAUSE IDENTIFIED | `ScanActivityHeatmap` 30-day cells collapse to 0px height on Android Yoga engine. |
| **DEF-04** | History | Medium | ROOT CAUSE IDENTIFIED | Delete button inside `Card` is intercepted by card's outer `PressableScale`. |
| **DEF-05** | Home | High | ROOT CAUSE IDENTIFIED | Injected fake 4.2 score and hardcoded May 12-18 trend data for new users. |
| **DEF-06** | Theme | Medium | ROOT CAUSE IDENTIFIED | Four redundant theme modes (`system`, `dark`, `amoled`, `light`) and home header toggle button. |
| **DEF-07** | Result / Share | High | ROOT CAUSE IDENTIFIED | Product share only supports text string; lacks true `.json` file creation. |
| **DEF-08** | Result / Notice | Medium | ROOT CAUSE IDENTIFIED | Health notice cards display thick dark creamy borders instead of semantic bright red warning. |
| **DEF-09** | Guide | Low | ROOT CAUSE IDENTIFIED | Decorative status dots beside NOVA groups; lacks long-press popup sheets. |
| **DEF-10** | Profile / Passport | High | ROOT CAUSE IDENTIFIED | Food Passport card visible in profile body; pull-down gesture conflicts; fake barcode; missing avatar. |
| **DEF-11** | Profile / Snapshots | Low | ROOT CAUSE IDENTIFIED | First polaroid snapshot offset `-60px` off-screen left; missing blank placeholder. |
| **DEF-12** | Profile / Edit | High | ROOT CAUSE IDENTIFIED | Edit profile does not load current avatar on re-open; handle and allergens not persisted. |
| **DEF-13** | Profile / Histogram | Medium | ROOT CAUSE IDENTIFIED | Annual histogram shows hardcoded 184 scans across 12 months for new accounts. |
| **DEF-14** | Onboarding / Auth | Critical | ROOT CAUSE IDENTIFIED | App auto-provisions guest mode on first launch without showing guided onboarding. |
| **DEF-15** | Scan / Crop | High | ROOT CAUSE IDENTIFIED | Captured photo is uploaded full-frame without cropping to viewfinder dimensions. |
| **DEF-16** | Copy / Style | Low | ROOT CAUSE IDENTIFIED | Em-dashes and emojis present in UI copy; progress bar design uses fake asymptotic timer. |

---

## Detailed Defect Records

### DEF-01: FloatingNavBar FAB Circle Top Half Clipped
* **Subsystem:** `mobile/src/components/FloatingNavBar.tsx` & `GlassSurface.tsx`
* **Severity:** High
* **Expected Behavior:** Center Scan FAB circle (`56x56`) floats gracefully above the pill island with a raised specular elevation.
* **Actual Behavior:** Top 14 pixels of the circle are sliced off horizontally by the container border.
* **Reproduction:** Open app on any device; inspect the center Scan button.
* **Root Cause:** `FloatingNavBar` wraps all slots inside `<GlassSurface>`, which has `overflow: 'hidden'`. The FAB has `position: 'absolute', top: -14`, so its top 14px exceed the boundary and are clipped.
* **Proposed Solution:** Restructure `FloatingNavBar` so `GlassSurface` forms the background island, while the center FAB container is rendered outside the `overflow: 'hidden'` wrapper.
* **Verification:** Frame capture on Waydroid verifying full circular geometry (56px diameter).

---

### DEF-02: Camera Shutter & Gallery Controls Covered by Nav Bar
* **Subsystem:** `mobile/src/screens/ScanScreen.tsx`
* **Severity:** Critical
* **Expected Behavior:** In the live camera viewfinder, the shutter capture button and the photo gallery button are fully visible, comfortable to tap, and unencumbered.
* **Actual Behavior:** `FloatingNavBar` (height 68px + bottom offset) renders directly over the shutter button and gallery button.
* **Reproduction:** Navigate to the Scan tab; observe camera shutter controls.
* **Root Cause:** `styles.bottomControls` in `ScanScreen.tsx` has `paddingBottom: 36`, which positions the controls in the bottom 36-90px region where `FloatingNavBar` is stationed.
* **Proposed Solution:** Apply dynamic safe padding: `paddingBottom: insets.bottom + 68 + 24` to ensure bottom controls comfortably clear the floating island.
* **Verification:** Waydroid ADB touch test confirming shutter and gallery buttons are fully interactive and visually distinct above the island.

---

### DEF-03: `ScanActivityHeatmap` 30-Day Grid Cell Height Collapse
* **Subsystem:** `mobile/src/components/ScanActivityHeatmap.tsx:138-142`
* **Severity:** High
* **Expected Behavior:** 30 square cells rendered in a responsive grid representing the past 30 days of actual scan activity.
* **Actual Behavior:** On Android, `aspectRatio: 1` combined with `width: '14.2%'` in a `flexWrap: 'wrap'` container causes Yoga to compute `height: 0`, rendering the entire grid invisible.
* **Reproduction:** Open History screen with at least 1 saved scan; observe empty gap between title and first card.
* **Root Cause:** React Native Android Yoga layout bug with percentage widths and aspect ratios in wrapping containers.
* **Proposed Solution:** Calculate explicit pixel cell width and height: `const cellSize = Math.floor((containerWidth - 36) / 7)` and set `{ width: cellSize, height: cellSize }`.
* **Verification:** Frame capture on Waydroid verifying all 30 cells render with background tracks and active colors.

---

### DEF-04: Nested Pressable Responder Conflict on History Cards
* **Subsystem:** `mobile/src/screens/HistoryScreen.tsx:274-285`
* **Severity:** Medium
* **Expected Behavior:** Tapping the trash icon on a history card opens the delete confirmation modal.
* **Actual Behavior:** Outer `Card.onPress` (wrapped in `PressableScale`) captures the touch responder, navigating to Result instead of triggering `handleDeleteItem`.
* **Reproduction:** On History screen, tap the trash icon on any saved scan item.
* **Root Cause:** React Native responder chain does not bubble press events from inner Pressable to outer Pressable predictably when both have scale animations.
* **Proposed Solution:** Restructure `HistoryCard` so the card body is the pressable target, and the delete icon is housed in a sibling pressable container outside the main navigation target.
* **Verification:** ADB tap on trash icon opens `ConfirmModal` without triggering screen navigation.

---

### DEF-05: Fake Injected 4.2 Score and Simulated Trend Data on Home
* **Subsystem:** `mobile/src/screens/HomeScreen.tsx` & `ProcessingTrendChart.tsx`
* **Severity:** High
* **Expected Behavior:** New user sees honest empty state: 0 scans, prompt to take first scan, empty trend chart with clear guidance.
* **Actual Behavior:** When `items.length === 0`, `setAvgScore(4.2)` was injected, and `<ProcessingTrendChart />` displayed hardcoded May 12-18 dummy points.
* **Reproduction:** Clean install or clear history; observe Home screen.
* **Root Cause:** Fallback to dummy data in `HomeScreen.tsx:50` and `ProcessingTrendChart.tsx:36`.
* **Proposed Solution:** Require real `TrendDataPoint[]` derived from `getScanHistory()`. If empty, render a clean empty state card: "No scan data recorded yet. Point your camera at a food label to begin tracking your 7-day clarity."
* **Verification:** Clean install on Waydroid shows 0 scans and designed empty states.

---

### DEF-06: Four Redundant Themes & Home Header Toggle Button
* **Subsystem:** `mobile/src/theme/ThemeContext.tsx`, `colors.ts`, `HomeScreen.tsx`, `SettingsSheet.tsx`
* **Severity:** Medium
* **Expected Behavior:** Exactly 3 theme modes: `System` (follows OS), `Dark` (pure black OLED tokens), `Light` (Nordic ivory). No direct toggle on Home header.
* **Actual Behavior:** 4 themes (`system`, `dark`, `amoled`, `light`) where `dark` is charcoal and `amoled` is pitch black. Sun/moon toggle button in Home header.
* **Reproduction:** Open Settings; view theme selector; observe Home header.
* **Root Cause:** Previous intermediate dark theme retained alongside AMOLED; home header contains direct toggle.
* **Proposed Solution:** Remove old charcoal dark theme; rename AMOLED to Dark; rename Auto to System; remove toggle from Home header; place theme control exclusively in Settings.
* **Verification:** Settings sheet offers exactly System, Dark, Light. Switching immediately updates whole app.

---

### DEF-07: Product Share Lacks Real JSON File Creation
* **Subsystem:** `mobile/src/screens/ResultScreen.tsx` & `mobile/src/lib/history.ts`
* **Severity:** High
* **Expected Behavior:** Result screen sharing provides two options: "Share as Text" (readable summary) and "Share as JSON" (generates an actual `.json` file attachment).
* **Actual Behavior:** Shares a plain text string via `Share.share({ message: '...' })`.
* **Reproduction:** On Result screen, tap Share button.
* **Root Cause:** No file creation logic or format selection dialog.
* **Proposed Solution:** Implement share action sheet / modal: "Share as Text" or "Share as JSON". For JSON, write structured file to `FileSystem.cacheDirectory + 'product-report.json'` and invoke `Sharing.shareAsync`.
* **Verification:** Tap Share -> choose Share as JSON -> verify system share sheet handles `.json` file.

---

### DEF-08: Health Notices Border Color Styling
* **Subsystem:** `mobile/src/screens/ResultScreen.tsx:260-265`
* **Severity:** Medium
* **Expected Behavior:** Health notices and critical label warnings render with clean, semantic light bright red borders and background tint with high contrast.
* **Actual Behavior:** Inherits generic dark card borders with dark/creamy tint.
* **Reproduction:** Open Result screen for product with warning notices.
* **Root Cause:** Card uses `borderColor: colors.warningBorder` which falls back to dark border in dark/AMOLED themes.
* **Proposed Solution:** Define semantic `dangerLight` (`rgba(239, 68, 68, 0.12)`) and `dangerBorder` (`rgba(239, 68, 68, 0.45)`) with bright light-red text and icon.
* **Verification:** Visual inspection of warning cards on Result screen.

---

### DEF-09: Decorative Dots Beside NOVA Groups & Missing Long-Press
* **Subsystem:** `mobile/src/components/NovaBadge.tsx` & `GuideScreen.tsx`
* **Severity:** Low
* **Expected Behavior:** Clean typography without status dots; long-press on NOVA groups 1-4 and additive entries opens detailed floating modal sheet with haptics.
* **Actual Behavior:** `NovaBadge` contains `<View style={styles.dot} />`; long-press does nothing.
* **Reproduction:** Open Guide screen; observe dots beside NOVA 1-4.
* **Root Cause:** Legacy decorative dot in `NovaBadge.tsx`; missing `onLongPress` handlers on cards.
* **Proposed Solution:** Remove `styles.dot` from `NovaBadge`; add long-press gesture with `AppHaptics.impactHeavy()` opening detailed floating popup sheet.
* **Verification:** No dot visible; long-press opens floating modal sheet.

---

### DEF-10: Food Passport Card Visible in Profile Body & Barcode
* **Subsystem:** `mobile/src/screens/ProfileScreen.tsx` & `FoodPassportModal.tsx`
* **Severity:** High
* **Expected Behavior:** Food Passport card is removed from profile body; passport is revealed exclusively via pull-down gesture; passport renders user profile picture and total scans metric instead of fake barcode.
* **Actual Behavior:** Food Passport was placed as Box 3 in the profile body; modal showed text initial instead of avatar image; modal showed fake SVG barcode.
* **Reproduction:** Open Profile screen; observe Box 3 and pull-down behavior.
* **Root Cause:** Box 3 was directly in `ScrollView`; modal lacked `photoUrl` prop; barcode was rendered instead of scans count.
* **Proposed Solution:** Remove Box 3 from Profile screen; fix pull-down responder activation; pass `photoUrl` to `FoodPassportModal`; replace SVG barcode with stylized total scans metric card.
* **Verification:** Profile body contains only Achievements, Recent Snapshots, and Annual Density; pull-down smoothly reveals Food Passport with user photo and total scans.

---

### DEF-11: Polaroid Snapshots Fan Clipping First Card
* **Subsystem:** `mobile/src/screens/ProfileScreen.tsx:486`
* **Severity:** Low
* **Expected Behavior:** Recent snapshots are centered horizontally in the card display.
* **Actual Behavior:** Card 0 has `left: -60`, clipping it 60px off the left edge.
* **Reproduction:** Open Profile screen with recent scans.
* **Root Cause:** Hardcoded `left: index * 48 - 60` without accounting for container centering.
* **Proposed Solution:** Calculate dynamic offset: `left: (index - (total - 1) / 2) * 44`, keeping cards centered inside the 140px display, and display blank scan logo when no image exists.
* **Verification:** First card is fully within container bounds.

---

### DEF-12: Edit Profile Does Not Load Avatar & Discards Handle/Allergens
* **Subsystem:** `mobile/src/components/EditProfileSheet.tsx` & `lib/auth.ts`
* **Severity:** High
* **Expected Behavior:** Opening Edit Profile displays current user avatar; allows editing name, handle (prefilled from email prefix), and allergen flags; persists updates; highlights matching allergens in future and existing scans in bright light-red.
* **Actual Behavior:** Avatar picker was blank on re-open; dietary goal was present; handle and allergens were not persisted to storage.
* **Reproduction:** Open Edit Profile; type handle and allergens; save; re-open.
* **Root Cause:** `useState` not synchronized with `currentSession` on open; `UserSessionData` lacked `handle` and `allergens`; dietary goal field was retained.
* **Proposed Solution:** Sync state in `useEffect` when `visible` changes; add `handle` and `allergens: string[]` to `UserSessionData`; remove dietary goal input; evaluate saved allergens against ingredients in `ResultScreen.tsx`.
* **Verification:** Save custom handle & allergens; verify persistence across app restart; scan ingredient containing allergen shows bright light-red warning.

---

### DEF-13: Annual Activity Histogram Uses Fake 184 Scans
* **Subsystem:** `mobile/src/components/YearActivityChart.tsx`
* **Severity:** Medium
* **Expected Behavior:** For new accounts, annual chart starts from the account creation month or first scan, displaying zero activity for earlier months.
* **Actual Behavior:** Hardcoded default props: `monthlyCounts = [2, 5, 8, ...]`, `totalScans = 184`.
* **Reproduction:** Open Profile screen on clean install.
* **Root Cause:** Fallback default prop values.
* **Proposed Solution:** Aggregate scan timestamps from `getScanHistory()` by calendar month for the current year; new users show only months from account creation date onwards.
* **Verification:** Clean install shows 0 scans across all months.

---

### DEF-14: Missing Guided First-Launch Onboarding Sequence
* **Subsystem:** `mobile/src/App.tsx`, `AuthScreen.tsx`, new `OnboardingScreen.tsx`
* **Severity:** Critical
* **Expected Behavior:** First app open presents a 5-step onboarding experience: Welcome -> Authentication Choice -> Choose Handle -> Choose Avatar -> Ready to Begin.
* **Actual Behavior:** Cold install automatically calls `signInAsGuest()` and navigates immediately to Home screen.
* **Reproduction:** Wipe app data; launch app; lands directly on Home as Guest.
* **Root Cause:** `App.tsx:75-84` unconditionally provisions guest session on cold start.
* **Proposed Solution:** Check `@eatinformed_onboarding_completed_v1`. If false, render the 5-screen onboarding sequence with Back/Next buttons, polite language, no em-dashes, and no emojis.
* **Verification:** Fresh install opens Welcome screen -> steps through onboarding -> navigates to Home on completion.

---

### DEF-15: Camera Capture Does Not Crop to Viewfinder Frame
* **Subsystem:** `mobile/src/screens/ScanScreen.tsx`
* **Severity:** High
* **Expected Behavior:** Captured image is cropped to the exact viewfinder aspect ratio and framing before upload.
* **Actual Behavior:** Full camera sensor image is saved and uploaded, including irrelevant background outside the viewfinder.
* **Reproduction:** Capture food label; inspect uploaded image.
* **Root Cause:** Photo capture directly uses full `takePictureAsync` result without coordinate mapping or cropping.
* **Proposed Solution:** Map viewfinder dimensions to camera image coordinate space using `expo-image-manipulator` to crop and compress before upload.
* **Verification:** Uploaded image dimensions match viewfinder rectangle aspect ratio.

---

### DEF-16: Em-Dashes and Emojis in UI Copy; Fake Asymptotic Progress
* **Subsystem:** Application-wide UI copy & `ScanScreen.tsx`
* **Severity:** Low
* **Expected Behavior:** Professional, polite copy without em-dashes (`—`) or emojis; progress reflects real pipeline stages.
* **Actual Behavior:** Progress ticker uses fake exponential timer with em-dashes in stage descriptions; profile achievements use emojis.
* **Reproduction:** Observe scan loading screen and achievement cards.
* **Root Cause:** Em-dashes in `PIPELINE_STAGES` and emoji characters in `NUTRITION_AWARDS`.
* **Proposed Solution:** Replace all emojis with Lucide icons; replace em-dashes with clean hyphens or commas; use clean indeterminate progress indicator with stage-based status messages.
* **Verification:** Grep confirms zero em-dashes and zero emojis in `mobile/src/`.
