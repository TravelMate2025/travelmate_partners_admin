import Link from "next/link";

import { ActivityTimeline } from "@/components/common/activity-timeline";
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
import type { SupportAction, SupportIncidentRecord } from "@/modules/support-incidents/types";

function getActionLabel(action: SupportAction) {
  const labels: Record<SupportAction, { idle: string; pending: string }> = {
    log_note: { idle: "Log internal note", pending: "Logging note..." },
    flag_incident: { idle: "Flag incident", pending: "Flagging incident..." },
    escalate: { idle: "Escalate case", pending: "Escalating..." },
    resolve: { idle: "Resolve case", pending: "Resolving..." },
    run_diagnostics: { idle: "Run safe diagnostics", pending: "Running diagnostics..." },
  };
  return labels[action];
}

export function SupportIncidentsDetailPanel({
  selectedRecord,
  emptyState,
  note,
  pendingAction,
  feedback,
  policySummary,
  availableActions,
  onNoteChange,
  onAction,
  onResetSelection,
}: {
  selectedRecord: SupportIncidentRecord | null;
  emptyState?: { title: string; description: string } | null;
  note: string;
  pendingAction: SupportAction | null;
  feedback: { tone: "success" | "error"; message: string } | null;
  policySummary: string;
  availableActions: SupportAction[];
  onNoteChange: (value: string) => void;
  onAction: (action: SupportAction) => void;
  onResetSelection: () => void;
}) {
  if (emptyState) {
    return (
      <article className="tm-panel min-w-0 h-fit xl:sticky xl:top-24">
        <SurfaceState description={emptyState.description} title={emptyState.title} tone="empty" />
      </article>
    );
  }

  if (!selectedRecord) {
    return (
      <article className="tm-panel min-w-0 h-fit xl:sticky xl:top-24">
        <SurfaceState
          actionLabel="Reset selection"
          description="The selected support case is no longer available in this snapshot."
          onAction={onResetSelection}
          title="Selected support case was not found"
          tone="exception"
        />
      </article>
    );
  }

  return (
    <article className="tm-panel min-w-0 h-fit xl:sticky xl:top-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Support Case Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedRecord.title}</h2>
          <p className="tm-muted mt-2 text-sm">{selectedRecord.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={formatSupportSeverityLabel(selectedRecord.severity)} tone={supportSeverityTone(selectedRecord.severity)} />
          <StatusBadge label={formatSupportStatusLabel(selectedRecord.status)} tone={supportStatusTone(selectedRecord.status)} />
          <StatusBadge label={formatSupportIncidentStateLabel(selectedRecord.incidentState)} tone={selectedRecord.incidentState === "active" ? "warning" : selectedRecord.incidentState === "mitigated" ? "success" : "neutral"} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Partner</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{selectedRecord.partnerName}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Queue</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{formatSupportQueueLabel(selectedRecord.queue)}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Owner</p>
          <p className="mt-2 text-sm text-slate-900">{selectedRecord.owner}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Response deadline</p>
          <p className="mt-2 text-sm text-slate-900">{selectedRecord.responseDeadline.slice(0, 16).replace("T", " ")}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="tm-soft-band">
          <p className="tm-label">Linked context</p>
          <div className="mt-4 grid gap-3">
            {selectedRecord.linkedContext.map((item) => (
              <Link className="tm-document-card block" href={item.href} key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                    <p className="tm-muted mt-2 text-sm capitalize">{item.kind}</p>
                  </div>
                  <StatusBadge label={item.statusLabel} tone="info" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="tm-soft-band">
          <p className="tm-label">Internal note and actions</p>
          <textarea
            aria-label="Support internal note"
            className="tm-textarea mt-3"
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Capture partner context, next action, escalation reason, or diagnostics follow-up..."
            value={note}
          />
          <p className="tm-muted mt-3 text-sm">{policySummary}</p>

          {feedback ? (
            <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>
              {feedback.message}
            </div>
          ) : null}

          {availableActions.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {availableActions.map((action) => {
                const { idle, pending } = getActionLabel(action);
                const isPending = pendingAction === action;
                const isBlocked = pendingAction !== null && !isPending;
                const isNeutral = action === "log_note" || action === "run_diagnostics";
                const isDanger = action === "escalate";
                return (
                  <button
                    aria-label={idle}
                    className={`tm-btn ${isDanger || isNeutral ? "tm-btn-outline" : "tm-btn-primary"}`}
                    disabled={isPending || isBlocked}
                    key={action}
                    onClick={() => onAction(action)}
                    type="button"
                  >
                    {isPending ? pending : idle}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="tm-muted mt-5 text-sm">No case actions are available for this role.</p>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="tm-soft-band">
          <p className="tm-label">Safe diagnostics</p>
          {selectedRecord.diagnostics.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {selectedRecord.diagnostics.map((snapshot) => (
                <article className="tm-document-card" key={snapshot.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{snapshot.summary}</p>
                      <p className="tm-muted mt-2 text-sm">
                        {snapshot.actor} · {snapshot.runAt.slice(0, 16).replace("T", " ")}
                      </p>
                    </div>
                    <StatusBadge label="safe only" tone="success" />
                  </div>
                  <div className="mt-4 grid gap-2">
                    {snapshot.checks.map((check) => (
                      <div className="tm-soft-band" key={check.id}>
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-950">{check.label}</p>
                          <StatusBadge
                            label={check.status}
                            tone={check.status === "pass" ? "success" : check.status === "warn" ? "warning" : "danger"}
                          />
                        </div>
                        <p className="tm-muted mt-2 text-sm">{check.detail}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="tm-muted mt-3 text-sm">
              No diagnostics have been run yet. When support runs diagnostics, only masked operational checks are stored here.
            </p>
          )}
        </div>

        <div className="tm-soft-band">
          <p className="tm-label">Response log</p>
          <div className="mt-4">
            <ActivityTimeline items={selectedRecord.activity} />
          </div>
        </div>
      </div>
    </article>
  );
}
