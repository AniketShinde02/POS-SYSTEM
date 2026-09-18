import fs from "fs";
import path from "path";

const DATA_ROOT = path.join(process.cwd(), "data", "tenants");

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getFilePath(tenantId: string, collection: string): string {
  const sanitizedTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const sanitizedCollection = collection.replace(/[^a-zA-Z0-9_-]/g, "_");
  const tenantDir = path.join(DATA_ROOT, sanitizedTenant);
  ensureDir(tenantDir);
  return path.join(tenantDir, `${sanitizedCollection}.json`);
}

export function readLocalCollection<T = Record<string, unknown>>(
  tenantId: string,
  collection: string
): T[] {
  try {
    const file = getFilePath(tenantId, collection);
    if (!fs.existsSync(file)) {
      return [];
    }
    const raw = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (error) {
    console.error(`[LocalTenantStore] Error reading ${tenantId}/${collection}:`, error);
    return [];
  }
}

export function writeLocalCollection<T = Record<string, unknown>>(
  tenantId: string,
  collection: string,
  items: T[]
): void {
  try {
    const file = getFilePath(tenantId, collection);
    fs.writeFileSync(file, JSON.stringify(items, null, 2), "utf-8");
  } catch (error) {
    console.error(`[LocalTenantStore] Error writing ${tenantId}/${collection}:`, error);
  }
}

export function getLocalDoc<T = Record<string, unknown>>(
  tenantId: string,
  collection: string,
  docId: string
): T | null {
  const items = readLocalCollection<{ _id?: string; id?: string } & T>(tenantId, collection);
  const found = items.find((i) => i._id === docId || i.id === docId);
  return (found as T) ?? null;
}

export function setLocalDoc<T extends object>(
  tenantId: string,
  collection: string,
  docId: string,
  data: T
): T {
  const items = readLocalCollection<{ _id?: string; id?: string } & T>(tenantId, collection);
  const idx = items.findIndex((i) => i._id === docId || i.id === docId);
  const now = new Date().toISOString();
  const itemToSave = {
    ...data,
    _id: docId,
    id: docId,
    updatedAt: now,
  };

  if (idx >= 0) {
    items[idx] = { ...items[idx], ...itemToSave };
  } else {
    const existingCreatedAt = "createdAt" in data && typeof (data as { createdAt?: unknown }).createdAt === "string"
      ? ((data as { createdAt: string }).createdAt)
      : now;

    items.unshift({
      ...itemToSave,
      createdAt: existingCreatedAt,
    });
  }

  writeLocalCollection(tenantId, collection, items);
  return itemToSave as T;
}

export function deleteLocalDoc(
  tenantId: string,
  collection: string,
  docId: string
): boolean {
  const items = readLocalCollection<{ _id?: string; id?: string }>(tenantId, collection);
  const filtered = items.filter((i) => i._id !== docId && i.id !== docId);
  if (filtered.length !== items.length) {
    writeLocalCollection(tenantId, collection, filtered);
    return true;
  }
  return false;
}
