"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, LogOut, LayoutDashboard, Wifi, WifiOff, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hasPermission } from "@/lib/permissions";
import type { UserRole } from "@/types";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
}

interface WorkspaceShellProps {
  children: React.ReactNode;
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Monitor online/offline status
    setIsOnline(typeof window !== "undefined" ? window.navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Fetch active session user profile
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.user) {
          setUser(json.data.user);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const isAdminOrSupervisor = user
    ? user.role === "admin" ||
      user.role === "supervisor" ||
      hasPermission(user.role, "dashboard.view")
    : false;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 antialiased selection:bg-[#E85002] selection:text-white">
      {/* Top Workspace Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md px-3 py-2.5 sm:px-4 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          {/* Brand & Store Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#E85002] to-[#C10801] text-white shadow-md shadow-[#E85002]/30">
              <Store className="h-5 w-5" />
            </div>
            <div className="truncate">
              <span className="block truncate text-sm font-bold tracking-tight text-white sm:text-base">
                RetailPOS Workspace
              </span>
              <span className="hidden truncate text-[11px] font-medium text-zinc-400 sm:block">
                Flagship Terminal
              </span>
            </div>
          </div>

          {/* User Info & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Online/Offline Status Indicator */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px]">
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3 text-emerald-500" />
                  <span className="hidden sm:inline text-emerald-400 font-medium">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-amber-500 animate-pulse" />
                  <span className="hidden sm:inline text-amber-400 font-medium">Offline</span>
                </>
              )}
            </div>

            {/* Employee Profile Info */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 border-l border-zinc-800 pl-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-700">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-zinc-100 max-w-[120px] truncate">{user.name}</p>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize bg-[#E85002]/10 text-[#E85002] border-[#E85002]/30">
                    {user.role}
                  </Badge>
                </div>
              </div>
            )}

            {/* Admin Switcher Button (if permitted) */}
            {isAdminOrSupervisor && (
              <Button asChild variant="outline" size="sm" className="hidden md:flex border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white h-8 text-xs gap-1.5">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-3.5 w-3.5 text-[#E85002]" />
                  Admin Panel
                </Link>
              </Button>
            )}

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 px-2 sm:px-3 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-950/40 border border-zinc-800/60"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5 sm:mr-1.5 text-zinc-400 hover:text-red-400" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
