import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-helpers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth();
    const tenantId = session.user.tenantId || "default";
    const uid = session.user.id;

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const avatar = typeof body.avatar === "string" ? body.avatar : undefined;

    if (!name) {
      return apiError("Name is required", 400);
    }

    const userDocRef = adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("users")
      .doc(uid);

    const updateData: Record<string, unknown> = {
      name,
      updatedAt: new Date().toISOString(),
    };
    if (avatar) {
      updateData.avatarUrl = avatar;
    }

    await userDocRef.set(updateData, { merge: true });

    // Update in Firebase Auth
    try {
      await adminAuth.updateUser(uid, {
        displayName: name,
        photoURL: avatar,
      });
    } catch (e) {
      console.warn("Failed to update Firebase Auth displayName:", e);
    }

    const updatedSnap = await userDocRef.get();
    const userData = updatedSnap.data();

    return apiSuccess(
      {
        user: {
          id: uid,
          _id: uid,
          ...userData,
        },
      },
      "Profile updated",
      200
    );
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to update profile",
      401
    );
  }
}
