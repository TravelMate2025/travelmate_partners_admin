import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getApiMonitoringRecords } from "@/modules/api-monitoring/data";
import { ApiMonitoringWorkspace } from "@/modules/api-monitoring/workspace";

export default async function ApiMonitoringPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/api-monitoring", session);

  return (
    <AdminShell
      title="API Monitoring"
      description="Watch API traffic, error rates, latency signals, rate-limit violations, and client abuse patterns."
    >
      <ApiMonitoringWorkspace actor={session.user.name} initialRecords={getApiMonitoringRecords()} role={session.user.role} />
    </AdminShell>
  );
}
