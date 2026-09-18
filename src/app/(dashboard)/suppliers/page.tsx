"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { ModulePage } from "@/components/shared/module-page";
import {
  SupplierFormDialog,
  type SupplierRecord,
} from "@/components/suppliers/supplier-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierRecord | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/suppliers${q}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setSuppliers(json.data.items ?? []);
      })
      .finally(() => setIsLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this supplier?")) return;
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("Supplier deactivated");
      load();
    } else {
      toast.error(json.error);
    }
  };

  return (
    <ModulePage title="Suppliers" description="Supplier profiles and purchase order tracking">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Supplier List</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search..."
                className="pl-9 w-48"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-zinc-500 dark:text-zinc-400">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Company</th>
                  <th className="pb-3 pr-4">Contact</th>
                  <th className="pb-3 pr-4">Due</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s._id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{s.name}</td>
                    <td className="py-3 pr-4">{s.company ?? "—"}</td>
                    <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">
                      {s.email ?? "—"}
                      {s.phone && <span className="block text-xs">{s.phone}</span>}
                    </td>
                    <td className="py-3 pr-4 font-medium">{formatCurrency(s.dueBalance)}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={s.isActive ? "success" : "secondary"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(s);
                            setDialogOpen(true);
                          }}
                          aria-label="Edit supplier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s._id)}
                          aria-label="Deactivate supplier"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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
            {suppliers.map((s) => (
              <div
                key={s._id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{s.name}</h4>
                    {s.company && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{s.company}</p>}
                    {s.phone && <p className="text-xs text-zinc-500 dark:text-zinc-400">📞 {s.phone}</p>}
                    {s.email && <p className="text-xs text-zinc-400 dark:text-zinc-500">{s.email}</p>}
                  </div>
                  <Badge variant={s.isActive ? "success" : "secondary"}>
                    {s.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Outstanding Due: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(s.dueBalance)}</span>
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setEditing(s);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleDelete(s._id)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Deactivate
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading suppliers...</p>
          ) : suppliers.length === 0 ? (
            <p className="py-8 text-center text-zinc-500 dark:text-zinc-400">No suppliers yet. Add one to get started.</p>
          ) : null}
        </CardContent>
      </Card>

      <SupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editing}
        onSuccess={load}
      />
    </ModulePage>
  );
}
