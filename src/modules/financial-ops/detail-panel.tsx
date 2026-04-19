import Link from "next/link";

import { ActivityTimeline } from "@/components/common/activity-timeline";
import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import {
  adminRunTone,
  formatAdminRunStatusLabel,
  formatPartnerSettlementStatusLabel,
  formatRefundStatusLabel,
  partnerSettlementTone,
  refundTone,
} from "@/modules/financial-ops/rules";
import type { FinancialOpsAction, FinancialOpsRecord } from "@/modules/financial-ops/types";

function getActionLabel(action: FinancialOpsAction) {
  const labels: Record<FinancialOpsAction, { idle: string; pending: string }> = {
    retry_settlement: { idle: "Retry settlement run", pending: "Retrying..." },
    reconcile_case: { idle: "Reconcile case", pending: "Reconciling..." },
    notify_partner_refund: { idle: "Notify partner refund", pending: "Queueing refund follow-up..." },
    recover_refund: { idle: "Record refund recovery", pending: "Recording recovery..." },
    generate_statement: { idle: "Generate statement", pending: "Generating statement..." },
  };
  return labels[action];
}

export function FinancialOpsDetailPanel({
  selectedRecord,
  emptyState,
  note,
  pendingAction,
  feedback,
  policySummary,
  availableActions,
  onNoteChange,
  onAction,
  onResetSelection,
}: {
  selectedRecord: FinancialOpsRecord | null;
  emptyState?: { title: string; description: string } | null;
  note: string;
  pendingAction: FinancialOpsAction | null;
  feedback: { tone: "success" | "error"; message: string } | null;
  policySummary: string;
  availableActions: FinancialOpsAction[];
  onNoteChange: (value: string) => void;
  onAction: (action: FinancialOpsAction) => void;
  onResetSelection: () => void;
}) {
  if (emptyState) {
    return (
      <article className="tm-panel">
        <SurfaceState description={emptyState.description} title={emptyState.title} tone="empty" />
      </article>
    );
  }

  if (!selectedRecord) {
    return (
      <article className="tm-panel">
        <SurfaceState
          actionLabel="Reset selection"
          description="The selected settlement case is no longer available in this finance snapshot."
          onAction={onResetSelection}
          title="Selected settlement case was not found"
          tone="exception"
        />
      </article>
    );
  }

  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Settlement Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedRecord.title}</h2>
          <p className="tm-muted mt-2 text-sm">{selectedRecord.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label={formatPartnerSettlementStatusLabel(selectedRecord.partnerSettlementStatus)}
            tone={partnerSettlementTone(selectedRecord.partnerSettlementStatus)}
          />
          <StatusBadge
            label={formatAdminRunStatusLabel(selectedRecord.adminRunStatus)}
            tone={adminRunTone(selectedRecord.adminRunStatus)}
          />
          {selectedRecord.refundStatus ? (
            <StatusBadge label={formatRefundStatusLabel(selectedRecord.refundStatus)} tone={refundTone(selectedRecord.refundStatus)} />
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Partner</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{selectedRecord.partnerName}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Booking</p>
          <p className="mt-2 text-sm text-slate-900">{selectedRecord.bookingReference}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Expected payout</p>
          <p className="mt-2 text-sm text-slate-900">
            {selectedRecord.currency} {selectedRecord.expectedPayoutAmount.toFixed(2)}
          </p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Current payout</p>
          <p className="mt-2 text-sm text-slate-900">
            {selectedRecord.currency} {selectedRecord.netPayoutAmount.toFixed(2)}
          </p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Reconciliation delta</p>
          <p className="mt-2 text-sm text-slate-900">
            {selectedRecord.currency} {selectedRecord.reconciliationDeltaAmount.toFixed(2)}
          </p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Settlement period</p>
          <p className="mt-2 text-sm text-slate-900">{selectedRecord.settlementPeriodLabel}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="tm-soft-band">
          <p className="tm-label">Linked finance context</p>
          <div className="mt-4 grid gap-3">
            {selectedRecord.linkedContext.map((item) => (
              <Link className="tm-document-card block" href={item.href} key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                    <p className="tm-muted mt-2 text-sm capitalize">{item.kind}</p>
                  </div>
                  <StatusBadge label={item.statusLabel} tone="info" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="tm-soft-band">
          <p className="tm-label">Audit note and actions</p>
          <textarea
            aria-label="Financial operations note"
            className="tm-textarea mt-3"
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Capture reconciliation reasoning, retry approval, refund follow-up, or statement context..."
            value={note}
          />
          <p className="tm-muted mt-3 text-sm">{policySummary}</p>

          {selectedRecord.failureReason ? (
            <div className="tm-alert tm-alert-danger mt-4">{selectedRecord.failureReason}</div>
          ) : null}

          {feedback ? (
            <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>
              {feedback.message}
            </div>
          ) : null}

          {availableActions.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {availableActions.map((action) => {
                const { idle, pending } = getActionLabel(action);
                const isPending = pendingAction === action;
                const isBlocked = pendingAction !== null && !isPending;
                const isNeutral = action === "generate_statement" || action === "reconcile_case";
                return (
                  <button
                    aria-label={idle}
                    className={`tm-btn ${isNeutral ? "tm-btn-outline" : "tm-btn-primary"}`}
                    disabled={isPending || isBlocked}
                    key={action}
                    onClick={() => onAction(action)}
                    type="button"
                  >
                    {isPending ? pending : idle}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="tm-muted mt-5 text-sm">No finance actions are available for this settlement case right now.</p>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="tm-soft-band">
          <p className="tm-label">Reconciliation evidence</p>
          <div className="mt-4 grid gap-3">
            {selectedRecord.evidence.map((item) => (
              <div className="tm-document-card" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                    <p className="tm-muted mt-2 text-sm">{item.value}</p>
                  </div>
                  <StatusBadge label={item.tone} tone={item.tone} />
                </div>
              </div>
            ))}
          </div>

          <div className="tm-soft-band mt-4">
            <p className="tm-label">Settlement statements</p>
            {selectedRecord.statements.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {selectedRecord.statements.map((statement) => (
                  <div className="tm-document-card" key={statement.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{statement.fileName}</p>
                        <p className="tm-muted mt-2 text-sm">
                          {statement.actor} · {statement.generatedAt.slice(0, 16).replace("T", " ")}
                        </p>
                      </div>
                      <StatusBadge label={statement.status} tone={statement.status === "generated" ? "success" : "info"} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="tm-muted mt-3 text-sm">No settlement statements have been generated yet for this case.</p>
            )}
          </div>
        </div>

        <div className="tm-soft-band">
          <p className="tm-label">Financial audit trail</p>
          <div className="mt-4">
            <ActivityTimeline items={selectedRecord.activity} />
          </div>
        </div>
      </div>
    </article>
  );
}
