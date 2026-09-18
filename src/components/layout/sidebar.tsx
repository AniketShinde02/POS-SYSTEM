"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Tags,
  Warehouse,
  Users,
  ShoppingBag,
  Truck,
  Wallet,
  BarChart3,
  UserCog,
  Building2,
  Settings,
  Store,
  Shield,
  X,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/providers/session-provider";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: ("admin" | "supervisor" | "manager" | "cashier" | "employee" | "staff")[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["admin", "supervisor", "manager"] },
    ],
  },
  {
    title: "Sell",
    items: [
      { href: "/workspace", label: "Cashier Workspace", icon: Store },
      { href: "/pos", label: "POS Terminal", icon: ShoppingCart },
      { href: "/sales", label: "Sales History", icon: Receipt },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/dashboard/products", label: "Products", icon: Package, roles: ["admin", "supervisor", "manager"] },
      { href: "/categories", label: "Categories", icon: Tags, roles: ["admin", "supervisor", "manager"] },
      { href: "/inventory", label: "Inventory", icon: Warehouse, roles: ["admin", "supervisor", "manager"] },
    ],
  },
  {
    title: "Customers",
    items: [
      { href: "/customers", label: "Customers", icon: Users },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/purchases", label: "Purchases", icon: ShoppingBag, roles: ["admin", "supervisor", "manager"] },
      { href: "/suppliers", label: "Suppliers", icon: Truck, roles: ["admin", "supervisor", "manager"] },
      { href: "/expenses", label: "Expenses", icon: Wallet, roles: ["admin", "supervisor", "manager"] },
    ],
  },
  {
    title: "Analytics",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3, roles: ["admin", "supervisor", "manager"] },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/employees", label: "Employees", icon: UserCog, roles: ["admin"] },
      { href: "/roles", label: "Roles & Permissions", icon: Shield, roles: ["admin"] },
      { href: "/branches", label: "Branches", icon: Building2, roles: ["admin"] },
      { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
    ],
  },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const rawRole = (session?.user?.role || "admin").toLowerCase();
  const userRole = rawRole as "admin" | "supervisor" | "manager" | "cashier" | "employee" | "staff";

  return (
    <aside className="flex h-full w-[224px] min-w-[224px] max-w-[224px] shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950 text-zinc-100 shadow-2xl">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-zinc-800/80 bg-zinc-950/80">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight text-white group min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#E85002] to-[#C10801] text-white shadow-md shadow-[#E85002]/30 group-hover:scale-105 transition-transform">
            <Store className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-extrabold leading-none tracking-wide text-white truncate">RetailPOS</span>
            <span className="text-[9px] font-semibold text-[#E85002] tracking-wider uppercase truncate">Enterprise 2026</span>
          </div>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden shrink-0"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4 text-xs min-w-0">
        {navSections.map((section, sIdx) => {
          const visibleItems = section.items.filter((item) => {
            if (!item.roles) return true;
            if (userRole === "admin") return true;
            if (item.roles.includes(userRole)) return true;
            if (userRole === "supervisor" && item.roles.includes("manager")) return true;
            if (userRole === "employee" && item.roles.includes("cashier")) return true;
            return false;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title || `sec-${sIdx}`} className="space-y-1">
              {section.title && (
                <div className="px-2.5 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 truncate">
                  {section.title}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-150",
                      active
                        ? "bg-[#E85002]/15 text-[#E85002] border-l-2 border-[#E85002] font-bold shadow-sm shadow-[#E85002]/10"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active
                          ? "text-[#E85002]"
                          : "text-zinc-500 group-hover:text-zinc-300"
                      )}
                    />
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer / User Profile summary */}
      <div className="border-t border-zinc-800/80 p-3.5 bg-zinc-950/60">
        <div className="flex items-center gap-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 p-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E85002] text-xs font-black text-white shadow-sm shadow-[#E85002]/40">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-xs font-bold text-white">
              {session?.user?.name || "Admin"}
            </p>
            <p className="truncate text-[10px] text-zinc-400 capitalize font-medium">
              {userRole} • {session?.user?.tenantId || "Store"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
