import { SaleRepository, type ISale } from "@/repositories/sale.repository";
import { ProductRepository, type IProduct } from "@/repositories/product.repository";
import { adminDb } from "@/lib/firebase/admin";

const saleRepo = new SaleRepository();
const productRepo = new ProductRepository();

export class DashboardService {
  async getOverview(branchId?: string, tenantId = "default") {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      const [today, week, month, recent, topProducts, lowStock] =
        await Promise.all([
          saleRepo.getRevenueStats(startOfDay, new Date(), branchId, tenantId),
          saleRepo.getRevenueStats(startOfWeek, new Date(), branchId, tenantId),
          saleRepo.getRevenueStats(startOfMonth, new Date(), branchId, tenantId),
          saleRepo.recent(8, tenantId),
          saleRepo.topProducts(5, startOfMonth, new Date(), tenantId),
          productRepo.lowStock(5, tenantId),
        ]);

      // Expenses query from Firestore
      const expensesSnap = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("expenses")
        .get();

      let totalMonthExpenses = 0;
      const startOfMonthTime = startOfMonth.getTime();

      for (const doc of expensesSnap.docs) {
        const exp = doc.data();
        const expTime = new Date(exp.date || exp.createdAt).getTime();
        if (expTime >= startOfMonthTime) {
          if (!branchId || exp.branchId === branchId) {
            totalMonthExpenses += Number(exp.amount ?? 0);
          }
        }
      }

      // Product count
      const productsSnap = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("products")
        .where("isActive", "==", true)
        .get();

      const totalProducts = productsSnap.size;

      return {
        today: {
          revenue: today.totalRevenue,
          sales: today.totalSales,
          avgOrder: today.avgOrder,
        },
        week: { revenue: week.totalRevenue, sales: week.totalSales },
        month: { revenue: month.totalRevenue, sales: month.totalSales },
        expenses: totalMonthExpenses,
        profit: month.totalRevenue - totalMonthExpenses,
        recentTransactions: recent,
        topProducts,
        lowStockAlerts: lowStock,
        totalProducts,
      };
    } catch (error) {
      console.warn("[DashboardService] Overview query deferred, computing from tenant store:", error);
      const { readLocalCollection } = await import("@/lib/tenant-store");
      const allSales: ISale[] = readLocalCollection<ISale>(tenantId, "sales").filter((s) => s.status === "completed");
      const allProducts: IProduct[] = readLocalCollection<IProduct>(tenantId, "products").filter((p) => p.isActive !== false);
      const allExpenses: { amount?: number; date?: string; createdAt?: string }[] = readLocalCollection(tenantId, "expenses");

      const startOfDayTime = startOfDay.getTime();
      const startOfWeekTime = startOfWeek.getTime();
      const startOfMonthTime = startOfMonth.getTime();

      const todaySales = allSales.filter((s) => new Date(s.createdAt).getTime() >= startOfDayTime);
      const weekSales = allSales.filter((s) => new Date(s.createdAt).getTime() >= startOfWeekTime);
      const monthSales = allSales.filter((s) => new Date(s.createdAt).getTime() >= startOfMonthTime);

      const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
      const weekRevenue = weekSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
      const monthRevenue = monthSales.reduce((sum, s) => sum + Number(s.total || 0), 0);

      const totalExpenses = allExpenses
        .filter((e) => new Date(e.date || e.createdAt || 0).getTime() >= startOfMonthTime)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // Low stock
      const lowStockAlerts = allProducts
        .filter((p) => Number(p.stock ?? 0) <= Number(p.lowStockThreshold ?? 5))
        .slice(0, 5);

      // Top products
      const prodMap = new Map<string, { _id: string; name: string; totalSold: number; revenue: number }>();
      for (const s of allSales) {
        for (const it of s.items || []) {
          const prev = prodMap.get(it.productId) || { _id: it.productId, name: it.name, totalSold: 0, revenue: 0 };
          prev.totalSold += Number(it.quantity || 0);
          prev.revenue += Number(it.subtotal || (it.price * it.quantity) || 0);
          prodMap.set(it.productId, prev);
        }
      }
      const topProducts = Array.from(prodMap.values())
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5);

      // Recent transactions
      const recent = [...allSales]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8);

      return {
        today: {
          revenue: todayRevenue,
          sales: todaySales.length,
          avgOrder: todaySales.length ? todayRevenue / todaySales.length : 0,
        },
        week: { revenue: weekRevenue, sales: weekSales.length },
        month: { revenue: monthRevenue, sales: monthSales.length },
        expenses: totalExpenses,
        profit: monthRevenue - totalExpenses,
        recentTransactions: recent,
        topProducts,
        lowStockAlerts,
        totalProducts: allProducts.length,
      };
    }
  }

  async getSalesChart(days = 7, branchId?: string, tenantId = "default") {
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startTime = start.getTime();

    interface ISaleChartItem {
      createdAt: string;
      total?: number;
      branchId?: string;
      status?: string;
    }

    let salesList: ISaleChartItem[] = [];
    try {
      const salesSnap = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("sales")
        .where("status", "==", "completed")
        .get();

      salesList = salesSnap.docs.map((d) => d.data() as ISaleChartItem);
    } catch {
      const { readLocalCollection } = await import("@/lib/tenant-store");
      salesList = readLocalCollection<ISaleChartItem>(tenantId, "sales").filter((s) => s.status === "completed");
    }

    const dailyMap = new Map<string, { revenue: number; count: number }>();

    for (const data of salesList) {
      const saleDate = new Date(data.createdAt);
      if (saleDate.getTime() >= startTime) {
        if (!branchId || data.branchId === branchId) {
          const key = saleDate.toISOString().split("T")[0];
          const curr = dailyMap.get(key) ?? { revenue: 0, count: 0 };
          curr.revenue += Number(data.total ?? 0);
          curr.count += 1;
          dailyMap.set(key, curr);
        }
      }
    }

    return Array.from(dailyMap.entries())
      .map(([date, val]) => ({
        _id: date,
        revenue: val.revenue,
        count: val.count,
      }))
      .sort((a, b) => a._id.localeCompare(b._id));
  }
}
