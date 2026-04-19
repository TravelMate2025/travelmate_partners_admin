"use client";

import { useEffect, useMemo, useState } from "react";

import { SurfaceState } from "@/components/common/surface-state";
import type { AdminRole } from "@/modules/auth/types";
import { AdminUsersDetailPanel } from "@/modules/admin-users/detail-panel";
import { AdminUsersQueuePanel } from "@/modules/admin-users/queue-panel";
import {
  buildAdminAccessSummary,
  getAdminAccessPolicy,
  getAvailableAdminGovernanceActions,
  matchesAdminAccessFilter,
} from "@/modules/admin-users/rules";
import { mockAdminUsersRepository } from "@/modules/admin-users/service";
import type {
  AdminAccessFilterState,
  AdminAccessRecord,
  AdminGovernanceAction,
  InviteAdminInput,
} from "@/modules/admin-users/types";

type AdminUsersSurfaceState =
  | {
      status: "loading" | "error" | "exception";
      title?: string;
      description?: string;
    }
  | undefined;

const defaultInviteInput: InviteAdminInput = {
  name: "",
  email: "",
  team: "",
  role: "operations",
  requiresMfa: true,
  note: "",
  confirmSensitiveGrant: false,
};

export function AdminUsersWorkspace({
  initialRecords,
  actor,
  role,
  surfaceState,
}: {
  initialRecords: AdminAccessRecord[];
  actor: string;
  role: AdminRole;
  surfaceState?: AdminUsersSurfaceState;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [filters, setFilters] = useState<AdminAccessFilterState>({
    query: "",
    status: "all",
    role: "all",
    risk: "all",
  });
  const [selectedId, setSelectedId] = useState(initialRecords[0]?.id ?? "");
  const [note, setNote] = useState(initialRecords[0]?.operationalNote ?? "");
  const [targetRole, setTargetRole] = useState<AdminRole>(initialRecords[0]?.role ?? "operations");
  const [confirmSensitiveGrant, setConfirmSensitiveGrant] = useState(false);
  const [inviteInput, setInviteInput] = useState<InviteAdminInput>(defaultInviteInput);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<Exclude<AdminGovernanceAction, "invite_admin"> | null>(null);
  const [invitePending, setInvitePending] = useState(false);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);

  const filteredRecords = useMemo(() => records.filter((record) => matchesAdminAccessFilter(record, filters)), [records, filters]);
  const selectedRecord = useMemo(() => records.find((record) => record.id === selectedId) ?? null, [records, selectedId]);
  const activeRecord = useMemo(() => filteredRecords.find((record) => record.id === selectedId) ?? null, [filteredRecords, selectedId]);
  const policy = getAdminAccessPolicy(role);
  const summary = useMemo(() => buildAdminAccessSummary(records), [records]);
  const availableActions = activeRecord ? getAvailableAdminGovernanceActions(activeRecord, role) : [];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const status = params.get("status");
    const adminRole = params.get("role");
    const risk = params.get("risk");
    const caseId = params.get("admin");

    setFilters({
      query: query ?? "",
      status:
        status === "pending_invite" || status === "active" || status === "inactive" || status === "revoked" ? status : "all",
      role:
        adminRole === "super_admin" ||
        adminRole === "operations" ||
        adminRole === "reviewer" ||
        adminRole === "support" ||
        adminRole === "finance"
          ? adminRole
          : "all",
      risk: risk === "normal" || risk === "elevated" ? risk : "all",
    });

    if (caseId) {
      const target = initialRecords.find((record) => record.id === caseId);
      if (target) {
        setSelectedId(target.id);
        setNote(target.operationalNote);
        setTargetRole(target.role);
      }
    }

    setHasLoadedUrlState(true);
  }, [initialRecords]);

  useEffect(() => {
    if (!hasLoadedUrlState) return;

    const params = new URLSearchParams(window.location.search);
    filters.query ? params.set("q", filters.query) : params.delete("q");
    filters.status !== "all" ? params.set("status", filters.status) : params.delete("status");
    filters.role !== "all" ? params.set("role", filters.role) : params.delete("role");
    filters.risk !== "all" ? params.set("risk", filters.risk) : params.delete("risk");
    selectedId ? params.set("admin", selectedId) : params.delete("admin");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters, hasLoadedUrlState, selectedId]);

  function syncSelection(record: AdminAccessRecord | undefined) {
    if (!record) return;
    setSelectedId(record.id);
    setNote(record.operationalNote);
    setTargetRole(record.role);
    setConfirmSensitiveGrant(false);
  }

  function handleSelect(id: string) {
    syncSelection(records.find((record) => record.id === id));
    setFeedback(null);
  }

  async function handleInvite() {
    setInvitePending(true);
    setFeedback(null);

    try {
      const result = await mockAdminUsersRepository.inviteAdmin(records, inviteInput, actor, role);
      setRecords(result.records);
      syncSelection(result.createdRecord);
      setInviteInput(defaultInviteInput);
      setFeedback({ tone: "success", message: result.auditRecord.summary });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to send the admin invite.",
      });
    } finally {
      setInvitePending(false);
    }
  }

  async function handleAction(action: Exclude<AdminGovernanceAction, "invite_admin">) {
    if (!selectedRecord) return;

    setPendingAction(action);
    setFeedback(null);

    try {
      const result = await mockAdminUsersRepository.applyAction(
        records,
        {
          adminId: selectedRecord.id,
          action,
          actor,
          note,
          targetRole,
          confirmSensitiveGrant,
        },
        role,
      );

      setRecords(result.records);
      syncSelection(result.updatedRecord);
      setFeedback({ tone: "success", message: result.auditRecord.summary });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to update the admin governance record.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  function resetFilters() {
    setFilters({
      query: "",
      status: "all",
      role: "all",
      risk: "all",
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
            description="Admin directory records, invites, and governance activity will appear here once internal admin management is seeded."
            title="Admin access governance workspace is empty"
            tone="empty"
          />
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.94fr_1.06fr]">
      <AdminUsersQueuePanel
        filters={filters}
        inviteInput={inviteInput}
        invitePending={invitePending}
        onFilterChange={setFilters}
        onInviteInputChange={setInviteInput}
        onInviteSubmit={() => void handleInvite()}
        onResetFilters={resetFilters}
        onSelect={handleSelect}
        records={filteredRecords}
        selectedId={selectedId}
        summary={summary}
      />
      <AdminUsersDetailPanel
        availableActions={availableActions}
        confirmSensitiveGrant={confirmSensitiveGrant}
        emptyState={
          filteredRecords.length === 0
            ? {
                title: "No admin governance record selected from this view",
                description: "Clear or relax the filters to bring an admin record back into view.",
              }
            : activeRecord === null
              ? {
                  title: "Selected admin record is outside this filtered view",
                  description: "Choose an admin record from the queue again or reset the filters to resync the detail panel.",
                }
              : null
        }
        feedback={feedback}
        note={note}
        onAction={(action) => void handleAction(action)}
        onConfirmSensitiveGrantChange={setConfirmSensitiveGrant}
        onNoteChange={setNote}
        onResetSelection={resetSelection}
        onTargetRoleChange={setTargetRole}
        pendingAction={pendingAction}
        policySummary={policy.summary}
        selectedRecord={activeRecord}
        targetRole={targetRole}
      />
    </section>
  );
}
