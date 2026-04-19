import type { AdminRole } from "@/modules/auth/types";
import type {
  CommercialAction,
  CommercialAdjustmentPayload,
  CommercialFilterState,
  CommercialPolicy,
  CommercialRuleRecord,
  CommercialRuleUpdatePayload,
} from "@/modules/commercial-controls/types";

export function getCommercialControlsPolicy(role: AdminRole): CommercialPolicy {
  const canManageCommercials = role === "finance" || role === "super_admin";

  return {
    canManageCommercials,
    canCreateAdjustments: canManageCommercials,
    summary: canManageCommercials
      ? "Finance and super admin roles can update fee rules and record manual commercial adjustments with audit preparation."
      : "This role can review commercial context only. Financial configuration changes remain finance-restricted.",
    allowedRoles: ["finance", "super_admin"],
  };
}

export function canApplyCommercialAction(
  role: AdminRole,
  record: CommercialRuleRecord,
  action: CommercialAction,
) {
  const policy = getCommercialControlsPolicy(role);

  if (!policy.canManageCommercials) {
    return false;
  }

  switch (action) {
    case "update_rule":
      return record.status === "active" || record.status === "scheduled";
    case "create_adjustment":
      return record.partnerSettings.length > 0;
  }
}

export function validateCommercialRuleUpdate(payload: CommercialRuleUpdatePayload, record: CommercialRuleRecord) {
  if (record.ruleType === "commission") {
    if (!Number.isFinite(payload.commissionRatePercent) || payload.commissionRatePercent < 0 || payload.commissionRatePercent > 35) {
      return "Commission rate must stay between 0% and 35%.";
    }
  } else if (!Number.isFinite(payload.serviceFeeFlatAmount) || payload.serviceFeeFlatAmount < 0 || payload.serviceFeeFlatAmount > 500) {
    return "Service fee must stay between 0 and 500.";
  }

  if (payload.effectiveDate.trim().length === 0) {
    return "Choose an effective date before saving commercial rules.";
  }

  if (payload.note.trim().length < 12) {
    return "Add a clear audit note describing why this commercial rule changed.";
  }

  return null;
}

export function getCommercialEditableField(record: CommercialRuleRecord) {
  return record.ruleType === "commission" ? "commission" : "service_fee";
}

export function validateCommercialAdjustment(payload: CommercialAdjustmentPayload, record: CommercialRuleRecord) {
  if (payload.partnerName.trim().length === 0) {
    return "Select a partner before recording a manual adjustment.";
  }

  if (!record.partnerSettings.some((setting) => setting.partnerName === payload.partnerName)) {
    return "Manual adjustments must target a partner linked to the selected commercial rule.";
  }

  if (!Number.isFinite(payload.amount) || payload.amount <= 0 || payload.amount > 5000) {
    return "Adjustment amount must be greater than 0 and no more than 5000.";
  }

  if (payload.reason.trim().length < 6) {
    return "Provide a short reason for the commercial adjustment.";
  }

  if (payload.note.trim().length < 12) {
    return "Add an audit note that explains the commercial adjustment.";
  }

  return null;
}

export function buildCommercialSummary(records: CommercialRuleRecord[]) {
  return {
    activeRules: records.filter((record) => record.status === "active").length,
    scheduledRules: records.filter((record) => record.status === "scheduled").length,
    partnerOverrides: records.filter((record) => record.scope === "partner").length,
    manualAdjustments: records.reduce((total, record) => total + record.manualAdjustmentHistory.length, 0),
  };
}

export function matchesCommercialFilter(record: CommercialRuleRecord, filters: CommercialFilterState) {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery =
    query.length === 0 ||
    record.title.toLowerCase().includes(query) ||
    record.region.toLowerCase().includes(query) ||
    record.summary.toLowerCase().includes(query);

  const matchesRuleType = filters.ruleType === "all" || record.ruleType === filters.ruleType;
  const matchesScope = filters.scope === "all" || record.scope === filters.scope;
  const matchesStatus = filters.status === "all" || record.status === filters.status;

  return matchesQuery && matchesRuleType && matchesScope && matchesStatus;
}
