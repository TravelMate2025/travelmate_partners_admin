"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import type { AdminRole } from "@/modules/auth/types";
import { CatalogControlsDetailPanel } from "@/modules/catalog-controls/detail-panel";
import { CatalogControlsQueuePanel } from "@/modules/catalog-controls/queue-panel";
import {
  buildCatalogDashboardSnapshot,
  canApplyCatalogAction,
  getCatalogControlsPolicy,
} from "@/modules/catalog-controls/rules";
import { mockCatalogControlsRepository } from "@/modules/catalog-controls/service";
import type {
  CatalogAction,
  CatalogFilterState,
  CatalogIssueRecord,
  CatalogWorkspaceSurfaceState,
  TaxonomyRuleRecord,
} from "@/modules/catalog-controls/types";

function matchesFilter(record: CatalogIssueRecord, filters: CatalogFilterState) {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery =
    query.length === 0 ||
    record.listingTitle.toLowerCase().includes(query) ||
    record.partnerName.toLowerCase().includes(query) ||
    record.locationLabel.toLowerCase().includes(query);

  const matchesKind = filters.kind === "all" || record.kind === filters.kind;
  const matchesIssueType = filters.issueType === "all" || record.issueType === filters.issueType;
  const matchesStatus = filters.status === "all" || record.status === filters.status;
  const matchesSeverity = filters.severity === "all" || record.severity === filters.severity;

  return matchesQuery && matchesKind && matchesIssueType && matchesStatus && matchesSeverity;
}

export function CatalogControlsWorkspace({
  initialRecords,
  initialRules,
  actor,
  role,
  surfaceState,
}: {
  initialRecords: CatalogIssueRecord[];
  initialRules: TaxonomyRuleRecord[];
  actor: string;
  role: AdminRole;
  surfaceState?: CatalogWorkspaceSurfaceState;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [taxonomyRules, setTaxonomyRules] = useState(initialRules);
  const [filters, setFilters] = useState<CatalogFilterState>({
    query: "",
    kind: "all",
    issueType: "all",
    status: "all",
    severity: "all",
  });
  const [selectedId, setSelectedId] = useState(initialRecords[0]?.id ?? "");
  const [note, setNote] = useState(initialRecords[0]?.operationalNote ?? "");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [ruleFeedback, setRuleFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<CatalogAction | null>(null);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState(initialRules[0]?.id ?? "");
  const [ruleDraft, setRuleDraft] = useState(initialRules[0]?.normalizedValue ?? "");

  const filteredRecords = useMemo(() => records.filter((record) => matchesFilter(record, filters)), [records, filters]);
  const selectedRecord = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const dashboard = useMemo(() => buildCatalogDashboardSnapshot(records), [records]);
  const policy = getCatalogControlsPolicy(role);
  const selectedRule = useMemo(
    () => taxonomyRules.find((rule) => rule.id === selectedRuleId) ?? null,
    [selectedRuleId, taxonomyRules],
  );

  const allowedActions = selectedRecord
    ? {
        standardize_taxonomy: canApplyCatalogAction(role, selectedRecord, "standardize_taxonomy") ?? false,
        resolve_duplicate: canApplyCatalogAction(role, selectedRecord, "resolve_duplicate") ?? false,
        resolve_geo: canApplyCatalogAction(role, selectedRecord, "resolve_geo") ?? false,
        resolve_policy: canApplyCatalogAction(role, selectedRecord, "resolve_policy") ?? false,
      }
    : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const kind = params.get("kind");
    const issueType = params.get("issue");
    const status = params.get("status");
    const severity = params.get("severity");
    const record = params.get("record");

    setFilters({
      query: query ?? "",
      kind: kind === "stay" || kind === "transfer" ? kind : "all",
      issueType:
        issueType === "duplicate" || issueType === "taxonomy" || issueType === "geo" || issueType === "policy"
          ? issueType
          : "all",
      status: status === "open" || status === "in_review" || status === "resolved" ? status : "all",
      severity:
        severity === "low" || severity === "medium" || severity === "high" || severity === "critical"
          ? severity
          : "all",
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
    filters.kind !== "all" ? params.set("kind", filters.kind) : params.delete("kind");
    filters.issueType !== "all" ? params.set("issue", filters.issueType) : params.delete("issue");
    filters.status !== "all" ? params.set("status", filters.status) : params.delete("status");
    filters.severity !== "all" ? params.set("severity", filters.severity) : params.delete("severity");
    selectedId ? params.set("record", selectedId) : params.delete("record");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters, hasLoadedUrlState, selectedId]);

  function syncSelection(record: CatalogIssueRecord | undefined) {
    if (!record) {
      return;
    }

    setSelectedId(record.id);
    setNote(record.operationalNote);
  }

  function syncSelectedRule(rule: TaxonomyRuleRecord | undefined) {
    if (!rule) {
      return;
    }

    setSelectedRuleId(rule.id);
    setRuleDraft(rule.normalizedValue);
  }

  function handleSelect(issueId: string) {
    syncSelection(records.find((record) => record.id === issueId));
    setFeedback(null);
  }

  function handleSelectRule(ruleId: string) {
    syncSelectedRule(taxonomyRules.find((rule) => rule.id === ruleId));
    setRuleFeedback(null);
  }

  async function handleAction(action: CatalogAction) {
    if (!selectedRecord) {
      return;
    }

    setPendingAction(action);
    setFeedback(null);

    try {
      const result = await mockCatalogControlsRepository.applyAction(
        records,
        {
          actor,
          issueId: selectedRecord.id,
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
        message: error instanceof Error ? error.message : "Unable to resolve catalog issue.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSaveRule() {
    if (!selectedRule) {
      return;
    }

    setRuleFeedback(null);

    try {
      const result = await mockCatalogControlsRepository.updateTaxonomyRule(
        taxonomyRules,
        {
          actor,
          ruleId: selectedRule.id,
          normalizedValue: ruleDraft,
          note,
        },
        role,
      );

      setTaxonomyRules(result.rules);
      syncSelectedRule(result.updatedRule);
      setRuleFeedback({ tone: "success", message: result.auditRecord.summary });
    } catch (error) {
      setRuleFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to update taxonomy rule.",
      });
    }
  }

  function resetFilters() {
    setFilters({
      query: "",
      kind: "all",
      issueType: "all",
      status: "all",
      severity: "all",
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
            description="Flagged duplicate, taxonomy, geo, and policy issues will appear here once catalog quality signals are available."
            title="Catalog quality queue is empty"
            tone="empty"
          />
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      <CatalogControlsQueuePanel
        dashboard={dashboard}
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        onSelect={handleSelect}
        records={filteredRecords}
        selectedId={selectedId}
      />
      <CatalogControlsDetailPanel
        allowedActions={allowedActions}
        canManageTaxonomyRules={policy.canStandardizeTaxonomy}
        feedback={feedback}
        note={note}
        onAction={(action) => void handleAction(action)}
        onNoteChange={setNote}
        onResetSelection={resetSelection}
        onRuleDraftChange={setRuleDraft}
        onSaveRule={() => void handleSaveRule()}
        onSelectRule={handleSelectRule}
        pendingAction={pendingAction}
        policySummary={policy.summary}
        ruleDraft={ruleDraft}
        ruleFeedback={ruleFeedback}
        selectedRuleId={selectedRuleId}
        selectedRecord={filteredRecords.length > 0 ? selectedRecord : null}
        taxonomyRules={taxonomyRules}
      />
    </section>
  );
}
