import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getApiClientRecords } from "@/modules/api-clients/data";
import { getApiClientsFromApi } from "@/modules/api-clients/server";
import { ApiClientsWorkspace } from "@/modules/api-clients/workspace";

export default async function ApiClientsPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/api-clients", session);
  const { records, error } = await getApiClientsFromApi();
  const initialRecords = records.length > 0 ? records : getApiClientRecords();
  const surfaceState =
    error && records.length === 0
      ? { status: "error" as const, title: "API clients queue is unavailable", description: error }
      : undefined;

  return (
    <AdminShell
      title="API Clients"
      description="Review API access applications, manage client keys, assign usage plans, and govern rate limits."
    >
      <ApiClientsWorkspace actor={session.user.name} initialRecords={initialRecords} role={session.user.role} mode="real" surfaceState={surfaceState} />
    </AdminShell>
  );
}
