"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { brandSchema, type BrandInput } from "@/validations/brand.schema";

export interface BrandRecord {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  isActive: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: BrandRecord | null;
  onSuccess: () => void;
}

export function BrandFormDialog({ open, onOpenChange, brand, onSuccess }: Props) {
  const isEdit = Boolean(brand);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BrandInput>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      slug: "",
      logo: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (brand) {
      reset({
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo ?? "",
        isActive: brand.isActive,
      });
    } else {
      reset({
        name: "",
        slug: "",
        logo: "",
        isActive: true,
      });
    }
  }, [brand, reset, open]);

  const onSubmit = async (data: BrandInput) => {
    const url = isEdit ? `/api/brands/${brand!._id}` : "/api/brands";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (!json.success) {
      toast.error(json.error ?? "Failed to save brand");
      return;
    }

    toast.success(isEdit ? "Brand updated" : "Brand created");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-100">{isEdit ? "Edit Brand" : "Add Brand"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {isEdit ? "Update the selected brand." : "Create a new brand for your catalog."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="brand-name" className="text-zinc-200 font-medium">Name *</Label>
            <Input id="brand-name" className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-slug" className="text-zinc-200 font-medium">Slug</Label>
            <Input id="brand-slug" className="bg-zinc-900 text-zinc-100 border-zinc-800 font-mono text-sm focus:border-[#E85002]" {...register("slug")} />
            {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-logo" className="text-zinc-200 font-medium">Logo URL</Label>
            <Input id="brand-logo" className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]" {...register("logo")} />
            {errors.logo && <p className="text-sm text-red-500">{errors.logo.message}</p>}
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <input
              id="isActive"
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-800 text-[#E85002] focus:ring-[#E85002]"
              {...register("isActive")}
            />
            <div className="space-y-1">
              <Label htmlFor="isActive" className="text-zinc-200 font-medium">Active</Label>
              <p className="text-xs text-zinc-400">
                Toggle to make this brand visible in product creation flows.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-800 text-zinc-300 hover:bg-zinc-900">
              Cancel
            </Button>
            <Button type="submit" variant="brandGradient" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
