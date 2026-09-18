// Database connection helper - migrated to standalone Firebase Firestore
import { adminDb } from "@/lib/firebase/admin";

export async function connectDB() {
  // Standalone Firebase Firestore is connection-less / auto-managed
  return adminDb;
}
