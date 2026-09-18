import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-helpers";
import { ProductRepository } from "@/repositories/product.repository";

const repo = new ProductRepository();

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const tenantId = session.user.tenantId || "default";

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const products = q ? await repo.search(q, 20, tenantId) : [];
    return apiSuccess(products);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Search failed", 401);
  }
}
