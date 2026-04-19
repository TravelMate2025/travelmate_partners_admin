"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import type { AdminRole } from "@/modules/auth/types";
import { ApiMonitoringDetailPanel } from "@/modules/api-monitoring/detail-panel";
import { ApiMonitoringQueuePanel } from "@/modules/api-monitoring/queue-panel";
import {
  buildApiMonitoringDashboard,
  canApplyApiGovernanceAction,
  getApiMonitoringPolicy,
} from "@/modules/api-monitoring/rules";
import { mockApiMonitoringRepository } from "@/modules/api-monitoring/service";
import type {
  ApiGovernanceAction,
  ApiMonitoringFilterState,
  ApiMonitoringRecord,
  ApiMonitoringSurfaceState,
} from "@/modules/api-monitoring/types";

function matchesFilter(record: ApiMonitoringRecord, filters: ApiMonitoringFilterState) {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery =
    query.length === 0 ||
    record.title.toLowerCase().includes(query) ||
    record.clientName.toLowerCase().includes(query) ||
    record.endpointLabel.toLowerCase().includes(query) ||
    record.region.toLowerCase().includes(query);

  const matchesCategory = filters.category === "all" || record.category === filters.category;
  const matchesSeverity = filters.severity === "all" || record.severity === filters.severity;
  const matchesStatus = filters.status === "all" || record.status === filters.status;
  const matchesClient = filters.client === "all" || record.clientName === filters.client;

  return matchesQuery && matchesCategory && matchesSeverity && matchesStatus && matchesClient;
}

export function ApiMonitoringWorkspace({
  initialRecords,
  actor,
  role,
  surfaceState,
}: {
  initialRecords: ApiMonitoringRecord[];
  actor: string;
  role: AdminRole;
  surfaceState?: ApiMonitoringSurfaceState;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [filters, setFilters] = useState<ApiMonitoringFilterState>({
    query: "",
    category: "all",
    severity: "all",
    status: "all",
    client: "all",
  });
  const [selectedId, setSelectedId] = useState(initialRecords[0]?.id ?? "");
  const [note, setNote] = useState(initialRecords[0]?.operationalNote ?? "");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<ApiGovernanceAction | null>(null);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);

  const filteredRecords = useMemo(() => records.filter((record) => matchesFilter(record, filters)), [records, filters]);
  const selectedRecord = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const dashboard = useMemo(() => buildApiMonitoringDashboard(records), [records]);
  const policy = getApiMonitoringPolicy(role);
  const availableClients = Array.from(new Set(records.map((record) => record.clientName))).sort();

  const allowedActions = selectedRecord
    ? {
        acknowledge_alert: canApplyApiGovernanceAction(role, selectedRecord, "acknowledge_alert") ?? false,
        open_incident: canApplyApiGovernanceAction(role, selectedRecord, "open_incident") ?? false,
        queue_client_containment: canApplyApiGovernanceAction(role, selectedRecord, "queue_client_containment") ?? false,
      }
    : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const category = params.get("category");
    const severity = params.get("severity");
    const status = params.get("status");
    const client = params.get("client");
    const record = params.get("record");

    setFilters({
      query: query ?? "",
      category:
        category === "traffic" || category === "latency" || category === "errors" || category === "rate_limit" || category === "access"
          ? category
          : "all",
      severity:
        severity === "low" || severity === "medium" || severity === "high" || severity === "critical"
          ? severity
          : "all",
      status:
        status === "open" || status === "investigating" || status === "contained" || status === "resolved"
          ? status
          : "all",
      client: client ?? "all",
    });

    if (record) {
      const target = initialRecords.find((item) => item.id === record);
      setSelectedId(record);
      setNote(target?.operationalNote ?? "");
    }

    setHasLoadedUrlState(true);
  }, [initialRecords]);

  useEffect(() => {
    if (!hasLoadedUrlState) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    filters.query ? params.set("q", filters.query) : params.delete("q");
    filters.category !== "all" ? params.set("category", filters.category) : params.delete("category");
    filters.severity !== "all" ? params.set("severity", filters.severity) : params.delete("severity");
    filters.status !== "all" ? params.set("status", filters.status) : params.delete("status");
    filters.client !== "all" ? params.set("client", filters.client) : params.delete("client");
    selectedId ? params.set("record", selectedId) : params.delete("record");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters, hasLoadedUrlState, selectedId]);

  function syncSelection(record: ApiMonitoringRecord | undefined) {
    if (!record) {
      return;
    }

    setSelectedId(record.id);
    setNote(record.operationalNote);
  }

  function handleSelect(recordId: string) {
    syncSelection(records.find((record) => record.id === recordId));
    setFeedback(null);
  }

  async function handleAction(action: ApiGovernanceAction) {
    if (!selectedRecord) {
      return;
    }

    setPendingAction(action);
    setFeedback(null);

    try {
      const result = await mockApiMonitoringRepository.applyAction(
        records,
        {
          actor,
          anomalyId: selectedRecord.id,
          action,
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
        message: error instanceof Error ? error.message : "Unable to manage API monitoring alert.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  function resetFilters() {
    setFilters({
      query: "",
      category: "all",
      severity: "all",
      status: "all",
      client: "all",
    });
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
            description="API traffic anomalies will appear here once monitoring feeds deliver latency, error, and access signals."
            title="API monitoring queue is empty"
            tone="empty"
          />
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      <ApiMonitoringQueuePanel
        availableClients={availableClients}
        dashboard={dashboard}
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        onSelect={handleSelect}
        records={filteredRecords}
        selectedId={selectedId}
      />
      <ApiMonitoringDetailPanel
        allowedActions={allowedActions}
        emptyState={
          filteredRecords.length === 0
            ? {
                title: "No API monitoring alerts match this view",
                description: "Clear or relax the current filters to continue investigating live monitoring signals.",
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
        selectedRecord={selectedRecord}
      />
    </section>
  );
}
