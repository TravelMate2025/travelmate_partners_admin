import Link from "next/link";

import { ActivityTimeline } from "@/components/common/activity-timeline";
import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import {
  formatHoldStateLabel,
  formatNameMatchLabel,
  formatPayoutMethodTypeLabel,
  formatPayoutReviewActionLabel,
  formatPayoutVerificationStatusLabel,
  formatRiskSeverityLabel,
  formatSettlementReadinessLabel,
  holdTone,
  nameMatchTone,
  payoutVerificationTone,
  readinessTone,
  riskTone,
} from "@/modules/payout-review/rules";
import type {
  PayoutDetailField,
  PayoutReviewAction,
  PayoutReviewReasonCode,
  PayoutReviewRecord,
} from "@/modules/payout-review/types";

function getActionButtonCopy(action: PayoutReviewAction, pendingAction: PayoutReviewAction | null, holdState: PayoutReviewRecord["holdState"] | undefined) {
  if (pendingAction !== action) {
    if (action === "toggle_settlement_hold") {
      return holdState === "active" ? "Release settlement hold" : "Place settlement hold";
    }
    return formatPayoutReviewActionLabel(action);
  }

  if (action === "approve_payout_method") return "Approving...";
  if (action === "reject_payout_method") return "Rejecting...";
  if (action === "reverify_payout_method") return "Sending to re-verification...";
  return holdState === "active" ? "Releasing hold..." : "Placing hold...";
}

export function PayoutReviewDetailPanel({
  selectedRecord,
  emptyState,
  note,
  pendingAction,
  feedback,
  policySummary,
  visibleFields,
  availableActions,
  reasonCode,
  reasonOptions,
  onNoteChange,
  onReasonChange,
  onAction,
  onResetSelection,
  isMaskedView,
}: {
  selectedRecord: PayoutReviewRecord | null;
  emptyState?: { title: string; description: string } | null;
  note: string;
  pendingAction: PayoutReviewAction | null;
  feedback: { tone: "success" | "error"; message: string } | null;
  policySummary: string;
  visibleFields: PayoutDetailField[];
  availableActions: PayoutReviewAction[];
  reasonCode: PayoutReviewReasonCode;
  reasonOptions: Array<{ value: PayoutReviewReasonCode; label: string }>;
  onNoteChange: (value: string) => void;
  onReasonChange: (value: PayoutReviewReasonCode) => void;
  onAction: (action: PayoutReviewAction) => void;
  onResetSelection: () => void;
  isMaskedView: boolean;
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
          description="The selected payout review case is no longer available in this snapshot."
          onAction={onResetSelection}
          title="Selected payout review case was not found"
          tone="exception"
        />
      </article>
    );
  }

  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Payout Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedRecord.title}</h2>
          <p className="tm-muted mt-2 text-sm">{selectedRecord.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={formatPayoutVerificationStatusLabel(selectedRecord.status)} tone={payoutVerificationTone(selectedRecord.status)} />
          <StatusBadge label={formatHoldStateLabel(selectedRecord.holdState)} tone={holdTone(selectedRecord.holdState)} />
          <StatusBadge
            label={formatSettlementReadinessLabel(selectedRecord.settlementReadiness)}
            tone={readinessTone(selectedRecord.settlementReadiness)}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Partner</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{selectedRecord.partnerName}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Method</p>
          <p className="mt-2 text-sm text-slate-900">{formatPayoutMethodTypeLabel(selectedRecord.methodType)}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Country / currency</p>
          <p className="mt-2 text-sm text-slate-900">
            {selectedRecord.country} / {selectedRecord.currency}
          </p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Name match</p>
          <div className="mt-2">
            <StatusBadge label={formatNameMatchLabel(selectedRecord.nameMatchStatus)} tone={nameMatchTone(selectedRecord.nameMatchStatus)} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="tm-soft-band">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="tm-label">Payout details</p>
              <p className="tm-muted mt-2 text-sm">
                {selectedRecord.maskedSummary} · submitted {selectedRecord.verificationSubmittedAt.slice(0, 16).replace("T", " ")}
              </p>
            </div>
            {selectedRecord.isDefault ? <StatusBadge label="Default method" tone="info" /> : null}
          </div>

          {isMaskedView ? (
            <div className="tm-alert mt-4">Sensitive settlement account fields are masked for this role. Finance can see the unmasked values.</div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {visibleFields.map((field) => (
              <div className="tm-document-card" key={field.id}>
                <p className="tm-label">{field.label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{field.value}</p>
                {field.masked ? <p className="tm-muted mt-2 text-xs">Masked by role policy</p> : null}
              </div>
            ))}
          </div>

          <div className="tm-soft-band mt-4">
            <p className="tm-label">Risk and hold signals</p>
            <div className="mt-3 grid gap-3">
              {selectedRecord.riskFlags.map((flag) => (
                <div className="tm-document-card" key={flag.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{flag.label}</p>
                      <p className="tm-muted mt-2 text-sm">{flag.detail}</p>
                    </div>
                    <StatusBadge label={formatRiskSeverityLabel(flag.severity)} tone={riskTone(flag.severity)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="tm-soft-band">
          <p className="tm-label">Audit note and actions</p>
          <textarea
            aria-label="Payout review note"
            className="tm-textarea mt-3"
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Capture payout approval context, rejection reason, re-verification rationale, or hold decision..."
            value={note}
          />

          <label className="block mt-4">
            <span className="tm-label">Reason code</span>
            <select
              aria-label="Payout review reason code"
              className="tm-input mt-3"
              onChange={(event) => onReasonChange(event.target.value as PayoutReviewReasonCode)}
              value={reasonCode}
            >
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <p className="tm-muted mt-3 text-sm">{policySummary}</p>

          {selectedRecord.rejectionReason ? (
            <div className="tm-alert tm-alert-danger mt-4">Latest rejection reason: {selectedRecord.rejectionReason}</div>
          ) : null}

          {feedback ? (
            <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>
              {feedback.message}
            </div>
          ) : null}

          {availableActions.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {availableActions.map((action) => {
                const isPending = pendingAction === action;
                const isBlocked = pendingAction !== null && !isPending;
                const isNeutral = action === "toggle_settlement_hold" || action === "reverify_payout_method";
                return (
                  <button
                    aria-label={formatPayoutReviewActionLabel(action)}
                    className={`tm-btn ${isNeutral ? "tm-btn-outline" : "tm-btn-primary"}`}
                    disabled={isPending || isBlocked}
                    key={action}
                    onClick={() => onAction(action)}
                    type="button"
                  >
                    {getActionButtonCopy(action, pendingAction, selectedRecord.holdState)}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="tm-muted mt-5 text-sm">No payout review actions are available for this case right now.</p>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="tm-soft-band">
          <p className="tm-label">Linked admin context</p>
          <div className="mt-4 grid gap-3">
            {selectedRecord.linkedContext.map((item) => (
              <Link className="tm-document-card block" href={item.href} key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                    <p className="tm-muted mt-2 text-sm capitalize">{item.kind.replace("_", " ")}</p>
                  </div>
                  <StatusBadge label={item.statusLabel} tone="info" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="tm-soft-band">
          <p className="tm-label">Decision history</p>
          <div className="mt-4">
            <ActivityTimeline items={selectedRecord.activity} />
          </div>
        </div>
      </div>
    </article>
  );
}
