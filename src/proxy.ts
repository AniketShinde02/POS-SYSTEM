import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/manifest.json",
  "/sw.js",
  "/icons",
];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const sessionCookie = req.cookies.get("firebase_session")?.value;

  // Public routes
  if (isPublic) {
    if (pathname === "/login" && sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Not authenticated
  if (!sessionCookie) {
    // If it's an API route, return 401 JSON instead of HTML redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|firebase-messaging-sw.js).*)",
  ],
};