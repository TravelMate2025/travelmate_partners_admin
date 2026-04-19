import type { AdminRole } from "@/modules/auth/types";
import {
  getAvailableAdminGovernanceActions,
  isSensitiveAdminRole,
  validateAdminGovernanceAction,
  validateInviteAdminInput,
} from "@/modules/admin-users/rules";
import type {
  AdminAccessRecord,
  AdminGovernanceAction,
  AdminGovernanceActionPayload,
  AdminGovernanceActionResult,
  AdminGovernanceAuditRecord,
  InviteAdminInput,
  InviteAdminResult,
} from "@/modules/admin-users/types";

function buildPermissionPolicies(role: AdminRole) {
  const labels = {
    super_admin: [
      { id: "perm-super-1", title: "Platform governance", detail: "Full control over admin access, finance, and governance routes.", tone: "success" as const },
      { id: "perm-super-2", title: "Sensitive grant approval", detail: "Sensitive role grants require explicit super-admin confirmation.", tone: "warning" as const },
    ],
    operations: [
      { id: "perm-ops-1", title: "Operational queues", detail: "Can operate verification, partners, moderation, and support routes.", tone: "info" as const },
      { id: "perm-ops-2", title: "Finance restrictions", detail: "Finance-controlled settlement and payout routes remain blocked.", tone: "warning" as const },
    ],
    reviewer: [
      { id: "perm-rev-1", title: "Review-only access", detail: "Reviewer can inspect review and governance evidence surfaces.", tone: "info" as const },
      { id: "perm-rev-2", title: "No lifecycle overrides", detail: "Lifecycle and money-movement actions remain unavailable.", tone: "warning" as const },
    ],
    support: [
      { id: "perm-sup-1", title: "Support operations", detail: "Support queues and messaging remain available.", tone: "info" as const },
      { id: "perm-sup-2", title: "Restricted payout visibility", detail: "Sensitive payout controls are blocked outside finance.", tone: "warning" as const },
    ],
    finance: [
      { id: "perm-fin-1", title: "Finance routes", detail: "Financial operations, payout review, and commercial controls are available.", tone: "success" as const },
      { id: "perm-fin-2", title: "Unmasked payout visibility", detail: "Finance-only payout detail access remains audited.", tone: "warning" as const },
    ],
  } satisfies Record<AdminRole, AdminAccessRecord["permissionPolicies"]>;

  return labels[role];
}

function buildAuditSummary(actor: string, action: AdminGovernanceAction, record: AdminAccessRecord, targetRole?: AdminRole) {
  switch (action) {
    case "invite_admin":
      return `${actor} invited ${record.name} into the admin dashboard and queued access governance follow-up.`;
    case "resend_invite":
      return `${actor} resent the admin invite for ${record.name} and queued access governance follow-up.`;
    case "revoke_invite":
      return `${actor} revoked the pending admin invite for ${record.name} and queued access governance follow-up.`;
    case "activate_admin":
      return `${actor} activated the admin account for ${record.name} and queued access governance follow-up.`;
    case "deactivate_admin":
      return `${actor} deactivated the admin account for ${record.name} and queued access governance follow-up.`;
    case "assign_role":
      return `${actor} changed ${record.name} to role ${targetRole?.replace("_", " ")} and queued access governance follow-up.`;
  }
}

function buildActivityTitle(action: AdminGovernanceAction) {
  const labels: Record<AdminGovernanceAction, string> = {
    invite_admin: "Admin invite created",
    resend_invite: "Admin invite resent",
    revoke_invite: "Admin invite revoked",
    activate_admin: "Admin account activated",
    deactivate_admin: "Admin account deactivated",
    assign_role: "Admin role changed",
  };
  return labels[action];
}

function createAuditRecord(adminId: string, actor: string, action: AdminGovernanceAction, record: AdminAccessRecord, targetRole?: AdminRole): AdminGovernanceAuditRecord {
  return {
    eventId: `admin-governance-${adminId}-${Date.now()}`,
    adminId,
    actor,
    action,
    summary: buildAuditSummary(actor, action, record, targetRole),
    status: "queued_for_access_governance",
  };
}

function nowTimeLabel(timestamp: string) {
  return timestamp.slice(11, 16) + " UTC";
}

export type AdminUsersRepository = {
  inviteAdmin(records: AdminAccessRecord[], input: InviteAdminInput, actor: string, role: AdminRole): Promise<InviteAdminResult>;
  applyAction(records: AdminAccessRecord[], payload: AdminGovernanceActionPayload, role: AdminRole): Promise<AdminGovernanceActionResult>;
};

export const mockAdminUsersRepository: AdminUsersRepository = {
  async inviteAdmin(records, input, actor, role) {
    const validationError = validateInviteAdminInput(input, role);
    if (validationError) throw new Error(validationError);

    const timestamp = new Date().toISOString();
    const createdRecord: AdminAccessRecord = {
      id: `adm-invite-${Date.now()}`,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      team: input.team.trim(),
      role: input.role,
      status: "pending_invite",
      inviteState: "pending",
      requiresMfa: input.requiresMfa,
      mfaState: input.requiresMfa ? "pending_setup" : "disabled",
      sensitiveGrantProtected: isSensitiveAdminRole(input.role),
      recentRisk: "normal",
      pendingApprovalReason: isSensitiveAdminRole(input.role) ? "Sensitive role grant confirmed by super admin." : undefined,
      invitedBy: actor,
      invitedAt: timestamp,
      lastSignInAt: undefined,
      lastRoleChangedAt: undefined,
      lastAccessedAt: timestamp,
      reviewOwner: actor,
      operationalNote: input.note.trim(),
      permissionPolicies: buildPermissionPolicies(input.role),
      recentSessions: [],
      activity: [
        {
          id: `admin-invite-activity-${Date.now()}`,
          title: buildActivityTitle("invite_admin"),
          detail: `${actor} invited this admin with role ${input.role.replace("_", " ")} and recorded the governance rationale.`,
          time: nowTimeLabel(timestamp),
          tone: "info",
        },
      ],
    };

    const auditRecord = createAuditRecord(createdRecord.id, actor, "invite_admin", createdRecord);

    return {
      records: [createdRecord, ...records],
      createdRecord,
      auditRecord,
    };
  },

  async applyAction(records, payload, role) {
    const record = records.find((item) => item.id === payload.adminId);

    if (!record) {
      throw new Error("Selected admin account was not found.");
    }

    const availableActions = getAvailableAdminGovernanceActions(record, role);
    if (!availableActions.includes(payload.action)) {
      throw new Error("This admin governance action is not available for the selected record and role.");
    }

    const validationError = validateAdminGovernanceAction(
      records,
      record,
      payload.action,
      role,
      payload.note,
      payload.targetRole,
      payload.confirmSensitiveGrant,
    );

    if (validationError) {
      throw new Error(validationError);
    }

    const timestamp = new Date().toISOString();
    const nextRole = payload.action === "assign_role" && payload.targetRole ? payload.targetRole : record.role;
    const updatedRecord: AdminAccessRecord = {
      ...record,
      role: nextRole,
      status:
        payload.action === "revoke_invite"
          ? "revoked"
          : payload.action === "activate_admin"
            ? "active"
            : payload.action === "deactivate_admin"
              ? "inactive"
              : record.status,
      inviteState:
        payload.action === "activate_admin"
          ? "accepted"
          : payload.action === "revoke_invite"
            ? "revoked"
            : record.inviteState,
      mfaState:
        payload.action === "activate_admin"
          ? record.requiresMfa
            ? "verified"
            : "disabled"
          : record.mfaState,
      sensitiveGrantProtected: isSensitiveAdminRole(nextRole),
      pendingApprovalReason:
        payload.action === "assign_role" && payload.targetRole && isSensitiveAdminRole(payload.targetRole)
          ? "Sensitive role grant confirmed by super admin."
          : payload.action === "activate_admin" || payload.action === "deactivate_admin"
            ? record.pendingApprovalReason
            : undefined,
      lastSignInAt:
        payload.action === "activate_admin" && record.status === "pending_invite"
          ? timestamp
          : record.lastSignInAt,
      lastRoleChangedAt: payload.action === "assign_role" ? timestamp : record.lastRoleChangedAt,
      lastAccessedAt: timestamp,
      reviewOwner: payload.actor,
      operationalNote: payload.note.trim(),
      permissionPolicies: buildPermissionPolicies(nextRole),
      recentSessions:
        payload.action === "activate_admin" && record.recentSessions.length === 0
          ? [
              {
                id: `${record.id}-session-activated`,
                deviceLabel: "Accepted invite session",
                locationLabel: "Onboarding browser",
                lastSeenAt: timestamp,
                risk: "normal",
              },
            ]
          : record.recentSessions,
      activity: [
        {
          id: `admin-governance-activity-${record.id}-${Date.now()}`,
          title: buildActivityTitle(payload.action),
          detail:
            payload.action === "assign_role" && payload.targetRole
              ? `${payload.actor} changed the role to ${payload.targetRole.replace("_", " ")} and updated the access policy summary.`
              : `${payload.actor} applied ${payload.action.replaceAll("_", " ")} and documented the access-governance rationale.`,
          time: nowTimeLabel(timestamp),
          tone:
            payload.action === "deactivate_admin" || payload.action === "revoke_invite"
              ? "danger"
              : payload.action === "assign_role" && payload.targetRole && isSensitiveAdminRole(payload.targetRole)
                ? "warning"
                : "success",
        },
        ...record.activity,
      ],
    };

    const auditRecord = createAuditRecord(record.id, payload.actor, payload.action, updatedRecord, payload.targetRole);

    return {
      records: records.map((item) => (item.id === record.id ? updatedRecord : item)),
      updatedRecord,
      auditRecord,
    };
  },
};
