import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import {
  formatActionLabel,
  formatCategoryLabel,
  outcomeTone,
  riskTone,
} from "@/modules/audit-compliance/rules";
import type {
  AccessPolicyEntry,
  AuditLogEntry,
  ComplianceExportRecord,
  RetentionConfig,
} from "@/modules/audit-compliance/types";

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      <span className="min-w-[140px] text-sm font-medium text-slate-700">{label}</span>
      <span className="text-sm text-slate-900">{value}</span>
    </div>
  );
}

function RetentionSection({ config }: { config: RetentionConfig }) {
  return (
    <div className="tm-soft-band mt-5">
      <p className="tm-kicker">Retention Policy</p>
      <h3 className="mt-2 text-base font-semibold text-slate-950">Data retention controls</h3>
      <div className="mt-4 grid gap-3">
        <MetadataRow label="Default retention" value={`${config.defaultRetentionDays} days`} />
        <MetadataRow label="High-risk retention" value={`${config.highRiskRetentionDays} days`} />
        <MetadataRow label="Critical retention" value={`${config.criticalRetentionDays} days`} />
        <MetadataRow label="Legal hold" value={config.legalHoldEnabled ? "Active" : "Not active"} />
        <MetadataRow label="Last reviewed" value={config.lastReviewedAt.slice(0, 10)} />
      </div>
    </div>
  );
}

function AccessPolicySection({ entries }: { entries: AccessPolicyEntry[] }) {
  return (
    <div className="tm-soft-band mt-5">
      <p className="tm-kicker">Access Policy</p>
      <h3 className="mt-2 text-base font-semibold text-slate-950">Role-based audit access</h3>
      <div className="mt-4 grid gap-4">
        {entries.map((entry) => (
          <div key={entry.role} className="grid gap-1">
            <div className="flex items-center gap-2">
              <StatusBadge label={entry.role} tone="neutral" />
              <span className="text-sm text-slate-700">
                {entry.canExport ? "can export" : "read only"} ·{" "}
                {entry.canViewRetention ? "retention visible" : "retention restricted"} ·{" "}
                {entry.canViewAccessPolicy ? "policy visible" : "policy restricted"}
              </span>
            </div>
            {entry.restrictedCategories.length > 0 ? (
              <p className="tm-muted text-sm">
                Restricted categories: {entry.restrictedCategories.map((c) => formatCategoryLabel(c)).join(", ")}
              </p>
            ) : (
              <p className="tm-muted text-sm">No category restrictions.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuditComplianceDetailPanel({
  selectedEntry,
  emptyState,
  exportNote,
  pendingExport,
  feedback,
  exportRecord,
  canExport,
  canViewRetentionControls,
  canViewAccessPolicy,
  policySummary,
  retentionConfig,
  accessPolicyEntries,
  onExportNoteChange,
  onExport,
  onResetSelection,
}: {
  selectedEntry: AuditLogEntry | null;
  emptyState?: { title: string; description: string } | null;
  exportNote: string;
  pendingExport: boolean;
  feedback: { tone: "success" | "error"; message: string } | null;
  exportRecord: ComplianceExportRecord | null;
  canExport: boolean;
  canViewRetentionControls: boolean;
  canViewAccessPolicy: boolean;
  policySummary: string;
  retentionConfig: RetentionConfig;
  accessPolicyEntries: AccessPolicyEntry[];
  onExportNoteChange: (value: string) => void;
  onExport: () => void;
  onResetSelection: () => void;
}) {
  if (emptyState) {
    return (
      <article className="tm-panel">
        <SurfaceState description={emptyState.description} title={emptyState.title} tone="empty" />
      </article>
    );
  }

  if (!selectedEntry) {
    return (
      <article className="tm-panel">
        <SurfaceState
          actionLabel="Reset selection"
          description="The selected audit event is no longer available in the current log snapshot."
          onAction={onResetSelection}
          title="Selected audit event was not found"
          tone="exception"
        />
      </article>
    );
  }

  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Event Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedEntry.entityLabel}</h2>
          <p className="tm-muted mt-2 text-sm">
            {selectedEntry.actor} · {selectedEntry.actorRole.replaceAll("_", " ")} · {selectedEntry.timestamp.slice(0, 10)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={selectedEntry.riskLevel} tone={riskTone(selectedEntry.riskLevel)} />
          <StatusBadge label={selectedEntry.outcome} tone={outcomeTone(selectedEntry.outcome)} />
        </div>
      </div>

      <div className="tm-soft-band mt-5">
        <p className="tm-label">Event information</p>
        <div className="mt-4 grid gap-3">
          <MetadataRow label="Event ID" value={selectedEntry.eventId} />
          <MetadataRow label="Category" value={formatCategoryLabel(selectedEntry.category)} />
          <MetadataRow label="Action" value={formatActionLabel(selectedEntry.action)} />
          <MetadataRow label="Risk level" value={selectedEntry.riskLevel} />
          <MetadataRow label="Outcome" value={selectedEntry.outcome} />
          <MetadataRow label="Entity type" value={selectedEntry.entityType.replaceAll("_", " ")} />
          <MetadataRow label="Timestamp" value={selectedEntry.timestamp} />
        </div>
      </div>

      <div className="tm-soft-band mt-5">
        <p className="tm-label">Summary</p>
        <p className="mt-3 text-sm text-slate-900">{selectedEntry.summary}</p>
        {selectedEntry.note ? (
          <p className="tm-muted mt-3 text-sm">Operator note: {selectedEntry.note}</p>
        ) : null}
      </div>

      {Object.keys(selectedEntry.metadata).length > 0 ? (
        <div className="tm-soft-band mt-5">
          <p className="tm-label">Event metadata</p>
          <div className="mt-4 grid gap-3">
            {Object.entries(selectedEntry.metadata).map(([key, value]) => (
              <MetadataRow key={key} label={key.replaceAll(/([A-Z])/g, " $1").toLowerCase()} value={value} />
            ))}
          </div>
        </div>
      ) : null}

      {canExport ? (
        <div className="tm-soft-band mt-5">
          <p className="tm-label">Compliance export</p>
          <p className="tm-muted mt-2 text-sm">
            Export the currently filtered audit log as a CSV file. All entries visible under the active filters will be included.
          </p>
          <label className="mt-4 block">
            <span className="tm-label">Export reason</span>
            <textarea
              aria-label="Export reason"
              className="tm-textarea mt-3"
              onChange={(event) => onExportNoteChange(event.target.value)}
              placeholder="Explain why this compliance export is being requested — e.g. legal review, internal audit, incident investigation..."
              value={exportNote}
            />
          </label>
          {exportRecord ? (
            <div className="tm-alert tm-alert-success mt-4">
              <p className="font-medium">{exportRecord.summary}</p>
              <p className="mt-1 text-sm">
                File: <span className="font-mono">{exportRecord.fileName}</span>
              </p>
              <p className="mt-1 text-sm">
                {exportRecord.exportedEntryCount} {exportRecord.exportedEntryCount === 1 ? "entry" : "entries"} · Exported at{" "}
                {exportRecord.exportedAt}
              </p>
            </div>
          ) : null}
          {feedback && !exportRecord ? (
            <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>
              {feedback.message}
            </div>
          ) : null}
          <div className="mt-5">
            <button
              aria-label="Export compliance data"
              className="tm-btn tm-btn-primary"
              disabled={pendingExport}
              onClick={onExport}
              type="button"
            >
              {pendingExport ? "Exporting..." : "Export compliance data"}
            </button>
          </div>
          <p className="tm-muted mt-3 text-sm">{policySummary}</p>
        </div>
      ) : (
        <div className="tm-soft-band mt-5">
          <p className="tm-label">Compliance export</p>
          <p className="tm-muted mt-3 text-sm">{policySummary}</p>
        </div>
      )}

      {canViewRetentionControls ? <RetentionSection config={retentionConfig} /> : null}
      {canViewAccessPolicy ? <AccessPolicySection entries={accessPolicyEntries} /> : null}
    </article>
  );
}
