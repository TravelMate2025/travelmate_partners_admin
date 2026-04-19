import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import {
  formatSupportIncidentStateLabel,
  formatSupportQueueLabel,
  formatSupportSeverityLabel,
  formatSupportStatusLabel,
  supportSeverityTone,
  supportStatusTone,
} from "@/modules/support-incidents/rules";
import type { SupportIncidentFilterState, SupportIncidentRecord } from "@/modules/support-incidents/types";

export function SupportIncidentsQueuePanel({
  records,
  selectedId,
  filters,
  onFilterChange,
  onResetFilters,
  onSelect,
  summary,
}: {
  records: SupportIncidentRecord[];
  selectedId: string;
  filters: SupportIncidentFilterState;
  onFilterChange: (value: SupportIncidentFilterState) => void;
  onResetFilters: () => void;
  onSelect: (id: string) => void;
  summary: {
    openCases: number;
    escalatedCases: number;
    activeIncidents: number;
    criticalCases: number;
  };
}) {
  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Support Operations</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Partner issues and incident threads</h2>
          <p className="tm-muted mt-2 text-sm">
            Coordinate partner complaints, operational incidents, finance-linked follow-up, and safe diagnostics from one queue.
          </p>
        </div>
        <button className="tm-btn tm-btn-outline" onClick={onResetFilters} type="button">
          Reset filters
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Open or monitoring</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.openCases}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Escalated</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.escalatedCases}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Active incidents</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.activeIncidents}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">High-risk cases</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.criticalCases}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="tm-label">Search cases</span>
          <input
            aria-label="Search support cases"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, query: event.target.value })}
            placeholder="Search partner, issue, region, or summary"
            value={filters.query}
          />
        </label>
        <label className="block">
          <span className="tm-label">Status</span>
          <select
            aria-label="Support case status"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, status: event.target.value as SupportIncidentFilterState["status"] })}
            value={filters.status}
          >
            <option value="all">all</option>
            <option value="open">open</option>
            <option value="monitoring">monitoring</option>
            <option value="escalated">escalated</option>
            <option value="resolved">resolved</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Severity</span>
          <select
            aria-label="Support case severity"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, severity: event.target.value as SupportIncidentFilterState["severity"] })}
            value={filters.severity}
          >
            <option value="all">all</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Queue</span>
          <select
            aria-label="Support case queue"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, queue: event.target.value as SupportIncidentFilterState["queue"] })}
            value={filters.queue}
          >
            <option value="all">all</option>
            <option value="partner_support">partner support</option>
            <option value="trust_ops">trust ops</option>
            <option value="financial_followup">financial follow-up</option>
            <option value="incident_response">incident response</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Incident state</span>
          <select
            aria-label="Support incident state"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, incidentState: event.target.value as SupportIncidentFilterState["incidentState"] })}
            value={filters.incidentState}
          >
            <option value="all">all</option>
            <option value="none">no incident</option>
            <option value="active">active</option>
            <option value="mitigated">mitigated</option>
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
                    {record.partnerName} · {formatSupportQueueLabel(record.queue)} · {record.region}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={formatSupportSeverityLabel(record.severity)} tone={supportSeverityTone(record.severity)} />
                  <StatusBadge label={formatSupportStatusLabel(record.status)} tone={supportStatusTone(record.status)} />
                </div>
              </div>
              <p className="tm-muted mt-3 text-sm">{record.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge label={formatSupportIncidentStateLabel(record.incidentState)} tone={record.incidentState === "active" ? "warning" : record.incidentState === "mitigated" ? "success" : "neutral"} />
                <StatusBadge label={`Owner · ${record.owner}`} tone="info" />
              </div>
            </button>
          ))
        ) : (
          <SurfaceState
            actionLabel="Clear filters"
            description="No support cases match the current filters."
            onAction={onResetFilters}
            title="No support cases match this view"
            tone="empty"
          />
        )}
      </div>
    </article>
  );
}
