import { apiSuccess, apiAuthError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { SaleRepository } from "@/repositories/sale.repository";

const repo = new SaleRepository();

export async function GET(req: Request) {
  try {
    const session = await requirePermission("sales.manage");
    const tenantId = session.user.tenantId || "default";

    const { searchParams } = new URL(req.url);
    const result = await repo.paginate(
      {
        page: Number(searchParams.get("page") ?? 1),
        limit: Number(searchParams.get("limit") ?? 20),
        search: searchParams.get("search") ?? undefined,
        status: (() => {
          const value = searchParams.get("status");
          return value ? value : undefined;
        })(),
      },
      tenantId
    );
    return apiSuccess(result);
  } catch (e) {
    return apiAuthError(e);
  }
}
