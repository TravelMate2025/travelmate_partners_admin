import { StatusBadge } from "@/components/common/status-badge";
import type {
  CatalogDashboardSnapshot,
  CatalogFilterState,
  CatalogIssueRecord,
} from "@/modules/catalog-controls/types";

function toneForSeverity(severity: CatalogIssueRecord["severity"]) {
  if (severity === "critical") return "danger" as const;
  if (severity === "high") return "warning" as const;
  if (severity === "medium") return "info" as const;
  return "neutral" as const;
}

export function CatalogControlsQueuePanel({
  dashboard,
  filters,
  onFilterChange,
  onResetFilters,
  onSelect,
  records,
  selectedId,
}: {
  dashboard: CatalogDashboardSnapshot;
  filters: CatalogFilterState;
  onFilterChange: (filters: CatalogFilterState) => void;
  onResetFilters: () => void;
  onSelect: (issueId: string) => void;
  records: CatalogIssueRecord[];
  selectedId: string;
}) {
  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Catalog Quality Controls</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Flagged inventory queue</h2>
          <p className="tm-muted mt-2 text-sm">
            Duplicate, taxonomy, geo-data, and policy signals aligned to partner-side quality tooling.
          </p>
        </div>
        <button className="tm-btn tm-btn-outline" onClick={onResetFilters} type="button">
          Reset filters
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Open issues</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{dashboard.openIssues}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Critical issues</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{dashboard.criticalIssues}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Taxonomy gaps</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{dashboard.taxonomyGaps}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Geo mismatches</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{dashboard.geoMismatches}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="tm-label">Search issues</span>
          <input
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, query: event.target.value })}
            placeholder="Search listing, partner, or location"
            value={filters.query}
          />
        </label>
        <label className="block">
          <span className="tm-label">Issue type</span>
          <select
            className="tm-input mt-3"
            onChange={(event) =>
              onFilterChange({ ...filters, issueType: event.target.value as CatalogFilterState["issueType"] })
            }
            value={filters.issueType}
          >
            <option value="all">all</option>
            <option value="duplicate">duplicate</option>
            <option value="taxonomy">taxonomy</option>
            <option value="geo">geo</option>
            <option value="policy">policy</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Listing kind</span>
          <select
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, kind: event.target.value as CatalogFilterState["kind"] })}
            value={filters.kind}
          >
            <option value="all">all</option>
            <option value="stay">stay</option>
            <option value="transfer">transfer</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Severity</span>
          <select
            className="tm-input mt-3"
            onChange={(event) =>
              onFilterChange({ ...filters, severity: event.target.value as CatalogFilterState["severity"] })
            }
            value={filters.severity}
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
        {records.map((record) => (
          <button
            className={`tm-document-card text-left ${record.id === selectedId ? "tm-document-card-active" : ""}`}
            key={record.id}
            onClick={() => onSelect(record.id)}
            type="button"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{record.listingTitle}</p>
                <p className="tm-muted mt-2 text-sm">
                  {record.kind} · {record.partnerName} · {record.locationLabel}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge label={record.issueType} tone="info" />
                <StatusBadge label={record.severity} tone={toneForSeverity(record.severity)} />
              </div>
            </div>
            <p className="tm-muted mt-3 text-sm">{record.summary}</p>
          </button>
        ))}
      </div>
    </article>
  );
}
