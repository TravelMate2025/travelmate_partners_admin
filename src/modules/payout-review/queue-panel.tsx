import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import {
  formatHoldStateLabel,
  formatPayoutMethodTypeLabel,
  formatPayoutVerificationStatusLabel,
  formatRiskSeverityLabel,
  holdTone,
  payoutVerificationTone,
  riskTone,
} from "@/modules/payout-review/rules";
import type { PayoutReviewFilterState, PayoutReviewRecord } from "@/modules/payout-review/types";

export function PayoutReviewQueuePanel({
  records,
  selectedId,
  filters,
  onFilterChange,
  onResetFilters,
  onSelect,
  summary,
}: {
  records: PayoutReviewRecord[];
  selectedId: string;
  filters: PayoutReviewFilterState;
  onFilterChange: (value: PayoutReviewFilterState) => void;
  onResetFilters: () => void;
  onSelect: (id: string) => void;
  summary: {
    pendingReview: number;
    activeHolds: number;
    highRisk: number;
    settlementReady: number;
  };
}) {
  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Payout Review</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Settlement account review and payout controls</h2>
          <p className="tm-muted mt-2 text-sm">
            Review partner-submitted payout methods, watch fraud signals, and manage settlement holds without rebuilding the partner payout journey.
          </p>
        </div>
        <button className="tm-btn tm-btn-outline" onClick={onResetFilters} type="button">
          Reset filters
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Pending review</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.pendingReview}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Active holds</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.activeHolds}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">High-risk cases</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.highRisk}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Settlement ready</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.settlementReady}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="tm-label">Search payout review cases</span>
          <input
            aria-label="Search payout review cases"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, query: event.target.value })}
            placeholder="Search payout method, partner, or account summary"
            value={filters.query}
          />
        </label>
        <label className="block">
          <span className="tm-label">Verification status</span>
          <select
            aria-label="Payout verification status"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, status: event.target.value as PayoutReviewFilterState["status"] })}
            value={filters.status}
          >
            <option value="all">all</option>
            <option value="pending">pending</option>
            <option value="verified">verified</option>
            <option value="rejected">rejected</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Method type</span>
          <select
            aria-label="Payout method type"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, methodType: event.target.value as PayoutReviewFilterState["methodType"] })}
            value={filters.methodType}
          >
            <option value="all">all</option>
            <option value="bank_account">bank account</option>
            <option value="mobile_money">mobile money</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Settlement hold</span>
          <select
            aria-label="Settlement hold state"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, holdState: event.target.value as PayoutReviewFilterState["holdState"] })}
            value={filters.holdState}
          >
            <option value="all">all</option>
            <option value="active">active</option>
            <option value="clear">clear</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Risk severity</span>
          <select
            aria-label="Payout risk severity"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, riskSeverity: event.target.value as PayoutReviewFilterState["riskSeverity"] })}
            value={filters.riskSeverity}
          >
            <option value="all">all</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-3">
        {records.length > 0 ? (
          records.map((record) => (
            <button
              className={`tm-document-card text-left ${record.id === selectedId ? "tm-document-card-active" : ""}`}
              key={record.id}
              onClick={() => onSelect(record.id)}
              type="button"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{record.title}</p>
                  <p className="tm-muted mt-2 text-sm">
                    {record.partnerName} · {record.maskedSummary} · {record.region}
                  </p>
                </div>
                <StatusBadge label={formatPayoutVerificationStatusLabel(record.status)} tone={payoutVerificationTone(record.status)} />
              </div>
              <p className="tm-muted mt-3 text-sm">{record.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge label={formatPayoutMethodTypeLabel(record.methodType)} tone="info" />
                <StatusBadge label={formatHoldStateLabel(record.holdState)} tone={holdTone(record.holdState)} />
                {record.riskFlags[0] ? (
                  <StatusBadge label={formatRiskSeverityLabel(record.riskFlags[0].severity)} tone={riskTone(record.riskFlags[0].severity)} />
                ) : null}
              </div>
            </button>
          ))
        ) : (
          <SurfaceState
            actionLabel="Clear filters"
            description="No payout review cases match the current queue filters."
            onAction={onResetFilters}
            title="No payout review cases match this view"
            tone="empty"
          />
        )}
      </div>
    </article>
  );
}
