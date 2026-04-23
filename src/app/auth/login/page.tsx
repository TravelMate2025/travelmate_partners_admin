import Link from "next/link";

import { signInAction, signOutAction, verifyMfaAction } from "@/modules/auth/actions";
import { getAdminChallenge, getAdminSession } from "@/modules/auth/session";
import { SubmitButton } from "@/components/common/submit-button";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatExpiry(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const errorCopy: Record<string, string> = {
  invalid_credentials: "The email or password is incorrect. Please try again.",
  invalid_mfa: "The MFA code did not match. Please try again.",
  mfa_expired: "The MFA challenge expired. Sign in again to continue.",
  session_expired: "The trusted admin session expired. Sign in again to continue.",
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const step = getSingleParam(params.step) ?? "credentials";
  const next = getSingleParam(params.next) ?? "/";
  const email = getSingleParam(params.email) ?? "";
  const error = getSingleParam(params.error) ?? "";
  const signedOut = getSingleParam(params.signed_out) === "1";
  const passwordReset = getSingleParam(params.password_reset) === "1";
  const session = await getAdminSession();
  const challenge = await getAdminChallenge();

  const challengeEmail = challenge?.email ?? email;
  const challengeExpiry = formatExpiry(challenge?.expiresAt);

  return (
    <main className="tm-admin-page">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl items-center gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="tm-panel tm-panel-hero p-8">
          <p className="tm-kicker">TravelMate Admin</p>
          <h1 className="mt-3 text-5xl font-semibold text-slate-950">Trusted access for back-office decisions.</h1>
          <p className="tm-muted mt-4 max-w-xl text-sm">
            Protected routes, role-based access, MFA where required, and auditable signed session cookies are active across all admin surfaces.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="tm-soft-band">
              <p className="tm-label">Auth scope</p>
              <p className="mt-2 text-sm text-slate-900">
                Credentials are validated against the live API. Role-aware access, MFA challenge flow, and finance-only route protection are enforced.
              </p>
            </div>
            <div className="tm-soft-band">
              <p className="tm-label">Session model</p>
              <p className="mt-2 text-sm text-slate-900">
                Sessions are created by the API, then mirrored into a signed dashboard cookie so protected routes can bootstrap quickly.
              </p>
            </div>
          </div>
        </section>

        <section className="tm-panel p-8">
          <p className="tm-kicker">Admin Access</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">
            {session ? "Active admin session" : step === "mfa" ? "Verify MFA" : "Sign in"}
          </h2>

          {signedOut ? (
            <p className="tm-alert tm-alert-success mt-4">The admin session was closed successfully.</p>
          ) : null}
          {passwordReset ? (
            <p className="tm-alert tm-alert-success mt-4">Password updated — sign in with your new password.</p>
          ) : null}
          {error ? <p className="tm-alert tm-alert-danger mt-4">{errorCopy[error] ?? "Unable to complete sign in."}</p> : null}

          {session ? (
            <div className="mt-6 space-y-4">
              <div className="tm-soft-band">
                <p className="tm-label">Current session</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{session.user.name}</p>
                <p className="tm-muted mt-2 text-sm">
                  {session.user.email} · {session.user.role.replace("_", " ")} · {session.deviceLabel}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link className="tm-btn tm-btn-primary" href={next}>
                  Return to dashboard
                </Link>
                <Link className="tm-btn tm-btn-outline" href="/auth/sessions">
                  Manage sessions
                </Link>
                <form action={signOutAction}>
                  <button className="tm-btn tm-btn-outline" type="submit">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          ) : step === "mfa" ? (
            <form action={verifyMfaAction} className="mt-6 space-y-4">
              <input name="next" type="hidden" value={next} />
              <input name="email" type="hidden" value={challengeEmail} />
              <div className="tm-soft-band">
                <p className="tm-label">Challenge account</p>
                <p className="mt-2 text-sm text-slate-900">
                  MFA is required for <span className="font-semibold">{challengeEmail || "this admin account"}</span>.
                </p>
                {challengeExpiry ? (
                  <p className="tm-muted mt-2 text-xs">This MFA challenge expires at {challengeExpiry}.</p>
                ) : null}
              </div>
              <label className="block">
                <span className="tm-label">One-time code</span>
                <input
                  autoComplete="one-time-code"
                  className="tm-input mt-2"
                  name="code"
                  placeholder="Enter 6-digit code"
                  required
                />
              </label>
              <SubmitButton label="Verify MFA and continue" pendingLabel="Verifying…" />
              <Link className="tm-btn tm-btn-outline w-full" href={`/auth/login?email=${encodeURIComponent(challengeEmail)}&next=${encodeURIComponent(next)}`}>
                Start over
              </Link>
            </form>
          ) : (
            <form action={signInAction} className="mt-6 space-y-4">
              <input name="next" type="hidden" value={next} />
              <label className="block">
                <span className="tm-label">Admin email</span>
                <input
                  autoComplete="username"
                  className="tm-input mt-2"
                  defaultValue={email}
                  name="email"
                  placeholder="Admin email"
                  required
                  type="email"
                />
              </label>
              <label className="block">
                <span className="tm-label">Password</span>
                <input
                  autoComplete="current-password"
                  className="tm-input mt-2"
                  name="password"
                  placeholder="Password"
                  required
                  type="password"
                />
              </label>
              <SubmitButton label="Continue to admin shell" pendingLabel="Signing in…" />
              <div className="flex flex-wrap gap-3">
                <Link className="tm-btn tm-btn-outline" href="/auth/reset-password">
                  Reset password
                </Link>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
