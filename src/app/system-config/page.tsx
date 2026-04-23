import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getSystemConfigRecords } from "@/modules/system-config/data";
import { SystemConfigWorkspace } from "@/modules/system-config/workspace";

export default async function SystemConfigPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/system-config", session);

  return (
    <AdminShell
      title="System Configuration"
      description="Manage platform taxonomies, feature toggles, service regions (countries, cities, service areas), moderation templates, and static content. Publish drafts, deprecate stale entries, activate regions, and control feature rollouts."
    >
      <SystemConfigWorkspace
        actor={session.user.name}
        initialRecords={getSystemConfigRecords()}
        role={session.user.role}
      />
    </AdminShell>
  );
}
