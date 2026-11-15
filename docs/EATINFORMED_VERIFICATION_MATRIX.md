# EatInformed Production Verification Matrix

> **Environment:** Waydroid Android 13 on Wayland / ADB IPv6 `[fe80::82e4:abc2:2cbd:ba1c%waydroid0]:5555`  
> **Package:** `com.eatinformed.app`  
> **Status Codes:** `NOT TESTED` | `REPRODUCED` | `STATIC VERIFIED` | `RUNTIME VERIFIED` | `BLOCKED`  

---

## 1. Journey Verification Roster

| Journey ID | Journey Description | Prerequisites | Target Flow | Expected Outcome | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **JRN-A** | Brand-New User Onboarding | Clean install | Welcome -> Auth Choice -> Handle -> PFP -> Ready -> Home | 5 steps complete; no auto-guest; zero fake scans on Home. | NOT TESTED |
| **JRN-B** | Google User Flow | Google OAuth client | Select Google -> Prefill email handle -> Choose PFP -> Save | Real session restored on restart; name & pfp populated. | NOT TESTED |
| **JRN-C** | Email / Password User Flow | API online | Register -> Complete onboarding -> Edit profile -> Sign out -> Sign in | Account credentials authenticate; preferences persist. | NOT TESTED |
| **JRN-D** | Guest User Flow | Clean install | Select Guest -> Handle locked to 'Guest' -> Fixed PFP -> Home | 25 scans/hr tier; honest empty stats; restricted edit. | NOT TESTED |
| **JRN-E** | Camera Capture & Viewfinder Crop | Camera hardware / fallback | Frame label -> Tap capture -> Crop to frame | Image dimensions match viewfinder aspect ratio. | NOT TESTED |
| **JRN-F** | Gallery Label Selection | MediaStore photo | Pick from gallery -> Crop/confirm -> Upload | Analysis runs; Result screen opens with correct data. | NOT TESTED |
| **JRN-G** | Allergen Preference & Flag Alert | Allergen saved | Save allergen 'soy' -> Scan product with soy -> Warning | Bright light-red alert displays matching ingredient. | NOT TESTED |
| **JRN-H** | History Management & Deletion | 2+ scans in history | Open History -> Tap delete on card 1 -> ConfirmModal | Card 1 deleted; aggregates update; card 2 remains. | NOT TESTED |
| **JRN-I** | 30-Day Heatmap Android Layout | 1+ scans in history | Open History -> Inspect 30-day grid | All 30 cells visible (no Yoga height collapse). | NOT TESTED |
| **JRN-J** | Pull-Down Food Passport | Profile screen | Swipe down from top -> Arm threshold -> Release | Modal reveals user photo & total scans; no fake barcode. | NOT TESTED |
| **JRN-K** | Theme System Switching | Settings sheet | Switch System -> Dark -> Light -> Restart app | Pure black OLED for dark; preference survives restart. | NOT TESTED |
| **JRN-L** | Dual Product Sharing | Result screen | Tap Share -> Choose 'Text' / Choose 'JSON File' | Generates actual `.json` file for JSON option. | NOT TESTED |
| **JRN-M** | Scan History JSON Backup | Settings sheet | Tap Export Scan History (JSON) | Valid JSON backup file generated and shared. | NOT TESTED |
| **JRN-N** | Guide Long-Press Popups | Guide screen | Long-press NOVA 1-4 / Additive entry | Floating modal sheet opens with tactile haptic tick. | NOT TESTED |
| **JRN-O** | Nav Bar & Shutter Clearance | Scan screen | Open camera viewfinder | Shutter & gallery buttons 100% visible above island. | NOT TESTED |
| **JRN-P** | FAB Circle Geometric Integrity | Any screen | Inspect center Scan FAB | Full 56px circle visible; top half not clipped. | NOT TESTED |
| **JRN-Q** | Typography & Copy Compliance | Global search | Scan code for em-dashes and emojis | Zero em-dashes; zero emojis in UI strings. | NOT TESTED |

---

## 2. Static & Type Acceptance Log

| Test Suite | Command | Execution Date | Exit Code | Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **Root Next.js Typecheck** | `npx tsc --noEmit` | Nov 15, 2026 | 0 | Baseline PASS |
| **Mobile Expo Typecheck** | `cd mobile && npx tsc --noEmit` | Nov 15, 2026 | 0 | Baseline PASS |
| **Copy Lint (Em-Dashes)** | `grep -rn "—" mobile/src/` | Pending | - | PENDING |
| **Copy Lint (Emojis)** | `grep -rnP "[\x{1F300}-\x{1F9FF}]" mobile/src/` | Pending | - | PENDING |
