import type { AdminRole } from "@/modules/auth/types";
import { getAvailableFinancialOpsActions, validateFinancialOpsAction } from "@/modules/financial-ops/rules";
import type {
  FinancialOpsAction,
  FinancialOpsActionPayload,
  FinancialOpsActionResult,
  FinancialOpsAuditRecord,
  FinancialOpsRecord,
} from "@/modules/financial-ops/types";

function buildActionSummary(actor: string, action: FinancialOpsAction, title: string) {
  const labels: Record<FinancialOpsAction, string> = {
    retry_settlement: "queued a settlement retry for",
    reconcile_case: "reconciled",
    notify_partner_refund: "queued refund follow-up for",
    recover_refund: "recorded refund recovery for",
    generate_statement: "generated a settlement statement for",
  };

  return `${actor} ${labels[action]} ${title}.`;
}

function buildActivityTitle(action: FinancialOpsAction) {
  const labels: Record<FinancialOpsAction, string> = {
    retry_settlement: "Settlement retry queued",
    reconcile_case: "Case reconciled",
    notify_partner_refund: "Partner refund follow-up queued",
    recover_refund: "Refund recovered",
    generate_statement: "Settlement statement generated",
  };
  return labels[action];
}

export type FinancialOpsRepository = {
  applyAction(
    records: FinancialOpsRecord[],
    payload: FinancialOpsActionPayload,
    role: AdminRole,
  ): Promise<FinancialOpsActionResult>;
};

type FinancialOpsListEnvelope = {
  data?: { records?: FinancialOpsRecord[] };
  message?: string;
  error?: { message?: string };
};

type FinancialOpsDecisionEnvelope = {
  data?: FinancialOpsActionResult;
  message?: string;
  error?: { message?: string };
};

export const mockFinancialOpsRepository: FinancialOpsRepository = {
  async applyAction(records, payload, role) {
    const record = records.find((item) => item.id === payload.caseId);

    if (!record) {
      throw new Error("Selected financial operations case was not found.");
    }

    const availableActions = getAvailableFinancialOpsActions(record, role);
    if (!availableActions.includes(payload.action)) {
      throw new Error("This action is not available for the selected financial operations case and role.");
    }

    const validationError = validateFinancialOpsAction(record, payload.action, role, payload.note);
    if (validationError) {
      throw new Error(validationError);
    }

    const timestamp = new Date().toISOString();
    const auditRecord: FinancialOpsAuditRecord = {
      eventId: `financial-ops-audit-${record.id}-${Date.now()}`,
      caseId: record.id,
      actor: payload.actor,
      action: payload.action,
      summary: buildActionSummary(payload.actor, payload.action, record.title),
      status: "queued_for_finance_ops",
    };

    const updatedRecord: FinancialOpsRecord = {
      ...record,
      adminRunStatus:
        payload.action === "retry_settlement"
          ? "processing"
          : payload.action === "reconcile_case" && record.adminRunStatus === "partial"
            ? "completed"
            : record.adminRunStatus,
      partnerSettlementStatus:
        payload.action === "retry_settlement"
          ? "processing"
          : payload.action === "reconcile_case" && record.partnerSettlementStatus === "failed"
            ? "processing"
            : record.partnerSettlementStatus,
      refundStatus:
        payload.action === "notify_partner_refund"
          ? "partner_notified"
          : payload.action === "recover_refund"
            ? "recovered"
            : record.refundStatus,
      reconciliationDeltaAmount:
        payload.action === "reconcile_case" || payload.action === "recover_refund"
          ? 0
          : record.reconciliationDeltaAmount,
      failureReason:
        payload.action === "retry_settlement" || payload.action === "reconcile_case"
          ? null
          : record.failureReason,
      operationalNote: payload.note.trim(),
      statements:
        payload.action === "generate_statement"
          ? [
              {
                id: `financial-statement-${record.id}-${Date.now()}`,
                fileName: `travelmate-statement-${record.partnerName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${record.settlementPeriodLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
                generatedAt: timestamp,
                actor: payload.actor,
                status: "queued_for_backend",
              },
              ...record.statements,
            ]
          : record.statements,
      evidence: record.evidence.map((entry) =>
        entry.label === "Run delta"
          ? {
              ...entry,
              value:
                payload.action === "reconcile_case" || payload.action === "recover_refund"
                  ? "$0.00"
                  : entry.value,
              tone:
                payload.action === "reconcile_case" || payload.action === "recover_refund"
                  ? "success"
                  : entry.tone,
            }
          : entry,
      ),
      activity: [
        {
          id: `financial-ops-activity-${record.id}-${Date.now()}`,
          title: buildActivityTitle(payload.action),
          detail:
            payload.action === "retry_settlement"
              ? `${payload.actor} queued a settlement retry after documenting the reconciliation exception.`
              : payload.action === "reconcile_case"
                ? `${payload.actor} balanced the settlement delta and prepared the case for finance visibility.`
                : payload.action === "notify_partner_refund"
                  ? `${payload.actor} queued a partner refund follow-up so the reverse-settlement trail remains traceable.`
                  : payload.action === "recover_refund"
                    ? `${payload.actor} recorded refund recovery after partner acknowledgement and finance confirmation.`
                    : `${payload.actor} generated a settlement statement so partner payout visibility stays aligned with the admin run.`,
          time: timestamp.slice(11, 16) + " UTC",
          tone:
            payload.action === "retry_settlement" || payload.action === "notify_partner_refund"
              ? "warning"
              : "success",
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

export async function fetchFinancialOpsRecords(): Promise<FinancialOpsRecord[]> {
  const response = await fetch("/api/backend/financial-ops/cases", {
    method: "GET",
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as FinancialOpsListEnvelope | null;
  if (!response.ok || !body?.data?.records) {
    throw new Error(body?.message ?? body?.error?.message ?? "Unable to load financial operations queue.");
  }
  return body.data.records;
}

export const realFinancialOpsRepository: FinancialOpsRepository = {
  async applyAction(_records, payload, _role) {
    const response = await fetch(`/api/backend/financial-ops/cases/${encodeURIComponent(payload.caseId)}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as FinancialOpsDecisionEnvelope | null;
    if (!response.ok || !body?.data?.records || !body.data.updatedRecord || !body.data.auditRecord) {
      throw new Error(body?.message ?? body?.error?.message ?? "Unable to apply financial operations action.");
    }
    return body.data;
  },
};
