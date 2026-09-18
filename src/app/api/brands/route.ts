import { apiError, apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import { brandSchema } from "@/validations/brand.schema";
import { readLocalCollection, setLocalDoc } from "@/lib/tenant-store";

export async function GET() {
  try {
    const session = await requirePermission("brands.view");
    const tenantId = session.user.tenantId || "default";

    interface IBrandItem {
      _id: string;
      id: string;
      name: string;
      slug?: string;
      logo?: string;
      isActive?: boolean;
    }

    let brands: IBrandItem[] = [];
    try {
      const snap = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("brands")
        .where("isActive", "==", true)
        .get();

      brands = snap.docs.map((d) => {
        const data = d.data();
        return {
          _id: d.id,
          id: d.id,
          name: typeof data.name === "string" ? data.name : "",
          ...data,
        };
      });
    } catch (dbErr) {
      console.warn("[BrandsAPI] Firestore deferred, falling back to local:", dbErr);
    }

    if (brands.length === 0) {
      brands = readLocalCollection<IBrandItem>(tenantId, "brands").filter((b) => b.isActive !== false);
    }

    brands.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return apiSuccess(brands);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Failed to load brands", 401);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("brands.manage");
    const tenantId = session.user.tenantId || "default";

    const body = await req.json();
    const parsed = brandSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid brand data");
    }

    const data = parsed.data;
    const slug = data.slug?.trim()
      ? data.slug.trim().toLowerCase().replace(/\s+/g, "-")
      : data.name.trim().toLowerCase().replace(/\s+/g, "-");

    const docRef = adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("brands")
      .doc();

    const now = new Date().toISOString();
    const newBrand = {
      id: docRef.id,
      _id: docRef.id,
      name: data.name,
      slug,
      logo: data.logo,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    setLocalDoc(tenantId, "brands", docRef.id, newBrand);

    try {
      await docRef.set(newBrand);
    } catch (dbErr) {
      console.warn("[BrandsAPI] Firestore deferred:", dbErr);
    }

    return apiSuccess(newBrand, "Brand created", 201);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Failed to create brand", 400);
  }
}

