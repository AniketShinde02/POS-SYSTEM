"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth as clientAuth } from "@/lib/firebase/config";
import { signOut as fbSignOut } from "firebase/auth";
import type { UserRole } from "@/types";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  branchId?: string;
  image?: string;
}

export interface SessionData {
  user: SessionUser;
  expires: string;
}

export interface SessionContextType {
  data: SessionData | null;
  status: "loading" | "authenticated" | "unauthenticated";
  update: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  data: null,
  status: "loading",
  update: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user) {
          setSession({
            user: json.data.user,
            expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          });
          setStatus("authenticated");
          return;
        }
      }
      setSession(null);
      setStatus("unauthenticated");
    } catch {
      setSession(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return (
    <SessionContext.Provider value={{ data: session, status, update: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

export async function signOut({ callbackUrl = "/login" }: { callbackUrl?: string } = {}) {
  try {
    await fbSignOut(clientAuth);
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch (err) {
    console.error("Sign out error:", err);
  } finally {
    window.location.href = callbackUrl;
  }
}
