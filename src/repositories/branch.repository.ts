import { adminDb } from "@/lib/firebase/admin";
import type { PaginationParams, PaginatedResult } from "@/types";

export interface IBranch {
  _id: string;
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class BranchRepository {
  private getCollection(tenantId = "default") {
    return adminDb.collection("tenants").doc(tenantId).collection("branches");
  }

  private mapDoc(doc: FirebaseFirestore.DocumentSnapshot): IBranch | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      _id: doc.id,
      id: doc.id,
      name: data.name ?? "",
      code: data.code ?? "",
      address: data.address,
      phone: data.phone,
      email: data.email,
      isActive: data.isActive !== false,
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  }

  async findById(id: string, tenantId = "default"): Promise<IBranch | null> {
    const doc = await this.getCollection(tenantId).doc(id).get();
    return this.mapDoc(doc);
  }

  async paginate(params: PaginationParams, tenantId = "default"): Promise<PaginatedResult<IBranch>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const snap = await this.getCollection(tenantId).where("isActive", "==", true).get();
    let all: IBranch[] = [];

    for (const doc of snap.docs) {
      const b = this.mapDoc(doc);
      if (b) all.push(b);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      all = all.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          (b.address && b.address.toLowerCase().includes(q))
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

  async create(data: Partial<IBranch>, tenantId = "default"): Promise<IBranch> {
    const col = this.getCollection(tenantId);
    const docRef = col.doc();
    const now = new Date().toISOString();

    const newBranch = {
      ...data,
      id: docRef.id,
      isActive: data.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(newBranch);
    return {
      ...newBranch,
      _id: docRef.id,
    } as IBranch;
  }

  async update(id: string, data: Partial<IBranch>, tenantId = "default"): Promise<IBranch | null> {
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

  async delete(id: string, tenantId = "default"): Promise<IBranch | null> {
    return this.update(id, { isActive: false }, tenantId);
  }
}
