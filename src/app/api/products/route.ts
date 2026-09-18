import { apiSuccess, apiError, apiAuthError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { generateSKU, generateBarcode } from "@/lib/utils";
import { ProductRepository } from "@/repositories/product.repository";
import { zodFirstError } from "@/lib/zod-error";
import { productSchema } from "@/validations/product.schema";

const repo = new ProductRepository();

export async function GET(req: Request) {
  try {
    const session = await requirePermission("products.view");
    const tenantId = session.user.tenantId || "default";

    const { searchParams } = new URL(req.url);
    const result = await repo.paginate(
      {
        page: Number(searchParams.get("page") ?? 1),
        limit: Number(searchParams.get("limit") ?? 20),
        search: searchParams.get("search") ?? undefined,
        categoryId: searchParams.get("categoryId") ?? undefined,
      },
      tenantId
    );
    return apiSuccess(result);
  } catch (e) {
    return apiAuthError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("products.create");
    const tenantId = session.user.tenantId || "default";

    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(zodFirstError(parsed.error));
    }

    const data = parsed.data;
    const slug = data.name.toLowerCase().replace(/\s+/g, "-");
    const product = await repo.create(
      {
        name: data.name,
        slug,
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
    return apiSuccess(product, "Product created", 201);
  } catch (e) {
    return apiAuthError(e);
  }
}
