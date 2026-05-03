import { StatusBadge } from "@/components/common/status-badge";
import type { ApiClientFilterState, ApiClientRecord } from "@/modules/api-clients/types";

function toneForRisk(risk: ApiClientRecord["riskLevel"]) {
  if (risk === "high") return "danger" as const;
  if (risk === "medium") return "warning" as const;
  return "success" as const;
}

export function ApiClientsQueuePanel({
  filters,
  onFilterChange,
  onResetFilters,
  onSelect,
  records,
  selectedId,
}: {
  filters: ApiClientFilterState;
  onFilterChange: (filters: ApiClientFilterState) => void;
  onResetFilters: () => void;
  onSelect: (clientId: string) => void;
  records: ApiClientRecord[];
  selectedId: string;
}) {
  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">API Client Management</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Client review queue</h2>
          <p className="tm-muted mt-2 text-sm">
            Review API access applications, plan eligibility, key lifecycle, and usage risk in one place.
          </p>
        </div>
        <button className="tm-btn tm-btn-outline" onClick={onResetFilters} type="button">
          Reset filters
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="tm-label">Search clients</span>
          <input
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, query: event.target.value })}
            placeholder="Search company, applicant, or region"
            value={filters.query}
          />
        </label>
        <label className="block">
          <span className="tm-label">Status</span>
          <select
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, status: event.target.value as ApiClientFilterState["status"] })}
            value={filters.status}
          >
            <option value="all">all</option>
            <option value="pending_review">pending review</option>
            <option value="under_review">under review</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="blocked">blocked</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Plan</span>
          <select
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, plan: event.target.value as ApiClientFilterState["plan"] })}
            value={filters.plan}
          >
            <option value="all">all</option>
            <option value="starter">starter</option>
            <option value="growth">growth</option>
            <option value="enterprise">enterprise</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Risk</span>
          <select
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, risk: event.target.value as ApiClientFilterState["risk"] })}
            value={filters.risk}
          >
            <option value="all">all</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
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
                <p className="text-sm font-semibold text-slate-950">{record.companyName}</p>
                <p className="tm-muted mt-2 text-sm">
                  {record.applicantName} · {record.region} · {record.plan}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge label={record.status} tone="info" />
                {record.isResubmissionPending ? <StatusBadge label="Re-submission pending" tone="warning" /> : null}
                <StatusBadge label={record.riskLevel} tone={toneForRisk(record.riskLevel)} />
              </div>
            </div>
            <p className="tm-muted mt-3 text-sm">{record.useCase}</p>
          </button>
        ))}
      </div>
    </article>
  );
}
