import { adminDb } from "@/lib/firebase/admin";
import { ProductRepository } from "@/repositories/product.repository";

const productRepo = new ProductRepository();

export class InventoryService {
  async adjustStock(params: {
    productId: string;
    quantity: number;
    type: "adjustment" | "damage" | "return" | "transfer";
    notes?: string;
    createdBy: string;
    branchId?: string;
    warehouseId?: string;
    tenantId?: string;
  }) {
    const tenantId = params.tenantId || "default";
    const tenantRef = adminDb.collection("tenants").doc(tenantId);
    const prodRef = tenantRef.collection("products").doc(params.productId);
    const invCol = tenantRef.collection("inventory");
    const now = new Date().toISOString();

    let updatedProduct;

    try {
      await adminDb.runTransaction(async (t) => {
        const snap = await t.get(prodRef);
        if (!snap.exists) throw new Error("Product not found");

        const data = snap.data()!;
        const previousStock = Number(data.stock ?? 0);
        const newStock = previousStock + params.quantity;
        if (newStock < 0) throw new Error("Stock cannot be negative");

        t.update(prodRef, { stock: newStock, updatedAt: now });

        const logRef = invCol.doc();
        t.set(logRef, {
          id: logRef.id,
          productId: params.productId,
          type: params.type,
          quantityDelta: params.quantity,
          previousStock,
          newStock,
          notes: params.notes,
          branchId: params.branchId,
          warehouseId: params.warehouseId,
          performedBy: params.createdBy,
          timestamp: now,
        });

        updatedProduct = {
          _id: prodRef.id,
          id: prodRef.id,
          ...data,
          stock: newStock,
          updatedAt: now,
        };
      });
    } catch (txErr) {
      console.warn("[InventoryService] Firestore transaction deferred, fallback to local:", txErr);
      const prod = await productRepo.findById(params.productId, tenantId);
      if (!prod) throw new Error("Product not found");

      const previousStock = Number(prod.stock ?? 0);
      const newStock = previousStock + params.quantity;
      if (newStock < 0) throw new Error("Stock cannot be negative");

      await productRepo.updateStock(params.productId, params.quantity, tenantId);

      const logId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const logData = {
        id: logId,
        _id: logId,
        productId: params.productId,
        productName: prod.name,
        type: params.type,
        quantityDelta: params.quantity,
        previousStock,
        newStock,
        notes: params.notes ?? "",
        branchId: params.branchId,
        warehouseId: params.warehouseId,
        performedBy: params.createdBy,
        timestamp: now,
      };

      const { setLocalDoc } = await import("@/lib/tenant-store");
      setLocalDoc(tenantId, "inventory", logId, logData);

      updatedProduct = {
        ...prod,
        stock: newStock,
        updatedAt: now,
      };
    }

    return updatedProduct;
  }

  async transferStock(params: {
    productId: string;
    quantity: number;
    fromWarehouse: string;
    toWarehouse: string;
    createdBy: string;
    branchId?: string;
    tenantId?: string;
  }) {
    return this.adjustStock({
      productId: params.productId,
      quantity: 0,
      type: "transfer",
      notes: `Transfer ${params.quantity} from ${params.fromWarehouse} to ${params.toWarehouse}`,
      createdBy: params.createdBy,
      branchId: params.branchId,
      warehouseId: params.toWarehouse,
      tenantId: params.tenantId,
    });
  }

  async getLowStockAlerts(tenantId = "default") {
    return productRepo.lowStock(5, tenantId);
  }

  async getHistory(productId: string, limit = 50, tenantId = "default") {
    let items: Record<string, unknown>[] = [];
    try {
      const snap = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("inventory")
        .where("productId", "==", productId)
        .limit(limit)
        .get();

      items = snap.docs.map((doc) => ({
        id: doc.id,
        _id: doc.id,
        ...doc.data(),
      }));
    } catch (dbErr) {
      console.warn("[InventoryService] Firestore getHistory deferred:", dbErr);
    }

    if (items.length === 0) {
      const { readLocalCollection } = await import("@/lib/tenant-store");
      items = readLocalCollection<Record<string, unknown>>(tenantId, "inventory").filter(
        (entry) => !productId || (entry as { productId?: string }).productId === productId
      );
    }

    items.sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        new Date((b.timestamp || b.createdAt) as string).getTime() -
        new Date((a.timestamp || a.createdAt) as string).getTime()
    );

    return items;
  }
}
