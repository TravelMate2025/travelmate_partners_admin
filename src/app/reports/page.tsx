import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getReportsFromApi } from "@/modules/reports/server";
import { ReportsWorkspace } from "@/modules/reports/workspace";

export default async function ReportsPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/reports", session);
  const { snapshot, exports, error } = await getReportsFromApi();

  return (
    <AdminShell
      title="Reports & Analytics"
      description="Track partner growth, verification funnels, listing conversion, regional supply, and API adoption. Export as CSV."
    >
      <ReportsWorkspace
        actor={session.user.name}
        initialSnapshot={snapshot ?? undefined}
        initialExports={exports}
        mode="real"
        surfaceState={
          error
            ? {
                status: "error",
                title: "Reports unavailable",
                description: error,
              }
            : undefined
        }
      />
    </AdminShell>
  );
}
