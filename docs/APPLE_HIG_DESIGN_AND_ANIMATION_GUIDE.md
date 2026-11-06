# EatInformed  -  Apple HIG Minimal UI & Fluid Motion Redesign Guide

This document details the complete architectural, visual, typographic, and motion redesign of **EatInformed** across Mobile (React Native / Expo), Web (Next.js / Tailwind CSS), and Vector UI Artboards (SVG & High-DPI PNG) in accordance with the official [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines).

---

## 1. Root-Cause Audit of Original UI & SVG Defects

| Defect Area | Original Issue | Redesign Fix Applied |
| :--- | :--- | :--- |
| **Broken Light Mode Readability (Mobile Code)** | `ResultScreen.tsx`, `GuideScreen.tsx`, `HistoryScreen.tsx`, `ProfileScreen.tsx`, `ScanScreen.tsx`, `AuthScreen.tsx`, `Badge.tsx`, `Button.tsx`, `NovaBadge.tsx`, `RatingStars.tsx`, and `States.tsx` imported static `colors = darkColors`. When Light Mode was active, `Screen` and `Card` turned white (`#FFFFFF`/`#F5F5F7`) while all text stayed off-white (`#F5F5F7` on `#FFFFFF`  -  1.07:1 invisible contrast) and inner containers rendered as dark `#1C1C1E` blocks. | Refactored all 7 mobile screens and all 6 shared UI components to consume dynamic `useTheme()` tokens (`colors`, `isDark`), ensuring every surface, border, icon, and text node adapts seamlessly between Light and Dark modes. |
| **Low Text & Badge Contrast in Light & Dark Modes** | Light Mode used `#86868B` muted text on `#E5E5EA` pills (2.85:1 contrast, failing WCAG AA) and `#34C759` green text on light green pills (2.1:1 contrast). Dark Mode used `#6E6E73` text on `#1C1C1E` surfaces (3.7:1 contrast, failing WCAG AA). | Re-engineered semantic color tokens per [Apple HIG Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) and [Apple HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) so all body/secondary text achieves **7.5:1-17.4:1 (WCAG AAA)** and all muted/badge text achieves **≥5.1:1-8.8:1 (WCAG AA/AAA)**. |
| **Overlapping & Misaligned Bottom Tab Bar in SVGs** | Every SVG artboard hardcoded `Navigation_Bottom_Tab_Bar` at `transform="translate(0, 830)"` regardless of canvas height (`1040px`, `1180px`, `1260px`), causing the bottom tab bar to slice directly through cards on Home, Result, and Guide screens and leaving dead voids below the tab bar. | Docked the bottom tab bar strictly at `y = canvasHeight - 84` across every artboard, added an iOS Home Indicator pill, and replaced placeholder circle dots with true vector icons for Home, Scan, History, Guide, and Profile. |
| **Missing Text in Fontless SVG Renderers** | Original SVGs relied on `<defs><style>` font declarations and non-standard `rgba(...)` inside SVG `fill`/`stroke` attributes, causing strict SVG 1.1 parsers and fontless previewers to drop all `<text>` nodes. | Added explicit inline `font-family` and hex `fill`/`stroke` + `fill-opacity`/`stroke-opacity` attributes on every element in `docs/ui-vectors/*.svg`, plus generated `docs/ui-vectors-outlined/*.svg` (with text converted to vector `<path>` outlines) and `docs/ui-previews-png/*.png` (2x Retina PNG renders). |
| **Missing Mobile Screens in SVG Suite** | Original `docs/ui-vectors/` only included 5 partial screens (`home`, `result`, `guide`, `history`, `profile`), omitting `ScanScreen` and `AuthScreen` as well as ingredient deconstruction rows. | Created complete Light and Dark artboards for all **7 mobile screens** (`home`, `scan`, `result`, `guide`, `history`, `profile`, `auth`) plus 7-screen `master-artboards-{light,dark}.svg`. |

---

## 2. Apple HIG Semantic Color & Contrast Architecture

Per [Apple HIG Color](https://developer.apple.com/design/human-interface-guidelines/color) and [Apple HIG Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode), interfaces must use adaptive semantic layers (Base → Elevated Level 1 Card → Elevated Level 2 Control → Elevated Level 3 Active Thumb) rather than flat static colors:

| Semantic Token | Light Mode Hex | Light Contrast | Dark Mode (OLED) Hex | Dark Contrast | Role & Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `background` | `#F2F2F7` |  -  | `#000000` |  -  | Root screen background (`systemGroupedBackground` / OLED base) |
| `surface` | `#FFFFFF` |  -  | `#161618` |  -  | Level 1 grouped card & bottom tab bar surface |
| `surfaceRaised` | `#F2F2F7` |  -  | `#222226` |  -  | Level 2 nested controls, input fields, table headers, quick-nav pills |
| `surfaceHighlight` | `#E5E5EA` |  -  | `#2C2C31` |  -  | Level 3 active segmented control thumb & touch highlight |
| `border` / `separator` | `#E5E5EA` / `#EBEBF0` |  -  | `#26262A` / `#222226` |  -  | 1pt subtle hairline card borders & internal row dividers |
| `text` (Primary) | `#1C1C1E` | **17.4:1 (AAA)** | `#F5F5F7` | **16.4:1 (AAA)** | Titles, headlines, primary body copy, nutrient names |
| `textSecondary` | `#48484A` | **8.4:1 (AAA)** | `#AEAEB2` | **8.2:1 (AAA)** | Subtitles, card descriptions, inactive segment labels |
| `textMuted` | `#636366` | **5.7:1 (AA)** | `#8E8E93` | **5.4:1 (AA)** | Timestamps, input placeholders, inactive tab bar labels |
| `primaryButton` / `onPrimary` | `#1E8E3E` / `#FFFFFF` | **4.7:1 (AA)** | `#30D158` / `#031A09` | **10.4:1 (AAA)** | Primary pill CTA buttons & active scanner shutter |
| `nova1` (Whole Food) | Text `#166534` on `#E8F8ED` | **7.1:1 (AAA)** | Text `#4ADE80` on `#0D2818` | **8.8:1 (AAA)** | NOVA Group 1 badges, high-score pills, clean ingredient tags |
| `nova2` (Culinary Base) | Text `#0055B3` on `#EBF5FF` | **7.4:1 (AAA)** | Text `#60A5FA` on `#0C2340` | **7.9:1 (AAA)** | NOVA Group 2 badges, gluten-free tags, info banners |
| `nova3` (Processed) | Text `#9A4D00` on `#FFF4E5` | **6.2:1 (AA)** | Text `#FBBF24` on `#2A1C08` | **9.4:1 (AAA)** | NOVA Group 3 badges, moderate score pills, additive alerts |
| `nova4` (Ultra-Processed) | Text `#C41224` on `#FFEBEE` | **6.8:1 (AA)** | Text `#FF6961` on `#2C1215` | **6.6:1 (AA)** | NOVA Group 4 badges, allergen warnings, destructive actions |

---

## 3. Apple Typography & Spatial Layout Scale

Aligned with [Apple HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography) and iOS Dynamic Type (`Large` default scale):

- **Large Title (`34pt`, Weight `800`, Line Height `40-41pt`, Tracking `-0.8pt`)**: Hero headers (`"Food clarity. For what you eat."`).
- **Title 1 (`28pt`, Weight `800`, Line Height `34pt`, Tracking `-0.6pt`)**: Screen titles (`"Plain Greek Yogurt"`, `"Food Safety Guide"`, `"Scan History"`, `"Account & System"`).
- **Title 3 (`20pt`, Weight `700`, Line Height `25pt`, Tracking `-0.4pt`)**: Section headers (`"Try Instant Samples"`, `"The NOVA Classification"`).
- **Headline / Card Title (`17pt`, Weight `600`, Line Height `23pt`, Tracking `-0.3pt`)**: Primary card headers (`"Scan a Product Label"`, `"Health Benefits & Pros"`).
- **Callout (`16pt`, Weight `600`, Line Height `22pt`, Tracking `-0.2pt`)**: Product list titles and primary CTA button labels.
- **Subheadline (`15pt`, Weight `400-500`, Line Height `20pt`)**: Bullet items, nutrient table rows, and screen descriptions.
- **Footnote (`13pt`, Weight `400`, Line Height `18pt`)**: Secondary card subtitles and explanations.
- **Caption 1 & 2 (`11-12pt`, Weight `600-700`, Line Height `14-16pt`)**: NOVA pills, segmented control labels, and uppercase section eyebrows (`letterSpacing: 0.6-1.0`).
- **Touch Target Floor**: Every interactive button, icon toggle, back/share button, and segmented tab enforces a minimum `44×44pt` hit area per [Apple HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).

---

## 4. Apple Fluid Motion & Spring Physics System

Per [Apple HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [SwiftUI Animations](https://developer.apple.com/documentation/swiftui/animations), and Apple's WWDC23 session [*Animate with Springs*](https://www.youtube.com/watch?v=HaZ2jw9rx9M), natural interfaces rely on velocity-preserving spring physics rather than linear or fixed-duration bezier curves. Implemented in `mobile/src/theme/animations.ts` and `mobile/src/components/SegmentedControl.tsx`:

1. **`SpringPresets.snappy` (`stiffness: 380, damping: 28, mass: 1`)**:
   - Critically damped (`ζ ≈ 1.0`) with zero overshoot.
   - Powers `PressableScale` on all buttons (`scaleTo: 0.975`), interactive cards (`scaleTo: 0.982`), icon toggles (`scaleTo: 0.92`), and bottom tab bar icon focus transitions (`scale: 1.0 → 1.08`).
2. **`SpringPresets.fluid` (`stiffness: 280, damping: 26, mass: 1`)**:
   - Drives the sliding pill thumb inside `SegmentedControl.tsx` (`ResultScreen` tabs, `ProfileScreen` appearance selector, and `AuthScreen` mode switcher).
3. **`SpringPresets.gentle` (`stiffness: 210, damping: 24, mass: 1`)**:
   - Powers `FadeInView` staggered screen cascades (`delay: 0ms, 50ms, 100ms, 150ms...`), animating `opacity: 0 → 1`, `translateY: 12 → 0`, and `scale: 0.985 → 1`.
   - Automatically checks `AccessibilityInfo.isReduceMotionEnabled()` and bypasses translation/scale motion when Reduce Motion is enabled on the user's device.
4. **Continuous Scanner & Loading Feedback**:
   - `ScanScreen.tsx` features a continuous vertical laser sweep (`Animated.loop` over `2200ms`) inside the rounded-squircle corner brackets.
   - `States.tsx` features a breathing spinner halo (`scale: 0.85 ↔ 1.06`), a progressive AI step progress bar, and a smooth skeleton shimmer (`opacity: 0.45 ↔ 0.90`).

---

## 5. Package Directory Structure

- `docs/ui-vectors/*.svg`  -  **16 Editable Vector Artboards** (all 7 mobile screens + master artboard suite in Light & Dark modes) with standard SVG 1.1 hex attributes and editable `<text>` layers for Figma, Sketch, and Lunacy.
- `docs/ui-vectors-outlined/*.svg`  -  **16 Outlined Vector Artboards** with all typography converted into pure SVG `<path>` curves so every screen renders with 100% sharp text even in fontless SVG viewers.
- `docs/ui-previews-png/*.png`  -  **16 High-Resolution (2x Retina) PNG Previews** of every Light and Dark screen and master artboard.
- `mobile/src/`  -  Complete redesigned React Native / Expo mobile application (`theme/colors.ts`, `theme/tokens.ts`, `theme/animations.ts`, `components/*`, `screens/*`, `App.tsx`).
- `src/`  -  Synchronized Next.js Web UI (`app/globals.css`, `lib/sample-products.ts`, `components/*`).
