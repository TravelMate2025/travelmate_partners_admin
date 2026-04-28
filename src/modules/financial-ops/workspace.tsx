"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import type { AdminRole } from "@/modules/auth/types";
import { FinancialOpsDetailPanel } from "@/modules/financial-ops/detail-panel";
import { FinancialOpsQueuePanel } from "@/modules/financial-ops/queue-panel";
import {
  buildFinancialOpsSummary,
  getAvailableFinancialOpsActions,
  getFinancialOpsPolicy,
  matchesFinancialOpsFilter,
} from "@/modules/financial-ops/rules";
import { mockFinancialOpsRepository, realFinancialOpsRepository } from "@/modules/financial-ops/service";
import type { FinancialOpsAction, FinancialOpsFilterState, FinancialOpsRecord } from "@/modules/financial-ops/types";

type FinancialOpsSurfaceState =
  | {
      status: "loading" | "error" | "exception";
      title?: string;
      description?: string;
    }
  | undefined;

export function FinancialOpsWorkspace({
  initialRecords,
  actor,
  role,
  mode = "mock",
  surfaceState,
}: {
  initialRecords: FinancialOpsRecord[];
  actor: string;
  role: AdminRole;
  mode?: "mock" | "real";
  surfaceState?: FinancialOpsSurfaceState;
}) {
  const repository = mode === "real" ? realFinancialOpsRepository : mockFinancialOpsRepository;
  const [records, setRecords] = useState(initialRecords);
  const [filters, setFilters] = useState<FinancialOpsFilterState>({
    query: "",
    partnerSettlementStatus: "all",
    adminRunStatus: "all",
    refundStatus: "all",
    region: "all",
  });
  const [selectedId, setSelectedId] = useState(initialRecords[0]?.id ?? "");
  const [note, setNote] = useState(initialRecords[0]?.operationalNote ?? "");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<FinancialOpsAction | null>(null);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);

  const filteredRecords = useMemo(() => records.filter((record) => matchesFinancialOpsFilter(record, filters)), [records, filters]);
  const selectedRecord = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const activeRecord = useMemo(() => filteredRecords.find((record) => record.id === selectedId) ?? null, [filteredRecords, selectedId]);
  const policy = getFinancialOpsPolicy(role);
  const summary = useMemo(() => buildFinancialOpsSummary(records), [records]);
  const availableActions = activeRecord ? getAvailableFinancialOpsActions(activeRecord, role) : [];
  const availableRegions = Array.from(new Set(records.map((record) => record.region))).sort();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const settlement = params.get("settlement");
    const run = params.get("run");
    const refund = params.get("refund");
    const region = params.get("region");
    const caseId = params.get("case");

    setFilters({
      query: query ?? "",
      partnerSettlementStatus:
        settlement === "pending_completion" ||
        settlement === "processing" ||
        settlement === "paid" ||
        settlement === "failed" ||
        settlement === "reversed"
          ? settlement
          : "all",
      adminRunStatus:
        run === "queued" || run === "processing" || run === "completed" || run === "partial" || run === "failed"
          ? run
          : "all",
      refundStatus:
        refund === "requested" ||
        refund === "partner_notified" ||
        refund === "refunded" ||
        refund === "disputed" ||
        refund === "recovered"
          ? refund
          : "all",
      region: region ?? "all",
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
    filters.partnerSettlementStatus !== "all" ? params.set("settlement", filters.partnerSettlementStatus) : params.delete("settlement");
    filters.adminRunStatus !== "all" ? params.set("run", filters.adminRunStatus) : params.delete("run");
    filters.refundStatus !== "all" ? params.set("refund", filters.refundStatus) : params.delete("refund");
    filters.region !== "all" ? params.set("region", filters.region) : params.delete("region");
    selectedId ? params.set("case", selectedId) : params.delete("case");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters, hasLoadedUrlState, selectedId]);

  function syncSelection(record: FinancialOpsRecord | undefined) {
    if (!record) return;
    setSelectedId(record.id);
    setNote(record.operationalNote);
  }

  function handleSelect(id: string) {
    syncSelection(records.find((record) => record.id === id));
    setFeedback(null);
  }

  async function handleAction(action: FinancialOpsAction) {
    if (!selectedRecord) return;

    setPendingAction(action);
    setFeedback(null);

    try {
      const result = await repository.applyAction(
        records,
        {
          caseId: selectedRecord.id,
          action,
          actor,
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
        message: error instanceof Error ? error.message : "Unable to update financial operations case.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  function resetFilters() {
    setFilters({
      query: "",
      partnerSettlementStatus: "all",
      adminRunStatus: "all",
      refundStatus: "all",
      region: "all",
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
            description="Settlement exceptions, refund follow-up, and reconciliation evidence will appear here once finance cases are available."
            title="Financial operations workspace is empty"
            tone="empty"
          />
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.94fr_1.06fr]">
      <FinancialOpsQueuePanel
        availableRegions={availableRegions}
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        onSelect={handleSelect}
        records={filteredRecords}
        selectedId={selectedId}
        summary={summary}
      />
      <FinancialOpsDetailPanel
        availableActions={availableActions}
        emptyState={
          filteredRecords.length === 0
            ? {
                title: "No settlement case selected from this view",
                description: "Clear or relax the finance filters to bring a settlement case back into view.",
              }
            : activeRecord === null
              ? {
                  title: "Selected settlement case is outside this filtered view",
                  description: "Choose a case from the queue again or reset the filters to resync the detail panel.",
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
  );
}
