"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Upload, Loader2, Barcode, Sparkles } from "lucide-react";
import Image from "next/image";
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
import { productSchema, type ProductInput } from "@/validations/product.schema";

interface Category {
  _id: string;
  name: string;
}

interface Brand {
  _id: string;
  name: string;
}

export interface ProductRecord {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  stock: number;
  lowStockThreshold: number;
  unit: string;
  images?: string[];
  isActive?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: ProductRecord | null;
}

export function ProductFormDialog({ open, onOpenChange, onSuccess, initialData }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const isEditing = Boolean(initialData?._id);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      description: "",
      categoryId: "",
      brandId: "",
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      taxRate: 0,
      lowStockThreshold: 5,
      unit: "pcs",
    },
  });

  useEffect(() => {
    if (open) {
      // Load categories
      fetch("/api/categories")
        .then((r) => r.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) setCategories(json.data);
        })
        .catch(() => {});

      // Load brands
      fetch("/api/brands")
        .then((r) => r.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) setBrands(json.data);
        })
        .catch(() => {});

      if (initialData) {
        reset({
          name: initialData.name ?? "",
          sku: initialData.sku ?? "",
          barcode: initialData.barcode ?? "",
          description: initialData.description ?? "",
          categoryId: initialData.categoryId ?? "",
          brandId: initialData.brandId ?? "",
          costPrice: Number(initialData.costPrice ?? 0),
          sellingPrice: Number(initialData.sellingPrice ?? 0),
          stock: Number(initialData.stock ?? 0),
          taxRate: Number(initialData.taxRate ?? 0),
          lowStockThreshold: Number(initialData.lowStockThreshold ?? 5),
          unit: initialData.unit ?? "pcs",
        });
        setImageUrl(initialData.images?.[0] ?? "");
      } else {
        const genSKU = `SKU-${Date.now().toString().slice(-6)}`;
        const genBarcode = `${Date.now()}`.slice(-12);
        reset({
          name: "",
          sku: genSKU,
          barcode: genBarcode,
          description: "",
          categoryId: "",
          brandId: "",
          costPrice: 0,
          sellingPrice: 0,
          stock: 10,
          taxRate: 18,
          lowStockThreshold: 5,
          unit: "pcs",
        });
        setImageUrl("");
      }
    }
  }, [open, reset, initialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Upload failed");
      setImageUrl(json.data.url);
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const generateNewBarcode = () => {
    const code = `${Date.now()}`.slice(-12);
    setValue("barcode", code);
    toast.info(`Generated barcode: ${code}`);
  };

  const generateNewSKU = () => {
    const sku = `SKU-${Date.now().toString().slice(-6)}`;
    setValue("sku", sku);
    toast.info(`Generated SKU: ${sku}`);
  };

  const onSubmit = async (data: ProductInput) => {
    const payload = {
      ...data,
      images: imageUrl ? [imageUrl] : [],
    };

    const url = isEditing ? `/api/products/${initialData!._id}` : "/api/products";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (!json.success) {
      toast.error(json.error ?? (isEditing ? "Failed to update product" : "Failed to create product"));
      return;
    }

    toast.success(isEditing ? "Product updated successfully" : "Product created successfully");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-100">
            {isEditing ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Configure catalog item details, barcodes, stock levels, and pricing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Product Image */}
          <div className="space-y-2">
            <Label className="text-zinc-200 font-medium">Product Image</Label>
            <div className="flex items-center gap-4">
              {imageUrl ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 text-zinc-500">
                  <Upload className="h-6 w-6" />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm font-medium text-zinc-200 shadow-sm hover:bg-zinc-800 transition-colors">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#E85002]" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "Uploading to Cloud..." : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
                <p className="text-xs text-zinc-500">PNG, JPG, or WEBP up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Name & Description */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-name" className="text-zinc-200 font-medium">
                Product Name *
              </Label>
              <Input
                id="prod-name"
                placeholder="e.g. Basmati Rice 5kg"
                className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]"
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-desc" className="text-zinc-200 font-medium">
                Description
              </Label>
              <Input
                id="prod-desc"
                placeholder="Optional short description or packaging info"
                className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]"
                {...register("description")}
              />
            </div>
          </div>

          {/* SKU and Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="prod-sku" className="text-zinc-200 font-medium">
                  SKU
                </Label>
                <button
                  type="button"
                  onClick={generateNewSKU}
                  className="text-xs text-[#E85002] hover:text-[#E85002]/80 font-medium inline-flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Auto
                </button>
              </div>
              <Input
                id="prod-sku"
                placeholder="e.g. SKU-10492"
                className="bg-zinc-900 text-zinc-100 border-zinc-800 font-mono text-sm focus:border-[#E85002]"
                {...register("sku")}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="prod-barcode" className="text-zinc-200 font-medium">
                  Barcode (EAN/UPC)
                </Label>
                <button
                  type="button"
                  onClick={generateNewBarcode}
                  className="text-xs text-[#E85002] hover:text-[#E85002]/80 font-medium inline-flex items-center gap-1"
                >
                  <Barcode className="h-3 w-3" /> Generate
                </button>
              </div>
              <Input
                id="prod-barcode"
                placeholder="Scan or enter 12/13 digits"
                className="bg-zinc-900 text-zinc-100 border-zinc-800 font-mono text-sm focus:border-[#E85002]"
                {...register("barcode")}
              />
            </div>
          </div>

          {/* Category & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-cat" className="text-zinc-200 font-medium">
                Category *
              </Label>
              <select
                id="prod-cat"
                className="flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E85002]/50"
                {...register("categoryId")}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-brand" className="text-zinc-200 font-medium">
                Brand
              </Label>
              <select
                id="prod-brand"
                className="flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E85002]/50"
                {...register("brandId")}
              >
                <option value="">No brand / Generic</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-cost" className="text-zinc-200 font-medium">
                Cost Price (Buy)
              </Label>
              <Input
                id="prod-cost"
                type="number"
                step="0.01"
                className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]"
                {...register("costPrice", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-price" className="text-zinc-200 font-medium">
                Selling Price (Retail) *
              </Label>
              <Input
                id="prod-price"
                type="number"
                step="0.01"
                className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]"
                {...register("sellingPrice", { valueAsNumber: true })}
              />
              {errors.sellingPrice && <p className="text-xs text-red-500">{errors.sellingPrice.message}</p>}
            </div>
          </div>

          {/* Stock, Tax & Unit */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prod-stock" className="text-zinc-200 font-medium">
                Stock Qty
              </Label>
              <Input
                id="prod-stock"
                type="number"
                className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]"
                {...register("stock", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-tax" className="text-zinc-200 font-medium">
                Tax % (GST/VAT)
              </Label>
              <Input
                id="prod-tax"
                type="number"
                className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]"
                {...register("taxRate", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-low" className="text-zinc-200 font-medium">
                Low Alert At
              </Label>
              <Input
                id="prod-low"
                type="number"
                className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]"
                {...register("lowStockThreshold", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-unit" className="text-zinc-200 font-medium">
                Unit
              </Label>
              <Input
                id="prod-unit"
                placeholder="pcs / kg / box"
                className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]"
                {...register("unit")}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
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
              disabled={isSubmitting || uploading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Product"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
