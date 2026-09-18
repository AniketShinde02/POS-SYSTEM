"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "@/components/providers/session-provider";
import { Moon, Sun, Menu, User, LogOut, Settings as SettingsIcon } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "A";

  const handleThemeToggle = () => {
    if (theme === "system") {
      setTheme(isDark ? "light" : "dark");
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 text-zinc-100 lg:px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-bold tracking-tight text-white">{title}</h1>
      </div>

      <div className="relative flex items-center gap-3" ref={dropdownRef}>
        <Badge
          variant="outline"
          className="uppercase border-[#E85002]/40 bg-[#E85002]/10 text-[#E85002] font-bold text-[10px] tracking-wider shadow-sm shadow-[#E85002]/10"
        >
          {session?.user?.role ? session.user.role.toUpperCase() : "LOGGED IN"}
        </Badge>
        {session?.user?.name && (
          <span className="hidden text-xs font-semibold text-zinc-300 sm:inline truncate max-w-[140px]">
            {session.user.name}
          </span>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={handleThemeToggle}
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <button
          type="button"
          onClick={() => setDropdownOpen((open) => !open)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E85002] text-xs font-black text-white shadow-sm shadow-[#E85002]/30 transition hover:scale-105"
          aria-label="Open user menu"
        >
          {session?.user?.name ? initials : <User className="h-4 w-4" />}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-2xl shadow-black/80">
            <div className="space-y-1 p-3 text-xs text-zinc-300 border-b border-zinc-800/80">
              <p className="font-bold text-white">
                {session?.user?.name ?? "Terminal User"}
              </p>
              <p className="truncate text-[11px] text-zinc-400 font-mono">
                {session?.user?.email ?? "admin@pos.local"}
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                onClick={() => setDropdownOpen(false)}
              >
                <SettingsIcon className="h-3.5 w-3.5 text-zinc-400" />
                Store Settings
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-400 transition hover:bg-red-950/40"
                onClick={async () => {
                  setDropdownOpen(false);
                  await signOut();
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
