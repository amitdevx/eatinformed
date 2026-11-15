# EatInformed: Targeted UX, Authentication, Passport, Camera, and Quota Repair Report

**Date:** November 15, 2026  
**Status:** FIX IMPLEMENTED & STATIC VERIFIED  
**Base Commit:** `25001a7cc960d89a189f8c501af20d42080eedb9`  
**Branch:** `feature/targeted-ux-auth-passport-camera-quota-repair`  

---

## 1. Confirmed Root Causes

### A. Food Passport Gesture Activation Defect
- **Confirmed Root Cause:** In `mobile/src/screens/ProfileScreen.tsx`, the activation threshold was compared against heavily damped visual rubber-band displacement (`currentPull >= REACH_THRESHOLD * 0.95 = 190pt`). The resistance formula `drag = 0.65 * (1 - dy / 290)` damped `currentPull` such that even with 400pt of finger drag, `currentPull` mathematically capped at ~40–50pt. It was physically impossible to reach 190pt.
- **Resolution:** Separated raw finger translation (`gesture.dy >= 110pt`) from rubber-band visual displacement (`visualY = (1 - 1 / (gesture.dy * 0.006 + 1)) * 95pt`). Modal arms strictly on raw finger travel. Single haptic tick triggered on arming state transition. Horizontal gestures (`Math.abs(dx) > Math.abs(dy)`) and vertical scroll positions (`scrollY > 0`) are explicitly rejected.

### B. Passport Backdrop Blur & Synthetic Identity
- **Confirmed Root Cause:** `FoodPassportModal.tsx` rendered a flat semi-transparent backdrop (`rgba(0,0,0,0.72)`) without hardware blur and ran a duplicate `NameTicker` loop that clashed with the Profile watermark. It also calculated a synthetic member ID (`EI-${charCodes}-BIO`).
- **Resolution:** Implemented native hardware-accelerated `BlurView` from `expo-blur` (`intensity={65}`, `tint={isDark ? 'dark' : 'light'}`) covering the backdrop, blurring underlying content without blurring the card. Removed duplicate `NameTicker`. Replaced synthetic ID with authentic verified handle (`@${userHandle}`) and verified pass state.

### C. Authentication & Sign-Out Lifecycle Defect
- **Confirmed Root Cause:** Profile and Settings sign-out cleared SecureStore locally, but never reset the root navigation state in `App.tsx`. The signed-out user remained trapped inside the authenticated `TabNavigator`, defaulting to a confused "Guest Explorer" state.
- **Resolution:** Built mobile `AuthContext` (`mobile/src/context/AuthContext.tsx`) governing explicit state machine: `initializing -> onboarding -> signed_out -> authenticated`. Created dedicated `SignedOutScreen` ("You are signed out") offering Sign In, Create Account, and Continue as Guest. Sign-out immediately transitions root stack to `SignedOutScreen`.

### D. Guest Quota & Unauthenticated Rate Limiting
- **Confirmed Root Cause:** Backend allowed 25 scans/hr in a process-local `Map`, easily lost on restarts and bypassable by generating arbitrary `guest_token_${Date.now()}` client strings.
- **Resolution:** Implemented true sliding-window rate limiter in `src/lib/quota.ts` and `src/app/api/scan/route.ts`:
  - **Policy:** Exactly 4 scans per rolling 2-hour window (`7,200,000 ms`) for guests.
  - **Shared Store:** File-backed atomic quota store (`.data/scan_quota_store.json`) with atomic check-and-set and in-memory cache.
  - **Cryptographic Tokens:** Cryptographically signed HMAC-SHA256 guest tokens (`guest_${b64Payload}.${signature}`) verified on every scan request. Arbitrary client strings rejected with 401.
  - **Refund Policy:** If validation fails or AI analysis throws an error, the consumed slot is immediately refunded (`refundQuotaSlot`).
  - **Quota Metadata:** Returns `limit`, `remaining`, `windowDurationSeconds`, `nextAvailableScanTimestamp`, and `retryAfterSeconds`.
  - **UI Integration:** Live quota pill in `ScanScreen.tsx` (`GUEST • 3 OF 4 SCANS`), shutter button disabled at limit, and explanatory countdown modal.

### E. Scanner Camera & Floating Navigation Collision
- **Confirmed Root Cause:** `FloatingNavBar` was rendered simultaneously on the `ScanScreen`, overlapping the shutter and gallery buttons and causing touch-target conflicts.
- **Resolution:** Enforced authoritative layout rule: `FloatingNavBar` returns `null` when `currentRouteName === 'Scan'`. The camera screen receives 100% of the viewport. Top bar includes an accessible `X` Close button to return to `Home`. Bottom controls feature full 74x74 shutter button and gallery buttons with dedicated safe-area padding (`Math.max(insets.bottom + 20, 32)`).

### F. Guest Onboarding Experience
- **Confirmed Root Cause:** Guest users could attempt to edit handles or tap non-functional avatar pickers without understanding restrictions.
- **Resolution:** Updated `OnboardingScreen.tsx`:
  - Step 3 (Handle): "Guest Explorer" and "@guest" visibly locked with Lock icon, accompanied by clear explanation and an instant upgrade link ("Create an account or sign in").
  - Step 4 (Avatar): Standard guest bio-pass icon locked with clear copy explaining that account creation unlocks avatar customization.
  - Step 2: Clear label "Continue as Guest (4 scans per 2 hours)".

---

## 2. Architectural Decisions & State Transitions

### Mobile Authentication Lifecycle
```
[App Launch]
    |
    v
[Check SecureStore & Onboarding Key]
    |
    +---> First Launch / Incomplete: [OnboardingScreen (5 steps)]
    |                                        | (Complete)
    |                                        v
    +---> Valid Stored Session: ------> [TabNavigator (Home/Scan/History/Guide/Profile)]
    |                                        | (Sign Out / Exit Guest)
    |                                        v
    +---> Signed Out: ----------------> [SignedOutScreen]
                                             |
                                             +---> Sign In / Sign Up: [AuthScreen Modal]
                                             |
                                             +---> Continue as Guest: [TabNavigator]
```

---

## 3. Automated Test Results

Executed via `npm test` (`npx tsx --test tests/**/*.test.ts`):
- `✔ Security: Cryptographic Guest Token Lifecycle (3.59ms)`: Validates signature creation, verification, tampering rejection, and expiry.
- `✔ Quota: 4 scans per 2-hour rolling sliding window enforcement (5.20ms)`: Validates scans 1–4 admission, 5th scan rejection (HTTP 429 semantics), retry-after calculation, and slot refund upon failure.
- `✔ Physics: Food Passport Pull-down Gesture Separation (0.88ms)`: Validates raw finger threshold (`110pt`) vs visual rubber-band displacement (`~38pt`), asymptotic limits, and horizontal gesture rejection.
- **Total: 3/3 Passed, 0 Failed, 0 Cancelled.**

---

## 4. Static Checks

- `cd mobile && npx tsc --noEmit`: **PASS (0 errors)**
- `npx tsc --noEmit` (root): **PASS (0 errors)**
- `npm run lint`: **PASS (0 errors, 8 standard RN alt-text warnings)**
- `grep -rn "—" mobile/src/`: **0 occurrences**
- `grep -rnP "[\x{1F300}-\x{1F9FF}]" mobile/src/`: **0 occurrences**

---

## 5. Modified & Added Files Manifest

- `src/lib/quota.ts` (NEW): Cryptographic guest tokens, sliding window quota enforcement, atomic store, and refund mechanics.
- `src/app/api/scan/route.ts`: Integrated sliding window quota (4 scans/2h for guests), token verification, metadata headers, and refund policy.
- `src/app/api/auth/[...action]/route.ts`: Issues signed cryptographic guest tokens upon anonymous login.
- `mobile/src/context/AuthContext.tsx` (NEW): Unified authentication state machine (`initializing`, `onboarding`, `signed_out`, `authenticated`).
- `mobile/src/screens/SignedOutScreen.tsx` (NEW): Dedicated signed-out landing experience.
- `mobile/src/App.tsx`: Wired `AuthProvider` and `SignedOutScreen` in `NavigationContainer`.
- `mobile/src/screens/ProfileScreen.tsx`: Repaired gesture physics (`RAW_PULL_THRESHOLD = 110pt`), single haptic trigger, and integrated `authSignOut()`.
- `mobile/src/components/FoodPassportModal.tsx`: Native `BlurView` backdrop blur, removed duplicate `NameTicker`, removed synthetic ID.
- `mobile/src/components/FloatingNavBar.tsx`: Hidden on `Scan` screen to avoid shutter control collision.
- `mobile/src/screens/ScanScreen.tsx`: Close button, live quota status pill, non-overlapping bottom controls, and quota exceeded modal.
- `mobile/src/screens/OnboardingScreen.tsx`: Locked guest handle & avatar with explanatory upgrade copy.
- `mobile/src/screens/AuthScreen.tsx`: Wired `authSignIn` from `AuthContext`.
- `mobile/src/navigation/types.ts`: Added `SignedOut` route.
- `package.json`: Added `npm test` script.
- `tests/quota-and-security.test.ts` (NEW): Automated unit tests for quota, security, and gesture math.
