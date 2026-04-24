import type { AdminRole } from "@/modules/auth/types";
import { adminRoleOptions, adminTeamOptions } from "@/modules/admin-users/constants";
import type {
  AdminAccessFilterState,
  AdminAccessPolicy,
  AdminAccessRecord,
  AdminGovernanceAction,
  InviteAdminInput,
  ManagedAdminStatus,
  ManagedMfaState,
  ManagedSessionRisk,
} from "@/modules/admin-users/types";

export const adminUsersAllowedRoles: AdminRole[] = ["super_admin"];

export function isSensitiveAdminRole(role: AdminRole) {
  return role === "finance" || role === "super_admin";
}

export function getAdminAccessPolicy(role: AdminRole): AdminAccessPolicy {
  const canGovern = role === "super_admin";

  return {
    canInvite: canGovern,
    canResendInvite: canGovern,
    canRevokeInvite: canGovern,
    canActivate: canGovern,
    canDeactivate: canGovern,
    canDelete: canGovern,
    canAssignRole: canGovern,
    summary: canGovern
      ? "Super admins can invite admins, activate or deactivate accounts, delete inactive admins, and assign roles. Grants into finance and super_admin require explicit confirmation."
      : "This role can inspect admin account context but cannot change access governance.",
    allowedRoles: adminUsersAllowedRoles,
  };
}

export function validateInviteAdminInput(input: InviteAdminInput, role: AdminRole) {
  const policy = getAdminAccessPolicy(role);

  if (!policy.canInvite) return "This role cannot invite admin accounts.";
  if (input.name.trim().length < 3) return "Admin name must be at least 3 characters long.";
  if (!input.email.trim().includes("@")) return "A valid admin email is required.";
  if (!adminTeamOptions.includes(input.team)) return "Choose a valid admin team before sending an invite.";
  if (!adminRoleOptions.includes(input.role)) return "Choose a valid admin role before sending an invite.";
  if (input.note.trim().length < 12) return "Add an audit note of at least 12 characters before inviting an admin.";
  if (isSensitiveAdminRole(input.role) && !input.confirmSensitiveGrant) {
    return "Explicit confirmation is required before inviting an admin into a sensitive role.";
  }

  return null;
}

export function validateAdminGovernanceAction(
  records: AdminAccessRecord[],
  record: AdminAccessRecord,
  action: Exclude<AdminGovernanceAction, "invite_admin">,
  role: AdminRole,
  note: string,
  targetRole?: AdminRole,
  confirmSensitiveGrant?: boolean,
) {
  const policy = getAdminAccessPolicy(role);

  if (note.trim().length < 12) {
    return "Add an audit note of at least 12 characters before applying this admin governance action.";
  }

  if (action === "resend_invite" && !policy.canResendInvite) return "This role cannot resend admin invites.";
  if (action === "revoke_invite" && !policy.canRevokeInvite) return "This role cannot revoke admin invites.";
  if (action === "activate_admin" && !policy.canActivate) return "This role cannot activate admin accounts.";
  if (action === "deactivate_admin" && !policy.canDeactivate) return "This role cannot deactivate admin accounts.";
  if (action === "delete_admin" && !policy.canDelete) return "This role cannot delete admin accounts.";
  if (action === "assign_role" && !policy.canAssignRole) return "This role cannot assign admin roles.";

  if ((action === "resend_invite" || action === "revoke_invite") && record.status !== "pending_invite") {
    return "Invite controls are only available while the admin invite is pending.";
  }

  if (action === "activate_admin" && record.status !== "inactive") {
    return "Only inactive admin accounts can be activated.";
  }

  if (action === "deactivate_admin" && record.status !== "active") {
    return "Only active admin accounts can be deactivated.";
  }

  if (action === "delete_admin" && record.status !== "inactive") {
    return "Only inactive admin accounts can be deleted.";
  }

  if (action === "deactivate_admin" && record.role === "super_admin") {
    const activeSuperAdmins = records.filter((item) => item.status === "active" && item.role === "super_admin").length;
    if (activeSuperAdmins <= 1) {
      return "At least one active super admin must remain available.";
    }
  }

  if (action === "delete_admin" && record.role === "super_admin") {
    return "Inactive super admin accounts cannot be deleted.";
  }

  if (action === "assign_role") {
    if (!targetRole) return "Select a target role before applying the role change.";
    if (!adminRoleOptions.includes(targetRole)) return "Choose a valid admin role before applying the role change.";
    if (record.status === "pending_invite" || record.status === "revoked") {
      return "Only accepted admin accounts can receive role changes.";
    }
    if (record.role === targetRole) {
      return "Choose a different role before applying the role change.";
    }
    if (isSensitiveAdminRole(targetRole) && !confirmSensitiveGrant) {
      return "Explicit confirmation is required before granting a sensitive admin role.";
    }
  }

  return null;
}

export function getAvailableAdminGovernanceActions(record: AdminAccessRecord, role: AdminRole) {
  const policy = getAdminAccessPolicy(role);
  const actions: Exclude<AdminGovernanceAction, "invite_admin">[] = [];

  if (policy.canResendInvite && record.status === "pending_invite") {
    actions.push("resend_invite");
  }
  if (policy.canRevokeInvite && record.status === "pending_invite") {
    actions.push("revoke_invite");
  }
  if (policy.canActivate && record.status === "inactive") {
    actions.push("activate_admin");
  }
  if (policy.canDeactivate && record.status === "active") {
    actions.push("deactivate_admin");
  }
  if (policy.canDelete && record.status === "inactive" && record.role !== "super_admin") {
    actions.push("delete_admin");
  }
  if (policy.canAssignRole && record.status !== "pending_invite" && record.status !== "revoked") {
    actions.push("assign_role");
  }

  return actions;
}

export function matchesAdminAccessFilter(record: AdminAccessRecord, filters: AdminAccessFilterState) {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery =
    query.length === 0 ||
    record.name.toLowerCase().includes(query) ||
    record.email.toLowerCase().includes(query) ||
    record.team.toLowerCase().includes(query);

  const matchesStatus = filters.status === "all" || record.status === filters.status;
  const matchesRole = filters.role === "all" || record.role === filters.role;
  const matchesRisk = filters.risk === "all" || record.recentRisk === filters.risk;

  return matchesQuery && matchesStatus && matchesRole && matchesRisk;
}

export function buildAdminAccessSummary(records: AdminAccessRecord[]) {
  return {
    pendingInvites: records.filter((record) => record.status === "pending_invite").length,
    activeAdmins: records.filter((record) => record.status === "active").length,
    sensitiveGrants: records.filter((record) => isSensitiveAdminRole(record.role) && record.status !== "revoked").length,
    mfaGaps: records.filter((record) => record.requiresMfa && record.mfaState !== "verified").length,
  };
}

export function formatManagedAdminStatusLabel(status: ManagedAdminStatus) {
  const labels: Record<ManagedAdminStatus, string> = {
    pending_invite: "Pending Invite",
    active: "Active",
    inactive: "Inactive",
    revoked: "Revoked",
  };
  return labels[status];
}

export function formatManagedMfaStateLabel(state: ManagedMfaState) {
  const labels: Record<ManagedMfaState, string> = {
    verified: "MFA Verified",
    required: "MFA Required",
    disabled: "MFA Disabled",
    pending_setup: "MFA Pending Setup",
  };
  return labels[state];
}

export function formatSessionRiskLabel(risk: ManagedSessionRisk) {
  return risk === "elevated" ? "Elevated Risk" : "Normal Risk";
}

export function adminStatusTone(status: ManagedAdminStatus) {
  switch (status) {
    case "active":
      return "success" as const;
    case "pending_invite":
      return "warning" as const;
    case "inactive":
      return "danger" as const;
    case "revoked":
      return "neutral" as const;
  }
}

export function mfaStateTone(state: ManagedMfaState) {
  switch (state) {
    case "verified":
      return "success" as const;
    case "pending_setup":
    case "required":
      return "warning" as const;
    case "disabled":
      return "danger" as const;
  }
}

export function sessionRiskTone(risk: ManagedSessionRisk) {
  return risk === "elevated" ? ("danger" as const) : ("info" as const);
}
