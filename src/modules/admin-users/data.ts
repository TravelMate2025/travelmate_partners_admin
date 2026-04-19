import type { AdminRole } from "@/modules/auth/types";
import type { AdminAccessRecord, ManagedMfaState } from "@/modules/admin-users/types";

function buildPolicies(role: AdminRole) {
  const base = {
    super_admin: [
      { id: "pol-1", title: "Platform governance", detail: "Access to every protected surface and privileged admin control.", tone: "success" as const },
      { id: "pol-2", title: "Sensitive grants", detail: "Role changes into finance or super_admin require explicit confirmation.", tone: "warning" as const },
    ],
    operations: [
      { id: "pol-3", title: "Operations routes", detail: "Verification, partner, moderation, support, and notifications routes are available.", tone: "info" as const },
      { id: "pol-4", title: "Restricted finance controls", detail: "Finance-only settlement and payout routes remain blocked.", tone: "warning" as const },
    ],
    reviewer: [
      { id: "pol-5", title: "Review surfaces", detail: "Reviewer can inspect verification and selected governance evidence without money-movement controls.", tone: "info" as const },
      { id: "pol-6", title: "Read-only partner context", detail: "Partner and finance linked context is visible where policy allows.", tone: "neutral" as const },
    ],
    support: [
      { id: "pol-7", title: "Support operations", detail: "Support and notifications routes are available with incident coordination actions.", tone: "info" as const },
      { id: "pol-8", title: "No payout visibility escalation", detail: "Sensitive payout details and finance controls remain restricted.", tone: "warning" as const },
    ],
    finance: [
      { id: "pol-9", title: "Finance operations", detail: "Financial operations, commercial controls, and payout review routes are enabled.", tone: "success" as const },
      { id: "pol-10", title: "Sensitive financial data", detail: "Unmasked payout details are visible only on finance-governed routes.", tone: "warning" as const },
    ],
  } satisfies Record<AdminRole, AdminAccessRecord["permissionPolicies"]>;

  return base[role];
}

function buildSessions(baseId: string, risk: "normal" | "elevated") {
  return [
    {
      id: `${baseId}-sess-1`,
      deviceLabel: "Primary admin workstation",
      locationLabel: "Lagos HQ",
      lastSeenAt: "2026-04-19T08:10:00.000Z",
      risk,
    },
    {
      id: `${baseId}-sess-2`,
      deviceLabel: "Trusted browser session",
      locationLabel: "VPN · London gateway",
      lastSeenAt: "2026-04-18T17:45:00.000Z",
      risk: "normal" as const,
    },
  ];
}

function makeRecord(input: {
  id: string;
  name: string;
  email: string;
  team: string;
  role: AdminRole;
  status: AdminAccessRecord["status"];
  inviteState: AdminAccessRecord["inviteState"];
  requiresMfa: boolean;
  mfaState: ManagedMfaState;
  recentRisk: AdminAccessRecord["recentRisk"];
  reviewOwner: string;
  operationalNote: string;
  invitedBy?: string;
  invitedAt?: string;
  lastSignInAt?: string;
  lastRoleChangedAt?: string;
  pendingApprovalReason?: string;
}) {
  return {
    ...input,
    sensitiveGrantProtected: input.role === "finance" || input.role === "super_admin",
    lastAccessedAt: input.lastSignInAt ?? input.invitedAt ?? "2026-04-18T09:00:00.000Z",
    permissionPolicies: buildPolicies(input.role),
    recentSessions: input.status === "pending_invite" || input.status === "revoked" ? [] : buildSessions(input.id, input.recentRisk),
    activity: [
      {
        id: `${input.id}-activity-1`,
        title: input.status === "pending_invite" ? "Invite sent" : input.status === "inactive" ? "Account deactivated" : "Access policy reviewed",
        detail:
          input.status === "pending_invite"
            ? `${input.invitedBy ?? "Amina Bello"} invited this admin account and access is still pending acceptance.`
            : input.status === "inactive"
              ? "Super admin deactivated this account after the access review noted stale ownership."
              : "Current role policies, MFA state, and recent session context were reviewed for access governance.",
        time: (input.invitedAt ?? input.lastSignInAt ?? "2026-04-18T09:00:00.000Z").slice(11, 16) + " UTC",
        tone: input.status === "inactive" ? "warning" : "info",
      },
    ],
  } satisfies AdminAccessRecord;
}

export function getAdminAccessRecords(): AdminAccessRecord[] {
  return [
    makeRecord({
      id: "adm-001",
      name: "Amina Bello",
      email: "superadmin@travelmate.test",
      team: "Platform Leadership",
      role: "super_admin",
      status: "active",
      inviteState: "accepted",
      requiresMfa: true,
      mfaState: "verified",
      recentRisk: "normal",
      reviewOwner: "Amina Bello",
      operationalNote: "Primary super admin account with approval authority for sensitive grants.",
      invitedBy: "Founding setup",
      invitedAt: "2026-03-01T08:00:00.000Z",
      lastSignInAt: "2026-04-19T08:10:00.000Z",
      lastRoleChangedAt: "2026-03-01T08:00:00.000Z",
    }),
    makeRecord({
      id: "adm-006",
      name: "Grace Holloway",
      email: "grace.holloway@travelmate.test",
      team: "Security Governance",
      role: "super_admin",
      status: "active",
      inviteState: "accepted",
      requiresMfa: true,
      mfaState: "verified",
      recentRisk: "normal",
      reviewOwner: "Amina Bello",
      operationalNote: "Secondary super admin retained so sensitive governance is never single-owner.",
      invitedBy: "Amina Bello",
      invitedAt: "2026-03-11T10:30:00.000Z",
      lastSignInAt: "2026-04-18T16:40:00.000Z",
      lastRoleChangedAt: "2026-03-11T10:30:00.000Z",
    }),
    makeRecord({
      id: "adm-002",
      name: "David Cole",
      email: "ops@travelmate.test",
      team: "Operations",
      role: "operations",
      status: "active",
      inviteState: "accepted",
      requiresMfa: true,
      mfaState: "verified",
      recentRisk: "normal",
      reviewOwner: "Amina Bello",
      operationalNote: "Operations lead with active queue ownership across verification and partner controls.",
      invitedBy: "Amina Bello",
      invitedAt: "2026-03-04T09:20:00.000Z",
      lastSignInAt: "2026-04-19T07:45:00.000Z",
      lastRoleChangedAt: "2026-03-04T09:20:00.000Z",
    }),
    makeRecord({
      id: "adm-003",
      name: "Ifeoma Okoye",
      email: "reviewer@travelmate.test",
      team: "Verification Review",
      role: "reviewer",
      status: "active",
      inviteState: "accepted",
      requiresMfa: true,
      mfaState: "verified",
      recentRisk: "normal",
      reviewOwner: "Amina Bello",
      operationalNote: "Reviewer account remains compliant and limited to review surfaces.",
      invitedBy: "Amina Bello",
      invitedAt: "2026-03-06T11:00:00.000Z",
      lastSignInAt: "2026-04-18T13:50:00.000Z",
      lastRoleChangedAt: "2026-03-06T11:00:00.000Z",
    }),
    makeRecord({
      id: "adm-004",
      name: "Maya Singh",
      email: "support@travelmate.test",
      team: "Partner Support",
      role: "support",
      status: "inactive",
      inviteState: "accepted",
      requiresMfa: false,
      mfaState: "disabled",
      recentRisk: "elevated",
      reviewOwner: "Amina Bello",
      operationalNote: "Support account was paused pending MFA uplift and session hygiene review.",
      invitedBy: "Amina Bello",
      invitedAt: "2026-03-08T08:30:00.000Z",
      lastSignInAt: "2026-04-16T12:25:00.000Z",
      lastRoleChangedAt: "2026-03-08T08:30:00.000Z",
    }),
    makeRecord({
      id: "adm-005",
      name: "Tunde Adebayo",
      email: "finance@travelmate.test",
      team: "Finance Operations",
      role: "finance",
      status: "active",
      inviteState: "accepted",
      requiresMfa: true,
      mfaState: "verified",
      recentRisk: "normal",
      reviewOwner: "Amina Bello",
      operationalNote: "Finance lead keeps settlement, payout, and commercial-control access under active review.",
      invitedBy: "Amina Bello",
      invitedAt: "2026-03-10T10:10:00.000Z",
      lastSignInAt: "2026-04-19T08:05:00.000Z",
      lastRoleChangedAt: "2026-03-10T10:10:00.000Z",
    }),
    makeRecord({
      id: "adm-007",
      name: "Jordan Nwosu",
      email: "jordan.nwosu@travelmate.test",
      team: "Platform Ops",
      role: "operations",
      status: "pending_invite",
      inviteState: "pending",
      requiresMfa: true,
      mfaState: "pending_setup",
      recentRisk: "normal",
      reviewOwner: "Amina Bello",
      operationalNote: "Invite is pending acceptance and MFA enrollment before route access can be activated.",
      invitedBy: "Amina Bello",
      invitedAt: "2026-04-18T15:15:00.000Z",
      pendingApprovalReason: undefined,
    }),
  ];
}
