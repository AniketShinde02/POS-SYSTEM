"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, Barcode, Package, AlertTriangle, Layers } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { ModulePage } from "@/components/shared/module-page";
import { ProductFormDialog, type ProductRecord } from "@/components/products/product-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
}

export default function AdminProductsPage() {
  const [data, setData] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products?limit=100");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data.items ?? []);
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) setCategories(json.data);
      })
      .catch(() => {});
  }, []);

  const filteredProducts = useMemo(() => {
    return data.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));

      const matchesCat = !selectedCategory || p.categoryId === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [data, search, selectedCategory]);

  const handleEdit = (product: ProductRecord) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleDelete = async (product: ProductRecord) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${product._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Delete failed");
      toast.success("Product deleted successfully");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  const getCategoryName = (catId?: string) => {
    if (!catId) return "-";
    const found = categories.find((c) => c._id === catId);
    return found?.name || "General";
  };

  return (
    <ModulePage
      title="Product Catalog Management"
      description="Manage all inventory items, barcodes, pricing, and stock levels"
    >
      <Card className="border-zinc-800 bg-zinc-950 shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#E85002]/10 border border-[#E85002]/20 text-[#E85002]">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-100">
                Products Directory
              </CardTitle>
              <p className="text-xs text-zinc-400">
                {filteredProducts.length} total items in catalog
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="brandGradient"
            className="self-start sm:self-auto font-medium"
            onClick={handleCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search by name, SKU, or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#E85002]"
              />
            </div>
            <div className="sm:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E85002]/50"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Content */}
          {isLoading ? (
            <div className="py-16 text-center text-sm text-zinc-400">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#E85002] border-r-transparent mb-2" />
              <p>Loading products catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-base font-medium text-zinc-100">No products found</h3>
              <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
                {search || selectedCategory
                  ? "Try clearing your search query or category filter."
                  : "Get started by adding your first product with pricing and barcode."}
              </p>
              {!search && !selectedCategory && (
                <Button
                  size="sm"
                  variant="brandGradient"
                  className="mt-4"
                  onClick={handleCreate}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Product
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60 text-left text-zinc-400">
                      <th className="py-3.5 px-4 font-medium">Product</th>
                      <th className="py-3.5 px-4 font-medium">Identifiers</th>
                      <th className="py-3.5 px-4 font-medium">Category</th>
                      <th className="py-3.5 px-4 font-medium text-right">Retail Price</th>
                      <th className="py-3.5 px-4 font-medium text-center">Stock</th>
                      <th className="py-3.5 px-4 font-medium text-center">Status</th>
                      <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredProducts.map((p) => {
                      const isLowStock = Number(p.stock) <= Number(p.lowStockThreshold || 5);
                      const isOutOfStock = Number(p.stock) <= 0;

                      return (
                        <tr
                          key={p._id}
                          className="hover:bg-zinc-900/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {p.images?.[0] ? (
                                <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-zinc-800 shrink-0">
                                  <Image
                                    src={p.images[0]}
                                    alt={p.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                                  <Package className="h-5 w-5" />
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-zinc-100 block">
                                  {p.name}
                                </span>
                                {p.description && (
                                  <span className="text-xs text-zinc-400 truncate max-w-xs block">
                                    {p.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-xs text-zinc-300">
                                SKU: {p.sku}
                              </span>
                              {p.barcode && (
                                <span className="font-mono text-xs text-zinc-400 flex items-center gap-1">
                                  <Barcode className="h-3 w-3" /> {p.barcode}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
                              <Layers className="h-3 w-3 text-[#E85002]" />
                              {getCategoryName(p.categoryId)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span className="font-mono font-bold text-zinc-100">
                              {formatCurrency(p.sellingPrice)}
                            </span>
                            {p.costPrice > 0 && (
                              <span className="block font-mono text-xs text-zinc-500">
                                Cost: {formatCurrency(p.costPrice)}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {isOutOfStock ? (
                              <Badge variant="destructive" className="font-normal text-xs">
                                Out of Stock
                              </Badge>
                            ) : isLowStock ? (
                              <Badge variant="warning" className="font-normal text-xs gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Low ({p.stock} {p.unit || "pcs"})
                              </Badge>
                            ) : (
                              <span className="font-medium font-mono text-zinc-300">
                                {p.stock} {p.unit || "pcs"}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <Badge
                              variant={p.isActive !== false ? "success" : "secondary"}
                              className="font-normal text-xs"
                            >
                              {p.isActive !== false ? "Active" : "Archived"}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                onClick={() => handleEdit(p)}
                                title="Edit Product"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/40"
                                onClick={() => handleDelete(p)}
                                title="Delete Product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={load}
        initialData={editingProduct}
      />
    </ModulePage>
  );
}
