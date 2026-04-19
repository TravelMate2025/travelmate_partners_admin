import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import {
  adminStatusTone,
  formatManagedAdminStatusLabel,
  formatSessionRiskLabel,
  sessionRiskTone,
} from "@/modules/admin-users/rules";
import type { AdminAccessFilterState, AdminAccessRecord, InviteAdminInput } from "@/modules/admin-users/types";

export function AdminUsersQueuePanel({
  records,
  selectedId,
  filters,
  onFilterChange,
  onResetFilters,
  onSelect,
  summary,
  inviteInput,
  onInviteInputChange,
  onInviteSubmit,
  invitePending,
}: {
  records: AdminAccessRecord[];
  selectedId: string;
  filters: AdminAccessFilterState;
  onFilterChange: (value: AdminAccessFilterState) => void;
  onResetFilters: () => void;
  onSelect: (id: string) => void;
  summary: {
    pendingInvites: number;
    activeAdmins: number;
    sensitiveGrants: number;
    mfaGaps: number;
  };
  inviteInput: InviteAdminInput;
  onInviteInputChange: (value: InviteAdminInput) => void;
  onInviteSubmit: () => void;
  invitePending: boolean;
}) {
  const pendingInvites = records.filter((record) => record.status === "pending_invite");
  const adminDirectory = records.filter((record) => record.status !== "pending_invite");

  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Admin Governance</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Directory, invites, and role governance</h2>
          <p className="tm-muted mt-2 text-sm">
            Manage admin access explicitly inside the back office with invite controls, MFA posture, session context, and policy-aware role grants.
          </p>
        </div>
        <button className="tm-btn tm-btn-outline" onClick={onResetFilters} type="button">
          Reset filters
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Pending invites</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.pendingInvites}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Active admins</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.activeAdmins}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Sensitive grants</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.sensitiveGrants}</p>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">MFA gaps</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.mfaGaps}</p>
        </div>
      </div>

      <div className="tm-soft-band mt-5">
        <p className="tm-label">Invite admin</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="tm-label">Admin name</span>
            <input
              aria-label="Invite admin name"
              className="tm-input mt-3"
              onChange={(event) => onInviteInputChange({ ...inviteInput, name: event.target.value })}
              value={inviteInput.name}
            />
          </label>
          <label className="block">
            <span className="tm-label">Admin email</span>
            <input
              aria-label="Invite admin email"
              className="tm-input mt-3"
              onChange={(event) => onInviteInputChange({ ...inviteInput, email: event.target.value })}
              value={inviteInput.email}
            />
          </label>
          <label className="block">
            <span className="tm-label">Team</span>
            <input
              aria-label="Invite admin team"
              className="tm-input mt-3"
              onChange={(event) => onInviteInputChange({ ...inviteInput, team: event.target.value })}
              value={inviteInput.team}
            />
          </label>
          <label className="block">
            <span className="tm-label">Initial role</span>
            <select
              aria-label="Invite admin role"
              className="tm-input mt-3"
              onChange={(event) => onInviteInputChange({ ...inviteInput, role: event.target.value as InviteAdminInput["role"] })}
              value={inviteInput.role}
            >
              <option value="operations">operations</option>
              <option value="reviewer">reviewer</option>
              <option value="support">support</option>
              <option value="finance">finance</option>
              <option value="super_admin">super admin</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="tm-label">Governance note</span>
            <textarea
              aria-label="Invite admin note"
              className="tm-textarea mt-3"
              onChange={(event) => onInviteInputChange({ ...inviteInput, note: event.target.value })}
              placeholder="Capture why this invite is needed, who approved it, and any onboarding constraints..."
              value={inviteInput.note}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="tm-tag-pill inline-flex items-center gap-2">
            <input
              checked={inviteInput.requiresMfa}
              onChange={(event) => onInviteInputChange({ ...inviteInput, requiresMfa: event.target.checked })}
              type="checkbox"
            />
            Require MFA on activation
          </label>
          <label className="tm-tag-pill inline-flex items-center gap-2">
            <input
              checked={inviteInput.confirmSensitiveGrant}
              onChange={(event) => onInviteInputChange({ ...inviteInput, confirmSensitiveGrant: event.target.checked })}
              type="checkbox"
            />
            Confirm sensitive role grant
          </label>
          <button className="tm-btn tm-btn-primary" disabled={invitePending} onClick={onInviteSubmit} type="button">
            {invitePending ? "Sending invite..." : "Invite admin"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <label className="block md:col-span-3">
          <span className="tm-label">Search admin accounts</span>
          <input
            aria-label="Search admin accounts"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, query: event.target.value })}
            placeholder="Search admin name, email, or team"
            value={filters.query}
          />
        </label>
        <label className="block">
          <span className="tm-label">Status</span>
          <select
            aria-label="Admin account status"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, status: event.target.value as AdminAccessFilterState["status"] })}
            value={filters.status}
          >
            <option value="all">all</option>
            <option value="pending_invite">pending invite</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="revoked">revoked</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Role</span>
          <select
            aria-label="Admin account role"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, role: event.target.value as AdminAccessFilterState["role"] })}
            value={filters.role}
          >
            <option value="all">all</option>
            <option value="super_admin">super admin</option>
            <option value="operations">operations</option>
            <option value="reviewer">reviewer</option>
            <option value="support">support</option>
            <option value="finance">finance</option>
          </select>
        </label>
        <label className="block">
          <span className="tm-label">Session risk</span>
          <select
            aria-label="Admin session risk"
            className="tm-input mt-3"
            onChange={(event) => onFilterChange({ ...filters, risk: event.target.value as AdminAccessFilterState["risk"] })}
            value={filters.risk}
          >
            <option value="all">all</option>
            <option value="normal">normal</option>
            <option value="elevated">elevated</option>
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-5">
        <section>
          <div className="flex items-center justify-between gap-3">
            <p className="tm-label">Pending invite list</p>
            <StatusBadge label={`${pendingInvites.length} pending`} tone={pendingInvites.length > 0 ? "warning" : "neutral"} />
          </div>
          <div className="mt-3 grid gap-3">
            {pendingInvites.length > 0 ? (
              pendingInvites.map((record) => (
                <button
                  className={`tm-document-card text-left ${record.id === selectedId ? "tm-document-card-active" : ""}`}
                  key={record.id}
                  onClick={() => onSelect(record.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{record.name}</p>
                      <p className="tm-muted mt-2 text-sm">{record.email}</p>
                    </div>
                    <StatusBadge label={formatManagedAdminStatusLabel(record.status)} tone={adminStatusTone(record.status)} />
                  </div>
                  <p className="tm-muted mt-3 text-sm">{record.team} · {record.role.replace("_", " ")}</p>
                </button>
              ))
            ) : (
              <SurfaceState title="No pending invites" description="All current admin invitations have been accepted, revoked, or filtered out." tone="empty" />
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <p className="tm-label">Admin directory</p>
            <StatusBadge label={`${adminDirectory.length} records`} tone="info" />
          </div>
          <div className="mt-3 grid gap-3">
            {adminDirectory.length > 0 ? (
              adminDirectory.map((record) => (
                <button
                  className={`tm-document-card text-left ${record.id === selectedId ? "tm-document-card-active" : ""}`}
                  key={record.id}
                  onClick={() => onSelect(record.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{record.name}</p>
                      <p className="tm-muted mt-2 text-sm">{record.team} · {record.role.replace("_", " ")}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={formatManagedAdminStatusLabel(record.status)} tone={adminStatusTone(record.status)} />
                      <StatusBadge label={formatSessionRiskLabel(record.recentRisk)} tone={sessionRiskTone(record.recentRisk)} />
                    </div>
                  </div>
                  <p className="tm-muted mt-3 text-sm">{record.email}</p>
                </button>
              ))
            ) : (
              <SurfaceState title="No admin directory records" description="No accepted or inactive admin accounts match the current filters." tone="empty" />
            )}
          </div>
        </section>
      </div>
    </article>
  );
}
