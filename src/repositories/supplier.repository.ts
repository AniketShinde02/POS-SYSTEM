import { adminDb } from "@/lib/firebase/admin";
import type { PaginationParams, PaginatedResult } from "@/types";

export interface ISupplier {
  _id: string;
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class SupplierRepository {
  private getCollection(tenantId = "default") {
    return adminDb.collection("tenants").doc(tenantId).collection("suppliers");
  }

  private mapDoc(doc: FirebaseFirestore.DocumentSnapshot): ISupplier | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      _id: doc.id,
      id: doc.id,
      name: data.name ?? "",
      company: data.company,
      email: data.email,
      phone: data.phone,
      address: data.address,
      isActive: data.isActive !== false,
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  }

  async findById(id: string, tenantId = "default"): Promise<ISupplier | null> {
    const doc = await this.getCollection(tenantId).doc(id).get();
    return this.mapDoc(doc);
  }

  async paginate(params: PaginationParams, tenantId = "default"): Promise<PaginatedResult<ISupplier>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const snap = await this.getCollection(tenantId).where("isActive", "==", true).get();
    let all: ISupplier[] = [];

    for (const doc of snap.docs) {
      const s = this.mapDoc(doc);
      if (s) all.push(s);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      all = all.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.company && s.company.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          (s.phone && s.phone.includes(q))
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

  async create(data: Partial<ISupplier>, tenantId = "default"): Promise<ISupplier> {
    const col = this.getCollection(tenantId);
    const docRef = col.doc();
    const now = new Date().toISOString();

    const newSupplier = {
      ...data,
      id: docRef.id,
      isActive: data.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(newSupplier);
    return {
      ...newSupplier,
      _id: docRef.id,
    } as ISupplier;
  }

  async update(id: string, data: Partial<ISupplier>, tenantId = "default"): Promise<ISupplier | null> {
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

  async delete(id: string, tenantId = "default"): Promise<ISupplier | null> {
    return this.update(id, { isActive: false }, tenantId);
  }
}
