"use client";

import { useEffect, useState } from "react";
import { Eye, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { InventoryAdjustDialog } from "@/components/inventory/inventory-adjust-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface InventoryRow {
  _id: string;
  name: string;
  sku: string;
  stock: number;
  sellingPrice: number;
  isActive: boolean;
  categoryId?: { name?: string };
  brandId?: { name?: string };
}

export function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryRow | null>(null);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products?limit=100");
      const json = await res.json();
      if (json.success) {
        setInventory(json.data.items ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const openAdjust = (item: InventoryRow) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const lowStockCount = inventory.filter((item) => item.stock <= 5).length;

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-zinc-800 bg-zinc-950 shadow-xl">
            <CardHeader>
              <CardTitle className="text-zinc-100">Inventory overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Total products</p>
                <p className="text-lg font-mono font-bold text-zinc-100">{inventory.length}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Low stock items</p>
                <Badge variant={lowStockCount > 0 ? "warning" : "success"}>
                  {lowStockCount}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-800 bg-zinc-950 shadow-xl">
            <CardHeader>
              <CardTitle className="text-zinc-100">Stock action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-zinc-400">
                Adjust product quantity manually when stock changes or discrepancies occur.
              </p>
              <Button
                variant="brandGradient"
                onClick={() => openAdjust(inventory[0] ?? { _id: "", name: "", sku: "", stock: 0, sellingPrice: 0, isActive: true })}
                disabled={inventory.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adjust stock
              </Button>
            </CardContent>
          </Card>
          <Card className="border-zinc-800 bg-zinc-950 shadow-xl">
            <CardHeader>
              <CardTitle className="text-zinc-100">Status alert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <TrendingDown className="h-4 w-4 text-amber-500" />
                <span>Below reorder threshold: {lowStockCount}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <TrendingUp className="h-4 w-4 text-[#E85002]" />
                <span>Total active products: {inventory.filter((item) => item.isActive).length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-zinc-800 bg-zinc-950 shadow-xl">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-4">
            <div>
              <CardTitle className="text-zinc-100">Stock list</CardTitle>
              <p className="text-sm text-zinc-400">
                Current inventory levels and product details.
              </p>
            </div>
            <Button variant="brandGradient" onClick={() => openAdjust(selectedItem ?? inventory[0] ?? { _id: "", name: "", sku: "", stock: 0, sellingPrice: 0, isActive: true })} disabled={inventory.length === 0}>
              <Eye className="mr-2 h-4 w-4" />
              Adjust stock
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-zinc-400">Loading inventory...</p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/60 text-left text-zinc-400">
                        <th className="py-3 px-4 font-medium">Product</th>
                        <th className="py-3 px-4 font-medium">SKU</th>
                        <th className="py-3 px-4 font-medium">Category</th>
                        <th className="py-3 px-4 font-medium">Brand</th>
                        <th className="py-3 px-4 font-medium">Price</th>
                        <th className="py-3 px-4 font-medium">Stock</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {inventory.map((item) => (
                        <tr key={item._id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-zinc-100">{item.name}</td>
                          <td className="py-3.5 px-4 font-mono text-xs text-zinc-400">{item.sku}</td>
                          <td className="py-3.5 px-4 text-zinc-400">{item.categoryId?.name ?? "—"}</td>
                          <td className="py-3.5 px-4 text-zinc-400">{item.brandId?.name ?? "—"}</td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-zinc-100">{formatCurrency(item.sellingPrice)}</td>
                          <td className="py-3.5 px-4">
                            <span className={item.stock <= 5 ? "font-mono font-bold text-amber-500" : "font-mono text-zinc-200"}>
                              {item.stock}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={item.isActive ? "success" : "secondary"}>
                              {item.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <Button size="sm" variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900" onClick={() => openAdjust(item)}>
                              Adjust
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-3 md:hidden">
                  {inventory.map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-zinc-100 text-sm">{item.name}</h4>
                          <p className="font-mono text-xs text-zinc-400">SKU: {item.sku}</p>
                        </div>
                        <Badge variant={item.isActive ? "success" : "secondary"}>
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400">Price:</span>
                          <span className="font-mono font-semibold text-zinc-100">
                            {formatCurrency(item.sellingPrice)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-zinc-400">Stock:</span>
                          <span className={`font-mono font-bold text-sm ${item.stock <= 5 ? "text-amber-500" : "text-[#E85002]"}`}>
                            {item.stock}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2 border-t border-zinc-800">
                        <Button size="sm" variant="outline" className="h-8 text-xs border-zinc-800 text-zinc-300 hover:bg-zinc-800" onClick={() => openAdjust(item)}>
                          Adjust Stock
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!isLoading && inventory.length === 0 && (
              <p className="py-8 text-center text-zinc-400">No inventory data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <InventoryAdjustDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productId={selectedItem?._id ?? inventory[0]?._id ?? ""}
        productName={selectedItem?.name ?? inventory[0]?.name ?? "Product"}
        onSuccess={loadInventory}
      />
    </>
  );
}
