"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
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

const adjustSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
  type: z.enum(["adjustment", "damage", "return", "transfer"]),
  notes: z.string().optional(),
});

type InventoryAdjustInput = z.infer<typeof adjustSchema>;

export interface InventoryAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  onSuccess: () => void;
}

export function InventoryAdjustDialog({
  open,
  onOpenChange,
  productId,
  productName,
  onSuccess,
}: InventoryAdjustDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InventoryAdjustInput>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      productId,
      quantity: 0,
      type: "adjustment",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        productId,
        quantity: 0,
        type: "adjustment",
        notes: "",
      });
    }
  }, [open, productId, reset]);

  const onSubmit = async (values: InventoryAdjustInput) => {
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Failed to adjust stock");
        return;
      }
      toast.success("Inventory updated");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to adjust stock");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-100">Adjust inventory for {productName}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Enter the stock change and reason for this adjustment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <Input type="hidden" {...register("productId")} />
          <div className="space-y-1.5">
            <Label htmlFor="adjust-qty" className="text-zinc-200 font-medium">Quantity Adjustment *</Label>
            <Input id="adjust-qty" type="number" step="1" className="bg-zinc-900 text-zinc-100 border-zinc-800 focus:border-[#E85002]" {...register("quantity", { valueAsNumber: true })} />
            {errors.quantity && (
              <p className="text-xs text-red-500">{errors.quantity.message}</p>
            )}
            <p className="text-xs text-zinc-500">
              Positive (+) to add received stock, negative (-) to write-off or deduct.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adjust-type" className="text-zinc-200 font-medium">Reason Type *</Label>
            <select id="adjust-type" className="flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E85002]/50" {...register("type")}> 
              <option value="adjustment">Stock Adjustment (Audit)</option>
              <option value="damage">Damaged / Expired</option>
              <option value="return">Customer Return</option>
              <option value="transfer">Internal Transfer</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adjust-notes" className="text-zinc-200 font-medium">Notes & Reference</Label>
            <textarea
              id="adjust-notes"
              placeholder="e.g. Physical inventory count correction or supplier return"
              className="flex min-h-24 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E85002]/50 placeholder:text-zinc-500"
              {...register("notes")}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-800 text-zinc-300 hover:bg-zinc-900">
              Cancel
            </Button>
            <Button type="submit" variant="brandGradient" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Adjustment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
