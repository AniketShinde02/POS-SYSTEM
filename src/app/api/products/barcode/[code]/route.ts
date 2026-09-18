import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-helpers";
import { ProductRepository } from "@/repositories/product.repository";

const repo = new ProductRepository();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await requireAuth();
    const tenantId = session.user.tenantId || "default";

    const { code } = await params;
    const product = await repo.findByBarcode(code, tenantId);
    if (!product) return apiError("Product not found", 404);
    return apiSuccess(product);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Not found", 401);
  }
}
