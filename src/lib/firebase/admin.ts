import { getApps, getApp, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

let app: App;

if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  app = initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
} else {
  app = getApp();
}

export const adminDb = getFirestore(app);
try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {
  // settings() can only be called once before any operations; safe to ignore on HMR re-evaluations
}
export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app).bucket();
export default app;
