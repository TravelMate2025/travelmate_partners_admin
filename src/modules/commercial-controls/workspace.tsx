"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import type { AdminRole } from "@/modules/auth/types";
import { CommercialControlsDetailPanel } from "@/modules/commercial-controls/detail-panel";
import { CommercialControlsQueuePanel } from "@/modules/commercial-controls/queue-panel";
import { buildCommercialSummary, canApplyCommercialAction, getCommercialControlsPolicy, matchesCommercialFilter } from "@/modules/commercial-controls/rules";
import { mockCommercialControlsRepository } from "@/modules/commercial-controls/service";
import type {
  AdjustmentDirection,
  CommercialAction,
  CommercialControlsSurfaceState,
  CommercialFilterState,
  CommercialRuleRecord,
} from "@/modules/commercial-controls/types";

export function CommercialControlsWorkspace({
  initialRecords,
  actor,
  role,
  surfaceState,
}: {
  initialRecords: CommercialRuleRecord[];
  actor: string;
  role: AdminRole;
  surfaceState?: CommercialControlsSurfaceState;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [filters, setFilters] = useState<CommercialFilterState>({
    query: "",
    ruleType: "all",
    scope: "all",
    status: "all",
  });
  const [selectedId, setSelectedId] = useState(initialRecords[0]?.id ?? "");
  const [commissionRatePercent, setCommissionRatePercent] = useState(initialRecords[0]?.commissionRatePercent ?? 0);
  const [serviceFeeFlatAmount, setServiceFeeFlatAmount] = useState(initialRecords[0]?.serviceFeeFlatAmount ?? 0);
  const [effectiveDate, setEffectiveDate] = useState(initialRecords[0]?.effectiveDate ?? "");
  const [note, setNote] = useState(initialRecords[0]?.operationalNote ?? "");
  const [adjustmentPartner, setAdjustmentPartner] = useState(initialRecords[0]?.partnerSettings[0]?.partnerName ?? "");
  const [adjustmentDirection, setAdjustmentDirection] = useState<AdjustmentDirection>("credit");
  const [adjustmentAmount, setAdjustmentAmount] = useState(50);
  const [adjustmentReason, setAdjustmentReason] = useState("Fee correction");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<CommercialAction | null>(null);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);

  const filteredRecords = useMemo(() => records.filter((record) => matchesCommercialFilter(record, filters)), [records, filters]);
  const selectedRecord = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const policy = getCommercialControlsPolicy(role);
  const summary = useMemo(() => buildCommercialSummary(records), [records]);

  const allowedActions = selectedRecord
    ? {
        update_rule: canApplyCommercialAction(role, selectedRecord, "update_rule") ?? false,
        create_adjustment: canApplyCommercialAction(role, selectedRecord, "create_adjustment") ?? false,
      }
    : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const ruleType = params.get("ruleType");
    const scope = params.get("scope");
    const status = params.get("status");
    const rule = params.get("rule");

    setFilters({
      query: query ?? "",
      ruleType: ruleType === "commission" || ruleType === "service_fee" ? ruleType : "all",
      scope: scope === "global" || scope === "region" || scope === "partner" ? scope : "all",
      status: status === "active" || status === "scheduled" || status === "paused" ? status : "all",
    });

    if (rule) {
      const target = initialRecords.find((record) => record.id === rule);
      syncSelection(target);
    }

    setHasLoadedUrlState(true);
  }, [initialRecords]);

  useEffect(() => {
    if (!hasLoadedUrlState) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    filters.query ? params.set("q", filters.query) : params.delete("q");
    filters.ruleType !== "all" ? params.set("ruleType", filters.ruleType) : params.delete("ruleType");
    filters.scope !== "all" ? params.set("scope", filters.scope) : params.delete("scope");
    filters.status !== "all" ? params.set("status", filters.status) : params.delete("status");
    selectedId ? params.set("rule", selectedId) : params.delete("rule");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters, hasLoadedUrlState, selectedId]);

  function syncSelection(record: CommercialRuleRecord | undefined) {
    if (!record) {
      return;
    }

    setSelectedId(record.id);
    setCommissionRatePercent(record.commissionRatePercent);
    setServiceFeeFlatAmount(record.serviceFeeFlatAmount);
    setEffectiveDate(record.effectiveDate);
    setNote(record.operationalNote);
    setAdjustmentPartner(record.partnerSettings[0]?.partnerName ?? "");
    setAdjustmentDirection("credit");
    setAdjustmentAmount(50);
    setAdjustmentReason("Fee correction");
  }

  function handleSelect(ruleId: string) {
    syncSelection(records.find((record) => record.id === ruleId));
    setFeedback(null);
  }

  async function handleAction(action: CommercialAction) {
    if (!selectedRecord) {
      return;
    }

    setPendingAction(action);
    setFeedback(null);

    try {
      const result = await mockCommercialControlsRepository.applyAction(
        records,
        action === "update_rule"
          ? {
              actor,
              ruleId: selectedRecord.id,
              action,
              note,
              commissionRatePercent,
              serviceFeeFlatAmount,
              effectiveDate,
            }
          : {
              actor,
              ruleId: selectedRecord.id,
              action,
              note,
              partnerName: adjustmentPartner,
              direction: adjustmentDirection,
              amount: adjustmentAmount,
              reason: adjustmentReason,
            },
        role,
      );

      setRecords(result.records);
      syncSelection(result.updatedRecord);
      setFeedback({ tone: "success", message: result.auditRecord.summary });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to manage commercial controls.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  function resetFilters() {
    setFilters({
      query: "",
      ruleType: "all",
      scope: "all",
      status: "all",
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
            description="Commercial rules and manual adjustments will appear here once finance configuration is available."
            title="Commercial controls are empty"
            tone="empty"
          />
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      <CommercialControlsQueuePanel
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        onSelect={handleSelect}
        records={filteredRecords}
        selectedId={selectedId}
        summary={summary}
      />
      <CommercialControlsDetailPanel
        adjustmentAmount={adjustmentAmount}
        adjustmentDirection={adjustmentDirection}
        adjustmentPartner={adjustmentPartner}
        adjustmentReason={adjustmentReason}
        allowedActions={allowedActions}
        commissionRatePercent={commissionRatePercent}
        effectiveDate={effectiveDate}
        emptyState={
          filteredRecords.length === 0
            ? {
                title: "No commercial controls match this view",
                description: "Clear or relax the current filters to continue reviewing marketplace fee configuration.",
              }
            : null
        }
        feedback={feedback}
        note={note}
        onAction={(action) => void handleAction(action)}
        onAdjustmentAmountChange={setAdjustmentAmount}
        onAdjustmentDirectionChange={setAdjustmentDirection}
        onAdjustmentPartnerChange={setAdjustmentPartner}
        onAdjustmentReasonChange={setAdjustmentReason}
        onCommissionChange={setCommissionRatePercent}
        onEffectiveDateChange={setEffectiveDate}
        onNoteChange={setNote}
        onResetSelection={resetSelection}
        onServiceFeeChange={setServiceFeeFlatAmount}
        pendingAction={pendingAction}
        policySummary={policy.summary}
        selectedRecord={selectedRecord}
        serviceFeeFlatAmount={serviceFeeFlatAmount}
      />
    </section>
  );
}
