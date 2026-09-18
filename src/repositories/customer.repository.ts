import { adminDb } from "@/lib/firebase/admin";
import type { PaginationParams, PaginatedResult } from "@/types";

export interface ICustomer {
  _id: string;
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  totalPurchases: number;
  totalSpent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class CustomerRepository {
  private getCollection(tenantId = "default") {
    return adminDb.collection("tenants").doc(tenantId).collection("customers");
  }

  private mapDoc(doc: FirebaseFirestore.DocumentSnapshot): ICustomer | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      _id: doc.id,
      id: doc.id,
      name: data.name ?? "",
      email: data.email,
      phone: data.phone ?? "",
      address: data.address,
      totalPurchases: Number(data.totalPurchases ?? 0),
      totalSpent: Number(data.totalSpent ?? 0),
      isActive: data.isActive !== false,
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  }

  async findById(id: string, tenantId = "default"): Promise<ICustomer | null> {
    const doc = await this.getCollection(tenantId).doc(id).get();
    return this.mapDoc(doc);
  }

  async paginate(params: PaginationParams, tenantId = "default"): Promise<PaginatedResult<ICustomer>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const snap = await this.getCollection(tenantId).where("isActive", "==", true).get();
    let all: ICustomer[] = [];

    for (const doc of snap.docs) {
      const c = this.mapDoc(doc);
      if (c) all.push(c);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      all = all.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
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

  async create(data: Partial<ICustomer>, tenantId = "default"): Promise<ICustomer> {
    const col = this.getCollection(tenantId);
    const docRef = col.doc();
    const now = new Date().toISOString();

    const newCustomer = {
      ...data,
      id: docRef.id,
      totalPurchases: Number(data.totalPurchases ?? 0),
      totalSpent: Number(data.totalSpent ?? 0),
      isActive: data.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(newCustomer);
    return {
      ...newCustomer,
      _id: docRef.id,
    } as ICustomer;
  }

  async update(id: string, data: Partial<ICustomer>, tenantId = "default"): Promise<ICustomer | null> {
    const docRef = this.getCollection(tenantId).doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const updates = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    delete (updates as Record<string, unknown>)._id;
    delete (updates as Record<string, unknown>).id;

    await docRef.update(updates);
    return this.findById(id, tenantId);
  }

  async delete(id: string, tenantId = "default"): Promise<ICustomer | null> {
    return this.update(id, { isActive: false }, tenantId);
  }
}
