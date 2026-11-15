# EatInformed Recovery & Implementation Plan

> **Strategy:** Phase-Ordered Dependency Architecture  
> **Rule:** Real Data Integrity · Zero Faked Stats · Zero Em-Dashes · Zero Emojis  
> **Date:** November 15, 2026  

---

## Implementation Phase Sequencing

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASE IMPLEMENTATION MAP                        │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 1: DATA, SESSION & THEME FOUNDATIONS                             │
│ • Update UserSessionData (handle, allergens: string[])                 │
│ • Clean Theme System: System, Dark (AMOLED), Light (remove 4th mode)   │
│ • Remove Home header theme button (Settings only)                      │
│ • Real History Analytics helpers (7-day trend & 30-day heatmap data)   │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 2: ONBOARDING & FIRST-LAUNCH FLOW                                │
│ • Create OnboardingScreen (5 steps: Welcome, Auth, Handle, PFP, Ready) │
│ • Implement first-run gate in App.tsx without auto-guest leak         │
│ • Handle Google / Email / Guest identities with polite language        │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 3: SCAN SCREEN & CAMERA OVERLAY REPAIR                           │
│ • Fix FloatingNavBar FAB circle clipping (unclip from GlassSurface)    │
│ • Elevate bottomControls in ScanScreen above nav bar                   │
│ • Smooth bidirectional laser line animation                            │
│ • Viewfinder frame cropping with expo-image-manipulator                │
│ • Clean loading progress without em-dashes                             │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 4: RESULT SCREEN & ALLERGEN MATCHING                             │
│ • Dual-format sharing: Share as Text vs Share as JSON file             │
│ • Match user's saved allergen flags against ingredients                │
│ • Semantic bright light-red warning notice styling                     │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 5: HISTORY SCREEN & 30-DAY HEATMAP REPAIR                        │
│ • Fix ScanActivityHeatmap Android Yoga cell height collapse            │
│ • Unnest card press targets (delete button separate from card body)    │
│ • Feed real scan timestamps & scores into heatmap                      │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 6: PROFILE SCREEN & FOOD PASSPORT REPAIR                         │
│ • Remove Box 3 from Profile body (Food Passport exclusively on pull)   │
│ • Fix pull-down gesture responder & backdrop recede                    │
│ • Display user profile photo & total scans in Food Passport            │
│ • Replace emojis with Lucide theme icons in achievements               │
│ • Center polaroid snapshots fan with blank placeholder                 │
│ • Real annual 12-month histogram starting from creation date           │
│ • Move Backend AI Health, JSON export, and Sign Out to Settings        │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 7: EDIT PROFILE & SETTINGS RESTRUCTURING                         │
│ • Re-sync avatar preview on sheet open                                 │
│ • Remove dietary goal input; add functioning allergen flags tagger     │
│ • Persist handle & allergens; refresh app state                        │
│ • Settings sheet with 3 theme modes, diagnostics & JSON export         │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 8: GUIDE SCREEN REFINEMENTS                                      │
│ • Remove status dots from NovaBadge                                    │
│ • Long-press popup sheets with haptics for NOVA 1-4 and additives      │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 9: VERIFICATION & APK BUILD                                      │
│ • Run root typecheck & mobile typecheck                                │
│ • Test on Waydroid via ADB across all journeys                         │
│ • Verify zero em-dashes and zero emojis                                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## File Modification Index

| File Path | Primary Responsibilities |
| :--- | :--- |
| `mobile/src/theme/ThemeContext.tsx` | Constrain `ThemeMode` to `'system' \| 'dark' \| 'light'`; use pure black for dark. |
| `mobile/src/theme/colors.ts` | Remove duplicate charcoal palette; merge AMOLED into darkColors. |
| `mobile/src/lib/auth.ts` | Add `handle`, `allergens` to `UserSessionData`; handle normalization; eliminate auto-guest on first start. |
| `mobile/src/lib/history.ts` | Real 7-day trend aggregator; real 30-day heatmap aggregator; real 12-month annual aggregator. |
| `mobile/src/screens/OnboardingScreen.tsx` | **[NEW]** 5-step guided first launch sequence with Back and Next buttons. |
| `mobile/src/App.tsx` | Wire up OnboardingScreen gate via `@eatinformed_onboarding_completed_v1`. |
| `mobile/src/components/FloatingNavBar.tsx` | Render FAB outside `overflow: 'hidden'` wrapper; ensure stable centering. |
| `mobile/src/screens/ScanScreen.tsx` | Elevate shutter controls above nav bar; crop captured image to frame; clean progress. |
| `mobile/src/screens/ResultScreen.tsx` | Dual-format sharing (Text vs JSON file); allergen ingredient matching; red notices. |
| `mobile/src/components/ScanActivityHeatmap.tsx` | Explicit pixel cell dimensions solving Yoga collapse; consume real scan data. |
| `mobile/src/screens/HistoryScreen.tsx` | Unnest card delete pressable; remove text export (moved to Settings). |
| `mobile/src/screens/ProfileScreen.tsx` | Remove Box 3 card; fix pull-down gesture; Lucide icons for achievements; center snapshots; move diagnostics to Settings. |
| `mobile/src/components/FoodPassportModal.tsx` | Load user profile photo; replace barcode with total scans counter. |
| `mobile/src/components/EditProfileSheet.tsx` | Sync avatar on open; remove dietary goal; add allergen tags; persist handle. |
| `mobile/src/components/SettingsSheet.tsx` | 3 theme modes; Backend AI Health card; JSON file export; Sign out button. |
| `mobile/src/components/NovaBadge.tsx` | Remove decorative dot beside group number. |
| `mobile/src/screens/GuideScreen.tsx` | Long-press floating modal popup sheets with haptics. |
| `mobile/src/screens/HomeScreen.tsx` | Remove fake 4.2 score; remove fake trend data; remove header theme toggle. |
| `mobile/src/components/YearActivityChart.tsx` | Accept dynamic monthly counts from real scan history. |
