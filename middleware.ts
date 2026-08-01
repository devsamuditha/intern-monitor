import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/src/lib/jwt";

export const runtime = "nodejs";

const authFreePages = new Set(["/login"]);

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' ws: wss:; connect-src 'self' ws: wss: https://*.supabase.co https://*.pooler.supabase.com; img-src 'self' data: https: https://*.supabase.co https://*.pooler.supabase.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' blob:;"
  );
  response.headers.set(
    "Access-Control-Allow-Origin",
    process.env.APP_URL || "*"
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  const { pathname } = request.nextUrl;

  // API routes: auth is enforced per-route via withAuth (returns JSON 401, not redirects)
  if (pathname.startsWith("/api/")) {
    return response;
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? verifySession(token) : null;
  const hasValidSession = !!payload;

  // Landing page: route based on auth state
  if (pathname === "/") {
    if (hasValidSession && !payload!.mustChangePassword) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (hasValidSession && payload!.mustChangePassword) {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Login page: authenticated users with a fresh password go straight to the dashboard
  if (authFreePages.has(pathname)) {
    if (hasValidSession && !payload!.mustChangePassword) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // All remaining page routes require a valid session
  if (!hasValidSession || !payload) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // /change-password is reachable for authenticated users (even those forced to reset)
  if (pathname === "/change-password") {
    return response;
  }

  // Force password change on first login for every other protected page
  if (payload.mustChangePassword) {
    const url = request.nextUrl.clone();
    url.pathname = "/change-password";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
