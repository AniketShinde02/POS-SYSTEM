"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCcw, Search, Printer, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { printThermalReceipt } from "@/lib/print-invoice";

interface SaleItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  subtotal: number;
}

interface SaleRecord {
  _id: string;
  id: string;
  invoiceNumber: string;
  items: SaleItem[];
  status: "completed" | "held" | "returned" | "refunded";
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  payments: { method: string; amount: number; reference?: string }[];
  createdAt?: string;
  updatedAt?: string;
  customerId?: string;
  customerName?: string;
  cashierId?: string;
  cashierName?: string;
}

export function SalesPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const loadSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      params.set("limit", "100");
      const res = await fetch(`/api/sales?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSales(json.data.items ?? json.data ?? []);
      }
    } catch {
      toast.error("Failed to load sales history");
    } finally {
      setIsLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timeout = setTimeout(loadSales, 250);
    return () => clearTimeout(timeout);
  }, [loadSales]);

  const handlePrint = (sale: SaleRecord) => {
    printThermalReceipt({
      storeName: "RetailPOS Store",
      invoiceNumber: sale.invoiceNumber,
      date: new Date(sale.createdAt || Date.now()).toLocaleString(),
      cashier: sale.cashierName || "Cashier",
      customer: sale.customerName,
      items: (sale.items || []).map((it) => ({
        productId: it.productId,
        name: it.name,
        sku: it.sku,
        price: it.price,
        quantity: it.quantity,
        discount: it.discount,
        tax: it.tax,
      })),
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      total: sale.total,
      payments: sale.payments || [{ method: "cash", amount: sale.total }],
    });
  };

  const openPreview = (sale: SaleRecord) => {
    setSelectedSale(sale);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card className="border-zinc-800 bg-zinc-950 shadow-xl">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-100">
              Sales & Invoice History
            </CardTitle>
            <p className="text-xs text-zinc-400">
              Track completed transactions, customer bills, and reprint thermal receipts
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                className="pl-9 h-9 w-full sm:w-60 bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]"
                placeholder="Search by invoice number..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E85002]/50"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="held">Held</option>
              <option value="refunded">Refunded</option>
            </select>

            <Button size="sm" variant="outline" className="h-9 border-zinc-800 text-zinc-300 hover:bg-zinc-900" onClick={loadSales}>
              <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-zinc-400">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#E85002] border-r-transparent mb-2" />
              <p>Loading sales records...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              <FileText className="mx-auto h-8 w-8 mb-2 opacity-40 text-[#E85002]" />
              <p className="font-medium text-zinc-100">No sales transactions found</p>
              <p className="text-xs text-zinc-400 mt-1">Complete orders at the POS register to see sales here.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60 text-left text-zinc-400">
                      <th className="py-3.5 px-4 font-medium">Invoice #</th>
                      <th className="py-3.5 px-4 font-medium">Date & Time</th>
                      <th className="py-3.5 px-4 font-medium">Items</th>
                      <th className="py-3.5 px-4 font-medium">Payment</th>
                      <th className="py-3.5 px-4 font-medium text-center">Status</th>
                      <th className="py-3.5 px-4 font-medium text-right">Total</th>
                      <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {sales.map((sale) => (
                      <tr
                        key={sale._id || sale.id}
                        className="hover:bg-zinc-900/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#E85002]">
                          {sale.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-zinc-400">
                          {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-zinc-300">
                          {sale.items?.length ?? 1} item(s)
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="capitalize font-medium text-zinc-200">
                            {sale.payments?.[0]?.method || "Cash"}
                          </span>
                          {sale.payments?.[0]?.reference && (
                            <span className="block font-mono text-[10px] text-zinc-500 truncate max-w-xs">
                              {sale.payments[0].reference}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant={sale.status === "completed" ? "success" : "secondary"}
                            className="text-xs font-normal capitalize"
                          >
                            {sale.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-100">
                          {formatCurrency(sale.total)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                              onClick={() => openPreview(sale)}
                            >
                              <FileText className="h-3.5 w-3.5 mr-1" /> View Bill
                            </Button>
                            <Button
                              size="sm"
                              variant="brandGradient"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => handlePrint(sale)}
                              title="Reprint Receipt"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {sales.map((sale) => (
                  <div
                    key={sale._id || sale.id}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-sm font-bold text-[#E85002]">
                          {sale.invoiceNumber}
                        </span>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : "—"}
                        </p>
                      </div>
                      <span className="text-base font-bold font-mono text-zinc-100">
                        {formatCurrency(sale.total)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800">
                      <span>{sale.items?.length ?? 1} item(s) • {sale.payments?.[0]?.method?.toUpperCase() || "CASH"}</span>
                      <Badge variant="success" className="text-[10px] font-normal">
                        {sale.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button size="sm" variant="outline" className="h-8 text-xs border-zinc-800 text-zinc-300 hover:bg-zinc-800" onClick={() => openPreview(sale)}>
                        <FileText className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="brandGradient" className="h-8 text-xs" onClick={() => handlePrint(sale)}>
                        <Printer className="h-3.5 w-3.5 mr-1" /> Print Bill
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bill Preview Modal */}
      {selectedSale && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="sm:max-w-md bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-base font-semibold">
                <span className="font-mono text-[#E85002]">Invoice #{selectedSale.invoiceNumber}</span>
                <Badge variant="success" className="text-xs font-normal">
                  {selectedSale.status}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Detailed invoice summary and receipt reprint option.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm">
              <div className="text-xs text-zinc-400 flex justify-between">
                <span>Date: {selectedSale.createdAt ? new Date(selectedSale.createdAt).toLocaleString() : "—"}</span>
                <span>Cashier: {selectedSale.cashierName || "Cashier"}</span>
              </div>

              <div className="border-t border-b border-zinc-800 py-2 divide-y divide-zinc-800">
                {(selectedSale.items || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 text-xs">
                    <div>
                      <p className="font-medium text-zinc-100">{it.name}</p>
                      <p className="text-zinc-400">{it.sku} &times; {it.quantity}</p>
                    </div>
                    <span className="font-mono font-semibold text-zinc-100">
                      {formatCurrency(it.price * it.quantity * (1 - (it.discount || 0) / 100))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Tax / GST:</span>
                  <span>{formatCurrency(selectedSale.tax)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-zinc-100 pt-1 border-t border-zinc-800">
                  <span>Grand Total:</span>
                  <span className="text-[#E85002]">{formatCurrency(selectedSale.total)}</span>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-xs space-y-1">
                <span className="font-medium text-zinc-300 block">Payment Details:</span>
                {(selectedSale.payments || []).map((p, i) => (
                  <div key={i} className="flex justify-between text-zinc-400 font-mono">
                    <span className="capitalize">{p.method} {p.reference ? `(${p.reference})` : ""}:</span>
                    <span className="font-semibold text-zinc-200">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-between border-t border-zinc-800 pt-3">
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="border-zinc-800 text-zinc-300 hover:bg-zinc-900">
                Close
              </Button>
              <Button
                variant="brandGradient"
                onClick={() => {
                  handlePrint(selectedSale);
                  setIsPreviewOpen(false);
                }}
              >
                <Printer className="mr-1.5 h-4 w-4" />
                Print Thermal Receipt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
