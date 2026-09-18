import type { CartItem, PaymentSplit } from "@/types";

const DB_NAME = "RetailPOS_OfflineDB";
const DB_VERSION = 1;

export interface OfflineSaleRecord {
  transactionId: string;
  items: CartItem[];
  discount: number;
  taxRate: number;
  payments: PaymentSplit[];
  customerId?: string;
  notes?: string;
  createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not available"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("pending_sales")) {
        db.createObjectStore("pending_sales", { keyPath: "transactionId" });
      }
      if (!db.objectStoreNames.contains("cached_products")) {
        db.createObjectStore("cached_products", { keyPath: "_id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineSale(sale: OfflineSaleRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_sales", "readwrite");
    const store = tx.objectStore("pending_sales");
    const req = store.put(sale);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingSales(): Promise<OfflineSaleRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_sales", "readonly");
    const store = tx.objectStore("pending_sales");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removePendingSale(transactionId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_sales", "readwrite");
    const store = tx.objectStore("pending_sales");
    const req = store.delete(transactionId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function syncPendingSales(): Promise<{ synced: number; failed: number }> {
  try {
    const pending = await getPendingSales();
    if (!pending.length) return { synced: 0, failed: 0 };

    const res = await fetch("/api/sales/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sales: pending }),
    });

    if (!res.ok) throw new Error("Sync failed");
    const json = await res.json();

    let synced = 0;
    let failed = 0;

    if (json.success && json.data?.results) {
      for (const result of json.data.results) {
        if (result.success) {
          await removePendingSale(result.transactionId);
          synced++;
        } else {
          failed++;
        }
      }
    }

    return { synced, failed };
  } catch (error) {
    console.error("[OfflineSync Error]:", error);
    return { synced: 0, failed: 0 };
  }
}
