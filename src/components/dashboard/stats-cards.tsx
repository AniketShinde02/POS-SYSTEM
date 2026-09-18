import { IndianRupee, ShoppingBag, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  today: { revenue: number; sales: number; avgOrder: number };
  week: { revenue: number; sales: number };
  lowStockCount: number;
}

export function StatsCards({ today, week, lowStockCount }: StatsCardsProps) {
  const stats = [
    {
      title: "Today's Revenue",
      value: formatCurrency(today.revenue),
      icon: IndianRupee,
      badge: `${today.sales} transactions today`,
      isPrimary: true,
    },
    {
      title: "7-Day Revenue",
      value: formatCurrency(week.revenue),
      icon: TrendingUp,
      badge: `${week.sales} orders total`,
      isPrimary: false,
    },
    {
      title: "Average Ticket (AOV)",
      value: formatCurrency(today.avgOrder),
      icon: ShoppingBag,
      badge: "Per customer checkout",
      isPrimary: false,
    },
    {
      title: "Low Stock Alert",
      value: String(lowStockCount),
      icon: AlertTriangle,
      badge: lowStockCount > 0 ? "Requires reorder" : "Stock levels healthy",
      isWarning: lowStockCount > 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className={`relative overflow-hidden border transition-all duration-200 ${
              stat.isPrimary
                ? "border-[#E85002]/60 bg-gradient-to-br from-[#E85002]/15 via-zinc-950 to-zinc-950 shadow-lg shadow-[#E85002]/10"
                : stat.isWarning
                ? "border-amber-900/60 bg-gradient-to-br from-amber-950/20 via-zinc-950 to-zinc-950"
                : "border-zinc-800/80 bg-zinc-950/90 hover:border-zinc-700"
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {stat.title}
              </CardTitle>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  stat.isPrimary
                    ? "bg-[#E85002] text-white shadow-md shadow-[#E85002]/40"
                    : stat.isWarning
                    ? "bg-amber-950/80 text-amber-400 border border-amber-800/60"
                    : "bg-zinc-900 text-zinc-300 border border-zinc-800"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight text-white font-mono">
                {stat.value}
              </div>
              <p className="mt-1.5 flex items-center text-xs font-medium text-zinc-400">
                {stat.badge}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
