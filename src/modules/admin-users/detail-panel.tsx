import { ActivityTimeline } from "@/components/common/activity-timeline";
import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import {
  adminStatusTone,
  formatManagedAdminStatusLabel,
  formatManagedMfaStateLabel,
  formatSessionRiskLabel,
  mfaStateTone,
  sessionRiskTone,
} from "@/modules/admin-users/rules";
import type { AdminGovernanceAction, AdminAccessRecord } from "@/modules/admin-users/types";
import type { AdminRole } from "@/modules/auth/types";

function getActionLabel(action: AdminGovernanceAction) {
  const labels: Record<Exclude<AdminGovernanceAction, "invite_admin">, { idle: string; pending: string }> = {
    resend_invite: { idle: "Resend invite", pending: "Resending..." },
    revoke_invite: { idle: "Revoke invite", pending: "Revoking..." },
    activate_admin: { idle: "Activate admin", pending: "Activating..." },
    deactivate_admin: { idle: "Deactivate admin", pending: "Deactivating..." },
    assign_role: { idle: "Apply role", pending: "Applying role..." },
  };

  return labels[action as Exclude<AdminGovernanceAction, "invite_admin">];
}

export function AdminUsersDetailPanel({
  selectedRecord,
  emptyState,
  note,
  pendingAction,
  feedback,
  policySummary,
  availableActions,
  targetRole,
  confirmSensitiveGrant,
  onNoteChange,
  onTargetRoleChange,
  onConfirmSensitiveGrantChange,
  onAction,
  onResetSelection,
}: {
  selectedRecord: AdminAccessRecord | null;
  emptyState?: { title: string; description: string } | null;
  note: string;
  pendingAction: Exclude<AdminGovernanceAction, "invite_admin"> | null;
  feedback: { tone: "success" | "error"; message: string } | null;
  policySummary: string;
  availableActions: Exclude<AdminGovernanceAction, "invite_admin">[];
  targetRole: AdminRole;
  confirmSensitiveGrant: boolean;
  onNoteChange: (value: string) => void;
  onTargetRoleChange: (value: AdminRole) => void;
  onConfirmSensitiveGrantChange: (value: boolean) => void;
  onAction: (action: Exclude<AdminGovernanceAction, "invite_admin">) => void;
  onResetSelection: () => void;
}) {
  if (emptyState) {
    return (
      <article className="tm-panel">
        <SurfaceState description={emptyState.description} title={emptyState.title} tone="empty" />
      </article>
    );
  }

  if (!selectedRecord) {
    return (
      <article className="tm-panel">
        <SurfaceState
          actionLabel="Reset selection"
          description="The selected admin account is no longer available in this governance snapshot."
          onAction={onResetSelection}
          title="Selected admin account was not found"
          tone="exception"
        />
      </article>
    );
  }

  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Admin Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedRecord.name}</h2>
          <p className="tm-muted mt-2 text-sm">{selectedRecord.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={formatManagedAdminStatusLabel(selectedRecord.status)} tone={adminStatusTone(selectedRecord.status)} />
          <StatusBadge label={formatManagedMfaStateLabel(selectedRecord.mfaState)} tone={mfaStateTone(selectedRecord.mfaState)} />
          <StatusBadge label={formatSessionRiskLabel(selectedRecord.recentRisk)} tone={sessionRiskTone(selectedRecord.recentRisk)} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Role</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{selectedRecord.role.replace("_", " ")}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Team</p>
          <p className="mt-2 text-sm text-slate-900">{selectedRecord.team}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Invited by</p>
          <p className="mt-2 text-sm text-slate-900">{selectedRecord.invitedBy ?? "System"}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Last sign-in</p>
          <p className="mt-2 text-sm text-slate-900">
            {selectedRecord.lastSignInAt ? selectedRecord.lastSignInAt.slice(0, 16).replace("T", " ") : "No sign-in yet"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="tm-soft-band">
          <p className="tm-label">Permission policy summary</p>
          <div className="mt-4 grid gap-3">
            {selectedRecord.permissionPolicies.map((policy) => (
              <div className="tm-document-card" key={policy.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{policy.title}</p>
                    <p className="tm-muted mt-2 text-sm">{policy.detail}</p>
                  </div>
                  <StatusBadge label={policy.tone} tone={policy.tone} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tm-soft-band">
          <p className="tm-label">Governance note and actions</p>
          <textarea
            aria-label="Admin governance note"
            className="tm-textarea mt-3"
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Capture invite rationale, role-change approval context, or account status review notes..."
            value={note}
          />
          <p className="tm-muted mt-3 text-sm">{policySummary}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="tm-label">Target role</span>
              <select
                aria-label="Target admin role"
                className="tm-input mt-3"
                onChange={(event) => onTargetRoleChange(event.target.value as AdminRole)}
                value={targetRole}
              >
                <option value="super_admin">super admin</option>
                <option value="operations">operations</option>
                <option value="reviewer">reviewer</option>
                <option value="support">support</option>
                <option value="finance">finance</option>
              </select>
            </label>
            <div className="tm-soft-band">
              <p className="tm-label">Sensitive grant control</p>
              <label className="tm-tag-pill mt-3 inline-flex items-center gap-2">
                <input
                  checked={confirmSensitiveGrant}
                  onChange={(event) => onConfirmSensitiveGrantChange(event.target.checked)}
                  type="checkbox"
                />
                Confirm finance or super admin grant
              </label>
              {selectedRecord.pendingApprovalReason ? (
                <p className="tm-muted mt-3 text-sm">{selectedRecord.pendingApprovalReason}</p>
              ) : null}
            </div>
          </div>

          {feedback ? (
            <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>
              {feedback.message}
            </div>
          ) : null}

          {availableActions.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {availableActions.map((action) => {
                const { idle, pending } = getActionLabel(action);
                const isPending = pendingAction === action;
                const isBlocked = pendingAction !== null && !isPending;
                const isNeutral = action === "resend_invite" || action === "assign_role";
                return (
                  <button
                    aria-label={idle}
                    className={`tm-btn ${isNeutral ? "tm-btn-outline" : "tm-btn-primary"}`}
                    disabled={isPending || isBlocked}
                    key={action}
                    onClick={() => onAction(action)}
                    type="button"
                  >
                    {isPending ? pending : idle}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="tm-muted mt-5 text-sm">No admin governance actions are available for this record right now.</p>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="tm-soft-band">
          <p className="tm-label">Recent access and session context</p>
          {selectedRecord.recentSessions.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {selectedRecord.recentSessions.map((session) => (
                <div className="tm-document-card" key={session.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{session.deviceLabel}</p>
                      <p className="tm-muted mt-2 text-sm">{session.locationLabel}</p>
                      <p className="tm-muted mt-2 text-sm">{session.lastSeenAt.slice(0, 16).replace("T", " ")}</p>
                    </div>
                    <StatusBadge label={formatSessionRiskLabel(session.risk)} tone={sessionRiskTone(session.risk)} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="tm-muted mt-3 text-sm">No recent sessions are available until the invite is accepted and the admin signs in.</p>
          )}
        </div>

        <div className="tm-soft-band">
          <p className="tm-label">Access governance history</p>
          <div className="mt-4">
            <ActivityTimeline items={selectedRecord.activity} />
          </div>
        </div>
      </div>
    </article>
  );
}
