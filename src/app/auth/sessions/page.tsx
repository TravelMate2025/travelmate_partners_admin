import { AdminShell } from "@/components/common/admin-shell";
import { StatusBadge } from "@/components/common/status-badge";
import { SubmitButton } from "@/components/common/submit-button";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { refreshSessionAction, requestPasswordResetAction, revokeAdminSessionAction, signOutAction } from "@/modules/auth/actions";
import { getAdminSession, getAdminSessionInventoryFromApi, getStoredAdminSession } from "@/modules/auth/session";
import { redirect } from "next/navigation";

type AdminSessionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSessionsPage({ searchParams }: AdminSessionsPageProps) {
  const params = searchParams ? await searchParams : {};
  const rotated = getSingleParam(params.rotated) === "1";
  const revoked = getSingleParam(params.revoked);
  const session = await getAdminSession();
  const storedSession = await getStoredAdminSession();

  requireAdminRouteAccess("/auth/sessions", session);
  if (!storedSession) {
    redirect("/auth/login?error=session_expired");
  }

  const inventory = await getAdminSessionInventoryFromApi(storedSession);
  const sessions = inventory?.sessions ?? [];

  return (
    <AdminShell
      title="Session Management"
      description="Protected admin access center for active session details, real API-backed session inventory, and route protection posture."
    >
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="tm-panel">
          <p className="tm-kicker">Current Session</p>
          {rotated ? <p className="tm-alert tm-alert-success mt-4">The current admin session was rotated successfully.</p> : null}
          {revoked ? <p className="tm-alert tm-alert-success mt-4">Tracked session {revoked} was ended successfully.</p> : null}
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{session.user.name}</h2>
          <p className="tm-muted mt-3 text-sm">
            {session.user.email} · {session.user.team} · {session.deviceLabel}
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="tm-soft-band">
              <p className="tm-label">Role access</p>
              <p className="mt-2 text-sm text-slate-900 capitalize">{session.user.role.replace("_", " ")}</p>
            </div>
            <div className="tm-soft-band">
              <p className="tm-label">MFA posture</p>
              <p className="mt-2 text-sm text-slate-900">{session.mfaSatisfied ? "Verified for this session" : "Not yet satisfied"}</p>
            </div>
            <div className="tm-soft-band">
              <p className="tm-label">Issued at</p>
              <p className="mt-2 text-sm text-slate-900">{new Date(session.issuedAt).toLocaleString()}</p>
            </div>
            <div className="tm-soft-band">
              <p className="tm-label">Validation model</p>
              <p className="mt-2 text-sm text-slate-900">API session bootstrap + signed dashboard cookie + role gate</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={refreshSessionAction}>
              <SubmitButton label="Rotate current session" pendingLabel="Rotating…" className="tm-btn tm-btn-primary" />
            </form>
            <form action={signOutAction}>
              <SubmitButton label="End current session" pendingLabel="Ending session…" className="tm-btn tm-btn-outline" />
            </form>
            <form action={requestPasswordResetAction}>
              <input name="email" type="hidden" value={session.user.email} />
              <SubmitButton label="Trigger password reset" pendingLabel="Sending…" className="tm-btn tm-btn-outline" />
            </form>
          </div>
        </article>

        <article className="tm-panel">
          <p className="tm-kicker">Protected Route Notes</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Access boundaries</h2>
          <ul className="tm-bullet-list mt-5">
            <li>All non-auth admin routes require an active admin session.</li>
            <li>Finance-sensitive routes require `finance` or `super_admin` access.</li>
            <li>System configuration is restricted to `super_admin` and `operations` roles.</li>
            <li>Session trust depends on server-verified signed cookies rather than client-readable role claims.</li>
            <li>Partner-facing statuses remain aligned with the partner app; admin-only controls are separate.</li>
          </ul>
        </article>
      </section>

      <section className="tm-panel">
        <p className="tm-kicker">Active Sessions</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">API-backed session inventory</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {sessions.map((device) => (
            <article className="tm-soft-band" key={device.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-slate-950">{device.isCurrent ? "Current admin session" : `Session ${device.id}`}</p>
                <StatusBadge label={device.isCurrent ? "Active now" : "Tracked"} tone={device.isCurrent ? "success" : "info"} />
              </div>
              <p className="tm-muted mt-2 text-sm">{device.fingerprint}</p>
              <p className="tm-muted mt-1 text-sm">Created {new Date(device.createdAt).toLocaleString()}</p>
              <p className="tm-muted mt-1 text-sm">Last seen {new Date(device.lastSeenAt).toLocaleString()}</p>
              {!device.isCurrent ? (
                <form action={revokeAdminSessionAction} className="mt-4">
                  <input name="session_id" type="hidden" value={device.id} />
                  <SubmitButton label={`End session ${device.id}`} pendingLabel="Revoking…" className="tm-btn tm-btn-outline" />
                </form>
              ) : null}
            </article>
          ))}
        </div>
        {sessions.length === 0 ? <p className="tm-muted mt-5 text-sm">No active admin sessions were returned by the API.</p> : null}
      </section>
    </AdminShell>
  );
}
