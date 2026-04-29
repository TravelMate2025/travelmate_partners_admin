import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getApiMonitoringRecords } from "@/modules/api-monitoring/data";
import { getApiMonitoringFromApi } from "@/modules/api-monitoring/server";
import { ApiMonitoringWorkspace } from "@/modules/api-monitoring/workspace";

export default async function ApiMonitoringPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/api-monitoring", session);
  const { records, error } = await getApiMonitoringFromApi();
  const initialRecords = records.length > 0 ? records : getApiMonitoringRecords();
  const surfaceState =
    error && records.length === 0
      ? { status: "error" as const, title: "API monitoring queue is unavailable", description: error }
      : undefined;

  return (
    <AdminShell
      title="API Monitoring"
      description="Watch API traffic, error rates, latency signals, rate-limit violations, and client abuse patterns."
    >
      <ApiMonitoringWorkspace actor={session.user.name} initialRecords={initialRecords} role={session.user.role} mode="real" surfaceState={surfaceState} />
    </AdminShell>
  );
}
