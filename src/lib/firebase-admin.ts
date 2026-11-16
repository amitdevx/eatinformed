import admin from 'firebase-admin';
import { parseServiceAccount } from './firebase-credentials';

if (!admin.apps.length) {
  try {
    const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (credentials) {
      admin.initializeApp({ credential: admin.credential.cert(parseServiceAccount(credentials)) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)) {
      admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }) });
    } else if (process.env.NODE_ENV !== 'production' && process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST) {
      admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-eatinformed' });
    } else {
      console.warn(JSON.stringify({ event: 'firebase_configuration_missing', code: 'no_supported_admin_credentials' }));
    }
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : error instanceof SyntaxError ? 'invalid_json' : 'invalid_credential';
    console.error(JSON.stringify({ event: 'firebase_configuration_invalid', code }));
  }
}
export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;
