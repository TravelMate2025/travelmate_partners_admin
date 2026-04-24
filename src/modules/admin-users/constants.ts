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

export const adminRolePermissionProfiles = {
  super_admin: {
    headline: "Full governance authority across the admin platform.",
    grants: [
      "Can invite, activate, deactivate, delete inactive admins, and assign roles.",
      "Can access every protected admin surface, including finance-controlled routes.",
    ],
    limits: [
      "Sensitive grants into finance and super admin still require explicit confirmation.",
      "At least one active super admin must remain available.",
    ],
  },
  operations: {
    headline: "Operational control for day-to-day back-office queues.",
    grants: [
      "Can work across verification, partner operations, moderation, and support routes.",
      "Can review admin context when allowed by super-admin policy.",
    ],
    limits: [
      "Cannot manage admin lifecycle actions or assign admin roles.",
      "Finance and payout-governed routes remain restricted.",
    ],
  },
  reviewer: {
    headline: "Review-focused access with evidence visibility and limited controls.",
    grants: [
      "Can inspect governance evidence and review surfaces.",
      "Can access supporting context needed for compliance and verification reviews.",
    ],
    limits: [
      "Cannot perform lifecycle overrides, admin role changes, or money-movement actions.",
      "Finance-only surfaces remain unavailable.",
    ],
  },
  support: {
    headline: "Support and incident response access without payout authority.",
    grants: [
      "Can work support queues, admin notifications, and incident coordination surfaces.",
      "Can use operational context needed for customer and partner support.",
    ],
    limits: [
      "Cannot perform admin governance actions or assign roles.",
      "Sensitive payout and finance controls remain blocked.",
    ],
  },
  finance: {
    headline: "Finance-controlled access for payout and settlement oversight.",
    grants: [
      "Can access financial operations, payout review, and commercial controls.",
      "Can view finance-governed payout details under audit coverage.",
    ],
    limits: [
      "Cannot manage admin lifecycle actions or assign roles unless also a super admin.",
      "Sensitive finance access should be granted only with explicit super-admin confirmation.",
    ],
  },
} as const satisfies Record<
  AdminRole,
  { headline: string; grants: readonly string[]; limits: readonly string[] }
>;

export function formatAdminRoleLabel(role: AdminRole) {
  return role.replace("_", " ");
}
