import type { AdminRole } from "@/modules/auth/types";
import type {
  PayoutDetailField,
  PayoutHoldState,
  PayoutMethodType,
  PayoutNameMatchStatus,
  PayoutReviewAction,
  PayoutReviewFilterState,
  PayoutReviewPolicy,
  PayoutReviewReasonCode,
  PayoutReviewRecord,
  PayoutRiskSeverity,
  PayoutSettlementReadiness,
  PayoutVerificationStatus,
} from "@/modules/payout-review/types";

export const payoutReviewAllowedRoles: AdminRole[] = ["finance", "super_admin"];

const reasonLabels: Record<PayoutReviewReasonCode, string> = {
  ownership_confirmed: "Ownership confirmed",
  otp_verified: "OTP verified",
  documents_matched: "Documents matched",
  name_mismatch: "Name mismatch",
  invalid_documentation: "Invalid documentation",
  unsupported_method: "Unsupported method",
  rapid_account_change: "Rapid account change",
  suspicious_update: "Suspicious update",
  ownership_check_required: "Ownership check required",
  verification_incomplete: "Verification incomplete",
  risk_window_active: "Risk window active",
  manual_review_required: "Manual review required",
};

const reasonCodesByAction: Record<PayoutReviewAction, PayoutReviewReasonCode[]> = {
  approve_payout_method: ["ownership_confirmed", "otp_verified", "documents_matched"],
  reject_payout_method: ["name_mismatch", "invalid_documentation", "unsupported_method"],
  reverify_payout_method: ["rapid_account_change", "suspicious_update", "ownership_check_required"],
  toggle_settlement_hold: ["verification_incomplete", "risk_window_active", "manual_review_required"],
};

function maskValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 4) return "*".repeat(trimmed.length);
  return `${"*".repeat(Math.max(4, trimmed.length - 4))}${trimmed.slice(-4)}`;
}

function maskName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return parts
    .map((part, index) => (index === 0 ? `${part.slice(0, 1)}${"*".repeat(Math.max(1, part.length - 1))}` : `${part.slice(0, 1)}${"*".repeat(Math.max(1, part.length - 1))}`))
    .join(" ");
}

export function getPayoutReviewPolicy(role: AdminRole): PayoutReviewPolicy {
  const canOperate = role === "finance" || role === "super_admin";
  const canViewUnmaskedDetails = role === "finance";

  return {
    canApprove: canOperate,
    canReject: canOperate,
    canReverify: canOperate,
    canToggleHold: canOperate,
    canViewUnmaskedDetails,
    summary: canViewUnmaskedDetails
      ? "Finance can approve, reject, reverify, and manage settlement holds with full payout-field visibility."
      : "Super admins can govern payout reviews, but sensitive settlement account fields stay masked unless finance handles the case.",
    allowedRoles: payoutReviewAllowedRoles,
  };
}

export function getReasonLabel(reasonCode: PayoutReviewReasonCode) {
  return reasonLabels[reasonCode];
}

export function getReasonOptionsForAction(action: PayoutReviewAction) {
  return reasonCodesByAction[action].map((reasonCode) => ({
    value: reasonCode,
    label: reasonLabels[reasonCode],
  }));
}

export function getVisiblePayoutFields(record: PayoutReviewRecord, role: AdminRole): PayoutDetailField[] {
  const canViewUnmasked = getPayoutReviewPolicy(role).canViewUnmaskedDetails;
  const details = record.sensitiveDetails;

  if (record.methodType === "bank_account") {
    return [
      {
        id: "holder",
        label: "Account holder",
        value: canViewUnmasked ? details.accountHolderName : maskName(details.accountHolderName),
        masked: !canViewUnmasked,
      },
      {
        id: "bank",
        label: "Bank name",
        value: details.bankName ?? "Not provided",
        masked: false,
      },
      {
        id: "account-number",
        label: "Account number",
        value: canViewUnmasked ? details.accountNumber ?? "Not provided" : maskValue(details.accountNumber ?? ""),
        masked: !canViewUnmasked,
      },
      {
        id: "iban",
        label: "IBAN",
        value: canViewUnmasked ? details.iban ?? "Not provided" : details.iban ? maskValue(details.iban) : "Not provided",
        masked: !canViewUnmasked && Boolean(details.iban),
      },
      {
        id: "routing",
        label: "Routing code",
        value: canViewUnmasked ? details.routingCode ?? "Not provided" : details.routingCode ? maskValue(details.routingCode) : "Not provided",
        masked: !canViewUnmasked && Boolean(details.routingCode),
      },
      {
        id: "swift",
        label: "SWIFT code",
        value: canViewUnmasked ? details.swiftCode ?? "Not provided" : details.swiftCode ? maskValue(details.swiftCode) : "Not provided",
        masked: !canViewUnmasked && Boolean(details.swiftCode),
      },
    ];
  }

  return [
    {
      id: "holder",
      label: "Account holder",
      value: canViewUnmasked ? details.accountHolderName : maskName(details.accountHolderName),
      masked: !canViewUnmasked,
    },
    {
      id: "provider",
      label: "Mobile money provider",
      value: details.mobileMoneyProvider ?? "Not provided",
      masked: false,
    },
    {
      id: "mobile",
      label: "Mobile number",
      value: canViewUnmasked ? details.mobileNumber ?? "Not provided" : maskValue(details.mobileNumber ?? ""),
      masked: !canViewUnmasked,
    },
  ];
}

function hasEscalatedRisk(record: PayoutReviewRecord) {
  return record.riskFlags.some((flag) => flag.severity === "high" || flag.severity === "critical");
}

export function getAvailablePayoutReviewActions(record: PayoutReviewRecord, role: AdminRole): PayoutReviewAction[] {
  const policy = getPayoutReviewPolicy(role);
  const actions: PayoutReviewAction[] = [];

  if (policy.canApprove && record.status === "pending") {
    actions.push("approve_payout_method");
  }

  if (policy.canReject && record.status === "pending") {
    actions.push("reject_payout_method");
  }

  if (policy.canReverify && record.status === "verified" && (hasEscalatedRisk(record) || record.riskFlags.some((flag) => flag.requiresReverification))) {
    actions.push("reverify_payout_method");
  }

  if (policy.canToggleHold) {
    if (record.holdState === "active" && record.status === "verified") {
      actions.push("toggle_settlement_hold");
    }
    if (record.holdState === "clear" && (record.status !== "verified" || hasEscalatedRisk(record))) {
      actions.push("toggle_settlement_hold");
    }
  }

  return actions;
}

export function validatePayoutReviewAction(
  record: PayoutReviewRecord,
  action: PayoutReviewAction,
  role: AdminRole,
  note: string,
  reasonCode: PayoutReviewReasonCode,
) {
  const policy = getPayoutReviewPolicy(role);

  if (note.trim().length < 12) {
    return "Add an audit note of at least 12 characters before applying this payout review action.";
  }

  if (!reasonCodesByAction[action].includes(reasonCode)) {
    return `Choose a valid reason code for ${formatPayoutReviewActionLabel(action).toLowerCase()}.`;
  }

  if (action === "approve_payout_method" && !policy.canApprove) return "This role cannot approve payout methods.";
  if (action === "reject_payout_method" && !policy.canReject) return "This role cannot reject payout methods.";
  if (action === "reverify_payout_method" && !policy.canReverify) return "This role cannot trigger re-verification.";
  if (action === "toggle_settlement_hold" && !policy.canToggleHold) return "This role cannot manage settlement holds.";

  if ((action === "approve_payout_method" || action === "reject_payout_method") && record.status !== "pending") {
    return "Only pending payout methods can be approved or rejected.";
  }

  if (action === "approve_payout_method" && record.nameMatchStatus === "mismatched") {
    return "Resolve the ownership mismatch before approving this payout method.";
  }

  if (action === "reverify_payout_method" && record.status !== "verified") {
    return "Only verified payout methods can be sent back to re-verification.";
  }

  if (action === "reverify_payout_method" && !record.riskFlags.some((flag) => flag.requiresReverification || flag.severity === "high" || flag.severity === "critical")) {
    return "Re-verification is only available when the payout method carries a qualifying risk signal.";
  }

  if (action === "toggle_settlement_hold") {
    if (record.holdState === "active" && record.status !== "verified") {
      return "Settlement holds can only be released after the payout method is verified.";
    }
    if (record.holdState === "clear" && record.status === "verified" && !hasEscalatedRisk(record)) {
      return "Place a settlement hold only when verification is incomplete or a high-risk signal is active.";
    }
  }

  return null;
}

export function matchesPayoutReviewFilter(record: PayoutReviewRecord, filters: PayoutReviewFilterState) {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery =
    query.length === 0 ||
    record.title.toLowerCase().includes(query) ||
    record.partnerName.toLowerCase().includes(query) ||
    record.maskedSummary.toLowerCase().includes(query) ||
    record.region.toLowerCase().includes(query);

  const matchesStatus = filters.status === "all" || record.status === filters.status;
  const matchesMethod = filters.methodType === "all" || record.methodType === filters.methodType;
  const matchesHold = filters.holdState === "all" || record.holdState === filters.holdState;
  const matchesRisk = filters.riskSeverity === "all" || record.riskFlags.some((flag) => flag.severity === filters.riskSeverity);

  return matchesQuery && matchesStatus && matchesMethod && matchesHold && matchesRisk;
}

export function buildPayoutReviewSummary(records: PayoutReviewRecord[]) {
  return {
    pendingReview: records.filter((record) => record.status === "pending").length,
    activeHolds: records.filter((record) => record.holdState === "active").length,
    highRisk: records.filter((record) => record.riskFlags.some((flag) => flag.severity === "high" || flag.severity === "critical")).length,
    settlementReady: records.filter((record) => record.settlementReadiness === "ready").length,
  };
}

export function formatPayoutVerificationStatusLabel(status: PayoutVerificationStatus) {
  const labels: Record<PayoutVerificationStatus, string> = {
    pending: "Pending",
    verified: "Verified",
    rejected: "Rejected",
  };
  return labels[status];
}

export function formatPayoutMethodTypeLabel(type: PayoutMethodType) {
  const labels: Record<PayoutMethodType, string> = {
    bank_account: "Bank Account",
    mobile_money: "Mobile Money",
  };
  return labels[type];
}

export function formatNameMatchLabel(status: PayoutNameMatchStatus) {
  const labels: Record<PayoutNameMatchStatus, string> = {
    matched: "Matched",
    mismatched: "Mismatched",
  };
  return labels[status];
}

export function formatHoldStateLabel(status: PayoutHoldState) {
  const labels: Record<PayoutHoldState, string> = {
    clear: "Hold Clear",
    active: "Hold Active",
  };
  return labels[status];
}

export function formatSettlementReadinessLabel(status: PayoutSettlementReadiness) {
  const labels: Record<PayoutSettlementReadiness, string> = {
    review_required: "Review Required",
    blocked: "Settlement Blocked",
    ready: "Settlement Ready",
  };
  return labels[status];
}

export function formatRiskSeverityLabel(severity: PayoutRiskSeverity) {
  const labels: Record<PayoutRiskSeverity, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };
  return labels[severity];
}

export function formatPayoutReviewActionLabel(action: PayoutReviewAction) {
  const labels: Record<PayoutReviewAction, string> = {
    approve_payout_method: "Approve payout method",
    reject_payout_method: "Reject payout method",
    reverify_payout_method: "Trigger re-verification",
    toggle_settlement_hold: "Toggle settlement hold",
  };
  return labels[action];
}

export function payoutVerificationTone(status: PayoutVerificationStatus) {
  switch (status) {
    case "verified":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "rejected":
      return "danger" as const;
  }
}

export function holdTone(status: PayoutHoldState) {
  return status === "active" ? ("danger" as const) : ("success" as const);
}

export function nameMatchTone(status: PayoutNameMatchStatus) {
  return status === "matched" ? ("success" as const) : ("danger" as const);
}

export function readinessTone(status: PayoutSettlementReadiness) {
  switch (status) {
    case "ready":
      return "success" as const;
    case "review_required":
      return "warning" as const;
    case "blocked":
      return "danger" as const;
  }
}

export function riskTone(severity: PayoutRiskSeverity) {
  switch (severity) {
    case "low":
      return "info" as const;
    case "medium":
      return "warning" as const;
    case "high":
    case "critical":
      return "danger" as const;
  }
}

export const payoutReasonCodes = reasonLabels;
