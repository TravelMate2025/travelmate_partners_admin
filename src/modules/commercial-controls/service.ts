import { canApplyCommercialAction, getCommercialEditableField, validateCommercialAdjustment, validateCommercialRuleUpdate } from "@/modules/commercial-controls/rules";
import type {
  CommercialAction,
  CommercialActionPayload,
  CommercialActionResult,
  CommercialAdjustmentPayload,
  CommercialRuleRecord,
  CommercialRuleUpdatePayload,
} from "@/modules/commercial-controls/types";
import type { AdminRole } from "@/modules/auth/types";

function formatTimestamp(date: string) {
  return new Date(date)
    .toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    })
    .replace(",", " UTC");
}

function buildAuditSummary(actor: string, action: CommercialAction, title: string) {
  switch (action) {
    case "update_rule":
      return `${actor} updated commercial rule ${title}.`;
    case "create_adjustment":
      return `${actor} recorded a manual commercial adjustment for ${title}.`;
  }
}

function applyRuleUpdate(record: CommercialRuleRecord, payload: CommercialRuleUpdatePayload) {
  const timestamp = new Date().toISOString();
  const note = payload.note.trim();
  const editableField = getCommercialEditableField(record);
  const nextCommissionRatePercent =
    editableField === "commission" ? payload.commissionRatePercent : record.commissionRatePercent;
  const nextServiceFeeFlatAmount =
    editableField === "service_fee" ? payload.serviceFeeFlatAmount : record.serviceFeeFlatAmount;

  return {
    ...record,
    commissionRatePercent: nextCommissionRatePercent,
    serviceFeeFlatAmount: nextServiceFeeFlatAmount,
    effectiveDate: payload.effectiveDate,
    lastUpdatedAt: timestamp,
    lastUpdatedBy: payload.actor,
    operationalNote: note,
    summary:
      record.ruleType === "commission"
        ? `Commission now set to ${nextCommissionRatePercent}% for the selected commercial scope.`
        : `Service fee now set to ${nextServiceFeeFlatAmount} USD for the selected commercial scope.`,
    downstreamImpactSummary: `${record.scope === "partner" ? "Partner override" : "Fee rule"} now flows into settlement previews and partner-facing fee visibility from ${payload.effectiveDate}. ${record.ruleType === "commission" ? "Service fee remains unchanged." : "Commission remains unchanged."}`,
    partnerSettings: record.partnerSettings.map((setting) => ({
      ...setting,
      commissionRatePercent: nextCommissionRatePercent,
      serviceFeeFlatAmount: nextServiceFeeFlatAmount,
      overrideReason:
        record.scope === "partner"
          ? "Partner-specific override updated through admin commercial controls."
          : `Inherited ${record.scope} commercial rule updated on ${payload.effectiveDate}.`,
    })),
    history: [
      {
        id: `commercial-history-${record.id}-rule-${Date.now()}`,
        actor: payload.actor,
        action: "Commercial rule updated",
        timestamp: formatTimestamp(timestamp),
        note,
      },
      ...record.history,
    ],
  };
}

function applyAdjustment(record: CommercialRuleRecord, payload: CommercialAdjustmentPayload) {
  const timestamp = new Date().toISOString();
  const note = payload.note.trim();

  return {
    ...record,
    operationalNote: note,
    manualAdjustmentHistory: [
      {
        id: `commercial-adjustment-${record.id}-${Date.now()}`,
        partnerName: payload.partnerName,
        direction: payload.direction,
        amount: payload.amount,
        currency: "USD",
        reason: payload.reason.trim(),
        note,
        createdAt: formatTimestamp(timestamp),
        createdBy: payload.actor,
      },
      ...record.manualAdjustmentHistory,
    ],
    history: [
      {
        id: `commercial-history-${record.id}-adjustment-${Date.now()}`,
        actor: payload.actor,
        action: "Manual adjustment recorded",
        timestamp: formatTimestamp(timestamp),
        note,
      },
      ...record.history,
    ],
  };
}

export type CommercialControlsRepository = {
  applyAction(
    records: CommercialRuleRecord[],
    payload: CommercialActionPayload,
    role: AdminRole,
  ): Promise<CommercialActionResult>;
};

export const mockCommercialControlsRepository: CommercialControlsRepository = {
  async applyAction(records, payload, role) {
    const record = records.find((item) => item.id === payload.ruleId);

    if (!record) {
      throw new Error("Selected commercial rule was not found.");
    }

    if (!canApplyCommercialAction(role, record, payload.action)) {
      throw new Error(`Action ${payload.action} is not allowed for this commercial rule.`);
    }

    const validationError =
      payload.action === "update_rule"
        ? validateCommercialRuleUpdate(payload, record)
        : validateCommercialAdjustment(payload, record);

    if (validationError) {
      throw new Error(validationError);
    }

    const updatedRecord = {
      ...(payload.action === "update_rule" ? applyRuleUpdate(record, payload) : applyAdjustment(record, payload)),
      latestAuditRecord: {
        eventId: `commercial-audit-${payload.action}-${Date.now()}`,
        actor: payload.actor,
        ruleId: record.id,
        action: payload.action,
        summary: buildAuditSummary(payload.actor, payload.action, record.title),
        status: "queued_for_backend" as const,
        ruleChangeDetails:
          payload.action === "update_rule"
            ? {
                ruleType: record.ruleType,
                previousValue: record.ruleType === "commission" ? record.commissionRatePercent : record.serviceFeeFlatAmount,
                nextValue: record.ruleType === "commission" ? payload.commissionRatePercent : payload.serviceFeeFlatAmount,
                effectiveDate: payload.effectiveDate,
              }
            : undefined,
        adjustmentDetails:
          payload.action === "create_adjustment"
            ? {
                partnerName: payload.partnerName,
                direction: payload.direction,
                amount: payload.amount,
                currency: "USD",
                reason: payload.reason.trim(),
              }
            : undefined,
      },
    };

    return {
      records: records.map((item) => (item.id === record.id ? updatedRecord : item)),
      updatedRecord,
      auditRecord: updatedRecord.latestAuditRecord,
    };
  },
};
