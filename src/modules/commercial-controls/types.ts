import type { AdminRole } from "@/modules/auth/types";

export type CommercialRuleType = "commission" | "service_fee";
export type CommercialRuleScope = "global" | "region" | "partner";
export type CommercialRuleStatus = "active" | "scheduled" | "paused";
export type AdjustmentDirection = "credit" | "debit";
export type CommercialAction = "update_rule" | "create_adjustment";

export type CommercialAuditRecord = {
  eventId: string;
  actor: string;
  ruleId: string;
  action: CommercialAction;
  summary: string;
  status: "queued_for_backend";
  ruleChangeDetails?: {
    ruleType: CommercialRuleType;
    previousValue: number;
    nextValue: number;
    effectiveDate: string;
  };
  adjustmentDetails?: {
    partnerName: string;
    direction: AdjustmentDirection;
    amount: number;
    currency: string;
    reason: string;
  };
};

export type CommercialHistoryEntry = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  note: string;
};

export type PartnerCommercialSetting = {
  id: string;
  partnerName: string;
  region: string;
  commissionRatePercent: number;
  serviceFeeFlatAmount: number;
  settlementCadenceLabel: string;
  overrideReason: string;
};

export type ManualAdjustmentRecord = {
  id: string;
  partnerName: string;
  direction: AdjustmentDirection;
  amount: number;
  currency: string;
  reason: string;
  note: string;
  createdAt: string;
  createdBy: string;
};

export type CommercialRuleRecord = {
  id: string;
  title: string;
  ruleType: CommercialRuleType;
  scope: CommercialRuleScope;
  region: string;
  status: CommercialRuleStatus;
  commissionRatePercent: number;
  serviceFeeFlatAmount: number;
  effectiveDate: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  summary: string;
  downstreamImpactSummary: string;
  operationalNote: string;
  partnerSettings: PartnerCommercialSetting[];
  manualAdjustmentHistory: ManualAdjustmentRecord[];
  history: CommercialHistoryEntry[];
  latestAuditRecord: CommercialAuditRecord | null;
};

export type CommercialFilterState = {
  query: string;
  ruleType: CommercialRuleType | "all";
  scope: CommercialRuleScope | "all";
  status: CommercialRuleStatus | "all";
};

export type CommercialControlsSurfaceState =
  | {
      status: "loading" | "error" | "exception";
      title: string;
      description: string;
    }
  | undefined;

export type CommercialRuleUpdatePayload = {
  actor: string;
  ruleId: string;
  action: "update_rule";
  note: string;
  commissionRatePercent: number;
  serviceFeeFlatAmount: number;
  effectiveDate: string;
};

export type CommercialAdjustmentPayload = {
  actor: string;
  ruleId: string;
  action: "create_adjustment";
  note: string;
  partnerName: string;
  direction: AdjustmentDirection;
  amount: number;
  reason: string;
};

export type CommercialActionPayload = CommercialRuleUpdatePayload | CommercialAdjustmentPayload;

export type CommercialActionResult = {
  records: CommercialRuleRecord[];
  updatedRecord: CommercialRuleRecord;
  auditRecord: CommercialAuditRecord;
};

export type CommercialPolicy = {
  canManageCommercials: boolean;
  canCreateAdjustments: boolean;
  summary: string;
  allowedRoles: AdminRole[];
};
