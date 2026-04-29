import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getPartnerRecords } from "@/modules/partner-operations/data";
import { getPartnerOperationsFromApi } from "@/modules/partner-operations/server";
import { PartnerOperationsWorkspace } from "@/modules/partner-operations/workspace";

export default async function PartnersPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/partners", session);
  const { records, error } = await getPartnerOperationsFromApi();
  const initialRecords = records.length > 0 ? records : getPartnerRecords();
  const surfaceState =
    error && records.length === 0
      ? { status: "error" as const, title: "Partner operations is unavailable", description: error }
      : undefined;

  return (
    <AdminShell
      title="Partner Accounts"
      description="Search, inspect, lock, restore, and supervise partner records, structured operating coverage, and payout setup."
    >
      <PartnerOperationsWorkspace actor={session.user.name} initialRecords={initialRecords} role={session.user.role} mode="real" surfaceState={surfaceState} />
    </AdminShell>
  );
}
