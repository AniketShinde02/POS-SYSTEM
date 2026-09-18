import { adminDb } from "@/lib/firebase/admin";
import { generateInvoiceNumber } from "@/lib/utils";
import type { CartItem, PaymentSplit } from "@/types";
import type { ISale } from "@/repositories/sale.repository";
import { setLocalDoc, getLocalDoc } from "@/lib/tenant-store";
import { ProductRepository } from "@/repositories/product.repository";

export class SaleService {
  async completeSale(params: {
    saleId?: string;
    items: CartItem[];
    discount: number;
    taxRate: number;
    payments: PaymentSplit[];
    customerId?: string;
    cashierId: string;
    branchId?: string;
    notes?: string;
    isOffline?: boolean;
    tenantId?: string;
  }): Promise<ISale> {
    const tenantId = params.tenantId || "default";
    const subtotal = params.items.reduce(
      (sum, item) =>
        sum + item.price * item.quantity * (1 - item.discount / 100),
      0
    );
    const afterDiscount = subtotal - params.discount;
    const tax = afterDiscount * (params.taxRate / 100);
    const total = afterDiscount + tax;

    const paymentTotal = params.payments.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(paymentTotal - total) > 0.05) {
      throw new Error("Payment total does not match sale total");
    }

    const tenantRef = adminDb.collection("tenants").doc(tenantId);
    const salesCol = tenantRef.collection("sales");
    const productsCol = tenantRef.collection("products");
    const inventoryCol = tenantRef.collection("inventory");
    const notifCol = tenantRef.collection("notifications");

    // Idempotency check: if saleId already exists, return existing sale
    const targetSaleId = params.saleId || `SALE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    try {
      const existingDoc = await salesCol.doc(targetSaleId).get();
      if (existingDoc.exists) {
        const data = existingDoc.data()!;
        return {
          _id: existingDoc.id,
          id: existingDoc.id,
          ...data,
        } as ISale;
      }
    } catch {
      const localExisting = getLocalDoc<ISale>(tenantId, "sales", targetSaleId);
      if (localExisting) return localExisting;
    }

    const invoiceNumber = generateInvoiceNumber();
    const now = new Date().toISOString();

    const saleItems = params.items.map((item) => {
      const lineSubtotal = item.price * item.quantity * (1 - item.discount / 100);
      return {
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        tax: item.tax,
        subtotal: lineSubtotal,
        variantId: item.variantId,
        barcode: item.barcode,
      };
    });

    const saleRecord = {
      id: targetSaleId,
      invoiceNumber,
      items: saleItems,
      subtotal,
      discount: params.discount,
      tax,
      total,
      payments: params.payments,
      customerId: params.customerId,
      cashierId: params.cashierId,
      branchId: params.branchId,
      status: "completed" as const,
      notes: params.notes,
      isOffline: params.isOffline ?? false,
      syncedAt: params.isOffline ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Always persist to local tenant store
    setLocalDoc(tenantId, "sales", targetSaleId, saleRecord);

    try {
      // Execute atomic transaction for stock verification & decrement in Firestore
      await adminDb.runTransaction(async (t) => {
        // 1. Read & verify all products
        const productDocs = await Promise.all(
          params.items.map((item) => t.get(productsCol.doc(item.productId)))
        );

        for (let i = 0; i < params.items.length; i++) {
          const item = params.items[i];
          const docSnap = productDocs[i];

          if (!docSnap.exists) {
            continue;
          }

          const productData = docSnap.data()!;
          const currentStock = Number(productData.stock ?? 0);
          if (currentStock < item.quantity) {
            console.warn(`Insufficient stock for ${item.name}. In stock: ${currentStock}, requested: ${item.quantity}`);
          }
        }

        // 2. Commit updates: write sale, decrement stocks, log inventory
        t.set(salesCol.doc(targetSaleId), saleRecord);

        for (let i = 0; i < params.items.length; i++) {
          const item = params.items[i];
          const docSnap = productDocs[i];
          if (!docSnap.exists) continue;

          const productData = docSnap.data()!;
          const prevStock = Number(productData.stock ?? 0);
          const newStock = prevStock - item.quantity;

          // Decrement product stock
          t.update(productsCol.doc(item.productId), {
            stock: newStock,
            updatedAt: now,
          });

          // Inventory log
          const logRef = inventoryCol.doc();
          t.set(logRef, {
            id: logRef.id,
            productId: item.productId,
            type: "sale",
            quantityDelta: -item.quantity,
            previousStock: prevStock,
            newStock,
            reference: invoiceNumber,
            branchId: params.branchId,
            performedBy: params.cashierId,
            timestamp: now,
          });

          // Low stock alert check
          const threshold = Number(productData.lowStockThreshold ?? 5);
          if (newStock <= threshold) {
            const notifRef = notifCol.doc();
            t.set(notifRef, {
              id: notifRef.id,
              title: "Low Stock Alert",
              message: `${productData.name} is low on stock (${newStock} remaining)`,
              type: "low_stock",
              branchId: params.branchId,
              link: "/products",
              read: false,
              createdAt: now,
            });
          }
        }
      });
    } catch (txErr) {
      console.warn("[SaleService] Firestore transaction deferred, updating local inventory:", txErr);
      const productRepo = new ProductRepository();
      for (const item of params.items) {
        await productRepo.updateStock(item.productId, -item.quantity, tenantId);
        const invLogId = `inv_sale_${Date.now()}_${item.productId.slice(0, 5)}`;
        setLocalDoc(tenantId, "inventory", invLogId, {
          id: invLogId,
          _id: invLogId,
          productId: item.productId,
          productName: item.name,
          type: "sale",
          quantityDelta: -item.quantity,
          reference: invoiceNumber,
          performedBy: params.cashierId,
          timestamp: now,
        });
      }
    }

    return {
      _id: targetSaleId,
      ...saleRecord,
    } as ISale;
  }

  async holdCart(params: {
    items: CartItem[];
    discount: number;
    taxRate: number;
    cashierId: string;
    branchId?: string;
    customerId?: string;
    tenantId?: string;
  }) {
    const tenantId = params.tenantId || "default";
    const subtotal = params.items.reduce(
      (sum, item) =>
        sum + item.price * item.quantity * (1 - item.discount / 100),
      0
    );
    const tax = (subtotal - params.discount) * (params.taxRate / 100);
    const total = subtotal - params.discount + tax;
    const now = new Date().toISOString();

    const tenantRef = adminDb.collection("tenants").doc(tenantId);
    const docRef = tenantRef.collection("sales").doc();

    const heldSale = {
      id: docRef.id,
      invoiceNumber: generateInvoiceNumber("HOLD"),
      items: params.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        tax: item.tax,
        subtotal: item.price * item.quantity,
        variantId: item.variantId,
      })),
      subtotal,
      discount: params.discount,
      tax,
      total,
      payments: [],
      cashierId: params.cashierId,
      branchId: params.branchId,
      customerId: params.customerId,
      status: "held",
      heldAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(heldSale);
    return {
      _id: docRef.id,
      ...heldSale,
    };
  }
}
