"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface SalesChartProps {
  data: { _id: string; revenue: number; count: number }[];
}

export function SalesChart({ data }: SalesChartProps) {
  const chartData = data.map((d) => ({
    date: d._id,
    revenue: d.revenue,
    sales: d.count,
  }));

  return (
    <Card className="col-span-2 border-zinc-800/80 bg-zinc-950/90 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-white">Sales Performance Trend</CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          Daily revenue breakdown over the last 7 days
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E85002" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#E85002" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a7a7a7" }} stroke="#27272a" />
            <YAxis tick={{ fontSize: 11, fill: "#a7a7a7" }} stroke="#27272a" tickFormatter={(v) => `₹${v}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#121215",
                borderColor: "#27272a",
                borderRadius: "12px",
                color: "#f9f9f9",
                fontSize: "12px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.8)",
              }}
              formatter={(val) => [formatCurrency(Number(val ?? 0)), "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#E85002"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              name="Revenue"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
