import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getCommercialControlRecords } from "@/modules/commercial-controls/data";
import { CommercialControlsWorkspace } from "@/modules/commercial-controls/workspace";

export default async function CommercialControlsPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/commercial-controls", session);

  return (
    <AdminShell
      title="Commercial Controls"
      description="Configure commission rules, service fees, and manual financial adjustments with full audit trails."
    >
      <CommercialControlsWorkspace actor={session.user.name} initialRecords={getCommercialControlRecords()} role={session.user.role} />
    </AdminShell>
  );
}
