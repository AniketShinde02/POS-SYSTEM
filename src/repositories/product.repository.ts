import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { PaginationParams, PaginatedResult } from "@/types";
import { readLocalCollection, setLocalDoc, getLocalDoc } from "@/lib/tenant-store";

export interface IProductVariant {
  id?: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  costPrice?: number;
  stock: number;
}

export interface IProduct {
  _id: string;
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  images: string[];
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  stock: number;
  lowStockThreshold: number;
  unit: string;
  variants?: IProductVariant[];
  isActive: boolean;
  branchId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class ProductRepository {
  private getCollection(tenantId = "default") {
    return adminDb.collection("tenants").doc(tenantId).collection("products");
  }

  private mapDoc(doc: FirebaseFirestore.DocumentSnapshot): IProduct | null {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      _id: doc.id,
      id: doc.id,
      name: data.name ?? "",
      slug: data.slug ?? "",
      sku: data.sku ?? "",
      barcode: data.barcode ?? "",
      description: data.description ?? "",
      categoryId: data.categoryId ?? "",
      categoryName: data.categoryName ?? "",
      brandId: data.brandId ?? "",
      brandName: data.brandName ?? "",
      images: data.images ?? (data.image ? [data.image] : []),
      costPrice: Number(data.costPrice ?? 0),
      sellingPrice: Number(data.sellingPrice ?? data.price ?? 0),
      taxRate: Number(data.taxRate ?? 0),
      stock: Number(data.stock ?? 0),
      lowStockThreshold: Number(data.lowStockThreshold ?? 5),
      unit: data.unit ?? "pcs",
      variants: data.variants ?? [],
      isActive: data.isActive !== false,
      branchId: data.branchId,
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  }

  async findById(id: string, tenantId = "default"): Promise<IProduct | null> {
    try {
      const doc = await this.getCollection(tenantId).doc(id).get();
      if (doc.exists) return this.mapDoc(doc);
    } catch (dbErr) {
      console.warn("[ProductRepo] Firestore findById deferred:", dbErr);
    }
    return getLocalDoc<IProduct>(tenantId, "products", id);
  }

  async findByBarcode(barcode: string, tenantId = "default"): Promise<IProduct | null> {
    try {
      const snap = await this.getCollection(tenantId)
        .where("barcode", "==", barcode)
        .where("isActive", "==", true)
        .limit(1)
        .get();

      if (!snap.empty) {
        return this.mapDoc(snap.docs[0]);
      }

      // Check variants if not matched by main barcode
      const allActive = await this.getCollection(tenantId)
        .where("isActive", "==", true)
        .get();

      for (const doc of allActive.docs) {
        const p = this.mapDoc(doc);
        if (p?.variants?.some((v) => v.barcode === barcode)) {
          return p;
        }
      }
    } catch (dbErr) {
      console.warn("[ProductRepo] Firestore findByBarcode deferred:", dbErr);
    }

    const localProducts = readLocalCollection<IProduct>(tenantId, "products").filter((p) => p.isActive);
    const found = localProducts.find(
      (p) => p.barcode === barcode || p.variants?.some((v) => v.barcode === barcode)
    );
    return found ?? null;
  }

  async search(query: string, limit = 20, tenantId = "default"): Promise<IProduct[]> {
    const qLower = query.toLowerCase();
    const results: IProduct[] = [];

    try {
      const snap = await this.getCollection(tenantId).get();
      for (const doc of snap.docs) {
        const p = this.mapDoc(doc);
        if (!p || !p.isActive) continue;

        if (
          p.name.toLowerCase().includes(qLower) ||
          p.sku.toLowerCase().includes(qLower) ||
          (p.barcode && p.barcode.toLowerCase().includes(qLower)) ||
          p.variants?.some(
            (v) =>
              v.name.toLowerCase().includes(qLower) ||
              v.sku.toLowerCase().includes(qLower) ||
              (v.barcode && v.barcode.toLowerCase().includes(qLower))
          )
        ) {
          results.push(p);
          if (results.length >= limit) break;
        }
      }
    } catch (dbErr) {
      console.warn("[ProductRepo] Firestore search deferred:", dbErr);
    }

    if (results.length === 0) {
      const localProducts = readLocalCollection<IProduct>(tenantId, "products").filter((p) => p.isActive);
      for (const p of localProducts) {
        if (
          p.name.toLowerCase().includes(qLower) ||
          p.sku.toLowerCase().includes(qLower) ||
          (p.barcode && p.barcode.toLowerCase().includes(qLower)) ||
          p.variants?.some(
            (v) =>
              v.name.toLowerCase().includes(qLower) ||
              v.sku.toLowerCase().includes(qLower) ||
              (v.barcode && v.barcode.toLowerCase().includes(qLower))
          )
        ) {
          results.push(p);
          if (results.length >= limit) break;
        }
      }
    }

    return results;
  }

  async paginate(
    params: PaginationParams & { categoryId?: string; branchId?: string },
    tenantId = "default"
  ): Promise<PaginatedResult<IProduct>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    let all: IProduct[] = [];

    try {
      const snap = await this.getCollection(tenantId).get();
      for (const doc of snap.docs) {
        const p = this.mapDoc(doc);
        if (p && p.isActive) {
          all.push(p);
        }
      }
    } catch (dbErr) {
      console.warn("[ProductRepo] Firestore paginate deferred:", dbErr);
    }

    if (all.length === 0) {
      all = readLocalCollection<IProduct>(tenantId, "products").filter((p) => p.isActive);
    }

    // Filter by search
    if (params.search) {
      const q = params.search.toLowerCase();
      all = all.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (params.categoryId) {
      all = all.filter((p) => p.categoryId === params.categoryId);
    }

    // Filter by branch
    if (params.branchId) {
      all = all.filter((p) => p.branchId === params.branchId);
    }

    // Sort descending by creation date
    all.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

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

  async create(data: Partial<IProduct>, tenantId = "default"): Promise<IProduct> {
    const col = this.getCollection(tenantId);
    const docRef = col.doc();
    const id = docRef.id;
    const now = new Date().toISOString();

    const newProduct: IProduct = {
      _id: id,
      id,
      name: data.name ?? "",
      slug: data.slug || (data.name ? data.name.toLowerCase().replace(/\s+/g, "-") : id),
      sku: data.sku ?? `SKU-${Date.now().toString().slice(-4)}`,
      barcode: data.barcode ?? `${Date.now()}`.slice(-12),
      description: data.description,
      categoryId: data.categoryId,
      categoryName: data.categoryName,
      brandId: data.brandId,
      brandName: data.brandName,
      images: data.images ?? (data.images ? [data.images[0]] : []),
      costPrice: Number(data.costPrice ?? 0),
      sellingPrice: Number(data.sellingPrice ?? 0),
      taxRate: Number(data.taxRate ?? 0),
      stock: Number(data.stock ?? 0),
      lowStockThreshold: Number(data.lowStockThreshold ?? 5),
      unit: data.unit ?? "pcs",
      variants: data.variants ?? [],
      isActive: data.isActive !== false,
      branchId: data.branchId,
      createdAt: now,
      updatedAt: now,
    };

    setLocalDoc(tenantId, "products", id, newProduct);

    try {
      await docRef.set(newProduct);
    } catch (dbErr) {
      console.warn("[ProductRepo] Firestore create deferred:", dbErr);
    }

    return newProduct;
  }

  async update(id: string, data: Partial<IProduct>, tenantId = "default"): Promise<IProduct | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    const updated: IProduct = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    setLocalDoc(tenantId, "products", id, updated);

    try {
      await this.getCollection(tenantId).doc(id).set(updated, { merge: true });
    } catch (dbErr) {
      console.warn("[ProductRepo] Firestore update deferred:", dbErr);
    }

    return updated;
  }

  async delete(id: string, tenantId = "default"): Promise<IProduct | null> {
    return this.update(id, { isActive: false }, tenantId);
  }

  async updateStock(id: string, quantity: number, tenantId = "default"): Promise<IProduct | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    const newStock = Math.max(0, (existing.stock || 0) + quantity);
    const updated: IProduct = {
      ...existing,
      stock: newStock,
      updatedAt: new Date().toISOString(),
    };

    setLocalDoc(tenantId, "products", id, updated);

    try {
      await this.getCollection(tenantId).doc(id).update({
        stock: FieldValue.increment(quantity),
        updatedAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn("[ProductRepo] Firestore updateStock deferred:", dbErr);
    }

    return updated;
  }

  async lowStock(threshold = 5, tenantId = "default"): Promise<IProduct[]> {
    let results: IProduct[] = [];
    try {
      const snap = await this.getCollection(tenantId).where("isActive", "==", true).get();
      for (const doc of snap.docs) {
        const p = this.mapDoc(doc);
        if (p && p.stock <= (p.lowStockThreshold ?? threshold)) {
          results.push(p);
        }
      }
    } catch (dbErr) {
      console.warn("[ProductRepo] Firestore lowStock deferred:", dbErr);
    }

    if (results.length === 0) {
      const localProducts = readLocalCollection<IProduct>(tenantId, "products").filter((p) => p.isActive);
      results = localProducts.filter((p) => p.stock <= (p.lowStockThreshold ?? threshold));
    }

    return results;
  }
}
