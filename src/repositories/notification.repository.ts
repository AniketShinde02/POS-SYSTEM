import { adminDb } from "@/lib/firebase/admin";
import type { PaginationParams, PaginatedResult } from "@/types";

export interface INotification {
  _id: string;
  id: string;
  title: string;
  message: string;
  type: string;
  branchId?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export class NotificationRepository {
  private getCollection(tenantId = "default") {
    return adminDb.collection("tenants").doc(tenantId).collection("notifications");
  }

  private mapDoc(doc: FirebaseFirestore.DocumentSnapshot): INotification | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      _id: doc.id,
      id: doc.id,
      title: data.title ?? "",
      message: data.message ?? "",
      type: data.type ?? "info",
      branchId: data.branchId,
      link: data.link,
      read: Boolean(data.read),
      createdAt: data.createdAt ?? new Date().toISOString(),
    };
  }

  async findById(id: string, tenantId = "default"): Promise<INotification | null> {
    const doc = await this.getCollection(tenantId).doc(id).get();
    return this.mapDoc(doc);
  }

  async paginate(params: PaginationParams, tenantId = "default"): Promise<PaginatedResult<INotification>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const snap = await this.getCollection(tenantId).get();
    let all: INotification[] = [];

    for (const doc of snap.docs) {
      const n = this.mapDoc(doc);
      if (n) all.push(n);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      all = all.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.type.toLowerCase().includes(q)
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

  async create(data: Partial<INotification>, tenantId = "default"): Promise<INotification> {
    const col = this.getCollection(tenantId);
    const docRef = col.doc();
    const now = new Date().toISOString();

    const newNotif = {
      ...data,
      id: docRef.id,
      read: Boolean(data.read),
      createdAt: now,
    };

    await docRef.set(newNotif);
    return {
      ...newNotif,
      _id: docRef.id,
    } as INotification;
  }

  async update(id: string, data: Partial<INotification>, tenantId = "default"): Promise<INotification | null> {
    const docRef = this.getCollection(tenantId).doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const updates = { ...data };
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
