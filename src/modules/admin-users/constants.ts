import type { AdminRole } from "@/modules/auth/types";

export const adminTeamOptions = [
  "Platform Leadership",
  "Security Governance",
  "Platform Ops",
  "Verification Review",
  "Partner Support",
  "Finance Operations",
] as const;

export type AdminTeam = (typeof adminTeamOptions)[number];

export const adminRoleOptions = [
  "super_admin",
  "operations",
  "reviewer",
  "support",
  "finance",
] as const satisfies readonly AdminRole[];

export function formatAdminRoleLabel(role: AdminRole) {
  return role.replace("_", " ");
}
