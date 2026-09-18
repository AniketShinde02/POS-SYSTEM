"use client";

import { useState, useEffect, Fragment } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Check, X, KeyRound, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface RoleDefinition {
  id: string;
  name: string;
  badgeColor: string;
  description: string;
  userCount?: number;
  permissions: string[];
}

const ROLES: RoleDefinition[] = [
  {
    id: "admin",
    name: "Admin",
    badgeColor: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800",
    description: "Full system administration, tenant configuration, branch creation, user role provisioning, and all business operations.",
    permissions: ["* (All 28+ System Permissions)"],
  },
  {
    id: "supervisor",
    name: "Supervisor / Manager",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800",
    description: "Store operations, catalog management, inventory adjustments, purchase orders, supplier management, and business analytics.",
    permissions: [
      "dashboard.view", "pos.access", "products.manage", "categories.manage",
      "inventory.manage", "sales.viewAll", "customers.manage", "suppliers.manage",
      "purchases.manage", "expenses.manage", "reports.view"
    ],
  },
  {
    id: "cashier",
    name: "Cashier",
    badgeColor: "bg-[#E85002]/10 text-[#E85002] border-[#E85002]/30",
    description: "Front-line terminal operations: product lookup, barcode scanning, cart processing, discount application, and payment settlement.",
    permissions: [
      "dashboard.view", "pos.access", "pos.checkout", "products.view",
      "categories.view", "sales.view", "customers.view", "customers.manage"
    ],
  },
  {
    id: "employee",
    name: "Employee / Staff",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800",
    description: "Standard staff access: view-only permissions for product catalog and inventory stock levels.",
    permissions: ["dashboard.view", "pos.view", "products.view", "inventory.view"],
  },
];

const PERMISSION_GROUPS = [
  {
    category: "POS & Checkout",
    perms: [
      { id: "pos.access", label: "Access POS Terminal", roles: ["admin", "supervisor", "cashier", "employee"] },
      { id: "pos.checkout", label: "Process Checkout & Payments", roles: ["admin", "supervisor", "cashier"] },
      { id: "pos.discount", label: "Apply Cart Discounts", roles: ["admin", "supervisor", "cashier"] },
      { id: "pos.refund", label: "Process Sale Refunds", roles: ["admin", "supervisor"] },
    ],
  },
  {
    category: "Products & Catalog",
    perms: [
      { id: "products.view", label: "View Product Catalog", roles: ["admin", "supervisor", "cashier", "employee"] },
      { id: "products.create", label: "Create Products", roles: ["admin", "supervisor"] },
      { id: "products.update", label: "Edit Products & Prices", roles: ["admin", "supervisor"] },
      { id: "products.delete", label: "Archive / Delete Products", roles: ["admin"] },
    ],
  },
  {
    category: "Inventory & Stock",
    perms: [
      { id: "inventory.view", label: "View Stock Levels", roles: ["admin", "supervisor", "employee"] },
      { id: "inventory.adjust", label: "Stock In / Out Adjustments", roles: ["admin", "supervisor"] },
    ],
  },
  {
    category: "Sales & Invoicing",
    perms: [
      { id: "sales.view", label: "View Personal / Terminal Sales", roles: ["admin", "supervisor", "cashier"] },
      { id: "sales.viewAll", label: "View All Store Orders", roles: ["admin", "supervisor"] },
      { id: "sales.refund", label: "Refund Completed Invoices", roles: ["admin", "supervisor"] },
    ],
  },
  {
    category: "Administration & Settings",
    perms: [
      { id: "employees.manage", label: "Manage Staff & Passwords", roles: ["admin"] },
      { id: "roles.manage", label: "Manage Roles & Permissions", roles: ["admin"] },
      { id: "branches.manage", label: "Manage Branches & Locations", roles: ["admin"] },
      { id: "settings.manage", label: "Edit Store & Tax Settings", roles: ["admin"] },
    ],
  },
];

export function RolesPage() {
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.items) {
          const counts: Record<string, number> = {};
          for (const item of json.data.items) {
            const r = (item.role || "cashier").toLowerCase();
            counts[r] = (counts[r] || 0) + 1;
          }
          setUserCounts(counts);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <DashboardShell title="Roles & Permissions">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Roles & Permissions
            </h1>
            <p className="text-sm text-zinc-400">
              Role-Based Access Control (RBAC) definitions and granular permission assignments.
            </p>
          </div>
          <Button asChild variant="brandGradient">
            <Link href="/employees" className="flex items-center gap-2 font-medium">
              <Users className="h-4 w-4" />
              Manage Staff Accounts
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Roles Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ROLES.map((role) => (
            <Card key={role.id} className="flex flex-col justify-between border-zinc-800 bg-zinc-950 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`font-semibold ${role.id === 'cashier' ? 'bg-[#E85002]/10 text-[#E85002] border-[#E85002]/30' : role.badgeColor}`}>
                    {role.name}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-zinc-400 font-medium">
                    <Users className="h-3.5 w-3.5" />
                    {userCounts[role.id] ?? 0} users
                  </span>
                </div>
                <CardTitle className="pt-2 text-base text-zinc-100">{role.name}</CardTitle>
                <CardDescription className="text-xs leading-relaxed text-zinc-400">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                    <KeyRound className="h-3 w-3 text-[#E85002]" />
                    <span>{role.permissions.length} Assigned Permission Sets</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Permission Matrix */}
        <Card className="border-zinc-800 bg-zinc-950 shadow-xl">
          <CardHeader className="border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#E85002]" />
              <CardTitle className="text-base text-zinc-100">Permission Matrix</CardTitle>
            </div>
            <CardDescription className="text-zinc-400">
              Granular permission matrix enforced at both the API endpoint layer and UI navigation guards.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-left">
                  <th className="p-3.5 font-semibold text-zinc-100">Domain & Capability</th>
                  <th className="p-3.5 text-center font-semibold text-zinc-100">Admin</th>
                  <th className="p-3.5 text-center font-semibold text-zinc-100">Supervisor</th>
                  <th className="p-3.5 text-center font-semibold text-zinc-100">Cashier</th>
                  <th className="p-3.5 text-center font-semibold text-zinc-100">Employee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {PERMISSION_GROUPS.map((group) => (
                  <Fragment key={group.category}>
                    <tr className="bg-zinc-900/40">
                      <td colSpan={5} className="px-3.5 py-2 font-bold uppercase tracking-wider text-[10px] text-zinc-400">
                        {group.category}
                      </td>
                    </tr>
                    {group.perms.map((perm) => (
                      <tr key={perm.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="p-3.5">
                          <p className="font-medium text-zinc-100">{perm.label}</p>
                          <code className="text-[10px] font-mono text-zinc-500">{perm.id}</code>
                        </td>
                        <td className="p-3.5 text-center">
                          <Check className="mx-auto h-4 w-4 text-[#E85002]" />
                        </td>
                        <td className="p-3.5 text-center">
                          {perm.roles.includes("supervisor") ? (
                            <Check className="mx-auto h-4 w-4 text-[#E85002]" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-zinc-700" />
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {perm.roles.includes("cashier") ? (
                            <Check className="mx-auto h-4 w-4 text-[#E85002]" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-zinc-700" />
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {perm.roles.includes("employee") ? (
                            <Check className="mx-auto h-4 w-4 text-[#E85002]" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-zinc-700" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
