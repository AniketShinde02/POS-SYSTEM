"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/providers/session-provider";

export function PublicHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 lg:px-8">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E85002] to-[#C10801] text-white shadow-md shadow-[#E85002]/30 group-hover:scale-105 transition-transform">
            <Store className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold leading-none tracking-wide text-white">RetailPOS</span>
            <span className="text-[10px] font-semibold text-[#E85002] tracking-wider uppercase">Storefront 2026</span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-300">
          <Link
            href="/"
            className={`transition-colors hover:text-[#E85002] ${pathname === "/" ? "text-[#E85002] font-bold" : ""}`}
          >
            Home
          </Link>
          <Link
            href="/products"
            className={`transition-colors hover:text-[#E85002] ${pathname.startsWith("/products") ? "text-[#E85002] font-bold" : ""}`}
          >
            Products
          </Link>
          <Link
            href="/about"
            className={`transition-colors hover:text-[#E85002] ${pathname === "/about" ? "text-[#E85002] font-bold" : ""}`}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={`transition-colors hover:text-[#E85002] ${pathname === "/contact" ? "text-[#E85002] font-bold" : ""}`}
          >
            Contact
          </Link>
        </nav>

        {/* Right CTA / Auth Button */}
        <div className="flex items-center gap-3">
          {session?.user ? (
            <Button asChild size="sm" variant="brandGradient">
              <Link href={session.user.role === "cashier" ? "/pos" : "/dashboard"}>
                <User className="mr-1.5 h-4 w-4" />
                {session.user.role === "cashier" ? "Open POS Workspace" : "Admin Dashboard"}
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="brandGradient">
              <Link href="/login">
                <User className="mr-1.5 h-4 w-4" />
                Staff Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
