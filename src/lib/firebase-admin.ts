import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (credentials) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(credentials)) });
    } else if (process.env.NODE_ENV !== 'production' && process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST) {
      admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-eatinformed' });
    }
  } catch {
    console.error(JSON.stringify({ event: 'firebase_configuration_invalid' }));
  }
}
export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;
