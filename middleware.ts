import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isPublicAdminPath } from "@/modules/auth/access";
import { ADMIN_SESSION_COOKIE, parseAdminSession } from "@/modules/auth/session";

// Middleware only checks authentication (session exists).
// Role-based access is enforced by requireAdminRouteAccess in each page server component,
// which re-fetches the current user from the backend on every request.
// This avoids stale-role issues where a role change made after login would be
// invisible to the middleware's locally-parsed JWT cookie.
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicAdminPath(pathname)) {
    return NextResponse.next();
  }

  const session = await parseAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  if (!session) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Keep middleware on page routes only; API routes should return JSON auth errors,
  // not HTML redirects to /auth/login.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
