import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import type { PartnerAccountState, PartnerFilterState, PartnerRecord } from "@/modules/partner-operations/types";

function toneForLifecycle(state: PartnerRecord["lifecycleState"]) {
  if (state === "verified") return "success" as const;
  if (state === "rejected" || state === "suspended") return "danger" as const;
  return "warning" as const;
}

function toneForAccountState(state: PartnerAccountState) {
  if (state === "active") return "success" as const;
  if (state === "locked") return "warning" as const;
  return "neutral" as const;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PartnerDirectoryPanel({
  filters,
  availableRegions,
  filteredRecords,
  selectedId,
  policySummary,
  onFilterChange,
  onSelect,
  onResetFilters,
}: {
  filters: PartnerFilterState;
  availableRegions: string[];
  filteredRecords: PartnerRecord[];
  selectedId: string;
  policySummary: string;
  onFilterChange: (nextFilters: PartnerFilterState) => void;
  onSelect: (recordId: string) => void;
  onResetFilters: () => void;
}) {
  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="tm-kicker">Partner Directory</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Search partner records</h2>
          <p className="tm-muted mt-2 text-sm">{policySummary}</p>
        </div>
        <StatusBadge label={`${filteredRecords.length} matched`} tone="info" />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="tm-label">Search</span>
          <input
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, query: event.target.value })}
            placeholder="Search partner, business, or email"
            value={filters.query}
          />
        </label>
        <label className="block">
          <span className="tm-label">Region</span>
          <select className="tm-input mt-3" onChange={(event) => onFilterChange({ ...filters, region: event.target.value })} value={filters.region}>
            <option value="all">All regions</option>
            {availableRegions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Lifecycle</span>
          <select
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, lifecycle: event.target.value as PartnerFilterState["lifecycle"] })}
            value={filters.lifecycle}
          >
            <option value="all">All lifecycle states</option>
            <option value="pending">pending</option>
            <option value="verified">verified</option>
            <option value="rejected">rejected</option>
            <option value="suspended">suspended</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Account state</span>
          <select
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, accountState: event.target.value as PartnerFilterState["accountState"] })}
            value={filters.accountState}
          >
            <option value="all">All account states</option>
            <option value="active">active</option>
            <option value="locked">locked</option>
            <option value="archived">archived</option>
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-4">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <button
              className={`tm-review-listing ${record.id === selectedId ? "tm-review-listing-active" : ""}`}
              key={record.id}
              onClick={() => onSelect(record.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{record.partnerName}</p>
                  <p className="tm-muted mt-1 text-sm">{record.businessName}</p>
                </div>
                <StatusBadge label={record.region} tone="info" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge label={record.lifecycleState} tone={toneForLifecycle(record.lifecycleState)} />
                <StatusBadge label={record.accountState} tone={toneForAccountState(record.accountState)} />
                <StatusBadge label={record.metadata.priority} tone={record.metadata.priority === "watchlist" ? "warning" : "neutral"} />
              </div>
              <p className="tm-muted mt-3 text-sm">
                {record.portfolio.liveListings} live listings · {record.portfolio.pendingListings} pending · last active {formatTimestamp(record.lastActiveAt)}
              </p>
            </button>
          ))
        ) : (
          <SurfaceState
            actionLabel="Clear filters"
            description="No partner records match the current search and filter combination."
            onAction={onResetFilters}
            title="No partners match this view"
            tone="empty"
          />
        )}
      </div>
    </article>
  );
}
