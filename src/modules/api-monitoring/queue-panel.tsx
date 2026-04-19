import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import type {
  ApiMonitoringDashboardSnapshot,
  ApiMonitoringFilterState,
  ApiMonitoringRecord,
} from "@/modules/api-monitoring/types";

function toneForSeverity(severity: ApiMonitoringRecord["severity"]) {
  if (severity === "critical") return "danger" as const;
  if (severity === "high") return "warning" as const;
  if (severity === "medium") return "info" as const;
  return "neutral" as const;
}

export function ApiMonitoringQueuePanel({
  dashboard,
  availableClients,
  filters,
  onFilterChange,
  onResetFilters,
  onSelect,
  records,
  selectedId,
}: {
  dashboard: ApiMonitoringDashboardSnapshot;
  availableClients: string[];
  filters: ApiMonitoringFilterState;
  onFilterChange: (filters: ApiMonitoringFilterState) => void;
  onResetFilters: () => void;
  onSelect: (recordId: string) => void;
  records: ApiMonitoringRecord[];
  selectedId: string;
}) {
  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">API Monitoring</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Investigate traffic and anomaly signals</h2>
          <p className="tm-muted mt-2 text-sm">
            Surface latency, errors, rate-limit pressure, and access-history patterns before they become partner-impacting incidents.
          </p>
        </div>
        <button className="tm-btn tm-btn-outline" onClick={onResetFilters} type="button">
          Reset filters
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Open alerts</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{dashboard.openAlerts}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Critical alerts</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{dashboard.criticalAlerts}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">High latency alerts</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{dashboard.highLatencyAlerts}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Rate-limit hotspots</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{dashboard.rateLimitHotspots}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="tm-label">Search anomalies</span>
          <input
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, query: event.target.value })}
            placeholder="Search anomaly, client, endpoint, or region"
            value={filters.query}
          />
        </label>
        <label className="block">
          <span className="tm-label">Category</span>
          <select
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, category: event.target.value as ApiMonitoringFilterState["category"] })}
            value={filters.category}
          >
            <option value="all">all</option>
            <option value="traffic">traffic</option>
            <option value="latency">latency</option>
            <option value="errors">errors</option>
            <option value="rate_limit">rate limit</option>
            <option value="access">access</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Severity</span>
          <select
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, severity: event.target.value as ApiMonitoringFilterState["severity"] })}
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
          <span className="tm-label">Status</span>
          <select
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, status: event.target.value as ApiMonitoringFilterState["status"] })}
            value={filters.status}
          >
            <option value="all">all</option>
            <option value="open">open</option>
            <option value="investigating">investigating</option>
            <option value="contained">contained</option>
            <option value="resolved">resolved</option>
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="tm-label">Client</span>
          <select
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, client: event.target.value })}
            value={filters.client}
          >
            <option value="all">all clients</option>
            {availableClients.map((client) => (
              <option key={client} value={client}>
                {client}
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
                    {record.clientName} · {record.endpointLabel} · {record.region}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={record.category.replace("_", " ")} tone="info" />
                  <StatusBadge label={record.severity} tone={toneForSeverity(record.severity)} />
                </div>
              </div>
              <p className="tm-muted mt-3 text-sm">{record.summary}</p>
            </button>
          ))
        ) : (
          <SurfaceState
            actionLabel="Clear filters"
            description="No API anomalies match the current monitoring filters."
            onAction={onResetFilters}
            title="No API monitoring alerts match this view"
            tone="empty"
          />
        )}
      </div>
    </article>
  );
}
