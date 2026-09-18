"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/providers/session-provider";
import { ROUTE_PERMISSIONS, hasPermission } from "@/lib/permissions";
import type { Permission } from "@/types";
import { ShieldAlert, ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const userRole = (session?.user?.role || "admin").toLowerCase();
  
  // Find matching route permission
  const matchingRoute = Object.keys(ROUTE_PERMISSIONS).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const requiredPermission = matchingRoute ? ROUTE_PERMISSIONS[matchingRoute] : undefined;

  const isAllowed =
    !requiredPermission ||
    hasPermission(
      userRole,
      requiredPermission,
      (session?.user as { permissions?: Permission[] })?.permissions
    );

  return (
    <div className="flex min-h-screen bg-zinc-900 text-zinc-100">
      {/* Fixed Desktop Sidebar Container - Zero Hydration Shift */}
      <div className="hidden lg:block w-[224px] min-w-[224px] max-w-[224px] shrink-0 h-screen sticky top-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Container */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[224px] shrink-0 transform transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* Flexible Main Content Area */}
      <div className="flex flex-1 min-w-0 flex-col">
        <Header title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 min-w-0 overflow-auto p-4 lg:p-6">
          {status !== "loading" && !isAllowed ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Access Denied
              </h2>
              <p className="mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
                Your account role (<span className="font-semibold uppercase text-zinc-900 dark:text-zinc-200">{userRole}</span>) does not have permission to access the <span className="font-semibold text-zinc-900 dark:text-zinc-200">{title}</span> module.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button asChild variant="brandGradient">
                  <Link href="/pos">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Open POS Terminal
                  </Link>
                </Button>
                {hasPermission(userRole, "dashboard.view") && (
                  <Button asChild variant="outline">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
