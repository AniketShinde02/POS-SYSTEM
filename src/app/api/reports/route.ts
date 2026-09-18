import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import { SaleRepository } from "@/repositories/sale.repository";
import { ProductRepository } from "@/repositories/product.repository";
import { CustomerRepository } from "@/repositories/customer.repository";

const saleRepo = new SaleRepository();
const productRepo = new ProductRepository();
const customerRepo = new CustomerRepository();

export async function GET(req: Request) {
  try {
    const session = await requirePermission("reports.view");
    const tenantId = session.user.tenantId || "default";

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "sales";
    const days = Number(searchParams.get("days") ?? 30);
    const start = new Date();
    start.setDate(start.getDate() - days);

    if (type === "sales") {
      const sales = await saleRepo.paginate(
        {
          limit: 500,
          from: start,
          status: "completed",
        },
        tenantId
      );

      const rows = sales.items.map((s) => ({
        Invoice: s.invoiceNumber,
        Date: new Date(s.createdAt).toLocaleDateString(),
        Cashier: s.cashierName ?? s.cashierId ?? "—",
        Subtotal: s.subtotal,
        Discount: s.discount,
        Tax: s.tax,
        Total: s.total,
        Status: s.status,
      }));

      const stats = await saleRepo.getRevenueStats(start, new Date(), undefined, tenantId);
      return apiSuccess({ rows, stats, type: "sales" });
    }

    if (type === "inventory") {
      const products = await productRepo.paginate({ limit: 1000 }, tenantId);

      const rows = products.items.map((p) => ({
        Product: p.name,
        SKU: p.sku,
        Category: p.categoryName || p.categoryId || "—",
        Stock: p.stock,
        "Low Threshold": p.lowStockThreshold,
        "Cost Price": p.costPrice,
        "Sell Price": p.sellingPrice,
        Status: p.stock <= p.lowStockThreshold ? "Low" : "OK",
      }));

      return apiSuccess({ rows, type: "inventory" });
    }

    if (type === "customers") {
      const customers = await customerRepo.paginate({ limit: 1000 }, tenantId);

      const rows = customers.items.map((c) => ({
        Name: c.name,
        Email: c.email ?? "—",
        Phone: c.phone ?? "—",
        "Total Spent": c.totalSpent,
        "Total Purchases": c.totalPurchases,
      }));

      return apiSuccess({ rows, type: "customers" });
    }

    if (type === "profit") {
      const stats = await saleRepo.getRevenueStats(start, new Date(), undefined, tenantId);

      const expSnap = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("expenses")
        .get();

      let expenses = 0;
      const startTime = start.getTime();
      for (const doc of expSnap.docs) {
        const data = doc.data();
        const expTime = new Date(data.date || data.createdAt).getTime();
        if (expTime >= startTime) {
          expenses += Number(data.amount ?? 0);
        }
      }

      const revenue = stats.totalRevenue ?? 0;

      return apiSuccess({
        type: "profit",
        rows: [
          { Metric: "Revenue", Amount: revenue },
          { Metric: "Expenses", Amount: expenses },
          { Metric: "Profit", Amount: revenue - expenses },
          { Metric: "Sales Count", Amount: stats.totalSales ?? 0 },
        ],
      });
    }

    return apiError("Invalid report type");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 401);
  }
}
