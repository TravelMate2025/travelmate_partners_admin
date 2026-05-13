"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import type { AdminRole } from "@/modules/auth/types";
import { SupportIncidentsDetailPanel } from "@/modules/support-incidents/detail-panel";
import { SupportIncidentsQueuePanel } from "@/modules/support-incidents/queue-panel";
import {
  buildSupportIncidentSummary,
  getAvailableSupportActions,
  getSupportIncidentPolicy,
  matchesSupportIncidentFilter,
} from "@/modules/support-incidents/rules";
import { applyListingAppealAction, mockSupportIncidentRepository, realSupportIncidentRepository } from "@/modules/support-incidents/service";
import type { SupportAction, SupportIncidentFilterState, SupportIncidentRecord } from "@/modules/support-incidents/types";

type SupportIncidentsSurfaceState =
  | {
      status: "loading" | "error" | "exception";
      title?: string;
      description?: string;
    }
  | undefined;

export function SupportIncidentsWorkspace({
  initialRecords,
  actor,
  role,
  mode = "mock",
  surfaceState,
}: {
  initialRecords: SupportIncidentRecord[];
  actor: string;
  role: AdminRole;
  mode?: "mock" | "real";
  surfaceState?: SupportIncidentsSurfaceState;
}) {
  const repository = mode === "real" ? realSupportIncidentRepository : mockSupportIncidentRepository;
  function sortByMostRecentOpened(items: SupportIncidentRecord[]) {
    return [...items].sort((a, b) => {
      const aTime = Date.parse(a.openedAt);
      const bTime = Date.parse(b.openedAt);
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return b.id.localeCompare(a.id);
      }
      return bTime - aTime;
    });
  }

  const [records, setRecords] = useState(() => sortByMostRecentOpened(initialRecords));
  const [filters, setFilters] = useState<SupportIncidentFilterState>({
    query: "",
    status: "all",
    severity: "all",
    queue: "all",
    incidentState: "all",
  });
  const [selectedId, setSelectedId] = useState(initialRecords[0]?.id ?? "");
  const [note, setNote] = useState(initialRecords[0]?.operationalNote ?? "");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<SupportAction | null>(null);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);

  const filteredRecords = useMemo(
    () => sortByMostRecentOpened(records.filter((record) => matchesSupportIncidentFilter(record, filters))),
    [records, filters],
  );
  const selectedRecord = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const activeRecord = useMemo(() => filteredRecords.find((record) => record.id === selectedId) ?? null, [filteredRecords, selectedId]);
  const summary = useMemo(() => buildSupportIncidentSummary(records), [records]);
  const policy = getSupportIncidentPolicy(role);
  const availableActions = activeRecord ? getAvailableSupportActions(activeRecord, role) : [];

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const status = params.get("status");
    const severity = params.get("severity");
    const queue = params.get("queue");
    const incident = params.get("incident");
    const caseId = params.get("case");

    setFilters({
      query: query ?? "",
      status: status === "open" || status === "monitoring" || status === "escalated" || status === "resolved" ? status : "all",
      severity: severity === "low" || severity === "medium" || severity === "high" || severity === "critical" ? severity : "all",
      queue:
        queue === "partner_support" || queue === "trust_ops" || queue === "financial_followup" || queue === "incident_response"
          ? queue
          : "all",
      incidentState: incident === "none" || incident === "active" || incident === "mitigated" ? incident : "all",
    });

    if (caseId) {
      const target = initialRecords.find((record) => record.id === caseId);
      if (target) {
        setSelectedId(target.id);
        setNote(target.operationalNote);
      }
    }

    setHasLoadedUrlState(true);
  }, [initialRecords]);

  useEffect(() => {
    if (!hasLoadedUrlState) return;

    const params = new URLSearchParams(window.location.search);
    filters.query ? params.set("q", filters.query) : params.delete("q");
    filters.status !== "all" ? params.set("status", filters.status) : params.delete("status");
    filters.severity !== "all" ? params.set("severity", filters.severity) : params.delete("severity");
    filters.queue !== "all" ? params.set("queue", filters.queue) : params.delete("queue");
    filters.incidentState !== "all" ? params.set("incident", filters.incidentState) : params.delete("incident");
    selectedId ? params.set("case", selectedId) : params.delete("case");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters, hasLoadedUrlState, selectedId]);

  function syncSelection(record: SupportIncidentRecord | undefined) {
    if (!record) return;

    setSelectedId(record.id);
    setNote(record.operationalNote);
  }

  function handleSelect(id: string) {
    syncSelection(records.find((record) => record.id === id));
    setFeedback(null);
  }

  async function handleAction(action: SupportAction) {
    if (!selectedRecord) return;

    setPendingAction(action);
    setFeedback(null);

    try {
      const payload = {
        caseId: selectedRecord.id,
        action,
        actor,
        note,
      };
      const result = selectedRecord.appealId
        ? await applyListingAppealAction(records, payload)
        : await repository.applyAction(records, payload, role);

      setRecords(result.records);
      syncSelection(result.updatedRecord);
      setNote("");
      setFeedback({ tone: "success", message: result.auditRecord.summary });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to update the support case.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  function resetFilters() {
    setFilters({ query: "", status: "all", severity: "all", queue: "all", incidentState: "all" });
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

  if (records.length === 0) {
    return (
      <section className="grid gap-5">
        <article className="tm-panel">
          <SurfaceState
            description="Partner issues and incident threads will appear here once support cases reach the admin queue."
            title="Support workspace is empty"
            tone="empty"
          />
        </article>
      </section>
    );
  }

  return (
    <>
      {feedback && selectedRecord?.appealId ? (
        <div className="fixed bottom-5 right-5 z-50 max-w-md">
          <div className={`tm-alert shadow-lg ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>
            {feedback.tone === "error" ? `Action failed: ${feedback.message}` : `Action completed: ${feedback.message}`}
          </div>
        </div>
      ) : null}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.94fr)_minmax(28rem,1.06fr)] xl:items-start">
      <SupportIncidentsQueuePanel
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        onSelect={handleSelect}
        records={filteredRecords}
        selectedId={selectedId}
        summary={summary}
      />
      <SupportIncidentsDetailPanel
        availableActions={availableActions}
        emptyState={
          filteredRecords.length === 0
            ? {
                title: "No support case selected from this view",
                description: "Clear or relax the filters to bring a support case back into view.",
              }
            : activeRecord === null
              ? {
                  title: "Selected support case is outside this filtered view",
                  description: "Pick a case from the queue again or reset the filters to resync the detail panel.",
                }
              : null
        }
        feedback={feedback}
        note={note}
        onAction={(action) => void handleAction(action)}
        onNoteChange={setNote}
        onResetSelection={resetSelection}
        pendingAction={pendingAction}
        policySummary={policy.summary}
        selectedRecord={activeRecord}
      />
      </section>
    </>
  );
}
