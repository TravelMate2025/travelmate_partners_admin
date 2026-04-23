import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getListingModerationRecords } from "@/modules/listing-moderation/data";
import { ListingModerationWorkspace } from "@/modules/listing-moderation/workspace";

export default async function ModerationPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/moderation", session);

  return (
    <AdminShell
      title="Listing Moderation"
      description="Review stay and transfer submissions, approve or reject listings, handle corrections, and manage emergency takedowns."
    >
      <ListingModerationWorkspace actor={session.user.name} initialRecords={getListingModerationRecords()} role={session.user.role} />
    </AdminShell>
  );
}
