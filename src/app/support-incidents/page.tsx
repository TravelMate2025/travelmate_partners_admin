import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getSupportIncidentRecords } from "@/modules/support-incidents/data";
import { getListingAppealSupportCasesFromApi } from "@/modules/support-incidents/server";
import { SupportIncidentsWorkspace } from "@/modules/support-incidents/workspace";

export default async function SupportIncidentsPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/support-incidents", session);
  const { records: appealRecords, error } = await getListingAppealSupportCasesFromApi();
  const initialRecords = [...appealRecords, ...getSupportIncidentRecords()];
  const surfaceState =
    error && appealRecords.length === 0
      ? {
          status: "error" as const,
          title: "Appeal queue is unavailable",
          description: error,
        }
      : undefined;

  return (
    <AdminShell
      title="Support & Incidents"
      description="Track partner issues, flag incidents, escalate operational risk, and run safe diagnostics with linked partner, listing, verification, and finance context."
    >
      <SupportIncidentsWorkspace
        actor={session.user.name}
        initialRecords={initialRecords}
        role={session.user.role}
        surfaceState={surfaceState}
      />
    </AdminShell>
  );
}
