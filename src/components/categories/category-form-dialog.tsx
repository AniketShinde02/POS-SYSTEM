"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categorySchema, type CategoryInput } from "@/validations/category.schema";

export interface CategoryRecord {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: CategoryRecord | null;
}

export function CategoryFormDialog({ open, onOpenChange, onSuccess, initialData }: Props) {
  const isEditing = Boolean(initialData?._id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image: "",
      parentId: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name ?? "",
          slug: initialData.slug ?? "",
          description: initialData.description ?? "",
          image: initialData.image ?? "",
          isActive: initialData.isActive ?? true,
        });
      } else {
        reset({
          name: "",
          slug: "",
          description: "",
          image: "",
          parentId: "",
          isActive: true,
        });
      }
    }
  }, [open, reset, initialData]);

  const onSubmit = async (data: CategoryInput) => {
    const url = isEditing ? `/api/categories/${initialData!._id}` : "/api/categories";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!json.success) {
      toast.error(json.error ?? (isEditing ? "Failed to update category" : "Failed to create category"));
      return;
    }

    toast.success(isEditing ? "Category updated successfully" : "Category created successfully");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-100">
            {isEditing ? "Edit Category" : "Add Category"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Group products into structured categories for navigation and POS filtering.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name" className="text-zinc-200 font-medium">
              Category Name *
            </Label>
            <Input
              id="cat-name"
              placeholder="e.g. Beverages, Dairy, Snacks"
              className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]"
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-slug" className="text-zinc-200 font-medium">
              Slug
            </Label>
            <Input
              id="cat-slug"
              placeholder="Auto-generated if left empty"
              className="bg-zinc-900 text-zinc-100 border-zinc-800 font-mono text-sm focus:border-[#E85002]"
              {...register("slug")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-desc" className="text-zinc-200 font-medium">
              Description
            </Label>
            <Input
              id="cat-desc"
              placeholder="Optional description"
              className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]"
              {...register("description")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-img" className="text-zinc-200 font-medium">
              Image URL / Icon
            </Label>
            <Input
              id="cat-img"
              placeholder="https://..."
              className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]"
              {...register("image")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brandGradient"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Category"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
