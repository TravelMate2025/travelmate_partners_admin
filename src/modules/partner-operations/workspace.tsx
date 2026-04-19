"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import type { AdminRole } from "@/modules/auth/types";
import { PartnerDetailPanel } from "@/modules/partner-operations/detail-panel";
import { PartnerDirectoryPanel } from "@/modules/partner-operations/directory-panel";
import { getPartnerPolicy, getPartnerRoutePolicySummary } from "@/modules/partner-operations/policy";
import { mockPartnerOperationsRepository } from "@/modules/partner-operations/service";
import type {
  PartnerFilterState,
  PartnerPriority,
  PartnerRecord,
  SupportTier,
} from "@/modules/partner-operations/types";

function matchesFilter(record: PartnerRecord, filters: PartnerFilterState) {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery =
    query.length === 0 ||
    record.partnerName.toLowerCase().includes(query) ||
    record.businessName.toLowerCase().includes(query) ||
    record.email.toLowerCase().includes(query);

  const matchesLifecycle = filters.lifecycle === "all" || record.lifecycleState === filters.lifecycle;
  const matchesAccountState = filters.accountState === "all" || record.accountState === filters.accountState;
  const matchesRegion = filters.region === "all" || record.region === filters.region;

  return matchesQuery && matchesLifecycle && matchesAccountState && matchesRegion;
}

type PartnerWorkspaceSurfaceState =
  | {
      status: "loading" | "error" | "exception";
      title?: string;
      description?: string;
    }
  | undefined;

export function PartnerOperationsWorkspace({
  initialRecords,
  role,
  actor,
  surfaceState,
}: {
  initialRecords: PartnerRecord[];
  role: AdminRole;
  actor: string;
  surfaceState?: PartnerWorkspaceSurfaceState;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [filters, setFilters] = useState<PartnerFilterState>({
    query: "",
    lifecycle: "all",
    accountState: "all",
    region: "all",
  });
  const [selectedId, setSelectedId] = useState(initialRecords[0]?.id ?? "");
  const [note, setNote] = useState(initialRecords[0]?.operationalNote ?? "");
  const [marketOwner, setMarketOwner] = useState(initialRecords[0]?.metadata.marketOwner ?? "");
  const [supportTier, setSupportTier] = useState<SupportTier>(initialRecords[0]?.metadata.supportTier ?? "standard");
  const [priority, setPriority] = useState<PartnerPriority>(initialRecords[0]?.metadata.priority ?? "standard");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);

  const filteredRecords = useMemo(
    () => records.filter((record) => matchesFilter(record, filters)),
    [records, filters],
  );
  const selectedRecord = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const policy = getPartnerPolicy(role);
  const policySummary = getPartnerRoutePolicySummary(role);
  const availableRegions = Array.from(new Set(records.map((record) => record.region))).sort();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const lifecycle = params.get("lifecycle");
    const accountState = params.get("account");
    const region = params.get("region");
    const partner = params.get("partner");

    setFilters({
      query: query ?? "",
      lifecycle:
        lifecycle === "pending" || lifecycle === "verified" || lifecycle === "rejected" || lifecycle === "suspended"
          ? lifecycle
          : "all",
      accountState: accountState === "active" || accountState === "locked" || accountState === "archived" ? accountState : "all",
      region: region ?? "all",
    });

    if (partner) {
      setSelectedId(partner);
      const target = initialRecords.find((record) => record.id === partner);
      setNote(target?.operationalNote ?? "");
      setMarketOwner(target?.metadata.marketOwner ?? "");
      setSupportTier(target?.metadata.supportTier ?? "standard");
      setPriority(target?.metadata.priority ?? "standard");
    }

    setHasLoadedUrlState(true);
  }, [initialRecords]);

  useEffect(() => {
    if (!hasLoadedUrlState) {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    filters.query ? params.set("q", filters.query) : params.delete("q");
    filters.lifecycle !== "all" ? params.set("lifecycle", filters.lifecycle) : params.delete("lifecycle");
    filters.accountState !== "all" ? params.set("account", filters.accountState) : params.delete("account");
    filters.region !== "all" ? params.set("region", filters.region) : params.delete("region");
    selectedId ? params.set("partner", selectedId) : params.delete("partner");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters, hasLoadedUrlState, selectedId]);

  function syncSelection(record: PartnerRecord | undefined) {
    if (!record) {
      return;
    }

    setSelectedId(record.id);
    setNote(record.operationalNote);
    setMarketOwner(record.metadata.marketOwner);
    setSupportTier(record.metadata.supportTier);
    setPriority(record.metadata.priority);
  }

  function handleSelect(recordId: string) {
    const target = records.find((record) => record.id === recordId);
    syncSelection(target);
    setFeedback(null);
  }

  async function handleMetadataSave() {
    if (!selectedRecord || !policy.canEditMetadata) {
      return;
    }

    setPendingAction("update_metadata");
    setFeedback(null);

    try {
      const result = await mockPartnerOperationsRepository.applyAction(
        records,
        {
          type: "update_metadata",
          partnerId: selectedRecord.id,
          actor,
          note,
          metadata: {
            marketOwner,
            supportTier,
            priority,
            note,
          },
        },
        role,
      );

      setRecords(result.records);
      syncSelection(result.updatedRecord);
      setFeedback({ tone: "success", message: result.auditMessage });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to update partner metadata.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleAccountAction(action: "lock" | "unlock" | "restore") {
    if (!selectedRecord) {
      return;
    }

    setPendingAction(action);
    setFeedback(null);

    try {
      const result = await mockPartnerOperationsRepository.applyAction(
        records,
        {
          type: action,
          partnerId: selectedRecord.id,
          actor,
          note,
        },
        role,
      );

      setRecords(result.records);
      syncSelection(result.updatedRecord);
      setFeedback({ tone: "success", message: result.auditMessage });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to apply account action.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  function resetFilters() {
    setFilters({
      query: "",
      lifecycle: "all",
      accountState: "all",
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
            description="Partner account records will appear here once the back-office directory receives partner data."
            title="Partner directory is empty"
            tone="empty"
          />
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      <PartnerDirectoryPanel
        availableRegions={availableRegions}
        filteredRecords={filteredRecords}
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
        onSelect={handleSelect}
        policySummary={policySummary.summary}
        selectedId={selectedId}
      />
      <PartnerDetailPanel
        emptyState={
          filteredRecords.length === 0
            ? {
                title: "No partner selected from this filter set",
                description: "Clear or adjust the filters to bring a partner record back into view.",
              }
            : null
        }
        feedback={feedback}
        marketOwner={marketOwner}
        note={note}
        onAccountAction={handleAccountAction}
        onMarketOwnerChange={setMarketOwner}
        onNoteChange={setNote}
        onPriorityChange={setPriority}
        onResetSelection={resetSelection}
        onSaveMetadata={handleMetadataSave}
        onSupportTierChange={setSupportTier}
        pendingAction={pendingAction}
        priority={priority}
        role={role}
        selectedRecord={filteredRecords.length > 0 ? selectedRecord : null}
        supportTier={supportTier}
      />
    </section>
  );
}
