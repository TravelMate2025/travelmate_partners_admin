import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import {
  formatActionLabel,
  formatCategoryLabel,
  getVisibleCategories,
  outcomeTone,
  riskTone,
} from "@/modules/audit-compliance/rules";
import type { AdminRole } from "@/modules/auth/types";
import type { AuditEventCategory, AuditFilterState, AuditLogEntry, AuditRiskLevel, AuditOutcome } from "@/modules/audit-compliance/types";

export function AuditComplianceQueuePanel({
  entries,
  selectedId,
  filters,
  role,
  onFilterChange,
  onResetFilters,
  onSelect,
  summary,
}: {
  entries: AuditLogEntry[];
  selectedId: string;
  filters: AuditFilterState;
  role: AdminRole;
  onFilterChange: (value: AuditFilterState) => void;
  onResetFilters: () => void;
  onSelect: (id: string) => void;
  summary: { total: number; critical: number; high: number; failed: number };
}) {
  const visibleCategories = getVisibleCategories(role);

  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Audit Log</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Critical action traces</h2>
          <p className="tm-muted mt-2 text-sm">
            Review verification decisions, partner lifecycle actions, moderation, financial changes, and access governance events.
          </p>
        </div>
        <button className="tm-btn tm-btn-outline" onClick={onResetFilters} type="button">
          Reset filters
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="tm-soft-band">
          <p className="tm-label">Total events</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.total}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Critical</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.critical}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">High risk</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.high}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Failed</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.failed}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="tm-label">Search events</span>
          <input
            aria-label="Search audit log"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, query: event.target.value })}
            placeholder="Search actor, entity, action, or summary"
            value={filters.query}
          />
        </label>
        <label className="block">
          <span className="tm-label">Category</span>
          <select
            aria-label="Audit category"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, category: event.target.value as AuditEventCategory | "all" })}
            value={filters.category}
          >
            {visibleCategories.map((cat) => (
              <option key={cat} value={cat}>
                {formatCategoryLabel(cat)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Risk level</span>
          <select
            aria-label="Risk level"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, riskLevel: event.target.value as AuditRiskLevel | "all" })}
            value={filters.riskLevel}
          >
            <option value="all">All risk levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Outcome</span>
          <select
            aria-label="Outcome"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, outcome: event.target.value as AuditOutcome | "all" })}
            value={filters.outcome}
          >
            <option value="all">All outcomes</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Entity type</span>
          <select
            aria-label="Entity type"
            className="tm-input mt-3"
            onChange={(event) =>
              onFilterChange({ ...filters, entityType: event.target.value as AuditFilterState["entityType"] })
            }
            value={filters.entityType}
          >
            <option value="all">All entities</option>
            <option value="partner">Partner</option>
            <option value="listing">Listing</option>
            <option value="settlement">Settlement</option>
            <option value="payout_method">Payout method</option>
            <option value="admin_account">Admin account</option>
            <option value="commission_rule">Commission rule</option>
            <option value="api_client">API client</option>
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-3">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <button
              className={`tm-document-card text-left ${entry.id === selectedId ? "tm-document-card-active" : ""}`}
              key={entry.id}
              onClick={() => onSelect(entry.id)}
              type="button"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{entry.entityLabel}</p>
                  <p className="tm-muted mt-2 text-sm">
                    {entry.actor} · {formatActionLabel(entry.action)} · {entry.timestamp.slice(0, 10)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={entry.riskLevel} tone={riskTone(entry.riskLevel)} />
                  <StatusBadge label={entry.outcome} tone={outcomeTone(entry.outcome)} />
                </div>
              </div>
              <p className="tm-muted mt-3 text-sm line-clamp-2">{entry.summary}</p>
            </button>
          ))
        ) : (
          <SurfaceState
            actionLabel="Clear filters"
            description="No audit events match the current filters."
            onAction={onResetFilters}
            title="No audit events match this view"
            tone="empty"
          />
        )}
      </div>
    </article>
  );
}
