import { adminDb } from "@/lib/firebase/admin";
import type { PaginationParams, PaginatedResult, UserRole } from "@/types";
import { readLocalCollection, setLocalDoc, getLocalDoc } from "@/lib/tenant-store";

export interface IUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  employeeId?: string;
  role: UserRole;
  isActive: boolean;
  branchId?: string;
  avatarUrl?: string;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export class EmployeeRepository {
  private getCollection(tenantId = "default") {
    return adminDb.collection("tenants").doc(tenantId).collection("users");
  }

  private mapDoc(doc: FirebaseFirestore.DocumentSnapshot): IUser | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      _id: doc.id,
      id: doc.id,
      name: data.name ?? "",
      email: data.email ?? "",
      phone: data.phone,
      employeeId: data.employeeId,
      role: (data.role as UserRole) ?? "cashier",
      isActive: data.isActive !== false,
      branchId: data.branchId,
      avatarUrl: data.avatarUrl,
      permissions: data.permissions,
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  }

  async findById(id: string, tenantId = "default"): Promise<IUser | null> {
    try {
      const doc = await this.getCollection(tenantId).doc(id).get();
      if (doc.exists) {
        return this.mapDoc(doc);
      }
    } catch (dbErr) {
      console.warn("[EmployeeRepo] Firestore read deferred:", dbErr);
    }
    return getLocalDoc<IUser>(tenantId, "users", id);
  }

  async paginate(params: PaginationParams, tenantId = "default"): Promise<PaginatedResult<IUser>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    let all: IUser[] = [];

    try {
      const snap = await this.getCollection(tenantId).where("isActive", "==", true).get();
      for (const doc of snap.docs) {
        const u = this.mapDoc(doc);
        if (u) all.push(u);
      }
    } catch (dbErr) {
      console.warn("[EmployeeRepo] Firestore paginate deferred:", dbErr);
    }

    if (all.length === 0) {
      all = readLocalCollection<IUser>(tenantId, "users").filter((u) => u.isActive !== false);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      all = all.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q)) ||
          (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
          u.role.toLowerCase().includes(q)
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

  async create(data: Partial<IUser>, tenantId = "default"): Promise<IUser> {
    const col = this.getCollection(tenantId);
    const targetId = data.id || data._id;
    const docRef = targetId ? col.doc(targetId) : col.doc();
    const id = docRef.id;
    const now = new Date().toISOString();

    let empId = data.employeeId;
    if (!empId) {
      try {
        const countSnap = await col.get();
        const nextNum = countSnap.size + 1;
        empId = `EMP-${String(nextNum).padStart(4, "0")}`;
      } catch {
        empId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    const newUser: IUser = {
      _id: id,
      id,
      name: data.name ?? "",
      email: data.email ?? "",
      phone: data.phone,
      employeeId: empId,
      role: (data.role as UserRole) ?? "cashier",
      isActive: data.isActive !== false,
      branchId: data.branchId,
      avatarUrl: data.avatarUrl,
      permissions: data.permissions ?? [],
      createdAt: now,
      updatedAt: now,
    };

    setLocalDoc(tenantId, "users", id, newUser);

    try {
      await docRef.set(newUser);
    } catch (dbErr) {
      console.warn("[EmployeeRepo] Firestore create deferred:", dbErr);
    }

    return newUser;
  }

  async update(id: string, data: Partial<IUser>, tenantId = "default"): Promise<IUser | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    const updated: IUser = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    setLocalDoc(tenantId, "users", id, updated);

    try {
      await this.getCollection(tenantId).doc(id).set(updated, { merge: true });
    } catch (dbErr) {
      console.warn("[EmployeeRepo] Firestore update deferred:", dbErr);
    }

    return updated;
  }

  async delete(id: string, tenantId = "default"): Promise<boolean> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return false;

    existing.isActive = false;
    existing.updatedAt = new Date().toISOString();

    setLocalDoc(tenantId, "users", id, existing);

    try {
      await this.getCollection(tenantId).doc(id).update({
        isActive: false,
        updatedAt: existing.updatedAt,
      });
    } catch (dbErr) {
      console.warn("[EmployeeRepo] Firestore delete deferred:", dbErr);
    }

    return true;
  }
}
