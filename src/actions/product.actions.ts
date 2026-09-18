"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth-helpers";
import { generateSKU, generateBarcode } from "@/lib/utils";
import { ProductRepository } from "@/repositories/product.repository";
import { zodFirstError } from "@/lib/zod-error";
import { productSchema } from "@/validations/product.schema";

const repo = new ProductRepository();

export async function createProductAction(formData: FormData) {
  const session = await requirePermission("products.manage");
  const tenantId = session.user.tenantId || "default";

  const raw = Object.fromEntries(formData.entries());
  const parsed = productSchema.safeParse({
    ...raw,
    costPrice: Number(raw.costPrice),
    sellingPrice: Number(raw.sellingPrice),
    stock: Number(raw.stock ?? 0),
    taxRate: Number(raw.taxRate ?? 0),
  });

  if (!parsed.success) {
    return { success: false, error: zodFirstError(parsed.error) };
  }

  const data = parsed.data;
  const product = await repo.create(
    {
      name: data.name,
      slug: data.name.toLowerCase().replace(/\s+/g, "-"),
      sku: data.sku ?? generateSKU(),
      barcode: data.barcode ?? generateBarcode(),
      description: data.description,
      categoryId: data.categoryId,
      brandId: data.brandId,
      branchId: data.branchId,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      taxRate: data.taxRate,
      stock: data.stock,
      lowStockThreshold: data.lowStockThreshold,
      unit: data.unit,
      images: data.images ?? [],
    },
    tenantId
  );

  revalidatePath("/products");
  return { success: true, data: product };
}

export async function deleteProductAction(id: string) {
  const session = await requirePermission("products.manage");
  const tenantId = session.user.tenantId || "default";

  await repo.delete(id, tenantId);
  revalidatePath("/products");
  return { success: true };
}
