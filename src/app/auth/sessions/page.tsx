import { AdminShell } from "@/components/common/admin-shell";
import { StatusBadge } from "@/components/common/status-badge";
import { refreshSessionAction, requestPasswordResetAction, signOutAction } from "@/modules/auth/actions";
import { getMockTrustedDevices } from "@/modules/auth/mock-devices";
import { getAdminSession } from "@/modules/auth/session";

type AdminSessionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSessionsPage({ searchParams }: AdminSessionsPageProps) {
  const params = searchParams ? await searchParams : {};
  const refreshed = getSingleParam(params.refreshed) === "1";
  const session = await getAdminSession();

  if (!session) {
    return null;
  }

  const devices = getMockTrustedDevices(session.user);

  return (
    <AdminShell
      title="Session Management"
      description="Protected admin access center for active session details, trusted devices, and route protection posture."
    >
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="tm-panel">
          <p className="tm-kicker">Current Session</p>
          {refreshed ? <p className="tm-alert tm-alert-success mt-4">The trusted session was refreshed successfully.</p> : null}
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
              <p className="mt-2 text-sm text-slate-900">Middleware + signed, server-verified cookie + role gate</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={refreshSessionAction}>
              <button className="tm-btn tm-btn-primary" type="submit">
                Refresh trusted session
              </button>
            </form>
            <form action={signOutAction}>
              <button className="tm-btn tm-btn-outline" type="submit">
                End current session
              </button>
            </form>
            <form action={requestPasswordResetAction}>
              <input name="email" type="hidden" value={session.user.email} />
              <button className="tm-btn tm-btn-outline" type="submit">
                Trigger password reset
              </button>
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
        <p className="tm-kicker">Trusted Devices</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Device and session inventory</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {devices.map((device) => (
            <article className="tm-soft-band" key={device.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-slate-950">{device.label}</p>
                <StatusBadge label={device.status} tone={device.status === "Active now" ? "success" : "info"} />
              </div>
              <p className="tm-muted mt-2 text-sm">{device.device}</p>
              <p className="tm-muted mt-1 text-sm">{device.location}</p>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
