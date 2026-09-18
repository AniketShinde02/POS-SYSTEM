import { cookies, headers } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { hasPermission } from "@/lib/permissions";
import type { Permission, UserRole } from "@/types";

export interface AppSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    tenantId: string;
    branchId?: string;
    employeeId?: string;
    permissions?: string[];
  };
  expires: string;
}

export async function getSession(): Promise<AppSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("firebase_session")?.value;

    let uid: string | null = null;
    let email: string = "";
    let exp: number = 0;
    let tokenTenant: string = "default";

    if (sessionCookie) {
      // STRICT: verifySessionCookie with checkRevoked=true. No dev_session bypass.
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      uid = decoded.uid;
      email = decoded.email || "";
      exp = decoded.exp;
      tokenTenant = (decoded.tenantId as string) || "default";
    } else {
      // Check Authorization header for Bearer token (API clients)
      const reqHeaders = await headers();
      const authHeader = reqHeaders.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const idToken = authHeader.substring(7);
        const decoded = await adminAuth.verifyIdToken(idToken);
        uid = decoded.uid;
        email = decoded.email || "";
        exp = decoded.exp;
        tokenTenant = (decoded.tenantId as string) || "default";
      }
    }

    if (!uid) {
      return null;
    }

    // STRICT: Always resolve role/permissions from Firestore. Never from token claims alone.
    const userDocRef = adminDb
      .collection("tenants")
      .doc(tokenTenant)
      .collection("users")
      .doc(uid);

    const userSnap = await userDocRef.get();
    if (!userSnap.exists) {
      // No Firestore profile — deny access
      return null;
    }

    const userData = userSnap.data()!;
    if (userData.isActive === false || userData.status === "inactive" || userData.status === "disabled") {
      return null;
    }

    const role: UserRole = (userData.role as UserRole) || "cashier";
    const name = userData.name || (email ? email.split("@")[0] : "User");
    const branchId = userData.branchId as string | undefined;
    const employeeId = userData.employeeId as string | undefined;
    const permissions = (userData.permissions as string[] | undefined) || [];

    return {
      user: {
        id: uid,
        email,
        name,
        role,
        tenantId: tokenTenant,
        branchId,
        employeeId,
        permissions,
      },
      expires: new Date((exp || Date.now() / 1000 + 3600) * 1000).toISOString(),
    };
  } catch (error) {
    console.error("[AuthHelper Error]:", error);
    return null;
  }
}

export async function requireAuth(): Promise<AppSession> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requirePermission(permission: Permission): Promise<AppSession> {
  const session = await requireAuth();
  const allowed = hasPermission(session.user.role, permission, session.user.permissions as Permission[]);
  if (!allowed) {
    throw new Error("Forbidden");
  }
  return session;
}
