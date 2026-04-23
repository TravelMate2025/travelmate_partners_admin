import Link from "next/link";

import { SubmitButton } from "@/components/common/submit-button";
import { requestPasswordResetAction, resetAdminPasswordAction } from "@/modules/auth/actions";

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = searchParams ? await searchParams : {};
  const step = getSingleParam(params.step) ?? "request";
  const sent = getSingleParam(params.sent) === "1";
  const email = getSingleParam(params.email) ?? "";
  const error = getSingleParam(params.error) ?? "";

  return (
    <main className="tm-admin-page">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-4xl items-center gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="tm-panel tm-panel-hero p-8">
          <p className="tm-kicker">Access Recovery</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">Reset your admin password.</h1>
          <p className="tm-muted mt-4 text-sm">
            {step === "verify"
              ? "A 6-digit reset code was sent to your email. Enter it below along with your new password."
              : "Enter your admin email address and we'll send a reset code if the account exists."}
          </p>
        </section>

        <section className="tm-panel p-8">
          <p className="tm-kicker">Password Reset</p>

          {step === "verify" ? (
            <>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">Set new password</h2>
              {sent ? (
                <p className="tm-alert tm-alert-success mt-4">
                  Reset code sent — check {email || "your email"} and enter it below.
                </p>
              ) : null}
              {error ? (
                <p className="tm-alert tm-alert-danger mt-4">{error}</p>
              ) : null}
              <form action={resetAdminPasswordAction} className="mt-6 space-y-4">
                <input name="email" type="hidden" value={email} />
                <label className="block">
                  <span className="tm-label">Reset code</span>
                  <input
                    autoComplete="one-time-code"
                    className="tm-input mt-2"
                    name="code"
                    placeholder="6-digit code from email"
                    required
                  />
                </label>
                <label className="block">
                  <span className="tm-label">New password</span>
                  <input
                    autoComplete="new-password"
                    className="tm-input mt-2"
                    name="newPassword"
                    placeholder="New password"
                    required
                    type="password"
                  />
                </label>
                <SubmitButton label="Update password" pendingLabel="Updating…" />
              </form>
              <div className="mt-4">
                <Link className="tm-btn tm-btn-outline" href="/auth/reset-password">
                  Request a new code
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">Request reset code</h2>
              <form action={requestPasswordResetAction} className="mt-6 space-y-4">
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
                <SubmitButton label="Send reset code" pendingLabel="Sending…" />
              </form>
              <div className="mt-4">
                <Link className="tm-btn tm-btn-outline" href="/auth/login">
                  Return to sign in
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
