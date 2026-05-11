import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getFinancialOpsFromApi } from "@/modules/financial-ops/server";
import { FinancialOpsWorkspace } from "@/modules/financial-ops/workspace";

export default async function FinancialOpsPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/financial-ops", session);
  const { records, error } = await getFinancialOpsFromApi();
  const initialRecords = records;
  const surfaceState =
    error && records.length === 0
      ? {
          status: "error" as const,
          title: "Financial operations queue is unavailable",
          description: error,
        }
      : undefined;

  return (
    <AdminShell
      title="Financial Operations"
      description="Supervise partner settlement states, admin settlement runs, reconciliation evidence, statement generation, and refund follow-up from one finance route."
    >
      <FinancialOpsWorkspace
        actor={session.user.name}
        initialRecords={initialRecords}
        role={session.user.role}
        mode="real"
        surfaceState={surfaceState}
      />
    </AdminShell>
  );
}
