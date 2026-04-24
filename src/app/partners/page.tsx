import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getPartnerRecords } from "@/modules/partner-operations/data";
import { PartnerOperationsWorkspace } from "@/modules/partner-operations/workspace";

export default async function PartnersPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/partners", session);

  return (
    <AdminShell
      title="Partner Accounts"
      description="Search, inspect, lock, restore, and supervise partner records, structured operating coverage, and payout setup."
    >
      <PartnerOperationsWorkspace actor={session.user.name} initialRecords={getPartnerRecords()} role={session.user.role} />
    </AdminShell>
  );
}
