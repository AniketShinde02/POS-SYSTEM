import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { SaleService } from "@/services/sale.service";
import { zodFirstError } from "@/lib/zod-error";
import { saleCheckoutSchema } from "@/validations/product.schema";

const saleService = new SaleService();

export async function POST(req: Request) {
  try {
    const session = await requirePermission("pos.access");
    const tenantId = session.user.tenantId || "default";

    const body = await req.json();
    const parsed = saleCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(zodFirstError(parsed.error, "Invalid checkout data"));
    }

    const sale = await saleService.completeSale({
      ...parsed.data,
      saleId: body.saleId || body.transactionId,
      cashierId: session.user.id,
      branchId: session.user.branchId,
      tenantId,
      isOffline: Boolean(body.isOffline),
    });

    return apiSuccess(sale, "Sale completed", 201);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Checkout failed", 400);
  }
}
