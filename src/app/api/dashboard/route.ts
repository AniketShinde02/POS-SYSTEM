import { apiSuccess, apiAuthError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-helpers";
import { DashboardService } from "@/services/dashboard.service";

const dashboardService = new DashboardService();

export async function GET() {
  try {
    const session = await requireAuth();
    const tenantId = session.user.tenantId || "default";

    const [overview, chart] = await Promise.all([
      dashboardService.getOverview(session.user.branchId, tenantId),
      dashboardService.getSalesChart(7, session.user.branchId, tenantId),
    ]);
    return apiSuccess({ overview, chart });
  } catch (e) {
    return apiAuthError(e);
  }
}
