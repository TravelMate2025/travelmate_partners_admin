"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import type { AdminRole } from "@/modules/auth/types";
import { AuditComplianceDetailPanel } from "@/modules/audit-compliance/detail-panel";
import { AuditComplianceQueuePanel } from "@/modules/audit-compliance/queue-panel";
import {
  buildAuditSummary,
  getAuditPolicy,
  matchesAuditFilter,
} from "@/modules/audit-compliance/rules";
import { mockAuditComplianceRepository } from "@/modules/audit-compliance/service";
import type {
  AccessPolicyEntry,
  AuditComplianceSurfaceState,
  AuditEventCategory,
  AuditFilterState,
  AuditLogEntry,
  AuditOutcome,
  AuditRiskLevel,
  ComplianceExportRecord,
  RetentionConfig,
} from "@/modules/audit-compliance/types";

export function AuditComplianceWorkspace({
  initialEntries,
  actor,
  role,
  retentionConfig,
  accessPolicyEntries,
  surfaceState,
}: {
  initialEntries: AuditLogEntry[];
  actor: string;
  role: AdminRole;
  retentionConfig: RetentionConfig;
  accessPolicyEntries: AccessPolicyEntry[];
  surfaceState?: AuditComplianceSurfaceState;
}) {
  const [entries] = useState(initialEntries);
  const [filters, setFilters] = useState<AuditFilterState>({
    query: "",
    category: "all",
    riskLevel: "all",
    outcome: "all",
    entityType: "all",
  });
  const [selectedId, setSelectedId] = useState(initialEntries[0]?.id ?? "");
  const [exportNote, setExportNote] = useState("");
  const [pendingExport, setPendingExport] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [exportRecord, setExportRecord] = useState<ComplianceExportRecord | null>(null);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);

  const policy = getAuditPolicy(role);

  const filteredEntries = useMemo(
    () => entries.filter((entry) => matchesAuditFilter(entry, filters, role)),
    [entries, filters, role],
  );

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? null,
    [entries, selectedId],
  );

  const summary = useMemo(() => buildAuditSummary(filteredEntries), [filteredEntries]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const category = params.get("category");
    const riskLevel = params.get("risk");
    const outcome = params.get("outcome");
    const entryId = params.get("entry");

    setFilters({
      query: query ?? "",
      category:
        category === "verification" ||
        category === "partner_lifecycle" ||
        category === "listing_moderation" ||
        category === "financial" ||
        category === "settlement" ||
        category === "payout_review" ||
        category === "admin_access" ||
        category === "api_governance"
          ? (category as AuditEventCategory)
          : "all",
      riskLevel:
        riskLevel === "low" || riskLevel === "medium" || riskLevel === "high" || riskLevel === "critical"
          ? (riskLevel as AuditRiskLevel)
          : "all",
      outcome:
        outcome === "success" || outcome === "failed" || outcome === "pending"
          ? (outcome as AuditOutcome)
          : "all",
      entityType: "all",
    });

    if (entryId) {
      const found = initialEntries.find((e) => e.id === entryId);
      if (found) setSelectedId(found.id);
    }

    setHasLoadedUrlState(true);
  }, [initialEntries]);

  useEffect(() => {
    if (!hasLoadedUrlState) return;

    const params = new URLSearchParams(window.location.search);
    filters.query ? params.set("q", filters.query) : params.delete("q");
    filters.category !== "all" ? params.set("category", filters.category) : params.delete("category");
    filters.riskLevel !== "all" ? params.set("risk", filters.riskLevel) : params.delete("risk");
    filters.outcome !== "all" ? params.set("outcome", filters.outcome) : params.delete("outcome");
    selectedId ? params.set("entry", selectedId) : params.delete("entry");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters, hasLoadedUrlState, selectedId]);

  function handleSelect(id: string) {
    setSelectedId(id);
    setFeedback(null);
    setExportRecord(null);
  }

  function resetFilters() {
    setFilters({ query: "", category: "all", riskLevel: "all", outcome: "all", entityType: "all" });
    setFeedback(null);
    setExportRecord(null);
  }

  function resetSelection() {
    const first = entries[0];
    if (first) setSelectedId(first.id);
    setFeedback(null);
    setExportRecord(null);
  }

  async function handleExport() {
    setPendingExport(true);
    setFeedback(null);
    setExportRecord(null);

    try {
      const result = await mockAuditComplianceRepository.applyExport(
        filteredEntries,
        { actor, filter: filters, note: exportNote },
        role,
      );

      setExportRecord(result.exportRecord);
      setFeedback({ tone: "success", message: result.exportRecord.summary });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to export compliance data.",
      });
    } finally {
      setPendingExport(false);
    }
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

  if (entries.length === 0) {
    return (
      <section className="grid gap-5">
        <article className="tm-panel">
          <SurfaceState
            description="Audit log entries will appear here once admin actions have been recorded on this platform."
            title="Audit log is empty"
            tone="empty"
          />
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <AuditComplianceQueuePanel
        entries={filteredEntries}
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        onSelect={handleSelect}
        role={role}
        selectedId={selectedId}
        summary={summary}
      />
      <AuditComplianceDetailPanel
        accessPolicyEntries={accessPolicyEntries}
        canExport={policy.canExportCompliance}
        canViewAccessPolicy={policy.canViewAccessPolicy}
        canViewRetentionControls={policy.canViewRetentionControls}
        emptyState={
          filteredEntries.length === 0
            ? {
                title: "No audit events match this view",
                description: "Clear or relax the current filters to continue reviewing the audit log.",
              }
            : null
        }
        exportNote={exportNote}
        exportRecord={exportRecord}
        feedback={feedback}
        onExport={() => void handleExport()}
        onExportNoteChange={setExportNote}
        onResetSelection={resetSelection}
        pendingExport={pendingExport}
        policySummary={policy.summary}
        retentionConfig={retentionConfig}
        selectedEntry={selectedEntry}
      />
    </section>
  );
}
