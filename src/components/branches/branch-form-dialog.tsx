"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { branchSchema, type BranchInput } from "@/validations/branch.schema";

export interface BranchRecord {
  _id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isMain: boolean;
  isActive: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: BranchRecord | null;
  onSuccess: () => void;
}

export function BranchFormDialog({ open, onOpenChange, branch, onSuccess }: Props) {
  const isEdit = Boolean(branch);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BranchInput>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      isMain: false,
      isActive: true,
    },
  });

  useEffect(() => {
    if (branch) {
      reset({
        name: branch.name,
        code: branch.code,
        address: branch.address ?? "",
        phone: branch.phone ?? "",
        email: branch.email ?? "",
        isMain: branch.isMain,
        isActive: branch.isActive,
      });
    } else {
      reset({
        name: "",
        code: "",
        address: "",
        phone: "",
        email: "",
        isMain: false,
        isActive: true,
      });
    }
  }, [branch, reset, open]);

  const onSubmit = async (data: BranchInput) => {
    const url = isEdit ? `/api/branches/${branch!._id}` : "/api/branches";
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await response.json();
    if (!json.success) {
      toast.error(json.error ?? "Failed to save branch");
      return;
    }

    toast.success(isEdit ? "Branch updated" : "Branch created");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Branch" : "Add Branch"}</DialogTitle>
          <DialogDescription>Manage store branches and contact information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input {...register("code")} />
              {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input {...register("address")} />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-300">
              <input type="checkbox" className="h-4 w-4 rounded border-zinc-800 text-[#E85002] focus:ring-[#E85002]" {...register("isMain")} />
              Main / Headquarter Branch
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-300">
              <input type="checkbox" className="h-4 w-4 rounded border-zinc-800 text-[#E85002] focus:ring-[#E85002]" {...register("isActive")} />
              Active Branch Status
            </label>
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
