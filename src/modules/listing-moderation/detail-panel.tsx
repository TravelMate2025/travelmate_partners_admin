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
  onCityAction,
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
  onCityAction: (action: "approve" | "merge" | "reject" | "blacklist") => void;
  onResetSelection: () => void;
}) {
  if (!selectedRecord) {
    return (
      <article className="tm-panel min-w-0 h-fit">
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

  const formattedSubmittedAt = selectedRecord.submittedAt
    ? selectedRecord.submittedAt.slice(0, 16).replace("T", " ")
    : "Not available";
  const noSingleListingActions =
    !!allowedActions &&
    !allowedActions.approve &&
    !allowedActions.send_back &&
    !allowedActions.reject &&
    !allowedActions.flag &&
    !allowedActions.emergency_unpublish;

  return (
    <article className="tm-panel min-w-0 h-fit">
      {/* Header */}
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

      {/* Key metadata — mirrors Admin Users Role / Team / Invited by / Last sign-in grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Listing type</p>
          <p className="mt-2 text-sm font-semibold capitalize text-slate-950">{selectedRecord.kind}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Partner</p>
          <p className="mt-2 text-sm text-slate-900">{selectedRecord.partnerName}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Submitted</p>
          <p className="mt-2 text-sm text-slate-900">{formattedSubmittedAt}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Queue priority</p>
          <p className="mt-2 text-sm text-slate-900">{selectedRecord.reviewSignals.priorityLabel}</p>
        </div>
      </div>

      {selectedRecord.cityReviewStatus && selectedRecord.cityReviewStatus !== "approved" ? (
        <div className="tm-soft-band mt-5">
          <p className="tm-label">City moderation</p>
          <p className="mt-2 text-sm text-slate-900">
            City review status: <span className="font-semibold">{selectedRecord.cityReviewStatus}</span>
          </p>
          <p className="tm-muted mt-2 text-sm">
            Listing approval is blocked until city is approved or merged into a canonical city.
          </p>
          {selectedRecord.cityContext ? (
            <div className="mt-3 grid gap-2 text-sm text-slate-900">
              <p>
                Scope: <span className="font-semibold">{selectedRecord.cityContext.country || "Unknown country"}</span>
                {" / "}
                <span className="font-semibold">{selectedRecord.cityContext.adminLevel1 || "Unknown region"}</span>
              </p>
              <p>
                Submitted city: <span className="font-semibold">{selectedRecord.cityContext.submittedCity || "N/A"}</span>
              </p>
              <p>
                Canonical cities in scope:{" "}
                <span className="font-semibold">{selectedRecord.cityContext.canonicalCityCount}</span>
              </p>
              {selectedRecord.cityContext.isStateEmpty ? (
                <p className="tm-alert tm-alert-warning">
                  No canonical cities exist yet in this state/region.
                </p>
              ) : null}
              {selectedRecord.cityContext.canonicalCities.length > 0 ? (
                <p className="tm-muted">
                  Existing cities: {selectedRecord.cityContext.canonicalCities.join(", ")}
                </p>
              ) : null}
              {selectedRecord.cityContext.hasExactCanonicalMatch ? (
                <p className="tm-alert tm-alert-warning">
                  Exact canonical match exists. Suggested action: <span className="font-semibold">Merge city</span>.
                </p>
              ) : null}
              {selectedRecord.cityContext.duplicateCandidates.length > 0 ? (
                <p className="tm-muted">
                  Possible duplicates: {selectedRecord.cityContext.duplicateCandidates.join(", ")}
                </p>
              ) : null}
              {!selectedRecord.cityContext.hasExactCanonicalMatch
                && selectedRecord.cityContext.duplicateCandidates.length === 0
                && selectedRecord.cityContext.recommendedAction === "approve" ? (
                  <p className="tm-alert tm-alert-info">
                    No duplicate candidate detected. Suggested action: <span className="font-semibold">Approve city</span>.
                  </p>
                ) : null}
            </div>
          ) : null}
          {selectedRecord.citySuggestionId ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="tm-btn tm-btn-primary" onClick={() => onCityAction("approve")} type="button">
                Approve city
              </button>
              <button className="tm-btn tm-btn-outline" onClick={() => onCityAction("merge")} type="button">
                Merge city
              </button>
              <button className="tm-btn tm-btn-outline" onClick={() => onCityAction("reject")} type="button">
                Reject city
              </button>
              <button className="tm-btn tm-btn-outline" onClick={() => onCityAction("blacklist")} type="button">
                Blacklist city
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Listing context + Media packet — asymmetric 2-col, same as Admin Users */}
      <div className="mt-5 grid items-start gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
        <div className="tm-soft-band h-full">
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
                {[
                  ...selectedRecord.compliance.policyFlags,
                  ...selectedRecord.compliance.duplicateWarnings,
                  ...selectedRecord.compliance.geoSignals,
                ].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="tm-soft-band h-full">
          <p className="tm-label">Media packet</p>
          <div className="mt-4 grid gap-3">
            {selectedRecord.media.map((media) => (
              <button
                className={`tm-document-card ${media.id === activeMedia?.id ? "tm-document-card-active" : ""}`}
                key={media.id}
                onClick={() => onSelectMedia(media.id)}
                type="button"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950">{media.fileName}</p>
                  <div className="flex flex-wrap gap-1">
                    {media.spaceType ? (
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {media.spaceType.replace(/_/g, " ")}
                      </span>
                    ) : null}
                    {media.roomId ? (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        Room image
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="tm-muted mt-2 text-sm">{media.previewSummary}</p>
              </button>
            ))}
          </div>
          {activeMedia ? (
            <div className="tm-document-preview mt-4">
              <p className="text-base font-semibold text-slate-950">{activeMedia.fileName}</p>
              {activeMedia.secureUrl ? (
                <img
                  src={activeMedia.secureUrl}
                  alt={activeMedia.fileName}
                  className="mt-3 h-44 w-full rounded-md border border-slate-200 object-cover"
                />
              ) : null}
              <p className="tm-muted mt-2 text-sm">{activeMedia.previewSummary}</p>
              <p className="tm-muted mt-3 text-sm">{activeMedia.secureUrl ?? activeMedia.securePath}</p>
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

      {/* Moderation decision — structured with governance cards, mirrors Admin Users governance section */}
      <div className="tm-soft-band mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="tm-label">Moderation decision</p>
          {selectedIds.length > 1 ? <StatusBadge label={`${selectedIds.length} selected`} tone="info" /> : null}
        </div>

        <div className="mt-4 grid gap-4">
          <div className="tm-document-card">
            <p className="text-sm font-semibold text-slate-950">Reason and note</p>
            <div className="mt-3 grid gap-4 md:grid-cols-[0.6fr_1.4fr]">
              <label className="block">
                <span className="tm-label">Reason</span>
                <select
                  className="tm-input mt-3"
                  onChange={(event) => onReasonCodeChange(event.target.value as ModerationReasonCode)}
                  value={reasonCode}
                >
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
                  aria-label="Moderation note"
                  className="tm-textarea mt-3"
                  onChange={(event) => onNoteChange(event.target.value)}
                  placeholder="Capture moderation reason, correction guidance, or emergency context..."
                  value={note}
                />
                <p className="tm-muted mt-2 text-xs">
                  Required for Flag and Emergency unpublish actions.
                </p>
              </label>
            </div>
          </div>

          {selectedRecord.latestAuditRecord ? (
            <div className="tm-alert tm-alert-success">
              Audit prep: {selectedRecord.latestAuditRecord.summary} Event is{" "}
              {selectedRecord.latestAuditRecord.status.replaceAll("_", " ")}.
            </div>
          ) : null}

          {feedback ? (
            <div className={`tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>
              {feedback.message}
            </div>
          ) : null}

          <div className="tm-admin-governance-card">
            <p className="tm-label">Listing actions</p>
            <p className="tm-muted mt-2 text-sm">
              Decision outputs stay aligned to partner-facing listing statuses. Audit and notification delivery remain backend-owned.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="tm-btn tm-btn-primary"
                disabled={pendingAction !== null || !allowedActions?.approve}
                onClick={() => onAction("approve")}
                type="button"
              >
                {pendingAction === "approve" ? "Approving..." : "Approve"}
              </button>
              <button
                className="tm-btn tm-btn-outline"
                disabled={pendingAction !== null || !allowedActions?.send_back}
                onClick={() => onAction("send_back")}
                type="button"
              >
                {pendingAction === "send_back" ? "Sending..." : "Send back for edits"}
              </button>
              <button
                className="tm-btn tm-btn-outline"
                disabled={pendingAction !== null || !allowedActions?.reject}
                onClick={() => onAction("reject")}
                type="button"
              >
                {pendingAction === "reject" ? "Rejecting..." : "Reject"}
              </button>
              <button
                className="tm-btn tm-btn-outline"
                disabled={pendingAction !== null || !allowedActions?.flag}
                onClick={() => onAction("flag")}
                type="button"
              >
                {pendingAction === "flag" ? "Flagging..." : "Flag"}
              </button>
              <button
                className="tm-btn tm-btn-outline"
                disabled={pendingAction !== null || !allowedActions?.emergency_unpublish}
                onClick={() => onAction("emergency_unpublish")}
                title={!allowedActions?.emergency_unpublish ? "Only operations or super admin can emergency-unpublish this listing." : undefined}
                type="button"
              >
                {pendingAction === "emergency_unpublish" ? "Unpublishing..." : "Emergency unpublish"}
              </button>
            </div>
            {!allowedActions?.emergency_unpublish ? (
              <p className="tm-muted mt-3 text-sm">
                Emergency unpublish is restricted to operations and super admin roles.
              </p>
            ) : null}
            {noSingleListingActions ? (
              <p className="tm-muted mt-3 text-sm">
                No single-listing moderation action is currently available for this status and role.
              </p>
            ) : null}
          </div>

          <div className="tm-admin-governance-card tm-admin-governance-card-accent">
            <p className="tm-label">Bulk actions</p>
            <p className="tm-muted mt-2 text-sm">
              Apply a decision to all selected listings at once. Select two or more from the queue to enable.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
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
        </div>
      </div>

      {/* Moderation history — wrapped in tm-soft-band with tm-label, mirrors Admin Users history section */}
      <div className="tm-soft-band mt-5">
        <p className="tm-label">Moderation history</p>
        <div className="mt-4 grid gap-3">
          {selectedRecord.history.map((entry) => (
            <div className="tm-document-card" key={entry.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{entry.action}</p>
                  <p className="tm-muted mt-1 text-sm">{entry.note}</p>
                </div>
                <StatusBadge label={entry.timestamp} tone="neutral" />
              </div>
              <p className="tm-muted mt-2 text-sm">{entry.actor}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
