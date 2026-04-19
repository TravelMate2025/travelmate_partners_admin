import type { AdminRole } from "@/modules/auth/types";

export type AuditEventCategory =
  | "verification"
  | "partner_lifecycle"
  | "listing_moderation"
  | "financial"
  | "settlement"
  | "payout_review"
  | "admin_access"
  | "api_governance";

export type AuditAction =
  | "approve_verification"
  | "reject_verification"
  | "request_more_info"
  | "suspend_partner_verification"
  | "lock_partner"
  | "unlock_partner"
  | "suspend_partner"
  | "restore_partner"
  | "soft_delete_partner"
  | "approve_listing"
  | "reject_listing"
  | "send_back_listing"
  | "flag_listing"
  | "emergency_unpublish"
  | "update_commission_rule"
  | "update_service_fee"
  | "manual_adjustment"
  | "trigger_settlement_run"
  | "retry_settlement"
  | "place_settlement_hold"
  | "release_settlement_hold"
  | "process_refund"
  | "escalate_refund"
  | "approve_payout_method"
  | "reject_payout_method"
  | "reverify_payout_method"
  | "toggle_payout_settlement_hold"
  | "invite_admin"
  | "change_admin_role"
  | "activate_admin"
  | "deactivate_admin"
  | "revoke_invite"
  | "approve_api_client"
  | "reject_api_client"
  | "revoke_api_key"
  | "block_api_client";

export type AuditRiskLevel = "low" | "medium" | "high" | "critical";

export type AuditOutcome = "success" | "failed" | "pending";

export type AuditEntityType =
  | "partner"
  | "listing"
  | "settlement"
  | "payout_method"
  | "admin_account"
  | "commission_rule"
  | "api_client";

export type AuditLogEntry = {
  id: string;
  eventId: string;
  actor: string;
  actorRole: AdminRole;
  category: AuditEventCategory;
  action: AuditAction;
  riskLevel: AuditRiskLevel;
  entityId: string;
  entityType: AuditEntityType;
  entityLabel: string;
  summary: string;
  outcome: AuditOutcome;
  timestamp: string;
  note: string;
  metadata: Record<string, string>;
};

export type AuditFilterState = {
  query: string;
  category: AuditEventCategory | "all";
  riskLevel: AuditRiskLevel | "all";
  outcome: AuditOutcome | "all";
  entityType: AuditEntityType | "all";
};

export type ComplianceExportPayload = {
  actor: string;
  filter: AuditFilterState;
  note: string;
};

export type ComplianceExportRecord = {
  eventId: string;
  actor: string;
  action: "export_compliance_data";
  exportedEntryCount: number;
  category: AuditEventCategory | "all";
  note: string;
  exportedAt: string;
  fileName: string;
  summary: string;
  status: "queued_for_backend";
};

export type AuditComplianceActionResult = {
  exportRecord: ComplianceExportRecord;
};

export type AuditComplianceSurfaceState =
  | {
      status: "loading" | "error" | "exception";
      title: string;
      description: string;
    }
  | undefined;

export type AuditPolicy = {
  canExportCompliance: boolean;
  canViewRetentionControls: boolean;
  canViewAccessPolicy: boolean;
  summary: string;
  allowedRoles: AdminRole[];
};

export type RetentionConfig = {
  defaultRetentionDays: number;
  highRiskRetentionDays: number;
  criticalRetentionDays: number;
  legalHoldEnabled: boolean;
  lastReviewedAt: string;
};

export type AccessPolicyEntry = {
  role: AdminRole;
  canExport: boolean;
  canViewRetention: boolean;
  canViewAccessPolicy: boolean;
  restrictedCategories: AuditEventCategory[];
};
