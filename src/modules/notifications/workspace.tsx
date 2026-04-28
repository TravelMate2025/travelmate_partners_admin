"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import type { AdminRole } from "@/modules/auth/types";
import { NotificationsDetailPanel } from "@/modules/notifications/detail-panel";
import { NotificationsQueuePanel } from "@/modules/notifications/queue-panel";
import { buildNotificationsSummary, canSendNotification, getNotificationsPolicy, matchesNotificationFilter } from "@/modules/notifications/rules";
import { mockNotificationsRepository, realNotificationsRepository } from "@/modules/notifications/service";
import type {
  NotificationAction,
  NotificationAudienceSegment,
  NotificationChannel,
  NotificationFilterState,
  NotificationKind,
  NotificationRecord,
  NotificationsSurfaceState,
} from "@/modules/notifications/types";

function buildDraftRecord(actor: string): NotificationRecord {
  const now = new Date().toISOString();
  return {
    id: "notification-draft-local",
    title: "Partner message draft",
    body: "Write a clear partner-facing update before sending.",
    kind: "direct",
    status: "draft",
    audienceSegment: "verified_partners",
    region: null,
    channels: ["email"],
    targetPartnerCount: 0,
    createdAt: now,
    createdBy: actor,
    summary: "Draft message prepared for partner communication.",
    deliveryMetadata: null,
    operationalNote: "",
    history: [],
    latestAuditRecord: null,
  };
}

export function NotificationsWorkspace({
  initialRecords,
  actor,
  role,
  mode = "mock",
  surfaceState,
}: {
  initialRecords: NotificationRecord[];
  actor: string;
  role: AdminRole;
  mode?: "mock" | "real";
  surfaceState?: NotificationsSurfaceState;
}) {
  const seededRecords = initialRecords.length > 0 ? initialRecords : [buildDraftRecord(actor)];
  const [records, setRecords] = useState(seededRecords);
  const [filters, setFilters] = useState<NotificationFilterState>({
    query: "",
    kind: "all",
    status: "all",
    channel: "all",
  });
  const [selectedId, setSelectedId] = useState(seededRecords[0]?.id ?? "");
  const [title, setTitle] = useState(seededRecords[0]?.title ?? "");
  const [body, setBody] = useState(seededRecords[0]?.body ?? "");
  const [kind, setKind] = useState<NotificationKind>(seededRecords[0]?.kind ?? "direct");
  const [audienceSegment, setAudienceSegment] = useState<NotificationAudienceSegment>(seededRecords[0]?.audienceSegment ?? "verified_partners");
  const [region, setRegion] = useState(seededRecords[0]?.region ?? "");
  const [channels, setChannels] = useState<NotificationChannel[]>(seededRecords[0]?.channels ?? ["email"]);
  const [note, setNote] = useState(seededRecords[0]?.operationalNote ?? "");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<NotificationAction | null>(null);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);

  const filteredRecords = useMemo(() => records.filter((record) => matchesNotificationFilter(record, filters)), [records, filters]);
  const selectedRecord = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const policy = getNotificationsPolicy(role);
  const summary = useMemo(() => buildNotificationsSummary(records), [records]);
  const repository = mode === "real" ? realNotificationsRepository : mockNotificationsRepository;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const kindParam = params.get("kind");
    const status = params.get("status");
    const channel = params.get("channel");
    const message = params.get("message");

    setFilters({
      query: query ?? "",
      kind: kindParam === "direct" || kindParam === "broadcast" || kindParam === "transactional" ? kindParam : "all",
      status: status === "draft" || status === "sent" || status === "failed" ? status : "all",
      channel: channel === "email" || channel === "in_app" || channel === "sms" ? channel : "all",
    });

    if (message) {
      syncSelection(initialRecords.find((record) => record.id === message));
    }

    setHasLoadedUrlState(true);
  }, [initialRecords]);

  useEffect(() => {
    if (!hasLoadedUrlState) return;

    const params = new URLSearchParams(window.location.search);
    filters.query ? params.set("q", filters.query) : params.delete("q");
    filters.kind !== "all" ? params.set("kind", filters.kind) : params.delete("kind");
    filters.status !== "all" ? params.set("status", filters.status) : params.delete("status");
    filters.channel !== "all" ? params.set("channel", filters.channel) : params.delete("channel");
    selectedId ? params.set("message", selectedId) : params.delete("message");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters, hasLoadedUrlState, selectedId]);

  function syncSelection(record: NotificationRecord | undefined) {
    if (!record) return;

    setSelectedId(record.id);
    setTitle(record.title);
    setBody(record.body);
    setKind(record.kind);
    setAudienceSegment(record.audienceSegment);
    setRegion(record.region ?? "");
    setChannels(record.channels);
    setNote(record.operationalNote);
  }

  function handleSelect(id: string) {
    syncSelection(records.find((record) => record.id === id));
    setFeedback(null);
  }

  function toggleChannel(channel: NotificationChannel) {
    setChannels((current) =>
      current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel],
    );
  }

  async function handleAction(action: NotificationAction) {
    if (!selectedRecord) return;

    setPendingAction(action);
    setFeedback(null);

    try {
      const result = await repository.applyAction(
        records,
        {
          actor,
          notificationId: selectedRecord.id,
          action,
          title,
          body,
          kind,
          audienceSegment,
          region: audienceSegment === "region" ? region : null,
          channels,
          note,
        },
        role,
      );

      setRecords(result.records);
      syncSelection(result.updatedRecord);
      setFeedback({ tone: "success", message: result.auditRecord.summary });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to send partner message.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  function resetFilters() {
    setFilters({ query: "", kind: "all", status: "all", channel: "all" });
    setFeedback(null);
  }

  function resetSelection() {
    syncSelection(records[0]);
    setFeedback(null);
  }

  if (surfaceState) {
    return (
      <section className="grid gap-5">
        <article className="tm-panel">
          <SurfaceState description={surfaceState.description} title={surfaceState.title} tone={surfaceState.status} />
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      <NotificationsQueuePanel
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        onSelect={handleSelect}
        records={filteredRecords}
        selectedId={selectedId}
        summary={summary}
      />
      <NotificationsDetailPanel
        audienceSegment={audienceSegment}
        canBroadcast={policy.canBroadcast}
        body={body}
        canSend={selectedRecord ? canSendNotification(role, { ...selectedRecord, kind }) : false}
        channels={channels}
        emptyState={
          filteredRecords.length === 0
            ? {
                title: "No messages match this view",
                description: "Clear or relax the current filters to continue reviewing partner communications.",
              }
            : null
        }
        feedback={feedback}
        kind={kind}
        note={note}
        onAction={(action) => void handleAction(action)}
        onAudienceSegmentChange={setAudienceSegment}
        onBodyChange={setBody}
        onChannelToggle={toggleChannel}
        onKindChange={setKind}
        onNoteChange={setNote}
        onRegionChange={setRegion}
        onResetSelection={resetSelection}
        onTitleChange={setTitle}
        pendingAction={pendingAction}
        policySummary={policy.summary}
        region={region}
        selectedRecord={selectedRecord}
        title={title}
      />
    </section>
  );
}
