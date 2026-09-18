import Link from "next/link";
import { ArrowUpRight, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  _id: string;
  invoiceNumber: string;
  total: number;
  createdAt: string;
  cashierName?: string;
  cashierId?: { name?: string };
  paymentMethod?: string;
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card className="border-zinc-800/80 bg-zinc-950/90 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold text-white">
            Recent Sales Activity
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Live register checkouts
          </CardDescription>
        </div>
        <Link
          href="/sales"
          className="flex items-center text-xs font-bold text-[#E85002] hover:underline"
        >
          View history
          <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {transactions.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center">
              <Receipt className="mx-auto h-6 w-6 text-zinc-600" />
              <p className="mt-2 text-xs font-semibold text-zinc-400">No transactions recorded yet</p>
              <p className="mt-1 text-[11px] text-zinc-500">Processed sales receipts will appear here in real-time</p>
            </div>
          )}
          {transactions.map((tx) => (
            <div
              key={tx._id}
              className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 transition hover:border-zinc-700"
            >
              <div className="min-w-0 flex-1 truncate">
                <p className="truncate text-xs font-bold text-white font-mono">
                  {tx.invoiceNumber}
                </p>
                <p className="text-[11px] text-zinc-400 font-medium">
                  {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                  {tx.cashierName || tx.cashierId?.name || "Cashier"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-white font-mono">
                  {formatCurrency(tx.total)}
                </p>
                {tx.paymentMethod && (
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-[#E85002] border-[#E85002]/30 bg-[#E85002]/10 mt-0.5">
                    {tx.paymentMethod}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
