"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import { ListingModerationDetailPanel } from "@/modules/listing-moderation/detail-panel";
import { ListingModerationQueuePanel } from "@/modules/listing-moderation/queue-panel";
import {
  canApplyModerationAction,
  getAllowedBulkModerationActions,
  getListingModerationPolicy,
} from "@/modules/listing-moderation/policy";
import {
  mockListingModerationRepository,
  realListingModerationRepository,
} from "@/modules/listing-moderation/service";
import type {
  ModerationAction,
  ModerationFilterState,
  ModerationListingRecord,
  ModerationReasonCode,
} from "@/modules/listing-moderation/types";
import type { AdminRole } from "@/modules/auth/types";

function matchesFilter(record: ModerationListingRecord, filters: ModerationFilterState) {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery =
    query.length === 0 ||
    record.title.toLowerCase().includes(query) ||
    record.partnerName.toLowerCase().includes(query) ||
    record.locationLabel.toLowerCase().includes(query);

  const matchesKind = filters.kind === "all" || record.kind === filters.kind;
  const matchesStatus = filters.status === "all" || record.status === filters.status;

  return matchesQuery && matchesKind && matchesStatus;
}

export function ListingModerationWorkspace({
  initialRecords,
  actor,
  role,
  mode = "mock",
}: {
  initialRecords: ModerationListingRecord[];
  actor: string;
  role: AdminRole;
  mode?: "mock" | "real";
}) {
  const repository = mode === "real" ? realListingModerationRepository : mockListingModerationRepository;
  const [records, setRecords] = useState(initialRecords);
  const [filters, setFilters] = useState<ModerationFilterState>({
    query: "",
    kind: "all",
    status: "all",
  });
  const [selectedId, setSelectedId] = useState(initialRecords[0]?.id ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>(initialRecords[0] ? [initialRecords[0].id] : []);
  const [activeMediaId, setActiveMediaId] = useState(initialRecords[0]?.media[0]?.id ?? "");
  const [reasonCode, setReasonCode] = useState<ModerationReasonCode>("content_quality");
  const [note, setNote] = useState(initialRecords[0]?.moderationFeedback ?? "");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<ModerationAction | null>(null);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);
  const [listingResyncAttempted, setListingResyncAttempted] = useState(false);

  const filteredRecords = useMemo(() => records.filter((record) => matchesFilter(record, filters)), [records, filters]);
  const selectedRecord = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const selectedRecords = useMemo(
    () => records.filter((record) => selectedIds.includes(record.id)),
    [records, selectedIds],
  );
  const policy = getListingModerationPolicy(role);

  const allowedActions = selectedRecord
    ? {
        approve: canApplyModerationAction(role, selectedRecord, "approve"),
        reject: canApplyModerationAction(role, selectedRecord, "reject"),
        send_back: canApplyModerationAction(role, selectedRecord, "send_back"),
        flag: canApplyModerationAction(role, selectedRecord, "flag"),
        emergency_unpublish: canApplyModerationAction(role, selectedRecord, "emergency_unpublish"),
      }
    : null;
  const allowedBulkActions = getAllowedBulkModerationActions(role, selectedRecords);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const kind = params.get("kind");
    const status = params.get("status");
    const listing = params.get("listing");
    const media = params.get("media");

    setFilters({
      query: query ?? "",
      kind: kind === "stay" || kind === "transfer" ? kind : "all",
      status:
        status === "draft" ||
        status === "pending" ||
        status === "approved" ||
        status === "live" ||
        status === "paused" ||
        status === "paused_by_admin" ||
        status === "rejected" ||
        status === "archived"
          ? status
          : "all",
    });

    if (listing) {
      const target = initialRecords.find((record) => record.id === listing);
      setSelectedId(listing);
      setSelectedIds(target ? [listing] : []);
      setActiveMediaId(media ?? target?.media[0]?.id ?? "");
      setNote(target?.moderationFeedback ?? "");
    }

    setHasLoadedUrlState(true);
  }, [initialRecords]);

  useEffect(() => {
    if (!hasLoadedUrlState || listingResyncAttempted) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const listingId = params.get("listing");
    if (!listingId) {
      return;
    }
    if (records.some((record) => record.id === listingId)) {
      return;
    }

    let active = true;
    setListingResyncAttempted(true);
    (async () => {
      try {
        const response = await fetch("/api/backend/moderation/listings?status=all&kind=all&page=1&pageSize=100", {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json().catch(() => null)) as
          | { data?: { results?: ModerationListingRecord[] } }
          | null;
        const nextRecords = payload?.data?.results;
        if (!active || !Array.isArray(nextRecords)) {
          return;
        }
        setRecords(nextRecords);
        const target = nextRecords.find((record) => record.id === listingId);
        if (target) {
          syncSelection(target);
          setSelectedIds([target.id]);
        }
      } catch {
        // no-op: keep current snapshot behavior if refresh fails
      }
    })();

    return () => {
      active = false;
    };
  }, [hasLoadedUrlState, listingResyncAttempted, records]);

  useEffect(() => {
    if (!hasLoadedUrlState) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    filters.query ? params.set("q", filters.query) : params.delete("q");
    filters.kind !== "all" ? params.set("kind", filters.kind) : params.delete("kind");
    filters.status !== "all" ? params.set("status", filters.status) : params.delete("status");
    selectedId ? params.set("listing", selectedId) : params.delete("listing");
    activeMediaId ? params.set("media", activeMediaId) : params.delete("media");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [activeMediaId, filters, hasLoadedUrlState, selectedId]);

  function syncSelection(record: ModerationListingRecord | undefined) {
    if (!record) {
      return;
    }

    setSelectedId(record.id);
    setActiveMediaId(record.media[0]?.id ?? "");
    setNote(record.moderationFeedback ?? "");
  }

  function handleSelect(recordId: string) {
    const target = records.find((record) => record.id === recordId);
    syncSelection(target);
    setSelectedIds((current) => (current.includes(recordId) ? current : [recordId, ...current]));
    setFeedback(null);
  }

  function toggleSelection(recordId: string) {
    setSelectedIds((current) =>
      current.includes(recordId) ? current.filter((item) => item !== recordId) : [...current, recordId],
    );
  }

  async function applyAction(action: ModerationAction, listingIds: string[]) {
    if ((action === "flag" || action === "emergency_unpublish") && note.trim().length === 0) {
      setFeedback({
        tone: "error",
        message: "Provide a moderation note when flagging or emergency-unpublishing a listing.",
      });
      return;
    }

    setPendingAction(action);
    setFeedback(null);

    try {
      const result = await repository.applyAction(
        records,
        {
          actor,
          listingIds,
          action,
          reasonCode,
          note,
        },
        role,
      );

      setRecords(result.records);
      const nextSelected = result.records.find((record) => record.id === selectedId) ?? result.records.find((record) => record.id === result.updatedIds[0]);
      syncSelection(nextSelected);
      setFeedback({ tone: "success", message: result.auditRecord.summary });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to apply moderation action.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  function resetFilters() {
    setFilters({ query: "", kind: "all", status: "all" });
    setFeedback(null);
  }

  function resetSelection() {
    const nextRecord = records[0];
    syncSelection(nextRecord);
    setSelectedIds(nextRecord ? [nextRecord.id] : []);
    setFeedback(null);
  }

  if (records.length === 0) {
    return (
      <section className="grid gap-5">
        <article className="tm-panel">
          <SurfaceState
            description="Submitted stays and transfers will appear here once partner listing workflows send them into moderation."
            title="Moderation queue is empty"
            tone="empty"
          />
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      <ListingModerationQueuePanel
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        onSelect={handleSelect}
        onToggleSelection={toggleSelection}
        records={filteredRecords}
        selectedId={selectedId}
        selectedIds={selectedIds}
      />
      <ListingModerationDetailPanel
        activeMediaId={activeMediaId}
        allowedActions={allowedActions}
        allowedBulkActions={allowedBulkActions}
        canBulkUpdate={policy.canBulkUpdate}
        feedback={feedback}
        note={note}
        onAction={(action) => void applyAction(action, selectedRecord ? [selectedRecord.id] : [])}
        onBulkAction={(action) => void applyAction(action, selectedIds)}
        onNoteChange={setNote}
        onReasonCodeChange={setReasonCode}
        onResetSelection={resetSelection}
        onSelectMedia={setActiveMediaId}
        pendingAction={pendingAction}
        reasonCode={reasonCode}
        selectedIds={selectedIds}
        selectedRecord={filteredRecords.length > 0 ? selectedRecord : null}
      />
    </section>
  );
}
