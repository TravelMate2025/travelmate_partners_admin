"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import type { AdminRole } from "@/modules/auth/types";
import { ApiClientsDetailPanel } from "@/modules/api-clients/detail-panel";
import { ApiClientsQueuePanel } from "@/modules/api-clients/queue-panel";
import { canApplyApiClientAction, getApiClientsPolicy } from "@/modules/api-clients/rules";
import { mockApiClientsRepository, realApiClientsRepository } from "@/modules/api-clients/service";
import type {
  ApiClientAction,
  ApiClientFilterState,
  ApiClientRecord,
  ApiClientsSurfaceState,
  ApiPlan,
} from "@/modules/api-clients/types";

function matchesFilter(record: ApiClientRecord, filters: ApiClientFilterState) {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery =
    query.length === 0 ||
    record.companyName.toLowerCase().includes(query) ||
    record.applicantName.toLowerCase().includes(query) ||
    record.region.toLowerCase().includes(query);

  const matchesStatus = filters.status === "all" || record.status === filters.status;
  const matchesPlan = filters.plan === "all" || record.plan === filters.plan;
  const matchesRisk = filters.risk === "all" || record.riskLevel === filters.risk;

  return matchesQuery && matchesStatus && matchesPlan && matchesRisk;
}

export function ApiClientsWorkspace({
  initialRecords,
  actor,
  role,
  mode = "mock",
  surfaceState,
}: {
  initialRecords: ApiClientRecord[];
  actor: string;
  role: AdminRole;
  mode?: "mock" | "real";
  surfaceState?: ApiClientsSurfaceState;
}) {
  const repository = mode === "real" ? realApiClientsRepository : mockApiClientsRepository;
  const [records, setRecords] = useState(initialRecords);
  const [filters, setFilters] = useState<ApiClientFilterState>({
    query: "",
    status: "all",
    plan: "all",
    risk: "all",
  });
  const [selectedId, setSelectedId] = useState(initialRecords[0]?.id ?? "");
  const [note, setNote] = useState(initialRecords[0]?.note ?? "");
  const [plan, setPlan] = useState<ApiPlan>(initialRecords[0]?.plan ?? "starter");
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(initialRecords[0]?.usage.rateLimitPerMinute ?? 60);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<ApiClientAction | null>(null);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);

  const filteredRecords = useMemo(() => records.filter((record) => matchesFilter(record, filters)), [records, filters]);
  const selectedRecord = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const policy = getApiClientsPolicy(role);

  const allowedActions = selectedRecord
      ? {
        approve_client: canApplyApiClientAction(role, selectedRecord, "approve_client") ?? false,
        reject_client: canApplyApiClientAction(role, selectedRecord, "reject_client") ?? false,
        issue_key: canApplyApiClientAction(role, selectedRecord, "issue_key") ?? false,
        regenerate_key: canApplyApiClientAction(role, selectedRecord, "regenerate_key") ?? false,
        revoke_key: canApplyApiClientAction(role, selectedRecord, "revoke_key") ?? false,
        block_client: canApplyApiClientAction(role, selectedRecord, "block_client") ?? false,
        update_plan: canApplyApiClientAction(role, selectedRecord, "update_plan") ?? false,
      }
    : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const status = params.get("status");
    const planParam = params.get("plan");
    const risk = params.get("risk");
    const client = params.get("client");

    setFilters({
      query: query ?? "",
      status:
        status === "pending_review" || status === "approved" || status === "rejected" || status === "blocked"
          ? status
          : "all",
      plan: planParam === "starter" || planParam === "growth" || planParam === "enterprise" ? planParam : "all",
      risk: risk === "low" || risk === "medium" || risk === "high" ? risk : "all",
    });

    if (client) {
      const target = initialRecords.find((record) => record.id === client);
      setSelectedId(client);
      setNote(target?.note ?? "");
      setPlan(target?.plan ?? "starter");
      setRateLimitPerMinute(target?.usage.rateLimitPerMinute ?? 60);
    }

    setHasLoadedUrlState(true);
  }, [initialRecords]);

  useEffect(() => {
    if (!hasLoadedUrlState) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    filters.query ? params.set("q", filters.query) : params.delete("q");
    filters.status !== "all" ? params.set("status", filters.status) : params.delete("status");
    filters.plan !== "all" ? params.set("plan", filters.plan) : params.delete("plan");
    filters.risk !== "all" ? params.set("risk", filters.risk) : params.delete("risk");
    selectedId ? params.set("client", selectedId) : params.delete("client");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters, hasLoadedUrlState, selectedId]);

  function syncSelection(record: ApiClientRecord | undefined) {
    if (!record) {
      return;
    }

    setSelectedId(record.id);
    setNote(record.note);
    setPlan(record.plan);
    setRateLimitPerMinute(record.usage.rateLimitPerMinute);
  }

  function handleSelect(clientId: string) {
    syncSelection(records.find((record) => record.id === clientId));
    setFeedback(null);
  }

  async function handleAction(action: ApiClientAction) {
    if (!selectedRecord) {
      return;
    }

    setPendingAction(action);
    setFeedback(null);

    try {
      const result = await repository.applyAction(
        records,
        {
          actor,
          clientId: selectedRecord.id,
          action,
          note,
          plan,
          rateLimitPerMinute,
        },
        role,
      );

      setRecords(result.records);
      syncSelection(result.updatedRecord);
      setFeedback({ tone: "success", message: result.auditRecord.summary });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to manage API client.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  function resetFilters() {
    setFilters({ query: "", status: "all", plan: "all", risk: "all" });
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
            description="API access applications will appear here once the business API review queue receives submissions."
            title="API client queue is empty"
            tone="empty"
          />
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      <ApiClientsQueuePanel
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        onSelect={handleSelect}
        records={filteredRecords}
        selectedId={selectedId}
      />
      <ApiClientsDetailPanel
        allowedActions={allowedActions}
        feedback={feedback}
        note={note}
        onAction={(action) => void handleAction(action)}
        onNoteChange={setNote}
        onPlanChange={setPlan}
        onRateLimitChange={setRateLimitPerMinute}
        onResetSelection={resetSelection}
        pendingAction={pendingAction}
        plan={plan}
        policySummary={policy.summary}
        rateLimitPerMinute={rateLimitPerMinute}
        selectedRecord={filteredRecords.length > 0 ? selectedRecord : null}
      />
    </section>
  );
}
