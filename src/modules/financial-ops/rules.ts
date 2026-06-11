import type { AdminRole } from "@/modules/auth/types";
import type {
  AdminSettlementRunStatus,
  FinanceBookingLifecycleStatus,
  FinanceFulfillmentLifecycleStatus,
  FinancePaymentLifecycleStatus,
  FinancialOpsAction,
  FinancialOpsFilterState,
  FinancialOpsPolicy,
  FinancialOpsRecord,
  PartnerSettlementStatus,
  RefundStatus,
} from "@/modules/financial-ops/types";

export const financialOpsAllowedRoles: AdminRole[] = ["finance", "super_admin"];

export function getFinancialOpsPolicy(role: AdminRole): FinancialOpsPolicy {
  const canOperate = role === "finance" || role === "super_admin";

  return {
    canRetryRun: canOperate,
    canReconcile: canOperate,
    canFollowRefunds: canOperate,
    canGenerateStatements: canOperate,
    summary: canOperate
      ? "Finance operations can retry runs, reconcile deltas, follow refund recovery, and generate partner settlement statements."
      : "Read-only financial visibility. This role cannot modify settlement operations.",
    allowedRoles: financialOpsAllowedRoles,
  };
}

export function getAvailableFinancialOpsActions(record: FinancialOpsRecord, role: AdminRole): FinancialOpsAction[] {
  const policy = getFinancialOpsPolicy(role);
  const actions: FinancialOpsAction[] = [];

  if (policy.canRetryRun && record.partnerSettlementStatus === "pending_completion") {
    actions.push("start_settlement_processing");
  }

  if (
    policy.canRetryRun &&
    record.partnerSettlementStatus === "processing" &&
    record.reconciliationDeltaAmount === 0
  ) {
    actions.push("mark_settlement_paid");
  }

  if (policy.canRetryRun && (record.adminRunStatus === "failed" || record.adminRunStatus === "partial")) {
    actions.push("retry_settlement");
  }

  if (policy.canReconcile && record.reconciliationDeltaAmount !== 0) {
    actions.push("reconcile_case");
  }

  if (policy.canFollowRefunds && (record.refundStatus === "requested" || record.refundStatus === "disputed")) {
    actions.push("notify_partner_refund");
  }

  if (policy.canFollowRefunds && (record.refundStatus === "partner_notified" || record.refundStatus === "disputed")) {
    actions.push("recover_refund");
  }

  if (policy.canGenerateStatements && record.partnerSettlementStatus !== "pending_completion") {
    actions.push("generate_statement");
  }

  return actions;
}

export function validateFinancialOpsAction(record: FinancialOpsRecord, action: FinancialOpsAction, role: AdminRole, note: string) {
  const policy = getFinancialOpsPolicy(role);

  if (note.trim().length < 12) {
    return "Add an audit note of at least 12 characters before applying this finance action.";
  }

  if (action === "start_settlement_processing" && !policy.canRetryRun) return "This role cannot start settlement processing.";
  if (action === "mark_settlement_paid" && !policy.canRetryRun) return "This role cannot mark settlements paid.";
  if (action === "retry_settlement" && !policy.canRetryRun) return "This role cannot retry settlement runs.";
  if (action === "reconcile_case" && !policy.canReconcile) return "This role cannot reconcile settlement deltas.";
  if ((action === "notify_partner_refund" || action === "recover_refund") && !policy.canFollowRefunds) {
    return "This role cannot manage refund follow-up actions.";
  }
  if (action === "generate_statement" && !policy.canGenerateStatements) {
    return "This role cannot generate settlement statements.";
  }

  if (action === "start_settlement_processing" && record.partnerSettlementStatus !== "pending_completion") {
    return "Only pending-completion settlements can move into processing.";
  }

  if (action === "mark_settlement_paid" && record.partnerSettlementStatus !== "processing") {
    return "Only processing settlements can be marked paid.";
  }

  if (action === "mark_settlement_paid" && record.reconciliationDeltaAmount !== 0) {
    return "Reconcile the settlement delta before marking this settlement paid.";
  }

  if (action === "retry_settlement" && record.adminRunStatus !== "failed" && record.adminRunStatus !== "partial") {
    return "Only failed or partial settlement runs can be retried.";
  }

  if (action === "reconcile_case" && record.reconciliationDeltaAmount === 0) {
    return "This settlement case is already balanced.";
  }

  if (action === "notify_partner_refund" && record.refundStatus !== "requested" && record.refundStatus !== "disputed") {
    return "Refund partner notification is only available for requested or disputed refunds.";
  }

  if (action === "recover_refund" && record.refundStatus !== "partner_notified" && record.refundStatus !== "disputed") {
    return "Refund recovery is only available after partner notification or during a dispute.";
  }

  if (action === "generate_statement" && record.partnerSettlementStatus === "pending_completion") {
    return "Generate statements only after settlement moves beyond pending completion.";
  }

  return null;
}

export function matchesFinancialOpsFilter(record: FinancialOpsRecord, filters: FinancialOpsFilterState) {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery =
    query.length === 0 ||
    record.title.toLowerCase().includes(query) ||
    record.partnerName.toLowerCase().includes(query) ||
    record.bookingReference.toLowerCase().includes(query) ||
    record.region.toLowerCase().includes(query);

  const matchesPartnerStatus =
    filters.partnerSettlementStatus === "all" || record.partnerSettlementStatus === filters.partnerSettlementStatus;
  const matchesRunStatus = filters.adminRunStatus === "all" || record.adminRunStatus === filters.adminRunStatus;
  const matchesRefundStatus = filters.refundStatus === "all" || record.refundStatus === filters.refundStatus;
  const matchesRegion = filters.region === "all" || record.region === filters.region;

  return matchesQuery && matchesPartnerStatus && matchesRunStatus && matchesRefundStatus && matchesRegion;
}

export function buildFinancialOpsSummary(records: FinancialOpsRecord[]) {
  return {
    settlementExceptions: records.filter((record) => record.adminRunStatus === "failed" || record.adminRunStatus === "partial").length,
    refundFollowUps: records.filter(
      (record) => record.refundStatus === "requested" || record.refundStatus === "partner_notified" || record.refundStatus === "disputed",
    ).length,
    unbalancedCases: records.filter((record) => record.reconciliationDeltaAmount !== 0).length,
    statementsPending: records.filter((record) => record.statements.length === 0 && record.partnerSettlementStatus !== "pending_completion").length,
  };
}

export function formatPartnerSettlementStatusLabel(status: PartnerSettlementStatus) {
  const labels: Record<PartnerSettlementStatus, string> = {
    pending_completion: "Pending Completion",
    processing: "Processing",
    paid: "Paid",
    failed: "Failed",
    reversed: "Reversed",
  };
  return labels[status];
}

export function formatAdminRunStatusLabel(status: AdminSettlementRunStatus) {
  const labels: Record<AdminSettlementRunStatus, string> = {
    queued: "Queued",
    processing: "Processing",
    completed: "Completed",
    partial: "Partial",
    failed: "Failed",
  };
  return labels[status];
}

export function formatRefundStatusLabel(status: RefundStatus) {
  const labels: Record<RefundStatus, string> = {
    requested: "Requested",
    partner_notified: "Partner Notified",
    refunded: "Refunded",
    disputed: "Disputed",
    recovered: "Recovered",
  };
  return labels[status];
}

export function formatBookingLifecycleStatusLabel(status: FinanceBookingLifecycleStatus) {
  const labels: Record<FinanceBookingLifecycleStatus, string> = {
    confirmed: "Booking Confirmed",
    amended: "Booking Amended",
    cancelled: "Booking Cancelled",
    completed: "Booking Completed",
    payment_failed: "Payment Failed",
    refunded: "Booking Refunded",
  };
  return labels[status];
}

export function formatPaymentLifecycleStatusLabel(status: FinancePaymentLifecycleStatus) {
  const labels: Record<FinancePaymentLifecycleStatus, string> = {
    pending: "Payment Pending",
    failed: "Payment Failed",
    succeeded: "Payment Succeeded",
  };
  return labels[status];
}

export function formatFulfillmentLifecycleStatusLabel(status: FinanceFulfillmentLifecycleStatus) {
  const labels: Record<FinanceFulfillmentLifecycleStatus, string> = {
    pending_completion: "Service Pending Completion",
    completed: "Service Completed",
  };
  return labels[status];
}

export function partnerSettlementTone(status: PartnerSettlementStatus) {
  switch (status) {
    case "paid":
      return "success" as const;
    case "processing":
    case "pending_completion":
      return "warning" as const;
    case "failed":
    case "reversed":
      return "danger" as const;
  }
}

export function adminRunTone(status: AdminSettlementRunStatus) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "queued":
    case "processing":
      return "info" as const;
    case "partial":
      return "warning" as const;
    case "failed":
      return "danger" as const;
  }
}

export function refundTone(status: RefundStatus) {
  switch (status) {
    case "refunded":
    case "recovered":
      return "success" as const;
    case "partner_notified":
      return "info" as const;
    case "requested":
    case "disputed":
      return "warning" as const;
  }
}

export function bookingLifecycleTone(status: FinanceBookingLifecycleStatus) {
  switch (status) {
    case "completed":
    case "refunded":
      return "success" as const;
    case "confirmed":
    case "amended":
      return "info" as const;
    case "cancelled":
    case "payment_failed":
      return "danger" as const;
  }
}

export function paymentLifecycleTone(status: FinancePaymentLifecycleStatus) {
  switch (status) {
    case "succeeded":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "failed":
      return "danger" as const;
  }
}

export function fulfillmentLifecycleTone(status: FinanceFulfillmentLifecycleStatus) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "pending_completion":
      return "warning" as const;
  }
}
