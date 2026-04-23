import { adminRouteDefinitions, buildForbiddenAccessPath, canAccessAdminRoute } from "@/modules/auth/access";
import type { AdminRole } from "@/modules/auth/types";

export type AdminNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  section: "core" | "operations" | "finance" | "governance";
  description: string;
  roles?: AdminRole[];
};

export type RoleAwareAdminNavItem = AdminNavItem & {
  accessible: boolean;
  destinationHref: string;
  restrictionNote: string | null;
};

export const adminNavItems: AdminNavItem[] = adminRouteDefinitions
  .filter((route) => route.showInNav)
  .map((route) => ({
    href: route.prefix,
    label: route.label,
    shortLabel: route.shortLabel,
    section: route.section,
    description: route.description,
    roles: route.roles,
  }));

function formatRoleLabel(role: AdminRole) {
  return role.replace("_", " ");
}

export function getRoleAwareAdminNavItems(role?: AdminRole | null): RoleAwareAdminNavItem[] {
  return adminNavItems.map((item) => {
    const accessible = canAccessAdminRoute(item.href, role);

    return {
      ...item,
      accessible,
      destinationHref: accessible ? item.href : buildForbiddenAccessPath(item.href, item.roles),
      restrictionNote: item.roles?.length ? `Requires ${item.roles.map(formatRoleLabel).join(" or ")}` : null,
    };
  });
}

export const adminShellHighlights = [
  "Global search, role-aware session controls, and alert rail",
  "Reusable queue widgets, status badges, and review-ready tables",
  "Partner-facing statuses stay aligned with the completed partner app",
  "A single shell for every operational, governance, and finance route",
];
