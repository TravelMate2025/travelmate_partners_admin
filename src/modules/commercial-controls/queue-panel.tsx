import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import type { CommercialFilterState, CommercialRuleRecord } from "@/modules/commercial-controls/types";

function toneForStatus(status: CommercialRuleRecord["status"]) {
  if (status === "active") return "success" as const;
  if (status === "scheduled") return "warning" as const;
  return "neutral" as const;
}

export function CommercialControlsQueuePanel({
  records,
  selectedId,
  filters,
  onFilterChange,
  onResetFilters,
  onSelect,
  summary,
}: {
  records: CommercialRuleRecord[];
  selectedId: string;
  filters: CommercialFilterState;
  onFilterChange: (value: CommercialFilterState) => void;
  onResetFilters: () => void;
  onSelect: (ruleId: string) => void;
  summary: {
    activeRules: number;
    scheduledRules: number;
    partnerOverrides: number;
    manualAdjustments: number;
  };
}) {
  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Commercial Controls</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Manage marketplace pricing and fee policy</h2>
          <p className="tm-muted mt-2 text-sm">
            Review commission rules, service-fee policy, partner overrides, and manual commercial adjustments with explicit audit context.
          </p>
        </div>
        <button className="tm-btn tm-btn-outline" onClick={onResetFilters} type="button">
          Reset filters
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Active rules</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.activeRules}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Scheduled changes</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.scheduledRules}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Partner overrides</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.partnerOverrides}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Manual adjustments logged</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.manualAdjustments}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="tm-label">Search fee rules</span>
          <input
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, query: event.target.value })}
            placeholder="Search rule, region, or commercial summary"
            value={filters.query}
          />
        </label>
        <label className="block">
          <span className="tm-label">Rule type</span>
          <select className="tm-input mt-3" onChange={(event) => onFilterChange({ ...filters, ruleType: event.target.value as CommercialFilterState["ruleType"] })} value={filters.ruleType}>
            <option value="all">all</option>
            <option value="commission">commission</option>
            <option value="service_fee">service fee</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Scope</span>
          <select className="tm-input mt-3" onChange={(event) => onFilterChange({ ...filters, scope: event.target.value as CommercialFilterState["scope"] })} value={filters.scope}>
            <option value="all">all</option>
            <option value="global">global</option>
            <option value="region">region</option>
            <option value="partner">partner</option>
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="tm-label">Status</span>
          <select className="tm-input mt-3" onChange={(event) => onFilterChange({ ...filters, status: event.target.value as CommercialFilterState["status"] })} value={filters.status}>
            <option value="all">all</option>
            <option value="active">active</option>
            <option value="scheduled">scheduled</option>
            <option value="paused">paused</option>
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
                    {record.region} · {record.scope} · effective {record.effectiveDate}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={record.ruleType.replace("_", " ")} tone="info" />
                  <StatusBadge label={record.status} tone={toneForStatus(record.status)} />
                </div>
              </div>
              <p className="tm-muted mt-3 text-sm">{record.summary}</p>
            </button>
          ))
        ) : (
          <SurfaceState
            actionLabel="Clear filters"
            description="No commercial rules match the current filters."
            onAction={onResetFilters}
            title="No commercial controls match this view"
            tone="empty"
          />
        )}
      </div>
    </article>
  );
}
