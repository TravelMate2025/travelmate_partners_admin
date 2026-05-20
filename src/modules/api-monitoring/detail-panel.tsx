import Link from "next/link";

import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import { detectApiMonitoringTags } from "@/modules/api-monitoring/rules";
import type { ApiGovernanceAction, ApiMonitoringRecord } from "@/modules/api-monitoring/types";

function toneForSeverity(severity: ApiMonitoringRecord["severity"]) {
  if (severity === "critical") return "danger" as const;
  if (severity === "high") return "warning" as const;
  if (severity === "medium") return "info" as const;
  return "neutral" as const;
}

export function ApiMonitoringDetailPanel({
  selectedRecord,
  emptyState,
  note,
  pendingAction,
  feedback,
  allowedActions,
  policySummary,
  onNoteChange,
  onAction,
  onResetSelection,
}: {
  selectedRecord: ApiMonitoringRecord | null;
  emptyState?: { title: string; description: string } | null;
  note: string;
  pendingAction: ApiGovernanceAction | null;
  feedback: { tone: "success" | "error"; message: string } | null;
  allowedActions: Record<ApiGovernanceAction, boolean> | null;
  policySummary: string;
  onNoteChange: (value: string) => void;
  onAction: (action: ApiGovernanceAction) => void;
  onResetSelection: () => void;
}) {
  if (emptyState) {
    return (
      <article className="tm-panel min-w-0 h-fit">
        <SurfaceState description={emptyState.description} title={emptyState.title} tone="empty" />
      </article>
    );
  }

  if (!selectedRecord) {
    return (
      <article className="tm-panel min-w-0 h-fit">
        <SurfaceState
          actionLabel="Reset monitoring selection"
          description="The selected API anomaly is no longer available in the current monitoring snapshot."
          onAction={onResetSelection}
          title="Selected API anomaly was not found"
          tone="exception"
        />
      </article>
    );
  }

  const tags = detectApiMonitoringTags(selectedRecord);

  return (
    <article className="tm-panel min-w-0 h-fit">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Anomaly Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedRecord.title}</h2>
          <p className="tm-muted mt-2 text-sm">
            {selectedRecord.clientName} · {selectedRecord.endpointLabel} · {selectedRecord.region}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={selectedRecord.status} tone="info" />
          <StatusBadge
            label={selectedRecord.incidentState === "open" ? "incident open" : "incident not open"}
            tone={selectedRecord.incidentState === "open" ? "warning" : "neutral"}
          />
          <StatusBadge label={selectedRecord.severity} tone={toneForSeverity(selectedRecord.severity)} />
          <StatusBadge label={`${selectedRecord.currentTrafficPerMinute}/min`} tone="neutral" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Signal summary</p>
          <p className="mt-3 text-sm text-slate-900">{selectedRecord.summary}</p>
          <ul className="tm-bullet-list mt-4">
            <li>Anomaly reason: {selectedRecord.anomalyReason}</li>
            <li>P95 latency: {selectedRecord.p95LatencyMs}ms</li>
            <li>Error rate: {selectedRecord.errorRatePercent}%</li>
            <li>Rate-limit violations (24h): {selectedRecord.rateLimitViolations24h}</li>
            <li>First detected: {selectedRecord.firstDetectedAt}</li>
            <li>Last seen: {selectedRecord.lastSeenAt}</li>
          </ul>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Governance signals</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge label={tags.needsIncident ? "incident recommended" : "incident optional"} tone={tags.needsIncident ? "warning" : "neutral"} />
            <StatusBadge label={tags.needsContainment ? "containment candidate" : "observe only"} tone={tags.needsContainment ? "danger" : "info"} />
            <StatusBadge label={tags.endpointRisk ? "sensitive endpoint" : "standard endpoint"} tone={tags.endpointRisk ? "warning" : "neutral"} />
          </div>
          <p className="mt-4 text-sm text-slate-900">{selectedRecord.governanceRecommendation}</p>
          <p className="tm-muted mt-3 text-sm">{policySummary}</p>
        </div>
      </div>

      <div className="tm-soft-band mt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="tm-label">Client governance linkage</p>
            <p className="mt-3 text-sm text-slate-900">{selectedRecord.clientLink.summary}</p>
            {selectedRecord.clientLink.lastLinkedAction ? (
              <p className="tm-muted mt-2 text-sm">
                Last linked action: {selectedRecord.clientLink.lastLinkedAction.replaceAll("_", " ")}
              </p>
            ) : null}
          </div>
          <Link className="tm-btn tm-btn-outline" href={selectedRecord.clientLink.href}>
            {selectedRecord.clientLink.label}
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Endpoint traffic and health</p>
          <div className="mt-4 grid gap-3">
            {selectedRecord.impactedEndpoints.map((endpoint) => (
              <div className="tm-document-meta" key={endpoint.endpointLabel}>
                <p className="text-sm font-semibold text-slate-950">{endpoint.endpointLabel}</p>
                <p className="tm-muted mt-2 text-sm">
                  {endpoint.requestCount24h.toLocaleString()} requests · {endpoint.p95LatencyMs}ms P95 · {endpoint.errorRatePercent}% error rate
                </p>
                <p className="tm-muted mt-2 text-sm">
                  {endpoint.rateLimitViolations24h} rate-limit violation{endpoint.rateLimitViolations24h === 1 ? "" : "s"} in the last 24h
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Access history</p>
          <div className="mt-4 grid gap-3">
            {selectedRecord.accessHistory.map((entry) => (
              <div className="tm-document-meta" key={entry.id}>
                <p className="text-sm font-semibold text-slate-950">{entry.event}</p>
                <p className="tm-muted mt-2 text-sm">
                  {entry.actorLabel} · {entry.timestamp}
                </p>
                <p className="tm-muted mt-2 text-sm">{entry.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tm-soft-band mt-5">
        <p className="tm-label">Governance action</p>
        <label className="block mt-4">
          <span className="tm-label">Operational note</span>
          <textarea
            className="tm-textarea mt-3"
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Capture investigation context, containment reasoning, or incident handoff notes..."
            value={note}
          />
        </label>
        {selectedRecord.latestAuditRecord ? (
          <div className="tm-alert tm-alert-success mt-4">
            Audit prep: {selectedRecord.latestAuditRecord.summary} Event is {selectedRecord.latestAuditRecord.status.replaceAll("_", " ")}.
          </div>
        ) : null}
        {feedback ? <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>{feedback.message}</div> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="tm-btn tm-btn-primary" disabled={pendingAction !== null || !allowedActions?.acknowledge_alert} onClick={() => onAction("acknowledge_alert")} type="button">
            {pendingAction === "acknowledge_alert" ? "Acknowledging..." : "Acknowledge alert"}
          </button>
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.open_incident} onClick={() => onAction("open_incident")} type="button">
            {pendingAction === "open_incident" ? "Opening..." : "Open incident"}
          </button>
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.queue_client_containment} onClick={() => onAction("queue_client_containment")} type="button">
            {pendingAction === "queue_client_containment" ? "Queueing..." : "Queue client containment"}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <p className="tm-kicker">Monitoring history</p>
        <div className="mt-4 grid gap-3">
          {selectedRecord.history.map((entry) => (
            <article className="tm-soft-band" key={entry.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{entry.action}</p>
                  <p className="tm-muted mt-1 text-sm">{entry.note}</p>
                </div>
                <StatusBadge label={entry.timestamp} tone="neutral" />
              </div>
              <p className="tm-muted mt-2 text-sm">{entry.actor}</p>
            </article>
          ))}
        </div>
      </div>
    </article>
  );
}
