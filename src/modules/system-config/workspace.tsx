"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import type { AdminRole } from "@/modules/auth/types";
import { SystemConfigDetailPanel } from "@/modules/system-config/detail-panel";
import { SystemConfigQueuePanel } from "@/modules/system-config/queue-panel";
import {
  buildConfigSummary,
  getSystemConfigPolicy,
  matchesConfigFilter,
} from "@/modules/system-config/rules";
import { mockSystemConfigRepository } from "@/modules/system-config/service";
import type {
  ConfigSection,
  FeatureToggleArea,
  SystemConfigActionType,
  SystemConfigFilterState,
  SystemConfigRecord,
  SystemConfigStatus,
  TaxonomyCategory,
} from "@/modules/system-config/types";

type SystemConfigSurfaceState =
  | {
      status: "loading" | "error" | "exception";
      title?: string;
      description?: string;
    }
  | undefined;

export function SystemConfigWorkspace({
  initialRecords,
  actor,
  role,
  surfaceState,
}: {
  initialRecords: SystemConfigRecord[];
  actor: string;
  role: AdminRole;
  surfaceState?: SystemConfigSurfaceState;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [filters, setFilters] = useState<SystemConfigFilterState>({
    query: "",
    section: "all",
    category: "all",
    area: "all",
    status: "all",
  });
  const [selectedId, setSelectedId] = useState(initialRecords[0]?.id ?? "");
  const [note, setNote] = useState(initialRecords[0]?.operationalNote ?? "");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<SystemConfigActionType | null>(null);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);

  const filteredRecords = useMemo(
    () => records.filter((record) => matchesConfigFilter(record, filters)),
    [records, filters],
  );
  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedId) ?? null,
    [records, selectedId],
  );
  const activeRecord = useMemo(
    () => filteredRecords.find((record) => record.id === selectedId) ?? null,
    [filteredRecords, selectedId],
  );
  const policy = getSystemConfigPolicy(role);
  const summary = useMemo(() => buildConfigSummary(records), [records]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const section = params.get("section");
    const category = params.get("category");
    const area = params.get("area");
    const status = params.get("status");
    const item = params.get("item");

    setFilters({
      query: query ?? "",
      section:
        section === "taxonomy" || section === "toggles" || section === "regions" || section === "templates" || section === "content"
          ? (section as ConfigSection)
          : "all",
      category:
        category === "amenity" ||
        category === "vehicle_class" ||
        category === "property_type" ||
        category === "tag" ||
        category === "service_area"
          ? (category as TaxonomyCategory)
          : "all",
      area:
        area === "partner_app" ||
        area === "admin_dashboard" ||
        area === "api" ||
        area === "global"
          ? (area as FeatureToggleArea)
          : "all",
      status:
        status === "active" || status === "draft" || status === "deprecated" ||
        status === "enabled" || status === "disabled" || status === "staged" ||
        status === "published" || status === "archived"
          ? (status as SystemConfigStatus)
          : "all",
    });

    if (item) {
      const target = initialRecords.find((record) => record.id === item);
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
    filters.section !== "all" ? params.set("section", filters.section) : params.delete("section");
    filters.category !== "all" ? params.set("category", filters.category) : params.delete("category");
    filters.area !== "all" ? params.set("area", filters.area) : params.delete("area");
    filters.status !== "all" ? params.set("status", filters.status) : params.delete("status");
    selectedId ? params.set("item", selectedId) : params.delete("item");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters, hasLoadedUrlState, selectedId]);

  function syncSelection(record: SystemConfigRecord | undefined) {
    if (!record) return;
    setSelectedId(record.id);
    setNote(record.operationalNote);
  }

  function handleSelect(id: string) {
    syncSelection(records.find((record) => record.id === id));
    setFeedback(null);
  }

  async function handleAction(action: SystemConfigActionType) {
    if (!selectedRecord) return;

    setPendingAction(action);
    setFeedback(null);

    try {
      const result = await mockSystemConfigRepository.applyAction(
        records,
        {
          type: action,
          itemId: selectedRecord.id,
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
        message: error instanceof Error ? error.message : "Unable to apply configuration change.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  function resetFilters() {
    setFilters({ query: "", section: "all", category: "all", area: "all", status: "all" });
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
            description="Taxonomy items, feature toggles, service regions, moderation templates, and static content will appear here once configuration data is available."
            title="Configuration workspace is empty"
            tone="empty"
          />
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <SystemConfigQueuePanel
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        onSelect={handleSelect}
        records={filteredRecords}
        selectedId={selectedId}
        summary={summary}
      />
      <SystemConfigDetailPanel
        emptyState={
          filteredRecords.length === 0
            ? {
                title: "No items match this view",
                description: "Clear or adjust the filters to bring configuration items back into view.",
              }
            : activeRecord === null
              ? {
                  title: "No item selected from this section",
                  description: "Select a configuration item from the list to review its detail and available actions.",
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
        role={role}
        selectedRecord={activeRecord}
      />
    </section>
  );
}
