import Link from "next/link";

import { getAdminSession } from "@/modules/auth/session";

type AccessDeniedPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AccessDeniedPage({ searchParams }: AccessDeniedPageProps) {
  const params = searchParams ? await searchParams : {};
  const required = (getSingleParam(params.required) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const next = getSingleParam(params.next) ?? "/";
  const session = await getAdminSession();

  return (
    <main className="tm-admin-page">
      <div className="mx-auto max-w-3xl">
        <section className="tm-panel tm-panel-hero p-8">
          <p className="tm-kicker">Access Denied</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">This admin route requires a different role.</h1>
          <p className="tm-muted mt-4 text-sm">
            {session
              ? `${session.user.name} is signed in as ${session.user.role.replace("_", " ")}.`
              : "No admin session is active."}{" "}
            Required roles: {required.length ? required.join(", ") : "contact platform leadership"}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="tm-btn tm-btn-primary" href="/">
              Return to overview
            </Link>
            <Link className="tm-btn tm-btn-outline" href="/auth/sessions">
              Review session access
            </Link>
            <Link className="tm-btn tm-btn-outline" href={next}>
              Retry route
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
