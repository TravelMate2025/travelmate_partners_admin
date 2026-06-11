import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import {
  adminRunTone,
  bookingLifecycleTone,
  formatBookingLifecycleStatusLabel,
  formatAdminRunStatusLabel,
  formatFulfillmentLifecycleStatusLabel,
  formatPaymentLifecycleStatusLabel,
  formatPartnerSettlementStatusLabel,
  formatRefundStatusLabel,
  fulfillmentLifecycleTone,
  paymentLifecycleTone,
  partnerSettlementTone,
  refundTone,
} from "@/modules/financial-ops/rules";
import type { FinancialOpsFilterState, FinancialOpsRecord } from "@/modules/financial-ops/types";

function formatSupplyTypeLabel(supplyType: FinancialOpsRecord["supplyType"]) {
  const labels: Record<FinancialOpsRecord["supplyType"], string> = {
    stay: "Stay",
    transfer: "Transfer",
    unknown: "Unknown",
  };
  return labels[supplyType];
}

export function FinancialOpsQueuePanel({
  records,
  selectedId,
  filters,
  onFilterChange,
  onResetFilters,
  onSelect,
  summary,
  availableRegions,
}: {
  records: FinancialOpsRecord[];
  selectedId: string;
  filters: FinancialOpsFilterState;
  onFilterChange: (value: FinancialOpsFilterState) => void;
  onResetFilters: () => void;
  onSelect: (id: string) => void;
  summary: {
    settlementExceptions: number;
    refundFollowUps: number;
    unbalancedCases: number;
    statementsPending: number;
  };
  availableRegions: string[];
}) {
  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Finance Operations</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Settlement supervision and reconciliation</h2>
          <p className="tm-muted mt-2 text-sm">
            Supervise partner settlement states, admin run exceptions, refund recovery, and statement readiness without duplicating partner-side finance flows.
          </p>
        </div>
        <button className="tm-btn tm-btn-outline" onClick={onResetFilters} type="button">
          Reset filters
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Settlement exceptions</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.settlementExceptions}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Refund follow-up</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.refundFollowUps}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Unbalanced cases</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.unbalancedCases}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Statements pending</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.statementsPending}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="tm-label">Search settlement cases</span>
          <input
            aria-label="Search settlement cases"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, query: event.target.value })}
            placeholder="Search partner, booking, region, or settlement issue"
            value={filters.query}
          />
        </label>
        <label className="block">
          <span className="tm-label">Partner settlement status</span>
          <select
            aria-label="Partner settlement status"
            className="tm-input mt-3"
            onChange={(event) =>
              onFilterChange({ ...filters, partnerSettlementStatus: event.target.value as FinancialOpsFilterState["partnerSettlementStatus"] })
            }
            value={filters.partnerSettlementStatus}
          >
            <option value="all">all</option>
            <option value="pending_completion">pending completion</option>
            <option value="processing">processing</option>
            <option value="paid">paid</option>
            <option value="failed">failed</option>
            <option value="reversed">reversed</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Admin run status</span>
          <select
            aria-label="Admin settlement run status"
            className="tm-input mt-3"
            onChange={(event) =>
              onFilterChange({ ...filters, adminRunStatus: event.target.value as FinancialOpsFilterState["adminRunStatus"] })
            }
            value={filters.adminRunStatus}
          >
            <option value="all">all</option>
            <option value="queued">queued</option>
            <option value="processing">processing</option>
            <option value="completed">completed</option>
            <option value="partial">partial</option>
            <option value="failed">failed</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Refund status</span>
          <select
            aria-label="Refund follow-up status"
            className="tm-input mt-3"
            onChange={(event) =>
              onFilterChange({ ...filters, refundStatus: event.target.value as FinancialOpsFilterState["refundStatus"] })
            }
            value={filters.refundStatus}
          >
            <option value="all">all</option>
            <option value="requested">requested</option>
            <option value="partner_notified">partner notified</option>
            <option value="refunded">refunded</option>
            <option value="disputed">disputed</option>
            <option value="recovered">recovered</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Region</span>
          <select
            aria-label="Settlement region"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, region: event.target.value })}
            value={filters.region}
          >
            <option value="all">all</option>
            {availableRegions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
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
                    {record.partnerName} · {record.bookingReference} · {record.region}
                  </p>
                </div>
                <StatusBadge label={formatAdminRunStatusLabel(record.adminRunStatus)} tone={adminRunTone(record.adminRunStatus)} />
              </div>
              <p className="tm-muted mt-3 text-sm">{record.summary}</p>
              <p className="tm-muted mt-2 text-xs">
                {formatSupplyTypeLabel(record.supplyType)} · {record.sourceContextLabel}
              </p>
              <p className="tm-muted mt-2 text-xs">{record.traceSummary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {record.bookingStatus ? (
                  <StatusBadge
                    label={formatBookingLifecycleStatusLabel(record.bookingStatus)}
                    tone={bookingLifecycleTone(record.bookingStatus)}
                  />
                ) : null}
                {record.paymentStatus ? (
                  <StatusBadge
                    label={formatPaymentLifecycleStatusLabel(record.paymentStatus)}
                    tone={paymentLifecycleTone(record.paymentStatus)}
                  />
                ) : null}
                {record.fulfillmentStatus ? (
                  <StatusBadge
                    label={formatFulfillmentLifecycleStatusLabel(record.fulfillmentStatus)}
                    tone={fulfillmentLifecycleTone(record.fulfillmentStatus)}
                  />
                ) : null}
                <StatusBadge
                  label={formatPartnerSettlementStatusLabel(record.partnerSettlementStatus)}
                  tone={partnerSettlementTone(record.partnerSettlementStatus)}
                />
                {record.refundStatus ? (
                  <StatusBadge label={formatRefundStatusLabel(record.refundStatus)} tone={refundTone(record.refundStatus)} />
                ) : null}
              </div>
            </button>
          ))
        ) : (
          <SurfaceState
            actionLabel="Clear filters"
            description="No settlement cases match the current finance filters."
            onAction={onResetFilters}
            title="No settlement cases match this view"
            tone="empty"
          />
        )}
      </div>
    </article>
  );
}
