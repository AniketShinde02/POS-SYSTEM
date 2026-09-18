import { adminDb } from "@/lib/firebase/admin";
import { readLocalCollection, setLocalDoc, getLocalDoc } from "@/lib/tenant-store";

export interface ICategory {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export class CategoryRepository {
  private getCollection(tenantId = "default") {
    return adminDb.collection("tenants").doc(tenantId).collection("categories");
  }

  private mapDoc(doc: FirebaseFirestore.DocumentSnapshot): ICategory | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      _id: doc.id,
      id: doc.id,
      name: data.name ?? "",
      slug: data.slug ?? "",
      description: data.description,
      image: data.image,
      parentId: data.parentId,
      isActive: data.isActive !== false,
      branchId: data.branchId,
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  }

  async findAll(tenantId = "default"): Promise<ICategory[]> {
    let categories: ICategory[] = [];
    try {
      const snap = await this.getCollection(tenantId).where("isActive", "==", true).get();
      for (const doc of snap.docs) {
        const cat = this.mapDoc(doc);
        if (cat) categories.push(cat);
      }
    } catch (dbErr) {
      console.warn("[CategoryRepo] Firestore findAll deferred:", dbErr);
    }

    if (categories.length === 0) {
      categories = readLocalCollection<ICategory>(tenantId, "categories").filter((c) => c.isActive !== false);
    }

    return categories;
  }

  async findById(id: string, tenantId = "default"): Promise<ICategory | null> {
    try {
      const doc = await this.getCollection(tenantId).doc(id).get();
      if (doc.exists) return this.mapDoc(doc);
    } catch (dbErr) {
      console.warn("[CategoryRepo] Firestore findById deferred:", dbErr);
    }
    return getLocalDoc<ICategory>(tenantId, "categories", id);
  }

  async create(data: Partial<ICategory>, tenantId = "default"): Promise<ICategory> {
    const col = this.getCollection(tenantId);
    const docRef = col.doc();
    const id = docRef.id;
    const now = new Date().toISOString();

    const newCategory: ICategory = {
      _id: id,
      id,
      name: data.name ?? "",
      slug: data.slug || (data.name ? data.name.toLowerCase().replace(/\s+/g, "-") : id),
      description: data.description,
      image: data.image,
      parentId: data.parentId,
      isActive: data.isActive !== false,
      branchId: data.branchId,
      createdAt: now,
      updatedAt: now,
    };

    setLocalDoc(tenantId, "categories", id, newCategory);

    try {
      await docRef.set(newCategory);
    } catch (dbErr) {
      console.warn("[CategoryRepo] Firestore create deferred:", dbErr);
    }

    return newCategory;
  }

  async update(id: string, data: Partial<ICategory>, tenantId = "default"): Promise<ICategory | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    const updated: ICategory = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    setLocalDoc(tenantId, "categories", id, updated);

    try {
      await this.getCollection(tenantId).doc(id).set(updated, { merge: true });
    } catch (dbErr) {
      console.warn("[CategoryRepo] Firestore update deferred:", dbErr);
    }

    return updated;
  }

  async delete(id: string, tenantId = "default"): Promise<ICategory | null> {
    return this.update(id, { isActive: false }, tenantId);
  }
}
