import type { ActivityItem } from "@/components/common/activity-timeline";
import type { AdminRole } from "@/modules/auth/types";

export type PayoutMethodType = "bank_account" | "mobile_money";
export type PayoutVerificationStatus = "pending" | "verified" | "rejected";
export type PayoutNameMatchStatus = "matched" | "mismatched";
export type PayoutRiskSeverity = "low" | "medium" | "high" | "critical";
export type PayoutHoldState = "clear" | "active";
export type PayoutSettlementReadiness = "review_required" | "blocked" | "ready";

export type PayoutReviewAction =
  | "approve_payout_method"
  | "reject_payout_method"
  | "reverify_payout_method"
  | "toggle_settlement_hold";

export type PayoutReviewReasonCode =
  | "ownership_confirmed"
  | "otp_verified"
  | "documents_matched"
  | "name_mismatch"
  | "invalid_documentation"
  | "unsupported_method"
  | "rapid_account_change"
  | "suspicious_update"
  | "ownership_check_required"
  | "verification_incomplete"
  | "risk_window_active"
  | "manual_review_required";

export type PayoutReviewLinkedContext = {
  id: string;
  label: string;
  href: string;
  statusLabel: string;
  kind: "partner" | "financial_ops" | "support" | "audit";
};

export type PayoutRiskFlag = {
  id: string;
  label: string;
  detail: string;
  severity: PayoutRiskSeverity;
  requiresReverification: boolean;
};

export type PayoutSensitiveDetails = {
  accountHolderName: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  routingCode?: string;
  swiftCode?: string;
  mobileMoneyProvider?: string;
  mobileNumber?: string;
};

export type PayoutDetailField = {
  id: string;
  label: string;
  value: string;
  masked: boolean;
};

export type PayoutReviewRecord = {
  id: string;
  title: string;
  summary: string;
  partnerName: string;
  partnerId: string;
  country: string;
  currency: string;
  region: string;
  methodType: PayoutMethodType;
  status: PayoutVerificationStatus;
  nameMatchStatus: PayoutNameMatchStatus;
  holdState: PayoutHoldState;
  settlementReadiness: PayoutSettlementReadiness;
  isDefault: boolean;
  maskedSummary: string;
  submissionSource: "partner_self_service" | "partner_update";
  verificationSubmittedAt: string;
  verifiedAt?: string;
  lastUpdatedAt: string;
  rejectionReason?: string;
  reviewOwner: string;
  operationalNote: string;
  riskFlags: PayoutRiskFlag[];
  linkedContext: PayoutReviewLinkedContext[];
  sensitiveDetails: PayoutSensitiveDetails;
  activity: ActivityItem[];
};

export type PayoutReviewFilterState = {
  query: string;
  status: PayoutVerificationStatus | "all";
  methodType: PayoutMethodType | "all";
  holdState: PayoutHoldState | "all";
  riskSeverity: PayoutRiskSeverity | "all";
};

export type PayoutReviewPolicy = {
  canApprove: boolean;
  canReject: boolean;
  canReverify: boolean;
  canToggleHold: boolean;
  canViewUnmaskedDetails: boolean;
  summary: string;
  allowedRoles: AdminRole[];
};

export type PayoutReviewActionPayload = {
  caseId: string;
  action: PayoutReviewAction;
  actor: string;
  note: string;
  reasonCode: PayoutReviewReasonCode;
};

export type PayoutReviewAuditRecord = {
  eventId: string;
  caseId: string;
  actor: string;
  action: PayoutReviewAction;
  reasonCode: PayoutReviewReasonCode;
  summary: string;
  status: "queued_for_payout_governance";
};

export type PayoutReviewActionResult = {
  records: PayoutReviewRecord[];
  updatedRecord: PayoutReviewRecord;
  auditRecord: PayoutReviewAuditRecord;
};
