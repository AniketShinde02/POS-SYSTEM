"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Edit3, Trash2 } from "lucide-react";
import { BrandFormDialog, type BrandRecord } from "@/components/brands/brand-form-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BrandsPage() {
  const [brands, setBrands] = useState<BrandRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadBrands = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/brands");
      const json = await res.json();
      if (json.success) {
        setBrands(json.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const openCreate = () => {
    setSelectedBrand(null);
    setDialogOpen(true);
  };

  const openEdit = (brand: BrandRecord) => {
    setSelectedBrand(brand);
    setDialogOpen(true);
  };

  const handleDelete = async (brand: BrandRecord) => {
    const confirmed = window.confirm(`Delete brand "${brand.name}"? This cannot be undone.`);
    if (!confirmed) return;
    const res = await fetch(`/api/brands/${brand._id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setBrands((current) => current.filter((item) => item._id !== brand._id));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-zinc-800 bg-zinc-950 shadow-xl">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <CardTitle className="text-zinc-100">Brand Directory</CardTitle>
            <p className="text-sm text-zinc-400">
              Manage the brands available for your products.
            </p>
          </div>
          <Button variant="brandGradient" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-left text-zinc-400">
                  <th className="py-3 px-4 font-medium">Brand</th>
                  <th className="py-3 px-4 font-medium">Slug</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {brands.map((brand) => (
                  <tr key={brand._id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-zinc-100">{brand.name}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-400">{brand.slug}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={brand.isActive ? "success" : "secondary"}>
                        {brand.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0 border-zinc-800 text-zinc-300 hover:bg-zinc-800" onClick={() => openEdit(brand)} aria-label="Edit brand">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="destructive" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(brand)} aria-label="Delete brand">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {brands.map((brand) => (
              <div
                key={brand._id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-100 text-sm">{brand.name}</h3>
                  <Badge variant={brand.isActive ? "success" : "secondary"}>
                    {brand.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="font-mono text-xs text-zinc-400">Slug: {brand.slug}</p>
                <div className="flex items-center justify-end gap-2 border-t border-zinc-800 pt-2.5">
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-zinc-800 text-zinc-300 hover:bg-zinc-800" onClick={() => openEdit(brand)}>
                    <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button type="button" variant="destructive" size="sm" className="h-8 text-xs" onClick={() => handleDelete(brand)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {!isLoading && brands.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-400">
              No brands found. Add a brand to get started.
            </p>
          )}
          {isLoading && (
            <p className="py-8 text-center text-sm text-zinc-400">Loading brands...</p>
          )}
        </CardContent>
      </Card>

      <BrandFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        brand={selectedBrand}
        onSuccess={loadBrands}
      />
    </div>
  );
}
