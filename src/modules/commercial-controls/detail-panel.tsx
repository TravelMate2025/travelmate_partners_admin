import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import type { AdjustmentDirection, CommercialAction, CommercialRuleRecord } from "@/modules/commercial-controls/types";

function toneForStatus(status: CommercialRuleRecord["status"]) {
  if (status === "active") return "success" as const;
  if (status === "scheduled") return "warning" as const;
  return "neutral" as const;
}

export function CommercialControlsDetailPanel({
  selectedRecord,
  emptyState,
  commissionRatePercent,
  serviceFeeFlatAmount,
  effectiveDate,
  note,
  adjustmentPartner,
  adjustmentDirection,
  adjustmentAmount,
  adjustmentReason,
  pendingAction,
  feedback,
  policySummary,
  allowedActions,
  onCommissionChange,
  onServiceFeeChange,
  onEffectiveDateChange,
  onNoteChange,
  onAdjustmentPartnerChange,
  onAdjustmentDirectionChange,
  onAdjustmentAmountChange,
  onAdjustmentReasonChange,
  onAction,
  onResetSelection,
}: {
  selectedRecord: CommercialRuleRecord | null;
  emptyState?: { title: string; description: string } | null;
  commissionRatePercent: number;
  serviceFeeFlatAmount: number;
  effectiveDate: string;
  note: string;
  adjustmentPartner: string;
  adjustmentDirection: AdjustmentDirection;
  adjustmentAmount: number;
  adjustmentReason: string;
  pendingAction: CommercialAction | null;
  feedback: { tone: "success" | "error"; message: string } | null;
  policySummary: string;
  allowedActions: Record<CommercialAction, boolean> | null;
  onCommissionChange: (value: number) => void;
  onServiceFeeChange: (value: number) => void;
  onEffectiveDateChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onAdjustmentPartnerChange: (value: string) => void;
  onAdjustmentDirectionChange: (value: AdjustmentDirection) => void;
  onAdjustmentAmountChange: (value: number) => void;
  onAdjustmentReasonChange: (value: string) => void;
  onAction: (action: CommercialAction) => void;
  onResetSelection: () => void;
}) {
  if (emptyState) {
    return (
      <article className="tm-panel min-w-0 h-fit">
        <SurfaceState description={emptyState.description} title={emptyState.title} tone="empty" />
      </article>
    );
  }

  if (!selectedRecord) {
    return (
      <article className="tm-panel min-w-0 h-fit">
        <SurfaceState
          actionLabel="Reset commercial selection"
          description="The selected commercial rule is no longer available in the current data snapshot."
          onAction={onResetSelection}
          title="Selected commercial rule was not found"
          tone="exception"
        />
      </article>
    );
  }

  return (
    <article className="tm-panel min-w-0 h-fit">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Rule Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedRecord.title}</h2>
          <p className="tm-muted mt-2 text-sm">
            {selectedRecord.region} · {selectedRecord.scope} scope · last updated by {selectedRecord.lastUpdatedBy}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={selectedRecord.ruleType.replace("_", " ")} tone="info" />
          <StatusBadge label={selectedRecord.status} tone={toneForStatus(selectedRecord.status)} />
          <StatusBadge label={`editable ${selectedRecord.ruleType.replace("_", " ")}`} tone="warning" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Current rule state</p>
          <ul className="tm-bullet-list mt-4">
            <li>Commission: {selectedRecord.commissionRatePercent}%</li>
            <li>Service fee: {selectedRecord.serviceFeeFlatAmount} USD</li>
            <li>Effective date: {selectedRecord.effectiveDate}</li>
            <li>Last updated: {selectedRecord.lastUpdatedAt}</li>
          </ul>
          <p className="mt-4 text-sm text-slate-900">{selectedRecord.summary}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Downstream visibility</p>
          <p className="mt-3 text-sm text-slate-900">{selectedRecord.downstreamImpactSummary}</p>
          <p className="tm-muted mt-3 text-sm">{policySummary}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="tm-label">Commission rate (%)</span>
          <input
            aria-label="Commission rate percent"
            className="tm-input mt-3"
            disabled={selectedRecord.ruleType !== "commission"}
            onChange={(event) => onCommissionChange(Number(event.target.value))}
            type="number"
            value={commissionRatePercent}
          />
          <p className="tm-muted mt-2 text-sm">
            {selectedRecord.ruleType === "commission" ? "This is the primary editable field for this rule." : "Commission is contextual here and stays unchanged when you save this rule."}
          </p>
        </label>
        <label className="block">
          <span className="tm-label">Service fee</span>
          <input
            aria-label="Service fee flat amount"
            className="tm-input mt-3"
            disabled={selectedRecord.ruleType !== "service_fee"}
            onChange={(event) => onServiceFeeChange(Number(event.target.value))}
            type="number"
            value={serviceFeeFlatAmount}
          />
          <p className="tm-muted mt-2 text-sm">
            {selectedRecord.ruleType === "service_fee" ? "This is the primary editable field for this rule." : "Service fee is contextual here and stays unchanged when you save this rule."}
          </p>
        </label>
        <label className="block">
          <span className="tm-label">Effective date</span>
          <input aria-label="Rule effective date" className="tm-input mt-3" onChange={(event) => onEffectiveDateChange(event.target.value)} type="date" value={effectiveDate} />
        </label>
      </div>

      <div className="tm-soft-band mt-5">
        <p className="tm-label">Commercial action note</p>
        <textarea
          className="tm-textarea mt-3"
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Capture pricing rationale, approval context, or adjustment explanation..."
          value={note}
        />
        {selectedRecord.latestAuditRecord ? (
          <div className="tm-alert tm-alert-success mt-4">
            Audit prep: {selectedRecord.latestAuditRecord.summary} Event is {selectedRecord.latestAuditRecord.status.replaceAll("_", " ")}.
          </div>
        ) : null}
        {selectedRecord.latestAuditRecord?.ruleChangeDetails ? (
          <p className="tm-muted mt-3 text-sm">
            Audit detail: {selectedRecord.latestAuditRecord.ruleChangeDetails.ruleType.replace("_", " ")} changed from{" "}
            {selectedRecord.latestAuditRecord.ruleChangeDetails.previousValue} to {selectedRecord.latestAuditRecord.ruleChangeDetails.nextValue} effective{" "}
            {selectedRecord.latestAuditRecord.ruleChangeDetails.effectiveDate}.
          </p>
        ) : null}
        {selectedRecord.latestAuditRecord?.adjustmentDetails ? (
          <p className="tm-muted mt-3 text-sm">
            Audit detail: {selectedRecord.latestAuditRecord.adjustmentDetails.direction} {selectedRecord.latestAuditRecord.adjustmentDetails.amount}{" "}
            {selectedRecord.latestAuditRecord.adjustmentDetails.currency} for {selectedRecord.latestAuditRecord.adjustmentDetails.partnerName} because{" "}
            {selectedRecord.latestAuditRecord.adjustmentDetails.reason}.
          </p>
        ) : null}
        {feedback ? <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>{feedback.message}</div> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="tm-btn tm-btn-primary" disabled={!allowedActions?.update_rule || pendingAction !== null} onClick={() => onAction("update_rule")} type="button">
            {pendingAction === "update_rule" ? "Saving..." : "Update rule"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Partner commercial settings</p>
          <div className="mt-4 grid gap-3">
            {selectedRecord.partnerSettings.map((setting) => (
              <article className="tm-document-meta" key={setting.id}>
                <p className="text-sm font-semibold text-slate-950">{setting.partnerName}</p>
                <p className="tm-muted mt-2 text-sm">
                  {setting.region} · {setting.commissionRatePercent}% commission · {setting.serviceFeeFlatAmount} USD service fee
                </p>
                <p className="tm-muted mt-2 text-sm">{setting.overrideReason}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Manual adjustment</p>
          <label className="block mt-4">
            <span className="tm-label">Partner</span>
            <select aria-label="Adjustment partner" className="tm-input mt-3" onChange={(event) => onAdjustmentPartnerChange(event.target.value)} value={adjustmentPartner}>
              {selectedRecord.partnerSettings.map((setting) => (
                <option key={setting.id} value={setting.partnerName}>
                  {setting.partnerName}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="tm-label">Direction</span>
              <select aria-label="Adjustment direction" className="tm-input mt-3" onChange={(event) => onAdjustmentDirectionChange(event.target.value as AdjustmentDirection)} value={adjustmentDirection}>
                <option value="credit">credit</option>
                <option value="debit">debit</option>
              </select>
            </label>
            <label className="block">
              <span className="tm-label">Amount</span>
              <input aria-label="Adjustment amount" className="tm-input mt-3" onChange={(event) => onAdjustmentAmountChange(Number(event.target.value))} type="number" value={adjustmentAmount} />
            </label>
            <label className="block sm:col-span-2">
              <span className="tm-label">Reason</span>
              <input aria-label="Adjustment reason" className="tm-input mt-3" onChange={(event) => onAdjustmentReasonChange(event.target.value)} value={adjustmentReason} />
            </label>
          </div>
          <button className="tm-btn tm-btn-outline mt-5" disabled={!allowedActions?.create_adjustment || pendingAction !== null} onClick={() => onAction("create_adjustment")} type="button">
            {pendingAction === "create_adjustment" ? "Recording..." : "Record adjustment"}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <p className="tm-kicker">Manual Adjustment History</p>
        <div className="mt-4 grid gap-3">
          {selectedRecord.manualAdjustmentHistory.length > 0 ? (
            selectedRecord.manualAdjustmentHistory.map((entry) => (
              <article className="tm-soft-band" key={entry.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {entry.partnerName} · {entry.direction} · {entry.amount} {entry.currency}
                    </p>
                    <p className="tm-muted mt-1 text-sm">{entry.reason}</p>
                  </div>
                  <StatusBadge label={entry.createdAt} tone="neutral" />
                </div>
                <p className="tm-muted mt-2 text-sm">
                  {entry.createdBy} · {entry.note}
                </p>
              </article>
            ))
          ) : (
            <SurfaceState
              description="Manual adjustments will appear here once finance records a correction, rebate, or recovery."
              title="No manual adjustments recorded yet"
              tone="empty"
            />
          )}
        </div>
      </div>
    </article>
  );
}
