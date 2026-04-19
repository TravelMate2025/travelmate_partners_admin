import type { AdminRole } from "@/modules/auth/types";
import {
  getAvailablePayoutReviewActions,
  getReasonLabel,
  validatePayoutReviewAction,
} from "@/modules/payout-review/rules";
import type {
  PayoutReviewAction,
  PayoutReviewActionPayload,
  PayoutReviewActionResult,
  PayoutReviewAuditRecord,
  PayoutReviewReasonCode,
  PayoutReviewRecord,
} from "@/modules/payout-review/types";

function buildActionLabel(action: PayoutReviewAction, holdState: PayoutReviewRecord["holdState"]) {
  const labels: Record<PayoutReviewAction, string> = {
    approve_payout_method: "approved payout method for",
    reject_payout_method: "rejected payout method for",
    reverify_payout_method: "sent payout method back to re-verification for",
    toggle_settlement_hold: holdState === "active" ? "released the settlement hold for" : "placed a settlement hold on",
  };
  return labels[action];
}

function buildAuditSummary(
  actor: string,
  action: PayoutReviewAction,
  reasonCode: PayoutReviewReasonCode,
  record: PayoutReviewRecord,
) {
  return `${actor} ${buildActionLabel(action, record.holdState)} ${record.title} with reason ${getReasonLabel(reasonCode).toLowerCase()}.`;
}

function buildActivityTitle(action: PayoutReviewAction, holdState: PayoutReviewRecord["holdState"]) {
  const labels: Record<PayoutReviewAction, string> = {
    approve_payout_method: "Payout method approved",
    reject_payout_method: "Payout method rejected",
    reverify_payout_method: "Re-verification triggered",
    toggle_settlement_hold: holdState === "active" ? "Settlement hold released" : "Settlement hold placed",
  };
  return labels[action];
}

function createRiskFlag(record: PayoutReviewRecord, payload: PayoutReviewActionPayload) {
  return {
    id: `risk-${record.id}-${Date.now()}`,
    label: getReasonLabel(payload.reasonCode),
    detail: payload.note.trim(),
    severity: "high" as const,
    requiresReverification: true,
  };
}

export type PayoutReviewRepository = {
  applyAction(
    records: PayoutReviewRecord[],
    payload: PayoutReviewActionPayload,
    role: AdminRole,
  ): Promise<PayoutReviewActionResult>;
};

export const mockPayoutReviewRepository: PayoutReviewRepository = {
  async applyAction(records, payload, role) {
    const record = records.find((item) => item.id === payload.caseId);

    if (!record) {
      throw new Error("Selected payout review case was not found.");
    }

    const availableActions = getAvailablePayoutReviewActions(record, role);
    if (!availableActions.includes(payload.action)) {
      throw new Error("This action is not available for the selected payout review case and role.");
    }

    const validationError = validatePayoutReviewAction(record, payload.action, role, payload.note, payload.reasonCode);
    if (validationError) {
      throw new Error(validationError);
    }

    const timestamp = new Date().toISOString();
    const auditRecord: PayoutReviewAuditRecord = {
      eventId: `payout-audit-${record.id}-${Date.now()}`,
      caseId: record.id,
      actor: payload.actor,
      action: payload.action,
      reasonCode: payload.reasonCode,
      summary: buildAuditSummary(payload.actor, payload.action, payload.reasonCode, record),
      status: "queued_for_payout_governance",
    };

    const updatedRecord: PayoutReviewRecord = {
      ...record,
      status:
        payload.action === "approve_payout_method"
          ? "verified"
          : payload.action === "reject_payout_method"
            ? "rejected"
            : payload.action === "reverify_payout_method"
              ? "pending"
              : record.status,
      holdState:
        payload.action === "approve_payout_method"
          ? "clear"
          : payload.action === "reject_payout_method" || payload.action === "reverify_payout_method"
            ? "active"
            : record.holdState === "active"
              ? "clear"
              : "active",
      settlementReadiness:
        payload.action === "approve_payout_method"
          ? "ready"
          : payload.action === "reject_payout_method"
            ? "blocked"
            : payload.action === "reverify_payout_method"
              ? "review_required"
              : record.holdState === "active"
                ? "ready"
                : "review_required",
      verifiedAt:
        payload.action === "approve_payout_method"
          ? timestamp
          : payload.action === "reject_payout_method" || payload.action === "reverify_payout_method"
            ? undefined
            : record.verifiedAt,
      rejectionReason: payload.action === "reject_payout_method" ? getReasonLabel(payload.reasonCode) : undefined,
      lastUpdatedAt: timestamp,
      operationalNote: payload.note.trim(),
      riskFlags:
        payload.action === "reverify_payout_method" && !record.riskFlags.some((flag) => flag.label === getReasonLabel(payload.reasonCode))
          ? [createRiskFlag(record, payload), ...record.riskFlags]
          : record.riskFlags,
      activity: [
        {
          id: `payout-activity-${record.id}-${Date.now()}`,
          title: buildActivityTitle(payload.action, record.holdState),
          detail: `${payload.actor} recorded ${getReasonLabel(payload.reasonCode).toLowerCase()} and documented the payout review decision for this partner method.`,
          time: timestamp.slice(11, 16) + " UTC",
          tone:
            payload.action === "approve_payout_method"
              ? "success"
              : payload.action === "toggle_settlement_hold"
                ? record.holdState === "active"
                  ? "success"
                  : "danger"
                : payload.action === "reject_payout_method"
                  ? "danger"
                  : "warning",
        },
        ...record.activity,
      ],
    };

    return {
      records: records.map((item) => (item.id === record.id ? updatedRecord : item)),
      updatedRecord,
      auditRecord,
    };
  },
};
