# **App Name**: EatInformed

## 1. System Architecture

EatInformed is a cross-platform food intelligence platform (Next.js 16 Web Application + React Native Expo Mobile App) powered by NVIDIA NIM foundation vision and reasoning models.

- **Vision AI Pipeline**: NVIDIA Nemotron-3.5-Super-VL (120B) single-pass optical extraction with automatic EXIF orientation normalization, image sharpening, and fallback to Nemotron-3.5-Lightning (30B).
- **NOVA Classification Engine**: Automatic four-tier food processing classification (Group 1: Unprocessed Whole Foods to Group 4: Ultra-Processed Formulations) developed by the University of São Paulo.
- **Nutrition Facts Normalization**: Structured transcription of macro and micronutrients with thousands-separator sanitization, kJ to kcal conversion, and per-serving/per-100g grouping.
- **Additive & Allergen Screening**: Clinical cross-referencing of emulsifiers, cosmetic dyes, synthetic sweeteners, and common allergen warnings.
- **Authentication & Sync**: Multi-provider authentication (Google OAuth, Email/Password, and Anonymous Guest Sessions) synchronized across Web and Mobile via Firebase Auth and Next.js session cookies.
- **Local-First Storage**: User scan history stored directly on client devices (browser `localStorage` on Web, `@react-native-async-storage/async-storage` on Mobile) without third-party tracking.

---

## 2. Design System Guidelines (Apple HIG Grounded)

- **Aesthetic**: Minimal, non-templated Apple Human Interface Guidelines standard.
- **Color Palette (Dark Mode - OLED)**:
  - System Background: Pure Black `#000000`
  - Level 1 Elevated Surface: `#161618`
  - Level 2 Nested Controls: `#222226`
  - Accent / Primary Action: Apple System Green Dark `#30D158`
  - Text Primary / Secondary: `#F5F5F7` / `#AEAEB2` (WCAG AAA compliant)
- **Color Palette (Light Mode)**:
  - System Background: Apple Grouped Light `#F2F2F7`
  - Card Surface: Pure White `#FFFFFF`
  - Accent / Primary Action: Accessible Apple Green `#1E8E3E`
  - Text Primary / Secondary: `#1C1C1E` / `#48484A`
- **Typography**: Inter (Variable font, Apple dynamic type scale alignment).
- **Spatial Geometry**: 20pt continuous squircles (`borderRadius: 20px`), hairline specular borders (`#26262A` / `#E5E5EA`), 44pt minimum touch targets.
