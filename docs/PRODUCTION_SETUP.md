# Production authentication and scans

The owner-provided Vercel variable-name list contains NEXT_PUBLIC_FIREBASE_* browser settings, but no supported Firebase Admin credential and no NVIDIA_API_KEY. This explains the observed HTTP503 auth_unavailable from the deployed backend. Public Firebase API configuration does not grant Firebase Admin permissions. GEMINI_API_KEY and GOOGLE_API_KEY do not configure the current NVIDIA pipeline; Turso variables are not used by this backend.

1. In the same Firebase project as NEXT_PUBLIC_FIREBASE_PROJECT_ID, open Project settings → Service accounts → Firebase Admin SDK. Obtain a service-account JSON credential authorized for Auth and Firestore (or use your existing securely managed credential).
2. Add the complete JSON as FIREBASE_SERVICE_ACCOUNT_JSON in Vercel's server environment for Production. Never prefix it NEXT_PUBLIC_. Do not commit the file or send it in chat. The code also supports separate FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY and FIREBASE_PROJECT_ID fields.
3. Configure NVIDIA_API_KEY for the current food-analysis provider. Do not substitute a Gemini/Google API key.
4. In Firebase Authentication, enable the intended providers: Email/Password, Anonymous and Google. Confirm the web domain is authorized and Firestore is provisioned for this project. Keep web and server settings on the same project.
5. The owner must redeploy the tested revision after environment changes; existing deployments do not automatically pick up newly added environment variables. No deployment has been performed by this repair.
6. Verify /api/auth/status reports configured, then test guest sign-in, existing email sign-in, and Google app exchange. This status confirms configuration presence, not a full provider/database readiness test. Search runtime logs by returned requestId; missing credentials log firebase_configuration_missing, rejected credentials log firebase_configuration_invalid, auth failures log auth_request_failed.

Use Sign In on the app for an account already created on the website. Creating the same account again correctly returns account_exists. Web and mobile may have separate sessions for the same UID without signing each other out.
