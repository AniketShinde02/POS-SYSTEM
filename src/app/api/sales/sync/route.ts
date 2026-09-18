import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { SaleService } from "@/services/sale.service";

const saleService = new SaleService();

export async function POST(req: Request) {
  try {
    const session = await requirePermission("pos.access");
    const tenantId = session.user.tenantId || "default";

    const body = await req.json();
    const sales = Array.isArray(body.sales) ? body.sales : [body];

    const results = [];

    for (const item of sales) {
      try {
        const saleId = item.transactionId || item.saleId || item.id;
        const processed = await saleService.completeSale({
          saleId,
          items: item.items,
          discount: Number(item.discount ?? 0),
          taxRate: Number(item.taxRate ?? 0),
          payments: item.payments,
          customerId: item.customerId,
          cashierId: session.user.id,
          branchId: session.user.branchId,
          notes: item.notes,
          isOffline: true,
          tenantId,
        });

        results.push({
          transactionId: saleId,
          invoiceNumber: processed.invoiceNumber,
          success: true,
        });
      } catch (err) {
        results.push({
          transactionId: item.transactionId || item.saleId,
          success: false,
          error: err instanceof Error ? err.message : "Sync error",
        });
      }
    }

    return apiSuccess({ results, count: results.length }, "Sync processed", 200);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Sync failed", 400);
  }
}
