import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import type {
  NotificationAction,
  NotificationAudienceSegment,
  NotificationChannel,
  NotificationKind,
  NotificationRecord,
} from "@/modules/notifications/types";

function toneForStatus(status: NotificationRecord["status"]) {
  if (status === "sent") return "success" as const;
  if (status === "failed") return "danger" as const;
  return "warning" as const;
}

function channelLabel(channel: NotificationChannel) {
  return channel === "in_app" ? "in app" : channel;
}

function renderDeliveryMetadata(record: NotificationRecord) {
  const metadata = record.deliveryMetadata;

  if (!metadata) {
    return null;
  }

  if (metadata.isEstimated) {
    return (
      <p className="tm-muted mt-3 text-sm">
        Delivery handoff: queued for backend dispatch via {metadata.channels.map(channelLabel).join(", ")} to {metadata.targetSummary}. Estimated audience size:{" "}
        {metadata.estimatedTargetCount} partners.
      </p>
    );
  }

  return (
    <p className="tm-muted mt-3 text-sm">
      Delivery metadata: {metadata.deliveredCount} delivered, {metadata.failedCount} failed via {metadata.channels.map(channelLabel).join(", ")} to{" "}
      {metadata.targetSummary}.
    </p>
  );
}

export function NotificationsDetailPanel({
  selectedRecord,
  emptyState,
  title,
  body,
  kind,
  audienceSegment,
  region,
  partnerIdsInput,
  channels,
  note,
  pendingAction,
  feedback,
  policySummary,
  canSend,
  canBroadcast,
  onTitleChange,
  onBodyChange,
  onKindChange,
  onAudienceSegmentChange,
  onRegionChange,
  onPartnerIdsInputChange,
  onChannelToggle,
  onNoteChange,
  onAction,
  onResetSelection,
}: {
  selectedRecord: NotificationRecord | null;
  emptyState?: { title: string; description: string } | null;
  title: string;
  body: string;
  kind: NotificationKind;
  audienceSegment: NotificationAudienceSegment;
  region: string;
  partnerIdsInput: string;
  channels: NotificationChannel[];
  note: string;
  pendingAction: NotificationAction | null;
  feedback: { tone: "success" | "error"; message: string } | null;
  policySummary: string;
  canSend: boolean;
  canBroadcast: boolean;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onKindChange: (value: NotificationKind) => void;
  onAudienceSegmentChange: (value: NotificationAudienceSegment) => void;
  onRegionChange: (value: string) => void;
  onPartnerIdsInputChange: (value: string) => void;
  onChannelToggle: (channel: NotificationChannel) => void;
  onNoteChange: (value: string) => void;
  onAction: (action: NotificationAction) => void;
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
          actionLabel="Reset message selection"
          description="The selected partner message is no longer available in the current communication snapshot."
          onAction={onResetSelection}
          title="Selected partner message was not found"
          tone="exception"
        />
      </article>
    );
  }

  return (
    <article className="tm-panel min-w-0 h-fit xl:sticky xl:top-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Message Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedRecord.title}</h2>
          <p className="tm-muted mt-2 text-sm">
            Created by {selectedRecord.createdBy} · {selectedRecord.targetPartnerCount} recipients
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={selectedRecord.kind} tone="info" />
          <StatusBadge label={selectedRecord.status} tone={toneForStatus(selectedRecord.status)} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Compose message</p>
          <label className="block mt-4">
            <span className="tm-label">Title</span>
            <input aria-label="Notification title" className="tm-input mt-3" onChange={(event) => onTitleChange(event.target.value)} value={title} />
          </label>
          <label className="block mt-4">
            <span className="tm-label">Body</span>
            <textarea
              aria-label="Notification body"
              className="tm-textarea mt-3"
              onChange={(event) => onBodyChange(event.target.value)}
              placeholder="Write the partner-facing message that will appear in the selected channels..."
              value={body}
            />
          </label>
        </div>

        <div className="tm-soft-band">
          <p className="tm-label">Audience and channels</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="tm-label">Message type</span>
              <select aria-label="Message type" className="tm-input mt-3" onChange={(event) => onKindChange(event.target.value as NotificationKind)} value={kind}>
                <option value="direct">direct</option>
                <option disabled={!canBroadcast} value="broadcast">
                  broadcast
                </option>
                <option value="transactional">transactional</option>
              </select>
            </label>
            <label className="block">
              <span className="tm-label">Audience segment</span>
              <select aria-label="Audience segment" className="tm-input mt-3" onChange={(event) => onAudienceSegmentChange(event.target.value as NotificationAudienceSegment)} value={audienceSegment}>
                <option value="all_partners">all partners</option>
                <option value="verified_partners">verified partners</option>
                <option value="watchlist">watchlist</option>
                <option value="api_clients">api clients</option>
                <option value="region">region</option>
                <option value="partner">partner</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="tm-label">Region</span>
              <input
                aria-label="Target region"
                className="tm-input mt-3"
                disabled={audienceSegment !== "region"}
                onChange={(event) => onRegionChange(event.target.value)}
                placeholder="East Africa"
                value={region}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="tm-label">Partner IDs</span>
              <input
                aria-label="Target partner IDs"
                className="tm-input mt-3"
                disabled={audienceSegment !== "partner"}
                onChange={(event) => onPartnerIdsInputChange(event.target.value)}
                placeholder="partner-id-1, partner-id-2"
                value={partnerIdsInput}
              />
            </label>
          </div>
          <div className="mt-4">
            <p className="tm-label">Channels</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {(["email", "in_app", "sms"] as NotificationChannel[]).map((channel) => (
                <label className="inline-flex items-center gap-2 text-sm text-slate-900" key={channel}>
                  <input
                    checked={channels.includes(channel)}
                    onChange={() => onChannelToggle(channel)}
                    type="checkbox"
                  />
                  <span>{channelLabel(channel)}</span>
                </label>
              ))}
            </div>
          </div>
          <p className="tm-muted mt-4 text-sm">{policySummary}</p>
        </div>
      </div>

      <div className="tm-soft-band mt-5">
        <p className="tm-label">Operator note</p>
        <textarea
          className="tm-textarea mt-3"
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Capture why this message is being sent, approval context, or delivery follow-up notes..."
          value={note}
        />
        {selectedRecord.latestAuditRecord ? (
          <div className="tm-alert tm-alert-success mt-4">
            Audit prep: {selectedRecord.latestAuditRecord.summary} Target segment is {selectedRecord.latestAuditRecord.targetSegment.replaceAll("_", " ")} for{" "}
            {selectedRecord.latestAuditRecord.targetPartnerCount} partners via {selectedRecord.latestAuditRecord.channels.map(channelLabel).join(", ")}.
          </div>
        ) : null}
        {renderDeliveryMetadata(selectedRecord)}
        {feedback ? <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>{feedback.message}</div> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="tm-btn tm-btn-primary" disabled={!canSend || pendingAction !== null} onClick={() => onAction("send_message")} type="button">
            {pendingAction === "send_message" ? "Sending..." : "Send message"}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <p className="tm-kicker">Delivery History</p>
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
