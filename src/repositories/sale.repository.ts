import { adminDb } from "@/lib/firebase/admin";
import type { PaginationParams, PaginatedResult } from "@/types";
import { readLocalCollection, setLocalDoc, getLocalDoc } from "@/lib/tenant-store";

export interface ISaleItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  subtotal: number;
  variantId?: string;
  barcode?: string;
}

export interface ISalePayment {
  method: string;
  amount: number;
  reference?: string;
}

export interface ISale {
  _id: string;
  id: string;
  invoiceNumber: string;
  items: ISaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payments: ISalePayment[];
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName?: string;
  branchId?: string;
  status: "completed" | "held" | "returned" | "refunded";
  notes?: string;
  heldAt?: string;
  isOffline?: boolean;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class SaleRepository {
  private getCollection(tenantId = "default") {
    return adminDb.collection("tenants").doc(tenantId).collection("sales");
  }

  private mapDoc(doc: FirebaseFirestore.DocumentSnapshot): ISale | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      _id: doc.id,
      id: doc.id,
      invoiceNumber: data.invoiceNumber ?? "",
      items: data.items ?? [],
      subtotal: Number(data.subtotal ?? 0),
      discount: Number(data.discount ?? 0),
      tax: Number(data.tax ?? 0),
      total: Number(data.total ?? 0),
      payments: data.payments ?? [],
      customerId: data.customerId,
      customerName: data.customerName,
      cashierId: data.cashierId ?? "",
      cashierName: data.cashierName,
      branchId: data.branchId,
      status: data.status ?? "completed",
      notes: data.notes,
      heldAt: data.heldAt,
      isOffline: data.isOffline,
      syncedAt: data.syncedAt,
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  }

  async findById(id: string, tenantId = "default"): Promise<ISale | null> {
    try {
      const doc = await this.getCollection(tenantId).doc(id).get();
      if (doc.exists) return this.mapDoc(doc);
    } catch (dbErr) {
      console.warn("[SaleRepo] Firestore findById deferred:", dbErr);
    }
    return getLocalDoc<ISale>(tenantId, "sales", id);
  }

  async findByInvoice(invoiceNumber: string, tenantId = "default"): Promise<ISale | null> {
    try {
      const snap = await this.getCollection(tenantId)
        .where("invoiceNumber", "==", invoiceNumber)
        .limit(1)
        .get();
      if (!snap.empty) return this.mapDoc(snap.docs[0]);
    } catch (dbErr) {
      console.warn("[SaleRepo] Firestore findByInvoice deferred:", dbErr);
    }
    const local = readLocalCollection<ISale>(tenantId, "sales");
    return local.find((s) => s.invoiceNumber === invoiceNumber) ?? null;
  }

  async paginate(
    params: PaginationParams & {
      status?: string;
      from?: Date;
      to?: Date;
      branchId?: string;
    },
    tenantId = "default"
  ): Promise<PaginatedResult<ISale>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    let all: ISale[] = [];

    try {
      const snap = await this.getCollection(tenantId).get();
      for (const doc of snap.docs) {
        const sale = this.mapDoc(doc);
        if (sale) all.push(sale);
      }
    } catch (dbErr) {
      console.warn("[SaleRepo] Firestore paginate deferred:", dbErr);
    }

    if (all.length === 0) {
      all = readLocalCollection<ISale>(tenantId, "sales");
    }

    if (params.status) {
      all = all.filter((s) => s.status === params.status);
    }

    if (params.branchId) {
      all = all.filter((s) => s.branchId === params.branchId);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      all = all.filter((s) => s.invoiceNumber.toLowerCase().includes(q));
    }

    if (params.from) {
      const fromTime = params.from.getTime();
      all = all.filter((s) => new Date(s.createdAt).getTime() >= fromTime);
    }

    if (params.to) {
      const toTime = params.to.getTime();
      all = all.filter((s) => new Date(s.createdAt).getTime() <= toTime);
    }

    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = all.length;
    const skip = (page - 1) * limit;
    const items = all.slice(skip, skip + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(data: Partial<ISale>, tenantId = "default"): Promise<ISale> {
    const col = this.getCollection(tenantId);
    const docRef = data.id ? col.doc(data.id) : col.doc();
    const id = docRef.id;
    const now = new Date().toISOString();

    const newSale: ISale = {
      _id: id,
      id,
      invoiceNumber: data.invoiceNumber ?? `INV-${Date.now()}`,
      items: data.items ?? [],
      subtotal: Number(data.subtotal ?? 0),
      discount: Number(data.discount ?? 0),
      tax: Number(data.tax ?? 0),
      total: Number(data.total ?? 0),
      payments: data.payments ?? [],
      customerId: data.customerId,
      customerName: data.customerName,
      cashierId: data.cashierId ?? "",
      cashierName: data.cashierName,
      branchId: data.branchId,
      status: data.status ?? "completed",
      notes: data.notes,
      heldAt: data.heldAt,
      isOffline: data.isOffline,
      syncedAt: data.syncedAt,
      createdAt: data.createdAt ?? now,
      updatedAt: now,
    };

    setLocalDoc(tenantId, "sales", id, newSale);

    try {
      await docRef.set(newSale, { merge: true });
    } catch (dbErr) {
      console.warn("[SaleRepo] Firestore create deferred:", dbErr);
    }

    return newSale;
  }

  async getRevenueStats(from?: Date | string, to?: Date | string, branchId?: string, tenantId = "default") {
    let sales: ISale[] = [];

    try {
      const snap = await this.getCollection(tenantId).where("status", "==", "completed").get();
      for (const doc of snap.docs) {
        const s = this.mapDoc(doc);
        if (s) sales.push(s);
      }
    } catch (dbErr) {
      console.warn("[SaleRepo] Firestore getRevenueStats deferred:", dbErr);
    }

    if (sales.length === 0) {
      sales = readLocalCollection<ISale>(tenantId, "sales").filter((s) => s.status === "completed");
    }

    const fromTime = from ? (from instanceof Date ? from.getTime() : new Date(from).getTime()) : 0;
    const toTime = to ? (to instanceof Date ? to.getTime() : new Date(to).getTime()) : Date.now() + 60000;
    let totalRevenue = 0;
    let totalSales = 0;

    for (const s of sales) {
      const saleTime = new Date(s.createdAt).getTime();
      if (saleTime >= fromTime && saleTime <= toTime) {
        if (!branchId || s.branchId === branchId) {
          totalRevenue += Number(s.total ?? 0);
          totalSales += 1;
        }
      }
    }

    const avgOrder = totalSales > 0 ? totalRevenue / totalSales : 0;
    return { totalRevenue, totalSales, avgOrder };
  }

  async topProducts(limit = 10, from?: Date | string, to?: Date | string, tenantId = "default") {
    let sales: ISale[] = [];

    try {
      const snap = await this.getCollection(tenantId).where("status", "==", "completed").get();
      for (const doc of snap.docs) {
        const s = this.mapDoc(doc);
        if (s) sales.push(s);
      }
    } catch (dbErr) {
      console.warn("[SaleRepo] Firestore topProducts deferred:", dbErr);
    }

    if (sales.length === 0) {
      sales = readLocalCollection<ISale>(tenantId, "sales").filter((s) => s.status === "completed");
    }

    const fromTime = from ? (from instanceof Date ? from.getTime() : new Date(from).getTime()) : 0;
    const toTime = to ? (to instanceof Date ? to.getTime() : new Date(to).getTime()) : Date.now() + 60000;
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    for (const s of sales) {
      const saleTime = new Date(s.createdAt).getTime();
      if (saleTime < fromTime || saleTime > toTime) continue;

      const items = (s.items as ISaleItem[]) || [];
      for (const item of items) {
        const existing = productMap.get(item.productId) ?? {
          name: item.name,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.subtotal;
        productMap.set(item.productId, existing);
      }
    }

    const sorted = Array.from(productMap.entries())
      .map(([id, val]) => ({
        _id: id,
        name: val.name,
        quantity: val.quantity,
        revenue: val.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);

    return sorted;
  }

  async recent(limit = 10, tenantId = "default"): Promise<ISale[]> {
    let sales: ISale[] = [];

    try {
      const snap = await this.getCollection(tenantId).where("status", "==", "completed").get();
      for (const doc of snap.docs) {
        const s = this.mapDoc(doc);
        if (s) sales.push(s);
      }
    } catch (dbErr) {
      console.warn("[SaleRepo] Firestore recent deferred:", dbErr);
    }

    if (sales.length === 0) {
      sales = readLocalCollection<ISale>(tenantId, "sales").filter((s) => s.status === "completed");
    }

    sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sales.slice(0, limit);
  }
}
