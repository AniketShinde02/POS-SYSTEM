import type { Permission, UserRole } from "@/types";

const ALL_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "pos.view",
  "pos.access",
  "pos.checkout",
  "pos.discount",
  "pos.refund",
  "products.view",
  "products.manage",
  "products.create",
  "products.update",
  "products.delete",
  "products.import",
  "categories.view",
  "categories.manage",
  "brands.view",
  "brands.manage",
  "inventory.view",
  "inventory.manage",
  "inventory.adjust",
  "sales.view",
  "sales.viewAll",
  "sales.manage",
  "sales.refund",
  "customers.view",
  "customers.manage",
  "suppliers.view",
  "suppliers.manage",
  "purchases.view",
  "purchases.manage",
  "expenses.view",
  "expenses.manage",
  "reports.view",
  "employees.view",
  "employees.manage",
  "employees.create",
  "employees.update",
  "employees.disable",
  "roles.view",
  "roles.manage",
  "branches.view",
  "branches.manage",
  "settings.view",
  "settings.manage",
];

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ALL_PERMISSIONS,
  supervisor: [
    "dashboard.view",
    "pos.view",
    "pos.access",
    "pos.checkout",
    "pos.discount",
    "products.view",
    "products.manage",
    "products.create",
    "products.update",
    "categories.view",
    "categories.manage",
    "brands.view",
    "brands.manage",
    "inventory.view",
    "inventory.manage",
    "inventory.adjust",
    "sales.view",
    "sales.viewAll",
    "sales.manage",
    "customers.view",
    "customers.manage",
    "suppliers.view",
    "suppliers.manage",
    "purchases.view",
    "purchases.manage",
    "expenses.view",
    "expenses.manage",
    "reports.view",
  ],
  manager: [
    "dashboard.view",
    "pos.view",
    "pos.access",
    "pos.checkout",
    "pos.discount",
    "products.view",
    "products.manage",
    "products.create",
    "products.update",
    "categories.view",
    "categories.manage",
    "brands.view",
    "brands.manage",
    "inventory.view",
    "inventory.manage",
    "inventory.adjust",
    "sales.view",
    "sales.viewAll",
    "sales.manage",
    "customers.view",
    "customers.manage",
    "suppliers.view",
    "suppliers.manage",
    "purchases.view",
    "purchases.manage",
    "expenses.view",
    "expenses.manage",
    "reports.view",
  ],
  cashier: [
    "pos.view",
    "pos.access",
    "pos.checkout",
    "products.view",
    "categories.view",
    "sales.view",
    "customers.view",
    "customers.manage",
  ],
  employee: [
    "pos.view",
    "pos.access",
    "products.view",
    "inventory.view",
  ],
  staff: [
    "pos.view",
    "pos.access",
    "products.view",
    "inventory.view",
  ],
};

// Map granular check to broad parent permissions that satisfy it
const PERMISSION_PARENTS: Partial<Record<Permission, Permission[]>> = {
  "products.view": ["products.manage"],
  "products.create": ["products.manage"],
  "products.update": ["products.manage"],
  "products.delete": ["products.manage"],
  "products.import": ["products.manage"],
  "categories.view": ["categories.manage", "products.manage"],
  "brands.view": ["brands.manage", "products.manage"],
  "pos.view": ["pos.access"],
  "pos.checkout": ["pos.access"],
  "inventory.view": ["inventory.manage"],
  "inventory.adjust": ["inventory.manage"],
  "sales.view": ["sales.manage"],
  "sales.viewAll": ["sales.manage"],
  "sales.refund": ["sales.manage"],
  "customers.view": ["customers.manage"],
  "suppliers.view": ["suppliers.manage"],
  "purchases.view": ["purchases.manage"],
  "expenses.view": ["expenses.manage"],
  "employees.view": ["employees.manage"],
  "employees.create": ["employees.manage"],
  "employees.update": ["employees.manage"],
  "employees.disable": ["employees.manage"],
  "roles.view": ["roles.manage", "employees.manage"],
  "branches.view": ["branches.manage"],
  "settings.view": ["settings.manage"],
};

export function getPermissionsForRole(role: UserRole | string): Permission[] {
  const norm = (role || "").toLowerCase();
  if (norm === "admin") return ALL_PERMISSIONS;
  return ROLE_PERMISSIONS[norm] ?? [];
}

export function hasPermission(
  role: UserRole | string,
  permission: Permission,
  customPermissions?: Permission[]
): boolean {
  const norm = (role || "").toLowerCase();
  if (norm === "admin") return true;

  const userPerms = new Set([
    ...getPermissionsForRole(norm),
    ...(customPermissions ?? []),
  ]);

  if (userPerms.has(permission)) return true;

  // Check parent permissions
  const parents = PERMISSION_PARENTS[permission];
  if (parents && parents.some((p) => userPerms.has(p))) {
    return true;
  }

  return false;
}

export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/dashboard": "dashboard.view",
  "/pos": "pos.access",
  "/dashboard/products": "products.view",
  "/products": "products.view",
  "/categories": "categories.view",
  "/brands": "brands.view",
  "/inventory": "inventory.view",
  "/customers": "customers.view",
  "/suppliers": "suppliers.view",
  "/purchases": "purchases.view",
  "/sales": "sales.view",
  "/expenses": "expenses.view",
  "/employees": "employees.view",
  "/roles": "roles.view",
  "/permissions": "roles.view",
  "/reports": "reports.view",
  "/settings": "settings.manage",
  "/branches": "branches.manage",
};