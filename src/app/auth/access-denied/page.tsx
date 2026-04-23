import Link from "next/link";

import { getAdminRouteDefinition } from "@/modules/auth/access";
import { getAdminSession } from "@/modules/auth/session";

type AccessDeniedPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AccessDeniedPage({ searchParams }: AccessDeniedPageProps) {
  const params = searchParams ? await searchParams : {};
  const next = getSingleParam(params.next) ?? "/";
  const route = getAdminRouteDefinition(next);
  const required = (getSingleParam(params.required) ?? route?.roles?.join(",") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
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
          {route ? (
            <div className="tm-soft-band mt-6">
              <p className="tm-label">Requested route</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{route.label}</p>
              <p className="tm-muted mt-2 text-sm">{route.description}</p>
            </div>
          ) : null}
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
