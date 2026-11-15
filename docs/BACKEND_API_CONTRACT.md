# EatInformed: Backend API Contract (v1.0.0)

**Base URL**: `https://eatinformed.amitdevx.tech`  
**Protocol**: HTTPS / REST  
**Data Format**: JSON  

---

## 1. Endpoints

### 1.1 `GET /api/scan`
Health check and quota status inspection endpoint.

#### Query Parameters
- `quota` (boolean, optional): If `true`, inspects the current user's scan quota. Requires `Authorization` header.

#### Headers
- `Authorization` (optional): `Bearer <token>` (Firebase ID token, session cookie, or HMAC guest token).

#### Responses
- **200 OK** (Standard Health Check):
  ```json
  {
    "status": "ok",
    "endpoint": "/api/scan",
    "service": "EatInformed Food Label Analysis API",
    "nimConfigured": true,
    "authConfigured": true,
    "quotaPolicy": {
      "guest": "4 scans per 2-hour rolling window",
      "member": "50 scans per 1-hour rolling window"
    },
    "timestamp": 1731690000000
  }
  ```
- **200 OK** (Quota Inspection `?quota=true`):
  ```json
  {
    "status": "success",
    "quota": {
      "allowed": true,
      "limit": 4,
      "remaining": 3,
      "windowDurationSeconds": 7200,
      "nextAvailableScanTimestamp": 1731697200000,
      "retryAfterSeconds": 0,
      "isGuest": true
    }
  }
  ```
- **401 Unauthorized** (Quota inspection without valid token):
  ```json
  {
    "status": "unauthenticated",
    "error": "Authentication token required to inspect scan quota.",
    "code": "auth_required",
    "quota": { "limit": 4, "remaining": 0, "isGuest": true }
  }
  ```

---

### 1.2 `POST /api/scan`
Food label optical character recognition and clinical nutritional analysis.

#### Headers
- `Authorization` (required): `Bearer <token>` (Firebase ID token, session cookie, or HMAC guest token).
- `Content-Type` (required): `application/json`
- `Idempotency-Key` (optional): Client-generated unique UUID to prevent double-charging on network retries.

#### Request Body
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

#### Responses
- **200 OK** (Successful Analysis):
  ```json
  {
    "status": "success",
    "productName": "Organic Rolled Oats",
    "brand": "Whole Harvest",
    "novaGroup": 1,
    "rating": 4.8,
    "ingredients": ["Whole Grain Rolled Oats"],
    "nutrition": {
      "rawText": "Serving size 40g, Calories 150...",
      "servingSizeLabel": "40g",
      "nutrients": [
        { "nutrient": "Calories", "perServing": "150 kcal", "per100mL": "375 kcal" }
      ]
    },
    "pros": ["Single ingredient whole grain", "High soluble dietary fiber"],
    "cons": [],
    "warnings": [],
    "ingredientAnalysis": [
      {
        "ingredient": "Whole Grain Rolled Oats",
        "description": "Minimally processed oat groats steamed and rolled flat.",
        "purpose": "Primary food grain base.",
        "isAllergen": false,
        "isControversial": false
      }
    ],
    "dietaryInfo": {
      "allergens": [],
      "suitability": ["Vegetarian", "Vegan"],
      "isVegetarian": true,
      "isVegan": true,
      "isGlutenFree": null,
      "summary": "100% whole grain oats."
    },
    "quota": {
      "limit": 4,
      "remaining": 2,
      "windowDurationSeconds": 7200,
      "nextAvailableScanTimestamp": 1731697200000,
      "isGuest": true
    },
    "requestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
  ```

- **400 Bad Request** (Malformed JSON or missing image):
  ```json
  {
    "error": "Image data URI is required in request body.",
    "code": "invalid_payload",
    "requestId": "..."
  }
  ```

- **401 Unauthorized** (Missing or invalid token):
  ```json
  {
    "error": "Authentication required. Please sign in or continue as Guest.",
    "code": "auth_required",
    "requestId": "..."
  }
  ```

- **413 Content Too Large** (Payload exceeds 10MB limit):
  ```json
  {
    "error": "Image file size exceeds the 10MB limit.",
    "code": "payload_too_large",
    "requestId": "..."
  }
  ```

- **415 Unsupported Media Type** (Corrupted bytes or unsupported format):
  ```json
  {
    "error": "Invalid image content. Must be a valid JPEG, PNG, or WEBP image.",
    "code": "unsupported_media_type",
    "requestId": "..."
  }
  ```

- **422 Unprocessable Content** (No readable text or unreadable label):
  ```json
  {
    "error": "No readable ingredient list or nutrition table was found in the photo. Please frame the label closely in good lighting.",
    "code": "label_unreadable",
    "slotRefunded": true,
    "requestId": "..."
  }
  ```

- **429 Too Many Requests** (Quota exceeded or IP burst limit):
  ```json
  {
    "error": "Your guest scan limit has been reached (4 scans per rolling 2-hour window). Please wait or sign in to continue scanning.",
    "code": "quota_limit_reached",
    "limit": 4,
    "remaining": 0,
    "windowDurationSeconds": 7200,
    "nextAvailableScanTimestamp": 1731697200000,
    "retryAfterSeconds": 3412,
    "isGuest": true,
    "requestId": "..."
  }
  ```

- **502 Bad Gateway** / **504 Gateway Timeout** (Upstream AI failure):
  ```json
  {
    "error": "AI service temporarily unavailable. Your scan slot has been refunded.",
    "code": "upstream_ai_failure",
    "slotRefunded": true,
    "requestId": "..."
  }
  ```

---

### 1.3 `POST /api/auth/mobile`
Authentication handler for mobile and web clients.

#### Actions
- `type: 'guest'`: Creates an authenticated anonymous session. Returns a cryptographically signed HMAC token or Firebase anonymous token.
- `type: 'signIn'`: Signs in with email and password via Firebase Identity Toolkit.
- `type: 'signUp'`: Creates a new account with email and password.
