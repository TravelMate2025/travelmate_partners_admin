import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getCommercialControlRecords } from "@/modules/commercial-controls/data";
import { LiveCommercialSettingsPanel } from "@/modules/commercial-controls/live-settings-panel";
import { getCommercialSettingsFromApi } from "@/modules/commercial-controls/server";
import { CommercialControlsWorkspace } from "@/modules/commercial-controls/workspace";

export default async function CommercialControlsPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/commercial-controls", session);
  const { setting } = await getCommercialSettingsFromApi();

  return (
    <AdminShell
      title="Commercial Controls"
      description="Configure commission rules, service fees, and manual financial adjustments with full audit trails."
    >
      <LiveCommercialSettingsPanel initialSetting={setting} />
      <CommercialControlsWorkspace actor={session.user.name} initialRecords={getCommercialControlRecords()} role={session.user.role} />
    </AdminShell>
  );
}
