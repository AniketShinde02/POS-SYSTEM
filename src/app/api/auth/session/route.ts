import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { UserRole } from "@/types";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME = "firebase_session";
const EXPIRES_IN = 14 * 24 * 60 * 60 * 1000; // 14 days

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "ID token is required" },
        { status: 400 }
      );
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const emailStr = decodedToken.email || "";

    // Canonical tenant resolution — always "default" unless the JWT carries a tenantId claim
    const tenantId = (decodedToken.tenantId as string) || "default";

    // STRICT: Resolve role from Firestore. No fallback to "admin". No silent swallow.
    const userDocRef = adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("users")
      .doc(uid);

    const userSnap = await userDocRef.get();

    let role: UserRole;
    let name: string;

    if (!userSnap.exists) {
      // User has no Firestore profile under this tenant UID.
      // Check if this email was pre-registered by an admin (Google sign-in UID linking).
      const preRegSnap = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("users")
        .where("email", "==", emailStr)
        .limit(1)
        .get();

      if (!preRegSnap.empty) {
        const preData = preRegSnap.docs[0].data();

        // Enforce active check before linking
        if (preData.status === "disabled" || preData.isActive === false) {
          return NextResponse.json(
            { success: false, error: "Your account has been deactivated. Contact your manager." },
            { status: 403 }
          );
        }

        role = (preData.role as UserRole) || "cashier";
        name = preData.name || emailStr.split("@")[0];

        // Link the real Firebase Auth UID to the pre-registered email profile
        await userDocRef.set(
          {
            ...preData,
            uid,
            lastLoginAt: new Date().toISOString(),
          },
          { merge: false }
        );
      } else {
        // Unknown account — no profile, no pre-registration — DENY
        return NextResponse.json(
          {
            success: false,
            error: "Your account is not authorized for this system. Contact your administrator.",
          },
          { status: 403 }
        );
      }
    } else {
      const data = userSnap.data()!;

      if (data.status === "disabled" || data.isActive === false) {
        return NextResponse.json(
          { success: false, error: "Your account has been deactivated. Contact your manager." },
          { status: 403 }
        );
      }

      role = (data.role as UserRole) || "cashier";
      name = data.name || emailStr.split("@")[0];

      // Update last login timestamp
      await userDocRef.update({ lastLoginAt: new Date().toISOString() });
    }

    // Mint Firebase session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: EXPIRES_IN,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: EXPIRES_IN / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: uid,
          email: emailStr,
          name,
          role,
          tenantId,
        },
      },
    });
  } catch (error) {
    console.error("[Auth Session POST Error]:", error);
    const msg = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 401 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    // Verify session cookie (checkRevoked = true enforces revocation on logout)
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const tenantId = (decoded.tenantId as string) || "default";

    // STRICT: Always read role from Firestore. No token-claim fallback.
    const userDocRef = adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("users")
      .doc(decoded.uid);

    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ success: false, user: null }, { status: 403 });
    }

    const userData = userSnap.data()!;

    if (userData.isActive === false || userData.status === "inactive" || userData.status === "disabled") {
      return NextResponse.json({ success: false, user: null }, { status: 403 });
    }

    const role = (userData.role as UserRole) || "cashier";
    const name = userData.name || decoded.email?.split("@")[0] || "User";
    const avatarUrl = (userData.avatarUrl as string) || null;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: decoded.uid,
          email: decoded.email,
          name,
          role,
          tenantId,
          image: avatarUrl,
        },
      },
    });
  } catch {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Logout failed" },
      { status: 500 }
    );
  }
}
