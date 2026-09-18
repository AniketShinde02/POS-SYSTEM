import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { ProductRepository } from "@/repositories/product.repository";
import { generateSKU, generateBarcode } from "@/lib/utils";

const productRepo = new ProductRepository();

export async function POST(req: Request) {
  try {
    const session = await requirePermission("products.manage");
    const tenantId = session.user.tenantId || "default";

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("Please upload a CSV file", 400);
    }

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return apiError("CSV file is empty or missing data rows", 400);
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = headers.findIndex((h) => h.includes("name"));
    const skuIdx = headers.findIndex((h) => h.includes("sku"));
    const barcodeIdx = headers.findIndex((h) => h.includes("barcode"));
    const priceIdx = headers.findIndex((h) => h.includes("price"));
    const stockIdx = headers.findIndex((h) => h.includes("stock"));
    const categoryIdx = headers.findIndex((h) => h.includes("category"));
    const taxIdx = headers.findIndex((h) => h.includes("tax"));
    const imageIdx = headers.findIndex((h) => h.includes("image"));

    if (nameIdx === -1 || priceIdx === -1) {
      return apiError("CSV must contain at least 'Product Name' and 'Price' columns", 400);
    }

    const imported = [];
    const errors = [];
    const seenBarcodes = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",").map((c) => c.trim());
      const name = row[nameIdx];
      const price = Number(row[priceIdx]);

      if (!name || isNaN(price)) {
        errors.push({ row: i + 1, error: "Invalid name or price" });
        continue;
      }

      const barcode = barcodeIdx !== -1 && row[barcodeIdx] ? row[barcodeIdx] : generateBarcode();
      if (seenBarcodes.has(barcode)) {
        errors.push({ row: i + 1, error: `Duplicate barcode in file: ${barcode}` });
        continue;
      }
      seenBarcodes.add(barcode);

      const sku = skuIdx !== -1 && row[skuIdx] ? row[skuIdx] : generateSKU();
      const stock = stockIdx !== -1 && !isNaN(Number(row[stockIdx])) ? Number(row[stockIdx]) : 0;
      const categoryId = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx] : "general";
      const taxRate = taxIdx !== -1 && !isNaN(Number(row[taxIdx])) ? Number(row[taxIdx]) : 0;
      const imageUrl = imageIdx !== -1 && row[imageIdx] ? row[imageIdx] : "";

      try {
        const prod = await productRepo.create(
          {
            name,
            slug: name.toLowerCase().replace(/\s+/g, "-"),
            sku,
            barcode,
            sellingPrice: price,
            costPrice: price * 0.7,
            stock,
            taxRate,
            categoryId,
            images: imageUrl ? [imageUrl] : [],
            isActive: true,
          },
          tenantId
        );
        imported.push(prod);
      } catch (err) {
        errors.push({
          row: i + 1,
          error: err instanceof Error ? err.message : "Failed to insert product",
        });
      }
    }

    return apiSuccess({
      importedCount: imported.length,
      errorsCount: errors.length,
      errors,
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Import failed", 400);
  }
}
