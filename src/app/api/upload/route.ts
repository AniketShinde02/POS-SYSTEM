import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-helpers";
import { adminStorage } from "@/lib/firebase/admin";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return apiError("No file provided");

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return apiError("Only JPEG, PNG, WebP, and GIF images are allowed");
    }

    if (file.size > 5 * 1024 * 1024) {
      return apiError("File must be under 5MB");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tenantId = session.user.tenantId || "default";
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `tenants/${tenantId}/products/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

    const storageFile = adminStorage.file(filename);

    await storageFile.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    try {
      await storageFile.makePublic();
    } catch {
      // If uniform bucket-level access is enabled, makePublic might not be allowed;
      // standard token-based media URL will be generated
    }

    const bucketName = adminStorage.name;
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filename)}?alt=media`;

    return apiSuccess({
      url: publicUrl,
      filename,
      provider: "firebase_storage",
    });
  } catch (e) {
    console.error("[Upload Error]:", e);
    return apiError(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
