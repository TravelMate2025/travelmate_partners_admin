import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import type { NotificationFilterState, NotificationRecord } from "@/modules/notifications/types";

function toneForStatus(status: NotificationRecord["status"]) {
  if (status === "sent") return "success" as const;
  if (status === "failed") return "danger" as const;
  return "warning" as const;
}

export function NotificationsQueuePanel({
  records,
  selectedId,
  filters,
  onFilterChange,
  onResetFilters,
  onSelect,
  summary,
}: {
  records: NotificationRecord[];
  selectedId: string;
  filters: NotificationFilterState;
  onFilterChange: (value: NotificationFilterState) => void;
  onResetFilters: () => void;
  onSelect: (id: string) => void;
  summary: {
    drafts: number;
    sent: number;
    broadcasts: number;
    failedDeliveries: number;
  };
}) {
  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Partner Messaging</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Compose and track partner communications</h2>
          <p className="tm-muted mt-2 text-sm">
            Send direct messages, transactional notices, and announcements with audience validation and delivery metadata.
          </p>
        </div>
        <button className="tm-btn tm-btn-outline" onClick={onResetFilters} type="button">
          Reset filters
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Drafts</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.drafts}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Sent</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.sent}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Broadcasts</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.broadcasts}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Failed deliveries</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.failedDeliveries}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="tm-label">Search messages</span>
          <input
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, query: event.target.value })}
            placeholder="Search title, summary, or actor"
            value={filters.query}
          />
        </label>
        <label className="block">
          <span className="tm-label">Message type</span>
          <select className="tm-input mt-3" onChange={(event) => onFilterChange({ ...filters, kind: event.target.value as NotificationFilterState["kind"] })} value={filters.kind}>
            <option value="all">all</option>
            <option value="direct">direct</option>
            <option value="broadcast">broadcast</option>
            <option value="transactional">transactional</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Status</span>
          <select className="tm-input mt-3" onChange={(event) => onFilterChange({ ...filters, status: event.target.value as NotificationFilterState["status"] })} value={filters.status}>
            <option value="all">all</option>
            <option value="draft">draft</option>
            <option value="sent">sent</option>
            <option value="failed">failed</option>
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="tm-label">Channel</span>
          <select className="tm-input mt-3" onChange={(event) => onFilterChange({ ...filters, channel: event.target.value as NotificationFilterState["channel"] })} value={filters.channel}>
            <option value="all">all</option>
            <option value="email">email</option>
            <option value="in_app">in app</option>
            <option value="sms">sms</option>
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
                    {record.kind} · {record.targetPartnerCount} recipients · {record.createdBy}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={record.kind} tone="info" />
                  <StatusBadge label={record.status} tone={toneForStatus(record.status)} />
                </div>
              </div>
              <p className="tm-muted mt-3 text-sm">{record.summary}</p>
            </button>
          ))
        ) : (
          <SurfaceState
            actionLabel="Clear filters"
            description="No partner messages match the current filters."
            onAction={onResetFilters}
            title="No messages match this view"
            tone="empty"
          />
        )}
      </div>
    </article>
  );
}
