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
import { supplierSchema, type SupplierInput } from "@/validations/supplier.schema";

export interface SupplierRecord {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  dueBalance: number;
  isActive: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: SupplierRecord | null;
  onSuccess: () => void;
}

export function SupplierFormDialog({ open, onOpenChange, supplier, onSuccess }: Props) {
  const isEdit = Boolean(supplier);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      company: "",
      dueBalance: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        email: supplier.email ?? "",
        phone: supplier.phone ?? "",
        address: supplier.address ?? "",
        company: supplier.company ?? "",
        dueBalance: supplier.dueBalance,
        isActive: supplier.isActive,
      });
    } else {
      reset({
        name: "",
        email: "",
        phone: "",
        address: "",
        company: "",
        dueBalance: 0,
        isActive: true,
      });
    }
  }, [supplier, reset, open]);

  const onSubmit = async (data: SupplierInput) => {
    const url = isEdit ? `/api/suppliers/${supplier!._id}` : "/api/suppliers";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (!json.success) {
      toast.error(json.error ?? "Failed to save");
      return;
    }

    toast.success(isEdit ? "Supplier updated" : "Supplier created");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-100">{isEdit ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Manage supplier contact and payment tracking.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="supp-name" className="text-zinc-200 font-medium">Supplier Name *</Label>
            <Input id="supp-name" className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supp-comp" className="text-zinc-200 font-medium">Company Name</Label>
            <Input id="supp-comp" className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]" {...register("company")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="supp-email" className="text-zinc-200 font-medium">Email</Label>
              <Input id="supp-email" type="email" className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]" {...register("email")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supp-phone" className="text-zinc-200 font-medium">Phone</Label>
              <Input id="supp-phone" className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]" {...register("phone")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supp-addr" className="text-zinc-200 font-medium">Address</Label>
            <Input id="supp-addr" className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]" {...register("address")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supp-due" className="text-zinc-200 font-medium">Due Balance (Payable)</Label>
            <Input id="supp-due" type="number" step="0.01" className="bg-zinc-900 text-zinc-100 border-zinc-800 font-mono focus:border-[#E85002]" {...register("dueBalance", { valueAsNumber: true })} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-800 text-zinc-300 hover:bg-zinc-900">
              Cancel
            </Button>
            <Button type="submit" variant="brandGradient" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Update Supplier" : "Create Supplier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
