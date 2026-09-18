import { adminDb } from "@/lib/firebase/admin";
import type { PaginationParams, PaginatedResult } from "@/types";

export interface IPurchaseItem {
  productId: string;
  name: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface IPurchase {
  _id: string;
  id: string;
  purchaseNumber: string;
  supplierId?: string;
  supplierName?: string;
  items: IPurchaseItem[];
  total: number;
  status: string;
  notes?: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export class PurchaseRepository {
  private getCollection(tenantId = "default") {
    return adminDb.collection("tenants").doc(tenantId).collection("purchases");
  }

  private mapDoc(doc: FirebaseFirestore.DocumentSnapshot): IPurchase | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      _id: doc.id,
      id: doc.id,
      purchaseNumber: data.purchaseNumber ?? "",
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      items: data.items ?? [],
      total: Number(data.total ?? 0),
      status: data.status ?? "received",
      notes: data.notes,
      branchId: data.branchId,
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  }

  async findById(id: string, tenantId = "default"): Promise<IPurchase | null> {
    const doc = await this.getCollection(tenantId).doc(id).get();
    return this.mapDoc(doc);
  }

  async paginate(params: PaginationParams, tenantId = "default"): Promise<PaginatedResult<IPurchase>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const snap = await this.getCollection(tenantId).get();
    let all: IPurchase[] = [];

    for (const doc of snap.docs) {
      const p = this.mapDoc(doc);
      if (p) all.push(p);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      all = all.filter(
        (p) =>
          p.purchaseNumber.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q))
      );
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

  async create(data: Partial<IPurchase>, tenantId = "default"): Promise<IPurchase> {
    const col = this.getCollection(tenantId);
    const docRef = col.doc();
    const now = new Date().toISOString();

    const newPurchase = {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(newPurchase);
    return {
      ...newPurchase,
      _id: docRef.id,
    } as IPurchase;
  }
}
