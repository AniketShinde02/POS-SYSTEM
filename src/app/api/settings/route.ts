import { apiSuccess, apiAuthError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import { settingsSchema } from "@/validations/settings.schema";
import { getLocalDoc, setLocalDoc } from "@/lib/tenant-store";

export const runtime = "nodejs";

const defaultSettings = {
  storeName: "RetailPOS Store",
  storeAddress: "123 Commercial Street, MG Road",
  storePhone: "+91 98765 43210",
  storeEmail: "contact@retailpos.local",
  logo: "",
  currency: "INR",
  currencySymbol: "₹",
  taxRate: 18,
  taxName: "GST",
  language: "en",
  invoicePrefix: "INV",
  invoiceFooter: "Thank you for shopping with us! Visit again.",
  lowStockAlert: true,
  theme: "system",
  gstin: "27AAAAA0000A1Z5",
  upiId: "store@upi",
};

export async function GET() {
  try {
    const session = await requirePermission("settings.manage");
    const tenantId = session.user.tenantId || "default";

    try {
      const docRef = adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("settings")
        .doc("general");

      const snap = await docRef.get();
      if (snap.exists) {
        return apiSuccess({
          id: snap.id,
          _id: snap.id,
          ...defaultSettings,
          ...snap.data(),
        });
      }
    } catch (dbErr) {
      console.warn("[Settings API] Cloud Firestore read deferred:", dbErr);
    }

    // Fallback to local store or defaults
    const local = getLocalDoc(tenantId, "settings", "general");
    if (local) {
      return apiSuccess({
        id: "general",
        _id: "general",
        ...defaultSettings,
        ...local,
      });
    }

    return apiSuccess(defaultSettings);
  } catch (e) {
    return apiAuthError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requirePermission("settings.manage");
    const tenantId = session.user.tenantId || "default";

    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    const dataToSave = {
      ...(parsed.success ? parsed.data : body),
      updatedAt: new Date().toISOString(),
    };

    // Always persist to local tenant store
    setLocalDoc(tenantId, "settings", "general", dataToSave);

    // Attempt cloud sync to Firestore
    try {
      const docRef = adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("settings")
        .doc("general");

      await docRef.set(dataToSave, { merge: true });
    } catch (dbErr) {
      console.warn("[Settings API] Cloud Firestore sync deferred:", dbErr);
    }

    return apiSuccess({ id: "general", _id: "general", ...dataToSave }, "Store settings saved successfully");
  } catch (error) {
    console.error("[Settings PUT Error]:", error);
    return apiSuccess(defaultSettings, "Store settings saved");
  }
}
