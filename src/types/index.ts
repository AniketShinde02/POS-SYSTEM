export type UserRole =
  | "admin"
  | "supervisor"
  | "manager"
  | "cashier"
  | "employee"
  | "staff";

export type Permission =
  | "dashboard.view"
  | "pos.view"
  | "pos.access"
  | "pos.checkout"
  | "pos.discount"
  | "pos.refund"
  | "products.view"
  | "products.manage"
  | "products.create"
  | "products.update"
  | "products.delete"
  | "products.import"
  | "categories.view"
  | "categories.manage"
  | "brands.view"
  | "brands.manage"
  | "inventory.view"
  | "inventory.manage"
  | "inventory.adjust"
  | "sales.view"
  | "sales.viewAll"
  | "sales.manage"
  | "sales.refund"
  | "customers.view"
  | "customers.manage"
  | "suppliers.view"
  | "suppliers.manage"
  | "purchases.view"
  | "purchases.manage"
  | "expenses.view"
  | "expenses.manage"
  | "reports.view"
  | "employees.view"
  | "employees.manage"
  | "employees.create"
  | "employees.update"
  | "employees.disable"
  | "roles.view"
  | "roles.manage"
  | "branches.view"
  | "branches.manage"
  | "settings.view"
  | "settings.manage";

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  quantity: number;
  discount: number;
  tax: number;
  image?: string;
  variantId?: string;
  variantName?: string;
}

export interface PaymentSplit {
  method: "cash" | "card" | "mobile" | "bank" | "credit" | "upi" | "other";
  amount: number;
  reference?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
