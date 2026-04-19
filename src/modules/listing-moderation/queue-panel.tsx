import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import type {
  ModerationFilterState,
  ModerationListingRecord,
} from "@/modules/listing-moderation/types";

function toneForKind(kind: ModerationListingRecord["kind"]) {
  return kind === "stay" ? "info" as const : "warning" as const;
}

function toneForStatus(status: ModerationListingRecord["status"]) {
  if (status === "live") return "success" as const;
  if (status === "paused" || status === "rejected") return "danger" as const;
  if (status === "approved") return "success" as const;
  return "warning" as const;
}

export function ListingModerationQueuePanel({
  filters,
  records,
  selectedId,
  selectedIds,
  onFilterChange,
  onSelect,
  onToggleSelection,
  onResetFilters,
}: {
  filters: ModerationFilterState;
  records: ModerationListingRecord[];
  selectedId: string;
  selectedIds: string[];
  onFilterChange: (nextFilters: ModerationFilterState) => void;
  onSelect: (recordId: string) => void;
  onToggleSelection: (recordId: string) => void;
  onResetFilters: () => void;
}) {
  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="tm-kicker">Moderation Queue</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Review stay and transfer submissions</h2>
        </div>
        <StatusBadge label={`${records.length} matched`} tone="info" />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <label className="block md:col-span-3">
          <span className="tm-label">Search</span>
          <input
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, query: event.target.value })}
            placeholder="Search listing, partner, or location"
            value={filters.query}
          />
        </label>
        <label className="block">
          <span className="tm-label">Listing type</span>
          <select className="tm-input mt-3" onChange={(event) => onFilterChange({ ...filters, kind: event.target.value as ModerationFilterState["kind"] })} value={filters.kind}>
            <option value="all">All types</option>
            <option value="stay">stay</option>
            <option value="transfer">transfer</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Status</span>
          <select className="tm-input mt-3" onChange={(event) => onFilterChange({ ...filters, status: event.target.value as ModerationFilterState["status"] })} value={filters.status}>
            <option value="all">All statuses</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="live">live</option>
            <option value="paused">paused</option>
            <option value="rejected">rejected</option>
          </select>
        </label>
        <div className="tm-soft-band">
          <p className="tm-label">Bulk selection</p>
          <p className="mt-2 text-sm text-slate-900">{selectedIds.length} selected for queue-wide moderation actions.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {records.length > 0 ? (
          records.map((record) => (
            <div className={`tm-review-listing ${record.id === selectedId ? "tm-review-listing-active" : ""}`} key={record.id}>
              <div className="flex items-start gap-3">
                <input
                  aria-label={`Select ${record.title}`}
                  checked={selectedIds.includes(record.id)}
                  className="mt-1 h-4 w-4 accent-[var(--adm-deep)]"
                  onChange={() => onToggleSelection(record.id)}
                  type="checkbox"
                />
                <button className="w-full text-left" onClick={() => onSelect(record.id)} type="button">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{record.title}</p>
                      <p className="tm-muted mt-1 text-sm">
                        {record.partnerName} · {record.locationLabel}
                      </p>
                    </div>
                    <StatusBadge label={record.kind} tone={toneForKind(record.kind)} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge label={record.status} tone={toneForStatus(record.status)} />
                    <StatusBadge label={record.reviewSignals.priorityLabel} tone="warning" />
                  </div>
                  <p className="tm-muted mt-3 text-sm">{record.reviewSignals.pendingAgeLabel}</p>
                  <p className="tm-muted mt-2 text-sm">{record.reviewSignals.queueLabel}</p>
                </button>
              </div>
            </div>
          ))
        ) : (
          <SurfaceState
            actionLabel="Clear filters"
            description="No moderation listings match the current search or filter combination."
            onAction={onResetFilters}
            title="No listings match this queue"
            tone="empty"
          />
        )}
      </div>
    </article>
  );
}
