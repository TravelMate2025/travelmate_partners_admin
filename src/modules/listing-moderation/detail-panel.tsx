import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import type {
  ModerationAction,
  ModerationListingRecord,
  ModerationReasonCode,
} from "@/modules/listing-moderation/types";

const moderationReasons: { code: ModerationReasonCode; label: string }[] = [
  { code: "content_quality", label: "content quality" },
  { code: "missing_details", label: "missing details" },
  { code: "policy_violation", label: "policy violation" },
  { code: "pricing_mismatch", label: "pricing mismatch" },
  { code: "duplicate_listing", label: "duplicate listing" },
  { code: "safety_risk", label: "safety risk" },
];

function toneForStatus(status: ModerationListingRecord["status"]) {
  if (status === "live" || status === "approved") return "success" as const;
  if (status === "paused" || status === "rejected") return "danger" as const;
  return "warning" as const;
}

export function ListingModerationDetailPanel({
  selectedRecord,
  activeMediaId,
  selectedIds,
  reasonCode,
  note,
  feedback,
  pendingAction,
  allowedActions,
  allowedBulkActions,
  canBulkUpdate,
  onSelectMedia,
  onReasonCodeChange,
  onNoteChange,
  onAction,
  onBulkAction,
  onResetSelection,
}: {
  selectedRecord: ModerationListingRecord | null;
  activeMediaId: string;
  selectedIds: string[];
  reasonCode: ModerationReasonCode;
  note: string;
  feedback: { tone: "success" | "error"; message: string } | null;
  pendingAction: ModerationAction | null;
  allowedActions: Record<ModerationAction, boolean> | null;
  allowedBulkActions: Record<ModerationAction, boolean>;
  canBulkUpdate: boolean;
  onSelectMedia: (mediaId: string) => void;
  onReasonCodeChange: (value: ModerationReasonCode) => void;
  onNoteChange: (value: string) => void;
  onAction: (action: ModerationAction) => void;
  onBulkAction: (action: ModerationAction) => void;
  onResetSelection: () => void;
}) {
  if (!selectedRecord) {
    return (
      <article className="tm-panel">
        <SurfaceState
          actionLabel="Reset moderation selection"
          description="The selected listing is no longer available in the moderation queue snapshot."
          onAction={onResetSelection}
          title="Selected listing was not found"
          tone="exception"
        />
      </article>
    );
  }

  const activeMedia =
    selectedRecord.media.find((media) => media.id === activeMediaId) ?? selectedRecord.media[0] ?? null;

  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Moderation Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedRecord.title}</h2>
          <p className="tm-muted mt-2 text-sm">
            {selectedRecord.kind} · {selectedRecord.businessName} · {selectedRecord.locationLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={selectedRecord.status} tone={toneForStatus(selectedRecord.status)} />
          <StatusBadge label={`${selectedRecord.compliance.completenessScore}% complete`} tone="info" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Listing context</p>
          <p className="mt-3 text-sm text-slate-900">{selectedRecord.summary}</p>
          {selectedRecord.escalationNote ? (
            <div className="tm-alert tm-alert-danger mt-4">{selectedRecord.escalationNote}</div>
          ) : null}
          <div className="mt-4 grid gap-2">
            <div className="tm-document-meta">
              <span className="tm-label">Required fixes</span>
              <ul className="tm-bullet-list mt-2">
                {selectedRecord.compliance.requiredFixes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="tm-document-meta">
              <span className="tm-label">Compliance context</span>
              <ul className="tm-bullet-list mt-2">
                {[...selectedRecord.compliance.policyFlags, ...selectedRecord.compliance.duplicateWarnings, ...selectedRecord.compliance.geoSignals].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="tm-soft-band">
          <p className="tm-label">Media packet</p>
          <div className="mt-4 grid gap-3">
            {selectedRecord.media.map((media) => (
              <button
                className={`tm-document-card ${media.id === activeMedia?.id ? "tm-document-card-active" : ""}`}
                key={media.id}
                onClick={() => onSelectMedia(media.id)}
                type="button"
              >
                <p className="text-sm font-semibold text-slate-950">{media.fileName}</p>
                <p className="tm-muted mt-2 text-sm">{media.previewSummary}</p>
              </button>
            ))}
          </div>
          {activeMedia ? (
            <div className="tm-document-preview mt-4">
              <p className="text-base font-semibold text-slate-950">{activeMedia.fileName}</p>
              <p className="tm-muted mt-2 text-sm">{activeMedia.previewSummary}</p>
              <p className="tm-muted mt-3 text-sm">{activeMedia.securePath}</p>
            </div>
          ) : (
            <div className="mt-4">
              <SurfaceState
                description="This listing does not currently have moderation media in the local snapshot."
                title="No media attached"
                tone="empty"
              />
            </div>
          )}
        </div>
      </div>

      <div className="tm-soft-band mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="tm-label">Moderation action</p>
            <p className="tm-muted mt-2 text-sm">
              Decision outputs stay aligned to partner-facing listing statuses while audit and notification delivery remain backend-owned.
            </p>
          </div>
          {selectedIds.length > 1 ? <StatusBadge label={`${selectedIds.length} selected`} tone="info" /> : null}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[0.6fr_1.4fr]">
          <label className="block">
            <span className="tm-label">Reason</span>
            <select className="tm-input mt-3" onChange={(event) => onReasonCodeChange(event.target.value as ModerationReasonCode)} value={reasonCode}>
              {moderationReasons.map((reason) => (
                <option key={reason.code} value={reason.code}>
                  {reason.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="tm-label">Moderation note</span>
            <textarea
              className="tm-textarea mt-3"
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Capture moderation reason, correction guidance, or emergency context..."
              value={note}
            />
          </label>
        </div>
        {selectedRecord.latestAuditRecord ? (
          <div className="tm-alert tm-alert-success mt-4">
            Audit prep: {selectedRecord.latestAuditRecord.summary} Event is {selectedRecord.latestAuditRecord.status.replaceAll("_", " ")}.
          </div>
        ) : null}
        {feedback ? <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>{feedback.message}</div> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="tm-btn tm-btn-primary" disabled={pendingAction !== null || !allowedActions?.approve} onClick={() => onAction("approve")} type="button">
            {pendingAction === "approve" ? "Approving..." : "Approve"}
          </button>
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.send_back} onClick={() => onAction("send_back")} type="button">
            {pendingAction === "send_back" ? "Sending..." : "Send back for edits"}
          </button>
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.reject} onClick={() => onAction("reject")} type="button">
            {pendingAction === "reject" ? "Rejecting..." : "Reject"}
          </button>
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.flag} onClick={() => onAction("flag")} type="button">
            {pendingAction === "flag" ? "Flagging..." : "Flag"}
          </button>
          <button
            className="tm-btn tm-btn-outline"
            disabled={pendingAction !== null || !allowedActions?.emergency_unpublish}
            onClick={() => onAction("emergency_unpublish")}
            type="button"
          >
            {pendingAction === "emergency_unpublish" ? "Unpublishing..." : "Emergency unpublish"}
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="tm-btn tm-btn-primary"
            disabled={!canBulkUpdate || selectedIds.length < 2 || pendingAction !== null || !allowedBulkActions.approve}
            onClick={() => onBulkAction("approve")}
            type="button"
          >
            Bulk approve selected
          </button>
          <button
            className="tm-btn tm-btn-outline"
            disabled={!canBulkUpdate || selectedIds.length < 2 || pendingAction !== null || !allowedBulkActions.send_back}
            onClick={() => onBulkAction("send_back")}
            type="button"
          >
            Bulk send back selected
          </button>
          <button
            className="tm-btn tm-btn-outline"
            disabled={!canBulkUpdate || selectedIds.length < 2 || pendingAction !== null || !allowedBulkActions.reject}
            onClick={() => onBulkAction("reject")}
            type="button"
          >
            Bulk reject selected
          </button>
          <button
            className="tm-btn tm-btn-outline"
            disabled={!canBulkUpdate || selectedIds.length < 2 || pendingAction !== null || !allowedBulkActions.flag}
            onClick={() => onBulkAction("flag")}
            type="button"
          >
            Bulk flag selected
          </button>
          <button
            className="tm-btn tm-btn-outline"
            disabled={
              !canBulkUpdate ||
              selectedIds.length < 2 ||
              pendingAction !== null ||
              !allowedBulkActions.emergency_unpublish
            }
            onClick={() => onBulkAction("emergency_unpublish")}
            type="button"
          >
            Bulk emergency unpublish selected
          </button>
        </div>
      </div>

      <div className="mt-5">
        <p className="tm-kicker">Moderation history</p>
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
