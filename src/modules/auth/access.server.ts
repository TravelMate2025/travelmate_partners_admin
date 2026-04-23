import { redirect } from "next/navigation";

import { buildForbiddenAccessPath, resolveAdminAccess } from "@/modules/auth/access";
import type { AdminSession } from "@/modules/auth/types";

export function requireAdminRouteAccess(pathname: string, session: AdminSession | null): asserts session is AdminSession {
  const outcome = resolveAdminAccess(pathname, session);

  if (outcome.type === "allow") {
    return;
  }

  if (outcome.type === "redirect_login") {
    const params = new URLSearchParams({ next: outcome.nextPath });
    redirect(`/auth/login?${params.toString()}`);
  }

  redirect(buildForbiddenAccessPath(outcome.nextPath, outcome.requiredRoles));
}
