"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import type { AdminRole } from "@/modules/auth/types";
import { PayoutReviewDetailPanel } from "@/modules/payout-review/detail-panel";
import { PayoutReviewQueuePanel } from "@/modules/payout-review/queue-panel";
import {
  buildPayoutReviewSummary,
  getAvailablePayoutReviewActions,
  getPayoutReviewPolicy,
  getReasonOptionsForAction,
  getVisiblePayoutFields,
  matchesPayoutReviewFilter,
} from "@/modules/payout-review/rules";
import { mockPayoutReviewRepository } from "@/modules/payout-review/service";
import type {
  PayoutReviewAction,
  PayoutReviewFilterState,
  PayoutReviewReasonCode,
  PayoutReviewRecord,
} from "@/modules/payout-review/types";

type PayoutReviewSurfaceState =
  | {
      status: "loading" | "error" | "exception";
      title?: string;
      description?: string;
    }
  | undefined;

function getDefaultReasonCode(record: PayoutReviewRecord | undefined): PayoutReviewReasonCode {
  if (!record) return "ownership_confirmed";
  if (record.status === "verified") return "rapid_account_change";
  if (record.nameMatchStatus === "mismatched") return "name_mismatch";
  if (record.holdState === "active") return "verification_incomplete";
  return "ownership_confirmed";
}

export function PayoutReviewWorkspace({
  initialRecords,
  actor,
  role,
  surfaceState,
}: {
  initialRecords: PayoutReviewRecord[];
  actor: string;
  role: AdminRole;
  surfaceState?: PayoutReviewSurfaceState;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [filters, setFilters] = useState<PayoutReviewFilterState>({
    query: "",
    status: "all",
    methodType: "all",
    holdState: "all",
    riskSeverity: "all",
  });
  const [selectedId, setSelectedId] = useState(initialRecords[0]?.id ?? "");
  const [note, setNote] = useState(initialRecords[0]?.operationalNote ?? "");
  const [reasonCode, setReasonCode] = useState<PayoutReviewReasonCode>(getDefaultReasonCode(initialRecords[0]));
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<PayoutReviewAction | null>(null);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);

  const filteredRecords = useMemo(() => records.filter((record) => matchesPayoutReviewFilter(record, filters)), [records, filters]);
  const selectedRecord = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const activeRecord = useMemo(() => filteredRecords.find((record) => record.id === selectedId) ?? null, [filteredRecords, selectedId]);
  const policy = getPayoutReviewPolicy(role);
  const summary = useMemo(() => buildPayoutReviewSummary(records), [records]);
  const availableActions = activeRecord ? getAvailablePayoutReviewActions(activeRecord, role) : [];
  const visibleFields = activeRecord ? getVisiblePayoutFields(activeRecord, role) : [];
  const reasonOptions = getReasonOptionsForAction(availableActions[0] ?? "approve_payout_method");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const status = params.get("status");
    const methodType = params.get("method");
    const hold = params.get("hold");
    const risk = params.get("risk");
    const caseId = params.get("case");

    setFilters({
      query: query ?? "",
      status: status === "pending" || status === "verified" || status === "rejected" ? status : "all",
      methodType: methodType === "bank_account" || methodType === "mobile_money" ? methodType : "all",
      holdState: hold === "active" || hold === "clear" ? hold : "all",
      riskSeverity: risk === "low" || risk === "medium" || risk === "high" || risk === "critical" ? risk : "all",
    });

    if (caseId) {
      const target = initialRecords.find((record) => record.id === caseId);
      if (target) {
        setSelectedId(target.id);
        setNote(target.operationalNote);
        setReasonCode(getDefaultReasonCode(target));
      }
    }

    setHasLoadedUrlState(true);
  }, [initialRecords]);

  useEffect(() => {
    if (!hasLoadedUrlState) return;

    const params = new URLSearchParams(window.location.search);
    filters.query ? params.set("q", filters.query) : params.delete("q");
    filters.status !== "all" ? params.set("status", filters.status) : params.delete("status");
    filters.methodType !== "all" ? params.set("method", filters.methodType) : params.delete("method");
    filters.holdState !== "all" ? params.set("hold", filters.holdState) : params.delete("hold");
    filters.riskSeverity !== "all" ? params.set("risk", filters.riskSeverity) : params.delete("risk");
    selectedId ? params.set("case", selectedId) : params.delete("case");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters, hasLoadedUrlState, selectedId]);

  useEffect(() => {
    if (!activeRecord) return;

    const preferredAction = getAvailablePayoutReviewActions(activeRecord, role)[0];
    if (!preferredAction) return;

    const preferredReason = getReasonOptionsForAction(preferredAction)[0]?.value;
    if (preferredReason) {
      setReasonCode((current) => (getReasonOptionsForAction(preferredAction).some((option) => option.value === current) ? current : preferredReason));
    }
  }, [activeRecord, role]);

  function syncSelection(record: PayoutReviewRecord | undefined) {
    if (!record) return;
    setSelectedId(record.id);
    setNote(record.operationalNote);
    setReasonCode(getDefaultReasonCode(record));
  }

  function handleSelect(id: string) {
    syncSelection(records.find((record) => record.id === id));
    setFeedback(null);
  }

  async function handleAction(action: PayoutReviewAction) {
    if (!selectedRecord) return;

    setPendingAction(action);
    setFeedback(null);

    try {
      const result = await mockPayoutReviewRepository.applyAction(
        records,
        {
          caseId: selectedRecord.id,
          action,
          actor,
          note,
          reasonCode,
        },
        role,
      );

      setRecords(result.records);
      syncSelection(result.updatedRecord);
      setFeedback({ tone: "success", message: result.auditRecord.summary });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to update payout review case.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  function resetFilters() {
    setFilters({
      query: "",
      status: "all",
      methodType: "all",
      holdState: "all",
      riskSeverity: "all",
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
            description="Payout-method submissions, re-verification cases, and settlement holds will appear here once partner payout updates enter review."
            title="Payout review workspace is empty"
            tone="empty"
          />
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.94fr_1.06fr]">
      <PayoutReviewQueuePanel
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        onSelect={handleSelect}
        records={filteredRecords}
        selectedId={selectedId}
        summary={summary}
      />
      <PayoutReviewDetailPanel
        availableActions={availableActions}
        emptyState={
          filteredRecords.length === 0
            ? {
                title: "No payout review case selected from this view",
                description: "Clear or relax the payout filters to bring a case back into view.",
              }
            : activeRecord === null
              ? {
                  title: "Selected payout review case is outside this filtered view",
                  description: "Choose a case from the queue again or reset the filters to resync the detail panel.",
                }
              : null
        }
        feedback={feedback}
        isMaskedView={!policy.canViewUnmaskedDetails}
        note={note}
        onAction={(action) => void handleAction(action)}
        onNoteChange={setNote}
        onReasonChange={setReasonCode}
        onResetSelection={resetSelection}
        pendingAction={pendingAction}
        policySummary={policy.summary}
        reasonCode={reasonCode}
        reasonOptions={reasonOptions}
        selectedRecord={activeRecord}
        visibleFields={visibleFields}
      />
    </section>
  );
}
