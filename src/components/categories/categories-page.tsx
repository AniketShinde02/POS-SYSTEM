"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import { ModulePage } from "@/components/shared/module-page";
import { CategoryFormDialog, type CategoryRecord } from "@/components/categories/category-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CategoriesPage() {
  const [data, setData] = useState<CategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);

  const load = () => {
    setIsLoading(true);
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setData(json.data);
        }
      })
      .catch(() => {
        toast.error("Failed to load categories");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [data, search]);

  const handleCreate = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (category: CategoryRecord) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleDelete = async (category: CategoryRecord) => {
    if (!confirm(`Are you sure you want to delete category "${category.name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${category._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Delete failed");
      toast.success("Category deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  return (
    <ModulePage title="Categories" description="Manage product categories for POS and catalog sorting">
      <Card className="border-zinc-800 bg-zinc-950 shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#E85002]/10 border border-[#E85002]/20 text-[#E85002]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-100">
                Category Directory
              </CardTitle>
              <p className="text-xs text-zinc-400">
                {filtered.length} total categories
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
            Add Category
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#E85002]"
            />
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-zinc-400">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#E85002] border-r-transparent mb-2" />
              <p>Loading categories...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-base font-medium text-zinc-100">No categories found</h3>
              <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
                {search ? "No matching categories." : "Add your first category to group your products."}
              </p>
              {!search && (
                <Button size="sm" variant="brandGradient" className="mt-4" onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Category
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-left text-zinc-500 dark:text-zinc-400">
                      <th className="py-3 px-4 font-medium">Category Name</th>
                      <th className="py-3 px-4 font-medium">Slug</th>
                      <th className="py-3 px-4 font-medium">Description</th>
                      <th className="py-3 px-4 font-medium text-center">Status</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filtered.map((cat) => (
                      <tr key={cat._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                          {cat.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {cat.slug || "-"}
                        </td>
                        <td className="py-3 px-4 text-xs text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                          {cat.description || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={cat.isActive !== false ? "success" : "secondary"} className="text-xs font-normal">
                            {cat.isActive !== false ? "Active" : "Archived"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                              onClick={() => handleEdit(cat)}
                              title="Edit Category"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                              onClick={() => handleDelete(cat)}
                              title="Delete Category"
                            >
                              <Trash2 className="h-4 w-4" />
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
                {filtered.map((cat) => (
                  <div
                    key={cat._id}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{cat.name}</h4>
                      {cat.slug && (
                        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{cat.slug}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-xs"
                        onClick={() => handleEdit(cat)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-xs text-red-500"
                        onClick={() => handleDelete(cat)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={load}
        initialData={editingCategory}
      />
    </ModulePage>
  );
}
