import type { AdminRole, AdminSession } from "@/modules/auth/types";

type AccessOutcome =
  | { type: "allow" }
  | { type: "redirect_login"; nextPath: string }
  | { type: "redirect_forbidden"; nextPath: string; requiredRoles: AdminRole[] };

type ProtectedRouteRule = {
  prefix: string;
  roles?: AdminRole[];
};

const protectedRouteRules: ProtectedRouteRule[] = [
  { prefix: "/" },
  { prefix: "/admin-users", roles: ["super_admin"] },
  { prefix: "/verification-review" },
  { prefix: "/partners" },
  { prefix: "/moderation" },
  { prefix: "/catalog-controls" },
  { prefix: "/api-clients" },
  { prefix: "/api-monitoring" },
  { prefix: "/commercial-controls", roles: ["finance", "super_admin"] },
  { prefix: "/notifications" },
  { prefix: "/reports" },
  { prefix: "/audit-compliance" },
  { prefix: "/system-config", roles: ["super_admin", "operations"] },
  { prefix: "/support-incidents" },
  { prefix: "/financial-ops", roles: ["finance", "super_admin"] },
  { prefix: "/payout-review", roles: ["finance", "super_admin"] },
  { prefix: "/auth/sessions" },
];

const publicPrefixes = ["/auth/login", "/auth/reset-password", "/auth/access-denied"];

function isSameOrNestedPath(pathname: string, prefix: string) {
  return prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicAdminPath(pathname: string) {
  return publicPrefixes.some((prefix) => isSameOrNestedPath(pathname, prefix));
}

export function sanitizeNextPath(nextPath?: string | null) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/";
  }

  if (nextPath.startsWith("/auth/login")) {
    return "/";
  }

  return nextPath;
}

export function resolveAdminAccess(pathname: string, session: AdminSession | null): AccessOutcome {
  if (isPublicAdminPath(pathname)) {
    return { type: "allow" };
  }

  const matchingRule = protectedRouteRules.find((rule) => isSameOrNestedPath(pathname, rule.prefix));

  if (!matchingRule) {
    return { type: "allow" };
  }

  if (!session) {
    return { type: "redirect_login", nextPath: pathname };
  }

  if (matchingRule.roles && !matchingRule.roles.includes(session.user.role)) {
    return {
      type: "redirect_forbidden",
      nextPath: pathname,
      requiredRoles: matchingRule.roles,
    };
  }

  return { type: "allow" };
}
