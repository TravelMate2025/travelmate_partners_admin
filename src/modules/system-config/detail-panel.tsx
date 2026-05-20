import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import {
  formatAreaLabel,
  formatCategoryLabel,
  formatContentKindLabel,
  formatRegionTypeLabel,
  formatTemplateKindLabel,
  formatTemplateScopeLabel,
  getAvailableActions,
  statusTone,
} from "@/modules/system-config/rules";
import type { AdminRole } from "@/modules/auth/types";
import type { SystemConfigActionType, SystemConfigRecord } from "@/modules/system-config/types";

function getActionLabel(
  action: SystemConfigActionType,
  kind: SystemConfigRecord["kind"],
): { idle: string; pending: string } {
  if (action === "publish") {
    const target = kind === "template" ? "template" : kind === "content" ? "content" : "taxonomy item";
    return { idle: `Publish ${target}`, pending: "Publishing..." };
  }
  const labels: Partial<Record<SystemConfigActionType, { idle: string; pending: string }>> = {
    deprecate: { idle: "Deprecate taxonomy item", pending: "Deprecating..." },
    archive: { idle: "Archive", pending: "Archiving..." },
    activate: { idle: "Activate region", pending: "Activating..." },
    deactivate: { idle: "Deactivate region", pending: "Deactivating..." },
    enable: { idle: "Enable feature", pending: "Enabling..." },
    disable: { idle: "Disable feature", pending: "Disabling..." },
    stage: { idle: "Stage for rollout", pending: "Staging..." },
  };
  return labels[action] ?? { idle: action, pending: "Applying..." };
}

function KindMetadata({ record }: { record: SystemConfigRecord }) {
  if (record.kind === "taxonomy") {
    return (
      <>
        <div className="tm-soft-band">
          <p className="tm-label">Category</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{formatCategoryLabel(record.category!)}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Usage count</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{record.usageCount} listings</p>
        </div>
      </>
    );
  }

  if (record.kind === "toggle") {
    return (
      <>
        <div className="tm-soft-band">
          <p className="tm-label">Area</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{formatAreaLabel(record.area!)}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Rollout</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {record.rolloutPercent !== null ? `${record.rolloutPercent}%` : "—"}
          </p>
        </div>
      </>
    );
  }

  if (record.kind === "region") {
    return (
      <>
        <div className="tm-soft-band">
          <p className="tm-label">Region type</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{formatRegionTypeLabel(record.regionType!)}</p>
        </div>
        {record.parentSlug && (
          <div className="tm-soft-band">
            <p className="tm-label">Parent region</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{record.parentSlug}</p>
          </div>
        )}
        {record.timezone && (
          <div className="tm-soft-band">
            <p className="tm-label">Timezone</p>
            <p className="mt-2 text-sm text-slate-900">{record.timezone}</p>
          </div>
        )}
        {record.currency && (
          <div className="tm-soft-band">
            <p className="tm-label">Currency</p>
            <p className="mt-2 text-sm text-slate-900">{record.currency}</p>
          </div>
        )}
      </>
    );
  }

  if (record.kind === "template") {
    return (
      <>
        <div className="tm-soft-band">
          <p className="tm-label">Template kind</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{formatTemplateKindLabel(record.templateKind!)}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Scope</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{formatTemplateScopeLabel(record.templateScope!)}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Usage count</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {record.usageCount} moderation workflows
            {record.usageCount > 0 ? " — archiving is blocked until usage reaches zero" : ""}
          </p>
        </div>
      </>
    );
  }

  // content
  return (
    <>
      <div className="tm-soft-band">
        <p className="tm-label">Content kind</p>
        <p className="mt-2 text-sm font-semibold text-slate-950">{formatContentKindLabel(record.contentKind!)}</p>
      </div>
      <div className="tm-soft-band">
        <p className="tm-label">Version</p>
        <p className="mt-2 text-sm font-semibold text-slate-950">v{record.contentVersion ?? "—"}</p>
      </div>
    </>
  );
}

export function SystemConfigDetailPanel({
  selectedRecord,
  emptyState,
  note,
  pendingAction,
  feedback,
  policySummary,
  role,
  onNoteChange,
  onAction,
  onResetSelection,
}: {
  selectedRecord: SystemConfigRecord | null;
  emptyState?: { title: string; description: string } | null;
  note: string;
  pendingAction: SystemConfigActionType | null;
  feedback: { tone: "success" | "error"; message: string } | null;
  policySummary: string;
  role: AdminRole;
  onNoteChange: (value: string) => void;
  onAction: (action: SystemConfigActionType) => void;
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
          actionLabel="Reset selection"
          description="The selected configuration item is no longer available in the current snapshot."
          onAction={onResetSelection}
          title="Selected item was not found"
          tone="exception"
        />
      </article>
    );
  }

  const availableActions = getAvailableActions(selectedRecord, role);

  return (
    <article className="tm-panel min-w-0 h-fit">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Configuration Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedRecord.name}</h2>
          <p className="tm-muted mt-2 text-sm">slug: {selectedRecord.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={selectedRecord.kind} tone="info" />
          <StatusBadge label={selectedRecord.status} tone={statusTone(selectedRecord.status)} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band md:col-span-2">
          <p className="tm-label">Description</p>
          <p className="mt-2 text-sm text-slate-900">{selectedRecord.description}</p>
        </div>
        <KindMetadata record={selectedRecord} />
        <div className="tm-soft-band">
          <p className="tm-label">Last updated</p>
          <p className="mt-2 text-sm text-slate-900">{selectedRecord.updatedAt.slice(0, 10)}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Updated by</p>
          <p className="mt-2 text-sm text-slate-900">{selectedRecord.updatedBy}</p>
        </div>
      </div>

      <div className="tm-soft-band mt-5">
        <p className="tm-label">Operator note</p>
        <textarea
          aria-label="Operator note"
          className="tm-textarea mt-3"
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Describe the reason for this configuration change, dependencies affected, or follow-up actions required..."
          value={note}
        />
        <p className="tm-muted mt-3 text-sm">{policySummary}</p>

        {selectedRecord.latestAuditRecord && (
          <div className="tm-alert tm-alert-success mt-4">{selectedRecord.latestAuditRecord.summary}</div>
        )}

        {feedback && (
          <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>
            {feedback.message}
          </div>
        )}

        {availableActions.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {availableActions.map((action) => {
              const { idle, pending } = getActionLabel(action, selectedRecord.kind);
              const isPending = pendingAction === action;
              const isBlocked = pendingAction !== null && !isPending;
              const isDanger = action === "deprecate" || action === "archive" || action === "deactivate";
              return (
                <button
                  aria-label={idle}
                  className={`tm-btn ${isDanger ? "tm-btn-outline" : "tm-btn-primary"}`}
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
          <p className="tm-muted mt-5 text-sm">No actions available for this item with the current role.</p>
        )}
      </div>

      <div className="mt-5">
        <p className="tm-kicker">Change History</p>
        <div className="mt-4 grid gap-3">
          {selectedRecord.history.map((entry) => (
            <article className="tm-soft-band" key={entry.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{entry.action}</p>
                  <p className="tm-muted mt-1 text-sm">{entry.note}</p>
                </div>
                <StatusBadge label={entry.timestamp.slice(0, 10)} tone="neutral" />
              </div>
              <p className="tm-muted mt-2 text-sm">{entry.actor}</p>
            </article>
          ))}
        </div>
      </div>
    </article>
  );
}
