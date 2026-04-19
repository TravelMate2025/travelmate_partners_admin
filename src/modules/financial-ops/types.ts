import type { ActivityItem } from "@/components/common/activity-timeline";
import type { AdminRole } from "@/modules/auth/types";

export type PartnerSettlementStatus = "pending_completion" | "processing" | "paid" | "failed" | "reversed";
export type AdminSettlementRunStatus = "queued" | "processing" | "completed" | "partial" | "failed";
export type RefundStatus = "requested" | "partner_notified" | "refunded" | "disputed" | "recovered";
export type FinancialOpsAction =
  | "retry_settlement"
  | "reconcile_case"
  | "notify_partner_refund"
  | "recover_refund"
  | "generate_statement";

export type FinancialOpsLinkedContext = {
  id: string;
  label: string;
  href: string;
  statusLabel: string;
  kind: "partner" | "support" | "commercial" | "payout_review";
};

export type SettlementEvidenceRecord = {
  id: string;
  label: string;
  value: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
};

export type SettlementStatementRecord = {
  id: string;
  fileName: string;
  generatedAt: string;
  actor: string;
  status: "generated" | "queued_for_backend";
};

export type FinancialOpsRecord = {
  id: string;
  title: string;
  summary: string;
  partnerName: string;
  bookingReference: string;
  supplyType: "stay" | "transfer";
  region: string;
  currency: string;
  owner: string;
  settlementPeriodLabel: string;
  partnerSettlementStatus: PartnerSettlementStatus;
  adminRunStatus: AdminSettlementRunStatus;
  refundStatus: RefundStatus | null;
  netPayoutAmount: number;
  expectedPayoutAmount: number;
  reconciliationDeltaAmount: number;
  failedBookingCount: number;
  riskWindowLabel: string;
  failureReason: string | null;
  operationalNote: string;
  linkedContext: FinancialOpsLinkedContext[];
  evidence: SettlementEvidenceRecord[];
  statements: SettlementStatementRecord[];
  activity: ActivityItem[];
};

export type FinancialOpsFilterState = {
  query: string;
  partnerSettlementStatus: PartnerSettlementStatus | "all";
  adminRunStatus: AdminSettlementRunStatus | "all";
  refundStatus: RefundStatus | "all";
  region: string | "all";
};

export type FinancialOpsPolicy = {
  canRetryRun: boolean;
  canReconcile: boolean;
  canFollowRefunds: boolean;
  canGenerateStatements: boolean;
  summary: string;
  allowedRoles: AdminRole[];
};

export type FinancialOpsAuditRecord = {
  eventId: string;
  caseId: string;
  actor: string;
  action: FinancialOpsAction;
  summary: string;
  status: "queued_for_finance_ops";
};

export type FinancialOpsActionPayload = {
  caseId: string;
  action: FinancialOpsAction;
  actor: string;
  note: string;
};

export type FinancialOpsActionResult = {
  records: FinancialOpsRecord[];
  updatedRecord: FinancialOpsRecord;
  auditRecord: FinancialOpsAuditRecord;
};
