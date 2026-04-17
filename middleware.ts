import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { resolveAdminAccess } from "@/modules/auth/access";
import { ADMIN_SESSION_COOKIE, parseAdminSession } from "@/modules/auth/session";

export async function middleware(request: NextRequest) {
  const session = await parseAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  const outcome = resolveAdminAccess(request.nextUrl.pathname, session);

  if (outcome.type === "allow") {
    return NextResponse.next();
  }

  const redirectUrl = new URL(
    outcome.type === "redirect_login" ? "/auth/login" : "/auth/access-denied",
    request.url,
  );

  redirectUrl.searchParams.set("next", outcome.nextPath);

  if (outcome.type === "redirect_forbidden") {
    redirectUrl.searchParams.set("required", outcome.requiredRoles.join(","));
  }

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
