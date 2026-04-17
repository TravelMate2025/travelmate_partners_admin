import Link from "next/link";

import { requestPasswordResetAction } from "@/modules/auth/actions";

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = searchParams ? await searchParams : {};
  const sent = getSingleParam(params.sent) === "1";
  const email = getSingleParam(params.email) ?? "";

  return (
    <main className="tm-admin-page">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-4xl items-center gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="tm-panel tm-panel-hero p-8">
          <p className="tm-kicker">Access Recovery</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">Reset the admin password flow.</h1>
          <p className="tm-muted mt-4 text-sm">
            This mock route confirms the shape of password recovery before backend email delivery lands.
          </p>
        </section>

        <section className="tm-panel p-8">
          <p className="tm-kicker">Password Reset</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">Request reset instructions</h2>
          {sent ? (
            <p className="tm-alert tm-alert-success mt-4">
              If an admin account exists for {email || "that email"}, reset instructions have been queued.
            </p>
          ) : null}
          <form action={requestPasswordResetAction} className="mt-6 space-y-4">
            <label className="block">
              <span className="tm-label">Admin email</span>
              <input className="tm-input mt-2" defaultValue={email} name="email" placeholder="Admin email" required type="email" />
            </label>
            <button className="tm-btn tm-btn-primary w-full" type="submit">
              Send reset instructions
            </button>
          </form>
          <div className="mt-4">
            <Link className="tm-btn tm-btn-outline" href="/auth/login">
              Return to sign in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
