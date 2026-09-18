import { adminDb } from "@/lib/firebase/admin";
import type { PaginationParams, PaginatedResult } from "@/types";

export interface IExpense {
  _id: string;
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  paymentMethod?: string;
  branchId?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export class ExpenseRepository {
  private getCollection(tenantId = "default") {
    return adminDb.collection("tenants").doc(tenantId).collection("expenses");
  }

  private mapDoc(doc: FirebaseFirestore.DocumentSnapshot): IExpense | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      _id: doc.id,
      id: doc.id,
      title: data.title ?? "",
      category: data.category ?? "General",
      amount: Number(data.amount ?? 0),
      date: data.date ?? new Date().toISOString(),
      description: data.description,
      paymentMethod: data.paymentMethod,
      branchId: data.branchId,
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  }

  async findById(id: string, tenantId = "default"): Promise<IExpense | null> {
    const doc = await this.getCollection(tenantId).doc(id).get();
    return this.mapDoc(doc);
  }

  async paginate(
    params: PaginationParams & { search?: string },
    tenantId = "default"
  ): Promise<PaginatedResult<IExpense>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const snap = await this.getCollection(tenantId).get();
    let all: IExpense[] = [];

    for (const doc of snap.docs) {
      const e = this.mapDoc(doc);
      if (e) all.push(e);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      all = all.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }

    all.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

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

  async create(data: Partial<IExpense>, tenantId = "default"): Promise<IExpense> {
    const col = this.getCollection(tenantId);
    const docRef = col.doc();
    const now = new Date().toISOString();

    const newExpense = {
      ...data,
      id: docRef.id,
      amount: Number(data.amount ?? 0),
      date: data.date ?? now,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(newExpense);
    return {
      ...newExpense,
      _id: docRef.id,
    } as IExpense;
  }

  async update(id: string, data: Partial<IExpense>, tenantId = "default"): Promise<IExpense | null> {
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

  async delete(id: string, tenantId = "default"): Promise<boolean> {
    await this.getCollection(tenantId).doc(id).delete();
    return true;
  }
}
