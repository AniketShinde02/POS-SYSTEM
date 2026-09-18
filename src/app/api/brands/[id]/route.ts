import { apiError, apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import { brandSchema } from "@/validations/brand.schema";
import { getLocalDoc, setLocalDoc, deleteLocalDoc } from "@/lib/tenant-store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("brands.view");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    try {
      const doc = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("brands")
        .doc(id)
        .get();

      if (doc.exists) {
        return apiSuccess({ _id: doc.id, id: doc.id, ...doc.data() });
      }
    } catch (dbErr) {
      console.warn("[BrandsAPI] Firestore deferred:", dbErr);
    }

    const localBrand = getLocalDoc(tenantId, "brands", id);
    if (!localBrand) return apiError("Brand not found", 404);
    return apiSuccess(localBrand);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Failed to load brand", 401);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("brands.manage");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    const body = await req.json();
    const parsed = brandSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid brand data");
    }

    const data = parsed.data;
    const slug = data.slug?.trim()
      ? data.slug.trim().toLowerCase().replace(/\s+/g, "-")
      : data.name.trim().toLowerCase().replace(/\s+/g, "-");

    const existing = getLocalDoc(tenantId, "brands", id) || {};
    const updateData = {
      ...existing,
      id,
      _id: id,
      name: data.name,
      slug,
      logo: data.logo,
      isActive: data.isActive ?? true,
      updatedAt: new Date().toISOString(),
    };

    setLocalDoc(tenantId, "brands", id, updateData);

    try {
      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("brands")
        .doc(id)
        .set(updateData, { merge: true });
    } catch (dbErr) {
      console.warn("[BrandsAPI] Firestore deferred:", dbErr);
    }

    return apiSuccess(updateData, "Brand updated");
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Failed to update brand", 400);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("brands.manage");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    deleteLocalDoc(tenantId, "brands", id);

    try {
      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("brands")
        .doc(id)
        .delete();
    } catch (dbErr) {
      console.warn("[BrandsAPI] Firestore deferred:", dbErr);
    }

    return apiSuccess(null, "Brand deleted");
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Failed to delete brand", 400);
  }
}

