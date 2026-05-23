"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import type { AdminRole } from "@/modules/auth/types";
import { NotificationsDetailPanel } from "@/modules/notifications/detail-panel";
import { NotificationsQueuePanel } from "@/modules/notifications/queue-panel";
import { buildNotificationsSummary, canSendNotification, getNotificationsPolicy, matchesNotificationFilter } from "@/modules/notifications/rules";
import { mockNotificationsRepository, realNotificationsRepository } from "@/modules/notifications/service";
import { fetchPartnerOperationRecords } from "@/modules/partner-operations/service";
import type {
  NotificationAction,
  NotificationAudienceSegment,
  NotificationChannel,
  NotificationFilterState,
  NotificationKind,
  NotificationPartnerOption,
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
    source: "admin_outbound",
    routing: {},
    history: [],
    latestAuditRecord: null,
  };
}

function buildNewDraftRecord(actor: string): NotificationRecord {
  const now = new Date().toISOString();
  return {
    id: `notification-draft-local-${Date.now()}`,
    title: "",
    body: "",
    kind: "direct",
    status: "draft",
    audienceSegment: "verified_partners",
    region: null,
    channels: ["email"],
    targetPartnerCount: 0,
    createdAt: now,
    createdBy: actor,
    summary: "Unsent outbound draft message.",
    deliveryMetadata: null,
    operationalNote: "",
    source: "admin_outbound",
    routing: {},
    history: [],
    latestAuditRecord: null,
  };
}

function buildAppealComposeDraft(actor: string): NotificationRecord {
  const now = new Date().toISOString();
  return {
    id: "notification-draft-appeal",
    title: "Appeal response draft",
    body: "Write a clear, partner-specific appeal response before sending.",
    kind: "direct",
    status: "draft",
    audienceSegment: "partner",
    region: null,
    channels: ["in_app", "email"],
    targetPartnerCount: 1,
    createdAt: now,
    createdBy: actor,
    summary: "Appeal response draft prepared for a specific partner.",
    deliveryMetadata: null,
    operationalNote: "",
    source: "admin_outbound",
    routing: {},
    history: [],
    latestAuditRecord: null,
  };
}

function isSafePartnerId(value: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(value);
}

function cleanLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncateLabel(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
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
  type NotificationsTab = "workflow" | "partner_messages";
  const seededRecords = initialRecords.length > 0 ? initialRecords : [buildDraftRecord(actor)];
  const [records, setRecords] = useState(seededRecords);
  const [activeTab, setActiveTab] = useState<NotificationsTab>("workflow");
  const [filters, setFilters] = useState<NotificationFilterState>({
    query: "",
    kind: "all",
    status: "all",
    channel: "all",
    source: "all",
  });
  const [selectedId, setSelectedId] = useState(seededRecords[0]?.id ?? "");
  const [title, setTitle] = useState(seededRecords[0]?.title ?? "");
  const [body, setBody] = useState(seededRecords[0]?.body ?? "");
  const [kind, setKind] = useState<NotificationKind>(seededRecords[0]?.kind ?? "direct");
  const [audienceSegment, setAudienceSegment] = useState<NotificationAudienceSegment>(seededRecords[0]?.audienceSegment ?? "verified_partners");
  const [region, setRegion] = useState(seededRecords[0]?.region ?? "");
  const [channels, setChannels] = useState<NotificationChannel[]>(seededRecords[0]?.channels ?? ["email"]);
  const [note, setNote] = useState(seededRecords[0]?.operationalNote ?? "");
  const [partnerIdsInput, setPartnerIdsInput] = useState("");
  const [partnerOptions, setPartnerOptions] = useState<NotificationPartnerOption[]>([]);
  const [isAppealCompose, setIsAppealCompose] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<NotificationAction | null>(null);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);

  const filteredRecords = useMemo(() => records.filter((record) => matchesNotificationFilter(record, filters)), [records, filters]);
  const selectedRecord = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const effectivePartnerOptions = useMemo(() => {
    if (!partnerIdsInput.trim()) return partnerOptions;
    if (!isSafePartnerId(partnerIdsInput.trim())) return partnerOptions;
    if (partnerOptions.some((option) => option.id === partnerIdsInput.trim())) return partnerOptions;
    return [{ id: partnerIdsInput.trim(), label: "Selected partner" }, ...partnerOptions];
  }, [partnerIdsInput, partnerOptions]);
  const policy = getNotificationsPolicy(role);
  const summary = useMemo(() => buildNotificationsSummary(records), [records]);
  const repository = mode === "real" ? realNotificationsRepository : mockNotificationsRepository;

  useEffect(() => {
    let isMounted = true;
    async function loadPartnerOptions() {
      try {
        const partners = await fetchPartnerOperationRecords();
        if (!isMounted) return;
        const mapped = partners
          .map((partner) => {
            const baseName = cleanLabel(partner.businessName || partner.partnerName || partner.email || "Partner");
            const readableBase = baseName.length > 0 ? baseName : partner.id;
            const displayBase = truncateLabel(readableBase, 64);
            const displayEmail = cleanLabel(partner.email || "");
            const label = displayEmail
              ? `${displayBase} (${displayEmail})`
              : displayBase;
            return {
              id: partner.id,
              label,
            };
          })
          .filter((option) => option.id.length > 0);
        const deduped = Array.from(new Map(mapped.map((option) => [option.id, option])).values());
        deduped.sort((a, b) => a.label.localeCompare(b.label));
        setPartnerOptions(deduped);
      } catch {
        if (!isMounted) return;
        setPartnerOptions([]);
      }
    }
    void loadPartnerOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const kindParam = params.get("kind");
    const status = params.get("status");
    const channel = params.get("channel");
    const source = params.get("source");
    const message = params.get("message");
    const compose = params.get("compose");
    const composeAudience = params.get("audience");
    const composePartnerId = params.get("partnerId");
    const composeSource = params.get("composeSource");
    const composeTitle = params.get("title");
    const composeBody = params.get("body");
    const composeNote = params.get("note");
    const tab = params.get("tab");

    const defaultTab: NotificationsTab =
      tab === "workflow"
        ? "workflow"
        : tab === "partner_messages" || compose === "1" || source !== "workflow_alert"
          ? "partner_messages"
          : "workflow";
    setActiveTab(defaultTab);

    setFilters({
      query: query ?? "",
      kind: kindParam === "direct" || kindParam === "broadcast" || kindParam === "transactional" ? kindParam : "all",
      status: status === "draft" || status === "sent" || status === "failed" ? status : "all",
      channel: channel === "email" || channel === "in_app" || channel === "sms" ? channel : "all",
      source:
        source === "workflow_alert" || source === "admin_outbound"
          ? source
          : defaultTab === "workflow"
            ? "workflow_alert"
            : "admin_outbound",
    });

    if (message) {
      syncSelection(initialRecords.find((record) => record.id === message));
    }
    const appealCompose = compose === "1" && composeSource === "appeal";
    if (compose === "1") {
      setIsAppealCompose(appealCompose);
      if (composeTitle) setTitle(composeTitle);
      if (composeBody) setBody(composeBody);
      if (composeNote) setNote(composeNote);
      if (composeAudience === "partner") {
        setAudienceSegment("partner");
      }
      if (composePartnerId) {
        setPartnerIdsInput(isSafePartnerId(composePartnerId) ? composePartnerId : "");
      }
      if (appealCompose) {
        setKind("direct");
        setAudienceSegment("partner");
        setSelectedId("notification-draft-appeal");
        setRecords((current) => {
          if (current.some((record) => record.id === "notification-draft-appeal")) {
            return current;
          }
          return [buildAppealComposeDraft(actor), ...current];
        });
      }
    }

    setHasLoadedUrlState(true);
  }, [actor, initialRecords]);

  useEffect(() => {
    if (!hasLoadedUrlState) return;

    const params = new URLSearchParams(window.location.search);
    filters.query ? params.set("q", filters.query) : params.delete("q");
    filters.kind !== "all" ? params.set("kind", filters.kind) : params.delete("kind");
    filters.status !== "all" ? params.set("status", filters.status) : params.delete("status");
    filters.channel !== "all" ? params.set("channel", filters.channel) : params.delete("channel");
    filters.source !== "all" ? params.set("source", filters.source) : params.delete("source");
    params.set("tab", activeTab);
    selectedId ? params.set("message", selectedId) : params.delete("message");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [activeTab, filters, hasLoadedUrlState, selectedId]);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      source: activeTab === "workflow" ? "workflow_alert" : "admin_outbound",
    }));
    if (activeTab === "partner_messages") {
      if (isAppealCompose) {
        setFeedback(null);
        return;
      }
      setRecords((current) => {
        if (current.some((record) => (record.source ?? "admin_outbound") === "admin_outbound")) {
          return current;
        }
        return [buildDraftRecord(actor), ...current];
      });
      const outboundTarget =
        records.find((record) => (record.source ?? "admin_outbound") === "admin_outbound") ??
        buildDraftRecord(actor);
      syncSelection(outboundTarget);
    } else {
      const workflowTarget = records.find((record) => (record.source ?? "admin_outbound") === "workflow_alert");
      if (workflowTarget) {
        syncSelection(workflowTarget);
      }
    }
    setFeedback(null);
  }, [activeTab, actor, isAppealCompose, records]);

  useEffect(() => {
    if (audienceSegment !== "partner" && partnerIdsInput.length > 0) {
      setPartnerIdsInput("");
      return;
    }
    if (audienceSegment === "partner" && partnerIdsInput && !isSafePartnerId(partnerIdsInput)) {
      setPartnerIdsInput("");
    }
  }, [audienceSegment, partnerIdsInput]);

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
    if (record.audienceSegment === "partner") {
      const routedPartnerIds = record.routing?.partnerIds;
      const firstPartnerId =
        Array.isArray(routedPartnerIds) && routedPartnerIds.length > 0
          ? String(routedPartnerIds[0] ?? "").trim()
          : "";
      setPartnerIdsInput(isSafePartnerId(firstPartnerId) ? firstPartnerId : "");
    } else {
      setPartnerIdsInput("");
    }
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
    if ((selectedRecord.source ?? "admin_outbound") !== "admin_outbound") {
      setFeedback({
        tone: "error",
        message: "Workflow alerts are read-only. Open the linked module to continue operations.",
      });
      return;
    }

    setPendingAction(action);
    setFeedback(null);

    if (isAppealCompose && audienceSegment !== "partner") {
      setFeedback({
        tone: "error",
        message: "Appeal responses must target the specific partner. Set audience segment to 'partner'.",
      });
      setPendingAction(null);
      return;
    }
    if (isAppealCompose && kind !== "direct") {
      setFeedback({
        tone: "error",
        message: "Appeal responses must be sent as direct messages.",
      });
      setPendingAction(null);
      return;
    }

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
          partnerIds:
            audienceSegment === "partner" && partnerIdsInput.trim().length > 0 ? [partnerIdsInput.trim()] : [],
          partnerLabel:
            audienceSegment === "partner"
              ? effectivePartnerOptions.find((option) => option.id === partnerIdsInput.trim())?.label ?? null
              : null,
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
    setFilters({
      query: "",
      kind: "all",
      status: "all",
      channel: "all",
      source: activeTab === "workflow" ? "workflow_alert" : "admin_outbound",
    });
    setFeedback(null);
  }

  function resetSelection() {
    syncSelection(records[0]);
    setFeedback(null);
  }

  function createDraft() {
    const draft = buildNewDraftRecord(actor);
    setRecords((current) => [draft, ...current]);
    syncSelection(draft);
    setFeedback({
      tone: "success",
      message: "New draft created. Complete title, body, audience, and note before sending.",
    });
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
        activeTab={activeTab}
        filters={filters}
        onCreateDraft={createDraft}
        onTabChange={setActiveTab}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        onSelect={handleSelect}
        records={filteredRecords}
        selectedId={selectedId}
        summary={summary}
      />
      <NotificationsDetailPanel
        activeTab={activeTab}
        audienceSegment={audienceSegment}
        canBroadcast={policy.canBroadcast}
        body={body}
        canSend={
          selectedRecord
            ? (selectedRecord.source ?? "admin_outbound") === "admin_outbound" &&
              canSendNotification(role, { ...selectedRecord, kind })
            : false
        }
        isAppealCompose={isAppealCompose}
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
        onAudienceSegmentChange={(value) => {
          setAudienceSegment(value);
          if (isAppealCompose && value !== "partner") {
            setFeedback({
              tone: "error",
              message: "This compose flow is for an appeal response. Keep audience segment as 'partner'.",
            });
          }
        }}
        onBodyChange={setBody}
        onChannelToggle={toggleChannel}
        onKindChange={setKind}
        onNoteChange={setNote}
        onRegionChange={setRegion}
        onPartnerIdsInputChange={setPartnerIdsInput}
        partnerOptions={effectivePartnerOptions}
        onResetSelection={resetSelection}
        onTitleChange={setTitle}
        pendingAction={pendingAction}
        partnerIdsInput={partnerIdsInput}
        policySummary={policy.summary}
        region={region}
        selectedRecord={selectedRecord}
        title={title}
      />
    </section>
  );
}
