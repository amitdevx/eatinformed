# EatInformed Android Application

Production-ready Android application for EatInformed, providing AI-powered food nutrition analysis, NOVA food processing classification, ingredient safety evaluation, and persistent scan history.

---

## 1. Architecture Overview

- **Framework**: React Native with Expo (following CampusOS mobile reference patterns).
- **Language**: TypeScript (strict mode enabled).
- **Navigation**: React Navigation with Native Stack and Bottom Tabs (`@react-navigation/native-stack`, `@react-navigation/bottom-tabs`).
- **Camera & Scanning**: `expo-camera` with custom framed viewfinder overlay, torch toggle, and camera switcher; `expo-image-picker` for photo gallery selection.
- **Storage**: `expo-secure-store` for persistent local scan history and session management.
- **API Client**: Axios with structured error handling, 45-second timeout for multi-modal AI processing, and automatic emulator/device URL resolution.
- **Design System**: Pure black theme matching EatInformed web (`#000000` background, `#0C0C0E` cards, `#1F1F23` borders, and `#22C55E` emerald green accents).

---

## 2. Directory Structure

```text
mobile/
├── assets/                  App icons and splash screens
├── src/
│   ├── api/
│   │   └── client.ts        Axios API client connecting to EatInformed /api/scan
│   ├── components/
│   │   ├── Badge.tsx        Pill badge for allergens and dietary flags
│   │   ├── Button.tsx       Interactive button with loading and icon states
│   │   ├── Card.tsx         Surface container with headers and footers
│   │   ├── NovaBadge.tsx    NOVA food processing classification badges (1 to 4)
│   │   ├── RatingStars.tsx  Visual 1.0 to 5.0 health rating stars
│   │   ├── Screen.tsx       Safe area container with scrollable option
│   │   └── States.tsx       LoadingState, EmptyState, ErrorState, and Skeleton
│   ├── lib/
│   │   ├── history.ts       SecureStore helpers for persistent scan history
│   │   └── sample-products.ts Offline demonstration products
│   ├── navigation/
│   │   └── types.ts         Type definitions for stack and tab navigators
│   ├── screens/
│   │   ├── AuthScreen.tsx   Modal sign in and account creation
│   │   ├── GuideScreen.tsx  NOVA food processing classification and additives guide
│   │   ├── HistoryScreen.tsx Saved scans list with delete and clear all actions
│   │   ├── HomeScreen.tsx   Hero showcase, quick scan CTA, and sample food items
│   │   ├── ProfileScreen.tsx Account status, server connectivity checker, and settings
│   │   ├── ResultScreen.tsx Full food report (Overview, Ingredients, Nutrition facts)
│   │   └── ScanScreen.tsx   Camera scanner, viewfinder, gallery picker, and progress ticker
│   ├── theme/
│   │   ├── colors.ts        Color palette and NOVA color mappings
│   │   └── tokens.ts        Spacing, border radii, and typography tokens
│   ├── types/
│   │   └── index.ts         ProductAnalysisOutput and Nutrient interfaces
│   └── App.tsx              Root component with NavigationContainer
├── app.json                 Expo application manifest and Android permissions
├── eas.json                 EAS build profiles for APK and AAB compilation
├── package.json             Mobile dependencies and scripts
└── tsconfig.json            TypeScript compiler options
```

---

## 3. Prerequisites

- **Node.js**: v20 or v22 LTS
- **Package Manager**: pnpm (`/home/amitdevx/.local/bin/pnpm` or global pnpm)
- **Android SDK**: Android API level 34+ (for local native builds)
- **ADB**: Android Debug Bridge (for emulator and physical device deployment)

---

## 4. Environment Configuration

The mobile app automatically connects to the local EatInformed Next.js server:
- **Android Emulator**: Defaults to `http://10.0.2.2:9003` (maps to host port 9003).
- **Physical Device**: Set the local network IP of your development computer:

Create `mobile/.env`:
```bash
EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:9003
```

---

## 5. Development Commands

Run all commands from the `mobile/` directory:

```bash
# Navigate to mobile directory
cd /home/amitdevx/Code/eatinformed/mobile

# Start Expo development server
pnpm start

# Run TypeScript typecheck
pnpm typecheck

# Verify Android Hermes bytecode bundle
npx expo export --platform android
```

---

## 6. Running on an Android Device or Emulator

### Option A: Via Expo Go (Fastest Development Workflow)
1. Install **Expo Go** from the Google Play Store on your Android phone.
2. Ensure phone and computer are connected to the same Wi-Fi network.
3. Start the dev server:
   ```bash
   pnpm start
   ```
4. Scan the terminal QR code using the Expo Go camera scanner.

### Option B: Local Android Native Run (Emulator / USB Debugging)
1. Start an Android emulator via Android Studio or connect an Android device with USB debugging enabled.
2. Verify connection:
   ```bash
   adb devices
   ```
3. Run the application:
   ```bash
   npx expo run:android
   ```

### Option C: Build Standalone APK (EAS Build)
Generate an installable `.apk` file for testing:
```bash
# Install EAS CLI if not already present
npm install -g eas-cli

# Build internal preview APK
eas build -p android --profile preview
```

---

## 7. Backend REST API Integration

The mobile application communicates with the EatInformed Next.js server via `POST /api/scan`.

### Request Specification
- **Endpoint**: `/api/scan`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "image": "data:image/jpeg;base64,..."
  }
  ```

### Response Specification
```json
{
  "productName": "Classic Potato Chips",
  "brand": "Lays",
  "novaGroup": 4,
  "rating": 1.9,
  "ingredients": ["Potatoes", "Vegetable Oil", "Salt"],
  "nutrition": {
    "rawText": "Per 28g serving: Calories 160...",
    "servingSizeLabel": "15 chips (28g)",
    "nutrients": [
      { "nutrient": "Calories", "perServing": "160 kcal", "per100mL": "571 kcal" },
      { "nutrient": "Total Fat", "perServing": "10g", "per100mL": "35.7g" }
    ]
  },
  "pros": ["Simple three-ingredient formulation"],
  "cons": ["High fat content from deep-frying oils"],
  "warnings": ["High sodium and saturated fat density"],
  "ingredientAnalysis": [
    {
      "ingredient": "Potatoes",
      "description": "Sliced white potatoes providing starch and potassium",
      "purpose": "Primary vegetable base",
      "isAllergen": false,
      "isControversial": false
    }
  ],
  "dietaryInfo": {
    "allergens": ["Soy"],
    "suitability": ["Vegan", "Vegetarian", "Gluten-Free"],
    "isVegetarian": true,
    "isVegan": true,
    "isGlutenFree": true,
    "summary": "High-fat snack formulation best consumed sparingly."
  },
  "status": "success"
}
```

---

## 8. Verification and Quality Checks

Run the verification commands to confirm system health:

```bash
# 1. Mobile TypeScript check
cd /home/amitdevx/Code/eatinformed/mobile && npx tsc --noEmit

# 2. Android bundle export check
cd /home/amitdevx/Code/eatinformed/mobile && npx expo export --platform android

# 3. Web TypeScript regression check
cd /home/amitdevx/Code/eatinformed && npm run typecheck

# 4. Web ESLint check
cd /home/amitdevx/Code/eatinformed && npm run lint

# 5. Web production build check
cd /home/amitdevx/Code/eatinformed && npm run build
```
