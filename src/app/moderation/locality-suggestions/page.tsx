import Link from "next/link";

import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getLocalitySuggestionsFromApi } from "@/modules/locality-suggestions/server";
import { LocalitySuggestionsWorkspace } from "@/modules/locality-suggestions/workspace";

export default async function LocalitySuggestionsPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/moderation", session);

  const { records, error } = await getLocalitySuggestionsFromApi();

  return (
    <AdminShell
      title="City Suggestions"
      description="Review partner-submitted cities that are waiting for canonical approval, merge, reject, or blacklist decisions."
      headerAside={
        <Link className="tm-btn tm-btn-outline" href="/moderation">
          Back to moderation
        </Link>
      }
    >
      {error ? (
        <section className="tm-panel p-6">
          <p className="tm-kicker">City Suggestions</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">Queue unavailable</h2>
          <p className="tm-muted mt-2 text-sm">{error}</p>
        </section>
      ) : (
        <LocalitySuggestionsWorkspace initialRecords={records} />
      )}
    </AdminShell>
  );
}
