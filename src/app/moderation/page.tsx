import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getModerationListingsFromApi } from "@/modules/listing-moderation/server";
import { ListingModerationWorkspace } from "@/modules/listing-moderation/workspace";

export default async function ModerationPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/moderation", session);

  const { records, error } = await getModerationListingsFromApi();

  return (
    <AdminShell
      title="Listing Moderation"
      description="Review stay and transfer submissions, approve or reject listings, handle corrections, and manage emergency takedowns."
    >
      {error ? (
        <section className="tm-panel p-6">
          <p className="tm-kicker">Listing Moderation</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">Queue unavailable</h2>
          <p className="tm-muted mt-2 text-sm">{error}</p>
        </section>
      ) : (
        <ListingModerationWorkspace
          actor={session.user.name}
          initialRecords={records}
          mode="real"
          role={session.user.role}
        />
      )}
    </AdminShell>
  );
}
