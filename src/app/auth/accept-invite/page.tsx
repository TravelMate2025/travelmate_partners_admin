import Link from "next/link";

import { SubmitButton } from "@/components/common/submit-button";
import { acceptAdminInviteAction } from "@/modules/auth/actions";

type AcceptInvitePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const errorCopy: Record<string, string> = {
  missing_token: "The invite link is incomplete. Ask a super admin to resend your invitation.",
  password_mismatch: "The password confirmation did not match. Please try again.",
};

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const params = searchParams ? await searchParams : {};
  const token = getSingleParam(params.token) ?? "";
  const error = getSingleParam(params.error) ?? "";

  return (
    <main className="tm-admin-page">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-5xl items-center gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="tm-panel tm-panel-hero p-8">
          <p className="tm-kicker">Admin Invitation</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">Activate your admin account.</h1>
          <p className="tm-muted mt-4 text-sm">
            This invite sets your first password and completes account activation so you can continue into the protected admin shell.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="tm-soft-band">
              <p className="tm-label">Activation scope</p>
              <p className="mt-2 text-sm text-slate-900">
                Invitation tokens are single-use, role assignment is already pre-approved, and any required MFA enforcement begins after activation.
              </p>
            </div>
          </div>
        </section>

        <section className="tm-panel p-8">
          <p className="tm-kicker">Accept Invite</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">Choose your password</h2>

          {!token ? (
            <div className="mt-6 space-y-4">
              <p className="tm-alert tm-alert-danger">
                The invite link is missing its activation token. Ask a super admin to resend your invitation.
              </p>
              <Link className="tm-btn tm-btn-outline" href="/auth/login">
                Return to sign in
              </Link>
            </div>
          ) : (
            <>
              {error ? (
                <p className="tm-alert tm-alert-danger mt-4">{errorCopy[error] ?? error}</p>
              ) : null}
              <form action={acceptAdminInviteAction} className="mt-6 space-y-4">
                <input name="token" type="hidden" value={token} />
                <label className="block">
                  <span className="tm-label">New password</span>
                  <input
                    autoComplete="new-password"
                    className="tm-input mt-2"
                    name="password"
                    placeholder="Create password"
                    required
                    type="password"
                  />
                </label>
                <label className="block">
                  <span className="tm-label">Confirm password</span>
                  <input
                    autoComplete="new-password"
                    className="tm-input mt-2"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    required
                    type="password"
                  />
                </label>
                <SubmitButton label="Activate admin account" pendingLabel="Activating…" />
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
