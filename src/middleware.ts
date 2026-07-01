import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public assets
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const session = request.cookies.get("better-auth_session_token")?.value;
  const isAuthenticated = !!session;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !publicRoutes.includes(pathname) && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
