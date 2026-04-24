import type { ActivityItem } from "@/components/common/activity-timeline";
import type { AdminRole } from "@/modules/auth/types";
import type { AdminTeam } from "@/modules/admin-users/constants";

export type ManagedAdminStatus = "pending_invite" | "active" | "inactive" | "revoked";
export type ManagedInviteState = "pending" | "accepted" | "revoked" | "none";
export type ManagedMfaState = "verified" | "required" | "disabled" | "pending_setup";
export type ManagedSessionRisk = "normal" | "elevated";

export type AdminGovernanceAction =
  | "invite_admin"
  | "resend_invite"
  | "revoke_invite"
  | "activate_admin"
  | "deactivate_admin"
  | "assign_role";

export type PermissionPolicySummary = {
  id: string;
  title: string;
  detail: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
};

export type RecentSessionSnapshot = {
  id: string;
  deviceLabel: string;
  locationLabel: string;
  lastSeenAt: string;
  risk: ManagedSessionRisk;
};

export type AdminAccessRecord = {
  id: string;
  name: string;
  email: string;
  team: AdminTeam | string;
  role: AdminRole;
  status: ManagedAdminStatus;
  inviteState: ManagedInviteState;
  requiresMfa: boolean;
  mfaState: ManagedMfaState;
  sensitiveGrantProtected: boolean;
  recentRisk: ManagedSessionRisk;
  pendingApprovalReason?: string;
  invitedBy?: string;
  invitedAt?: string;
  lastSignInAt?: string;
  lastRoleChangedAt?: string;
  lastAccessedAt: string;
  reviewOwner: string;
  operationalNote: string;
  permissionPolicies: PermissionPolicySummary[];
  recentSessions: RecentSessionSnapshot[];
  activity: ActivityItem[];
};

export type AdminAccessFilterState = {
  query: string;
  status: ManagedAdminStatus | "all";
  role: AdminRole | "all";
  risk: ManagedSessionRisk | "all";
};

export type AdminAccessPolicy = {
  canInvite: boolean;
  canResendInvite: boolean;
  canRevokeInvite: boolean;
  canActivate: boolean;
  canDeactivate: boolean;
  canAssignRole: boolean;
  summary: string;
  allowedRoles: AdminRole[];
};

export type InviteAdminInput = {
  name: string;
  email: string;
  team: AdminTeam;
  role: AdminRole;
  note: string;
  confirmSensitiveGrant: boolean;
};

export type AdminGovernanceActionPayload = {
  adminId: string;
  action: Exclude<AdminGovernanceAction, "invite_admin">;
  actor: string;
  note: string;
  targetRole?: AdminRole;
  confirmSensitiveGrant?: boolean;
};

export type AdminGovernanceAuditRecord = {
  eventId: string;
  adminId: string;
  actor: string;
  action: AdminGovernanceAction;
  summary: string;
  status: "queued_for_access_governance";
};

export type AdminGovernanceActionResult = {
  records: AdminAccessRecord[];
  updatedRecord: AdminAccessRecord;
  auditRecord: AdminGovernanceAuditRecord;
};

export type InviteAdminResult = {
  records: AdminAccessRecord[];
  createdRecord: AdminAccessRecord;
  auditRecord: AdminGovernanceAuditRecord;
};
