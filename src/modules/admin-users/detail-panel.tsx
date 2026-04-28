import { ActivityTimeline } from "@/components/common/activity-timeline";
import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import {
  adminRolePermissionProfiles,
  adminRoleOptions,
  formatAdminRoleLabel,
} from "@/modules/admin-users/constants";
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
    delete_admin: { idle: "Delete admin", pending: "Deleting..." },
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
      <article className="tm-panel min-w-0 h-fit xl:sticky xl:top-24">
        <SurfaceState description={emptyState.description} title={emptyState.title} tone="empty" />
      </article>
    );
  }

  if (!selectedRecord) {
    return (
      <article className="tm-panel min-w-0 h-fit xl:sticky xl:top-24">
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

  const isPendingInvite = selectedRecord.status === "pending_invite";
  const isInviteLifecycleRecord = selectedRecord.status === "pending_invite" || selectedRecord.status === "revoked";
  const canChangeRole = availableActions.includes("assign_role");
  const roleTargets = adminRoleOptions.filter((role) => role !== selectedRecord.role);
  const roleReferenceOrder = [selectedRecord.role, ...adminRoleOptions.filter((role) => role !== selectedRecord.role)];
  const invitationTimestamp = selectedRecord.invitedAt ?? selectedRecord.lastAccessedAt;
  const formattedInvitationTimestamp = invitationTimestamp ? invitationTimestamp.slice(0, 16).replace("T", " ") : "Not available";
  const inviteExpiry = selectedRecord.inviteState === "pending" ? "Invitation is still awaiting acceptance." : "Invitation is no longer pending.";

  return (
    <article className="tm-panel min-w-0 h-fit xl:sticky xl:top-24">
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
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

      <div className="mt-5 grid items-start gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
        <div className="tm-soft-band h-full">
          <p className="tm-label">{isInviteLifecycleRecord ? "Invitation details" : "Permission policy summary"}</p>
          {isInviteLifecycleRecord ? (
            <div className="mt-4 grid gap-3">
              <div className="tm-document-card">
                <p className="text-sm font-semibold text-slate-950">Invite created</p>
                <p className="tm-muted mt-2 text-sm">{formattedInvitationTimestamp}</p>
              </div>
              <div className="tm-document-card">
                <p className="text-sm font-semibold text-slate-950">Invitation status</p>
                <p className="tm-muted mt-2 text-sm">{inviteExpiry}</p>
              </div>
              <div className="tm-document-card">
                <p className="text-sm font-semibold text-slate-950">Original invite rationale</p>
                <p className="tm-muted mt-2 text-sm">
                  {selectedRecord.operationalNote || "No invite rationale was recorded for this admin."}
                </p>
              </div>
            </div>
          ) : (
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
          )}
        </div>

        <div className="tm-soft-band h-full">
          <p className="tm-label">{isInviteLifecycleRecord ? "Invitation actions" : "Governance note and actions"}</p>
          {isInviteLifecycleRecord ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="text-sm font-semibold text-slate-950">Invitation governance is locked to the original request.</p>
              <p className="tm-muted mt-2 text-sm">
                You can resend, revoke, or activate this invite state, but role changes and invite-rationale edits stay locked to avoid overlapping controls.
              </p>
            </div>
          ) : (
            <div className="mt-3 grid gap-4">
              <div className="tm-document-card">
                <p className="text-sm font-semibold text-slate-950">Operational note</p>
                <textarea
                  aria-label="Admin governance note"
                  className="tm-textarea mt-3"
                  onChange={(event) => onNoteChange(event.target.value)}
                  placeholder="Capture role-change approval context, account status review notes, or lifecycle rationale..."
                  value={note}
                />
              </div>

              {canChangeRole ? (
                <div className="tm-admin-governance-rail">
                  <div className="tm-admin-governance-card">
                    <div className="tm-admin-governance-header">
                      <div className="min-w-0">
                        <p className="tm-label">Challenge role</p>
                        <p className="tm-muted mt-2 text-sm">
                          Current role is <span className="font-semibold text-slate-950">{formatAdminRoleLabel(selectedRecord.role)}</span>.
                          Select the next access posture directly from the controlled list below.
                        </p>
                      </div>
                      <div className="tm-admin-role-chip">
                        <span className="tm-label">Current</span>
                        <strong className="block pt-1 text-sm font-semibold text-slate-950">
                          {formatAdminRoleLabel(selectedRecord.role)}
                        </strong>
                      </div>
                    </div>

                    <label className="mt-5 block">
                      <span className="tm-label">Target admin role</span>
                      <select
                        aria-label="Target admin role"
                        className="tm-input mt-3"
                        onChange={(event) => onTargetRoleChange(event.target.value as AdminRole)}
                        value={roleTargets.includes(targetRole) ? targetRole : roleTargets[0] ?? targetRole}
                      >
                        {roleTargets.map((role) => (
                          <option key={role} value={role}>
                            {formatAdminRoleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="tm-admin-target-preview mt-5">
                      <span className="tm-label">Selected transition</span>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {formatAdminRoleLabel(selectedRecord.role)} to {formatAdminRoleLabel(targetRole)}
                      </p>
                      <p className="tm-muted mt-2 text-sm">
                        This keeps the change explicit before you commit the governance action.
                      </p>
                    </div>
                  </div>

                  <div className="tm-admin-governance-card tm-admin-governance-card-accent">
                    <p className="tm-label">Sensitive grant control</p>
                    <p className="tm-muted mt-2 text-sm">
                      {targetRole === selectedRecord.role
                        ? "Choose a different role first. Sensitive confirmation only applies when the target role becomes finance or super admin."
                        : `Selected target role: ${formatAdminRoleLabel(targetRole)}.`}
                    </p>

                    <label className="tm-admin-sensitive-toggle mt-5">
                      <input
                        aria-label="Confirm finance or super admin grant"
                        checked={confirmSensitiveGrant}
                        onChange={(event) => onConfirmSensitiveGrantChange(event.target.checked)}
                        type="checkbox"
                      />
                      <span>
                        <strong className="block text-sm font-semibold text-slate-950">Confirm finance or super admin grant</strong>
                        <span className="tm-muted mt-1 block text-sm">
                          Use this only after the sensitive access review and approval note are complete.
                        </span>
                      </span>
                    </label>

                    {selectedRecord.pendingApprovalReason ? (
                      <div className="tm-admin-governance-callout mt-4">
                        <span className="tm-label">Policy note</span>
                        <p className="tm-muted mt-2 text-sm">{selectedRecord.pendingApprovalReason}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="tm-admin-governance-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="tm-label">Role permissions reference</p>
                    <p className="tm-muted mt-2 text-sm">
                      Compare what each admin role can do before you invite, reactivate, or reassign access.
                    </p>
                  </div>
                  <div className="tm-admin-role-chip">
                    <span className="tm-label">Selected target</span>
                    <strong className="block pt-1 text-sm font-semibold text-slate-950">
                      {formatAdminRoleLabel(targetRole)}
                    </strong>
                  </div>
                </div>

                <div className="tm-admin-role-reference mt-5">
                  {roleReferenceOrder.map((role) => {
                    const profile = adminRolePermissionProfiles[role];
                    const isSelectedRole = role === targetRole;
                    const isCurrentRole = role === selectedRecord.role;
                    return (
                      <article
                        className={`tm-admin-role-reference-card ${isSelectedRole ? "tm-admin-role-reference-card-active" : ""}`}
                        key={role}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-950">{formatAdminRoleLabel(role)}</p>
                            <p className="tm-muted mt-2 text-sm">{profile.headline}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {isCurrentRole ? <StatusBadge label="Current role" tone="info" /> : null}
                            {isSelectedRole ? <StatusBadge label="Selected target" tone="success" /> : null}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                          <div className="tm-admin-role-reference-block">
                            <p className="tm-label">Allowed</p>
                            <ul className="tm-admin-role-reference-list mt-3">
                              {profile.grants.map((grant) => (
                                <li key={grant}>{grant}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="tm-admin-role-reference-block">
                            <p className="tm-label">Restricted</p>
                            <ul className="tm-admin-role-reference-list mt-3">
                              {profile.limits.map((limit) => (
                                <li key={limit}>{limit}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <p className="tm-muted mt-3 text-sm">{policySummary}</p>

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
                const isDanger = action === "delete_admin";
                return (
                  <button
                    aria-label={idle}
                    className={`tm-btn ${isDanger ? "tm-btn-danger" : isNeutral ? "tm-btn-outline" : "tm-btn-primary"}`}
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

      <div className="mt-5 grid items-start gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
        <div className="tm-soft-band h-full">
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

        <div className="tm-soft-band h-full">
          <p className="tm-label">Access governance history</p>
          <div className="mt-4">
            <ActivityTimeline items={selectedRecord.activity} />
          </div>
        </div>
      </div>
    </article>
  );
}
