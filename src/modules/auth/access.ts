import type { AdminRole, AdminSession } from "@/modules/auth/types";

export type AdminRouteDefinition = {
  prefix: string;
  label: string;
  shortLabel: string;
  section: "core" | "operations" | "finance" | "governance";
  description: string;
  roles?: AdminRole[];
  showInNav?: boolean;
};

type AccessOutcome =
  | { type: "allow" }
  | { type: "redirect_login"; nextPath: string }
  | { type: "redirect_forbidden"; nextPath: string; requiredRoles: AdminRole[] };

export const adminRouteDefinitions: AdminRouteDefinition[] = [
  {
    prefix: "/",
    label: "Operations Overview",
    shortLabel: "Overview",
    section: "core",
    description: "Pulse on approvals, queues, alerts, and recent platform movement.",
    showInNav: true,
  },
  {
    prefix: "/admin-users",
    label: "Admin Users",
    shortLabel: "Admins",
    section: "core",
    description: "Invite admins, govern roles, and review MFA plus session access context.",
    roles: ["super_admin"],
    showInNav: true,
  },
  {
    prefix: "/verification-review",
    label: "Verification Review",
    shortLabel: "Verification",
    section: "operations",
    description: "Review KYC/KYB submissions and apply verification decisions with linked lifecycle controls.",
    showInNav: true,
  },
  {
    prefix: "/partners",
    label: "Partner Accounts",
    shortLabel: "Partners",
    section: "operations",
    description: "Search, inspect, lock, restore, and supervise partner records.",
    showInNav: true,
  },
  {
    prefix: "/moderation",
    label: "Listing Moderation",
    shortLabel: "Moderation",
    section: "operations",
    description: "Approve, reject, and correct stays and transfers.",
    showInNav: true,
  },
  {
    prefix: "/catalog-controls",
    label: "Catalog Controls",
    shortLabel: "Catalog",
    section: "operations",
    description: "Resolve duplicates, standardize taxonomy, and enforce content quality.",
    showInNav: true,
  },
  {
    prefix: "/api-clients",
    label: "API Clients",
    shortLabel: "Clients",
    section: "governance",
    description: "Approve clients, issue keys, and manage plans.",
    showInNav: true,
  },
  {
    prefix: "/api-monitoring",
    label: "API Monitoring",
    shortLabel: "Monitoring",
    section: "governance",
    description: "Watch traffic, errors, latency, and usage anomalies.",
    showInNav: true,
  },
  {
    prefix: "/commercial-controls",
    label: "Commercial Controls",
    shortLabel: "Commercial",
    section: "finance",
    description: "Set commissions, service fees, and manual adjustments.",
    roles: ["finance", "super_admin"],
    showInNav: true,
  },
  {
    prefix: "/notifications",
    label: "Partner Messaging",
    shortLabel: "Messaging",
    section: "operations",
    description: "Broadcast operational messages and transactional updates.",
    roles: ["super_admin", "operations", "support", "finance"],
    showInNav: true,
  },
  {
    prefix: "/reports",
    label: "Reports & Analytics",
    shortLabel: "Reports",
    section: "governance",
    description: "Track growth, supply, conversions, and exports.",
    showInNav: true,
  },
  {
    prefix: "/audit-compliance",
    label: "Audit & Compliance",
    shortLabel: "Audit",
    section: "governance",
    description: "Inspect critical action trails and export compliance evidence.",
    roles: ["super_admin", "operations", "finance", "reviewer", "support"],
    showInNav: true,
  },
  {
    prefix: "/system-config",
    label: "System Config",
    shortLabel: "Config",
    section: "governance",
    description: "Manage feature toggles, templates, and platform master data.",
    roles: ["super_admin", "operations"],
    showInNav: true,
  },
  {
    prefix: "/support-incidents",
    label: "Support & Incidents",
    shortLabel: "Support",
    section: "operations",
    description: "Track incidents, escalations, and safe diagnostics.",
    showInNav: true,
  },
  {
    prefix: "/financial-ops",
    label: "Financial Operations",
    shortLabel: "Finance",
    section: "finance",
    description: "Supervise partner settlement states, admin settlement runs, refunds, and reconciliations.",
    roles: ["finance", "super_admin"],
    showInNav: true,
  },
  {
    prefix: "/payout-review",
    label: "Payout Review",
    shortLabel: "Payouts",
    section: "finance",
    description: "Review payout methods, masking controls, holds, and payout risk signals.",
    roles: ["finance", "super_admin"],
    showInNav: true,
  },
  {
    prefix: "/auth/sessions",
    label: "Session Access",
    shortLabel: "Sessions",
    section: "core",
    description: "Inspect the authenticated admin session and backend session inventory.",
  },
];

const publicPrefixes = ["/auth/login", "/auth/reset-password", "/auth/access-denied"];

function isSameOrNestedPath(pathname: string, prefix: string) {
  return prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicAdminPath(pathname: string) {
  return publicPrefixes.some((prefix) => isSameOrNestedPath(pathname, prefix));
}

export function getAdminRouteDefinition(pathname: string) {
  return adminRouteDefinitions.find((route) => isSameOrNestedPath(pathname, route.prefix)) ?? null;
}

export function canAccessAdminRoute(pathname: string, role?: AdminRole | null) {
  const route = getAdminRouteDefinition(pathname);

  if (!route) {
    return true;
  }

  if (!route.roles) {
    return true;
  }

  return role ? route.roles.includes(role) : false;
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

export function buildForbiddenAccessPath(pathname: string, requiredRoles?: AdminRole[]) {
  const sanitizedPath = sanitizeNextPath(pathname);
  const params = new URLSearchParams({ next: sanitizedPath });
  const roles = requiredRoles ?? getAdminRouteDefinition(sanitizedPath)?.roles;

  if (roles?.length) {
    params.set("required", roles.join(","));
  }

  return `/auth/access-denied?${params.toString()}`;
}

export function resolveAdminAccess(pathname: string, session: AdminSession | null): AccessOutcome {
  if (isPublicAdminPath(pathname)) {
    return { type: "allow" };
  }

  const matchingRule = getAdminRouteDefinition(pathname);

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
