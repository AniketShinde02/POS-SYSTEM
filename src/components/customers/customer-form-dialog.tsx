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
import { customerSchema, type CustomerInput } from "@/validations/customer.schema";

export interface CustomerRecord {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints: number;
  dueBalance: number;
  isActive: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerRecord | null;
  onSuccess: () => void;
}

export function CustomerFormDialog({ open, onOpenChange, customer, onSuccess }: Props) {
  const isEdit = Boolean(customer);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      loyaltyPoints: 0,
      dueBalance: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        address: customer.address ?? "",
        loyaltyPoints: customer.loyaltyPoints,
        dueBalance: customer.dueBalance,
        isActive: customer.isActive,
      });
    } else {
      reset({
        name: "",
        email: "",
        phone: "",
        address: "",
        loyaltyPoints: 0,
        dueBalance: 0,
        isActive: true,
      });
    }
  }, [customer, reset, open]);

  const onSubmit = async (data: CustomerInput) => {
    const url = isEdit ? `/api/customers/${customer!._id}` : "/api/customers";
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

    toast.success(isEdit ? "Customer updated" : "Customer created");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Customer" : "Add Customer"}</DialogTitle>
          <DialogDescription>
            Manage customer profile, loyalty points, and due balance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cust-name" className="text-zinc-900 dark:text-zinc-100 font-medium">Customer Name *</Label>
            <Input id="cust-name" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-email" className="text-zinc-900 dark:text-zinc-100 font-medium">Email</Label>
              <Input id="cust-email" type="email" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700" {...register("email")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-phone" className="text-zinc-900 dark:text-zinc-100 font-medium">Phone</Label>
              <Input id="cust-phone" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700" {...register("phone")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-addr" className="text-zinc-900 dark:text-zinc-100 font-medium">Address</Label>
            <Input id="cust-addr" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700" {...register("address")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-points" className="text-zinc-900 dark:text-zinc-100 font-medium">Loyalty Points</Label>
              <Input id="cust-points" type="number" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700" {...register("loyaltyPoints", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-due" className="text-zinc-900 dark:text-zinc-100 font-medium">Due Balance</Label>
              <Input id="cust-due" type="number" step="0.01" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700" {...register("dueBalance", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-800 text-zinc-300 hover:bg-zinc-900">
              Cancel
            </Button>
            <Button type="submit" variant="brandGradient" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Update Customer" : "Create Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
