import Link from "next/link";
import { ShoppingCart, Plus, Receipt, Package, ArrowUpRight } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { connectDB } from "@/lib/db";
import { DashboardService } from "@/services/dashboard.service";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard | RetailPOS" };

const dashboardService = new DashboardService();

export default async function DashboardPage() {
  await connectDB();
  const overview = await dashboardService.getOverview();
  const chart = await dashboardService.getSalesChart(7);

  return (
    <DashboardShell title="Store Dashboard">
      <div className="space-y-6">
        {/* Quick Operational Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Operations Overview
            </h2>
            <p className="text-xs text-zinc-400">
              Live retail metrics, terminal sales, and real-time inventory tracking
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" className="bg-[#E85002] hover:bg-[#FF5F12] text-white font-bold shadow-md shadow-[#E85002]/20">
              <Link href="/pos">
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                Open POS Terminal
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800">
              <Link href="/products/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Product
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <Link href="/sales">
                <Receipt className="mr-1.5 h-4 w-4" />
                Sales History
              </Link>
            </Button>
          </div>
        </div>

        {/* Primary Stats */}
        <StatsCards
          today={overview.today}
          week={overview.week}
          lowStockCount={overview.lowStockAlerts.length}
        />

        {/* Charts and Real-time Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          <SalesChart data={chart} />
          <RecentTransactions
            transactions={overview.recentTransactions as never[]}
          />
        </div>

        {/* Catalog Highlights & Inventory Alerts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Selling Products */}
          <Card className="border-zinc-800/80 bg-zinc-950/90 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-white">
                  Top Selling Products
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Highest volume items this month
                </CardDescription>
              </div>
              <Link
                href="/products"
                className="flex items-center text-xs font-bold text-[#E85002] hover:underline"
              >
                View catalog
                <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overview.topProducts.map(
                  (p: { _id: string; name: string; quantity?: number; totalSold?: number; revenue: number }) => (
                    <div
                      key={String(p._id)}
                      className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E85002]/10 text-[#E85002] border border-[#E85002]/20">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <p className="truncate text-xs font-bold text-white">{p.name}</p>
                          <p className="text-[11px] text-zinc-400">{p.quantity ?? p.totalSold ?? 0} units sold</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-black text-white font-mono">
                        {formatCurrency(p.revenue)}
                      </span>
                    </div>
                  )
                )}
                {overview.topProducts.length === 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center">
                    <p className="text-xs font-semibold text-zinc-400">No product sales recorded yet</p>
                    <p className="mt-1 text-[11px] text-zinc-500">Transactions processed in POS will rank here automatically</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="border-zinc-800/80 bg-zinc-950/90 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-white">
                  Stock Depletion Alerts
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Products reaching critical reorder levels
                </CardDescription>
              </div>
              <Link
                href="/inventory"
                className="flex items-center text-xs font-bold text-amber-500 hover:underline"
              >
                Inventory
                <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {overview.lowStockAlerts.map((p) => (
                  <div
                    key={String(p._id)}
                    className="flex items-center justify-between rounded-xl border border-amber-900/40 bg-amber-950/20 p-3 text-sm"
                  >
                    <div className="truncate">
                      <p className="truncate text-xs font-bold text-white">{p.name}</p>
                      <p className="text-[11px] font-mono text-zinc-400">SKU: {p.sku || "N/A"}</p>
                    </div>
                    <Badge variant="outline" className="border-amber-700/60 bg-amber-950/80 text-[11px] font-bold text-amber-300">
                      {p.stock} remaining
                    </Badge>
                  </div>
                ))}
                {overview.lowStockAlerts.length === 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center">
                    <p className="text-xs font-semibold text-emerald-400">All inventory levels healthy</p>
                    <p className="mt-1 text-[11px] text-zinc-500">No items currently below their reorder threshold</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
