"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { employeeCreateSchema, employeeUpdateSchema, type EmployeeCreateInput, type EmployeeUpdateInput } from "@/validations/employee.schema";

export interface EmployeeRecord {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "cashier" | "staff";
  employeeId?: string;
  phone?: string;
  isActive: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: EmployeeRecord | null;
  onSuccess: () => void;
}

export function EmployeeFormDialog({ open, onOpenChange, employee, onSuccess }: Props) {
  const isEdit = Boolean(employee);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeCreateInput | EmployeeUpdateInput>({
    resolver: zodResolver(
      isEdit ? employeeUpdateSchema : employeeCreateSchema
    ) as unknown as Resolver<EmployeeCreateInput | EmployeeUpdateInput>,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "cashier",
      employeeId: "",
      phone: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (employee) {
      reset({
        name: employee.name,
        email: employee.email,
        password: "",
        role: employee.role,
        employeeId: employee.employeeId ?? "",
        phone: employee.phone ?? "",
        isActive: employee.isActive,
      });
    } else {
      reset({
        name: "",
        email: "",
        password: "",
        role: "cashier",
        employeeId: "",
        phone: "",
        isActive: true,
      });
    }
  }, [employee, reset, open]);

  const onSubmit = async (data: EmployeeCreateInput | EmployeeUpdateInput) => {
    const url = isEdit ? `/api/employees/${employee!._id}` : "/api/employees";
    const method = isEdit ? "PUT" : "POST";
    const payload = isEdit
      ? {
          ...data,
          password: (data as EmployeeUpdateInput).password || undefined,
        }
      : data;

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    if (!json.success) {
      toast.error(json.error ?? "Failed to save employee");
      return;
    }

    toast.success(isEdit ? "Employee updated" : "Employee created");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-100">{isEdit ? "Edit Employee" : "Add Employee"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Manage user access, role, and active status for your team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="emp-name" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Full Name *
            </Label>
            <Input id="emp-name" placeholder="John Doe" className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-[#E85002]" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-email" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Email Address *
            </Label>
            <Input id="emp-email" type="email" placeholder="john@store.local" className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-[#E85002]" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="emp-id" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Employee ID
              </Label>
              <Input id="emp-id" placeholder="EMP-1001 (auto if blank)" className="bg-zinc-900 border-zinc-800 text-zinc-100 font-mono text-sm focus:border-[#E85002]" {...register("employeeId")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-phone" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Phone Number
              </Label>
              <Input id="emp-phone" placeholder="+91 98765 43210" className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-[#E85002]" {...register("phone")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-role" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Access Role *
            </Label>
            <select
              id="emp-role"
              {...register("role")}
              className="flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E85002]/50"
            >
              <option value="admin">Admin (Full Access)</option>
              <option value="manager">Supervisor / Manager</option>
              <option value="cashier">Cashier (POS Only)</option>
              <option value="staff">Employee / Staff</option>
            </select>
            {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-pass" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              {isEdit ? "New Password (optional)" : "Account Password *"}
            </Label>
            <Input id="emp-pass" type="password" placeholder="••••••••" className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-[#E85002]" {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div className="flex items-center gap-2.5 pt-1">
            <input
              id="isActive"
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-800 text-[#E85002] focus:ring-[#E85002]"
              {...register("isActive")}
            />
            <label htmlFor="isActive" className="text-xs font-medium text-zinc-300">
              Active employee account (can sign in to assigned modules)
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
