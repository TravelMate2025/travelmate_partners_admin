import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getFinancialOpsRecords } from "@/modules/financial-ops/data";
import { FinancialOpsWorkspace } from "@/modules/financial-ops/workspace";

export default async function FinancialOpsPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/financial-ops", session);

  return (
    <AdminShell
      title="Financial Operations"
      description="Supervise partner settlement states, admin settlement runs, reconciliation evidence, statement generation, and refund follow-up from one finance route."
    >
      <FinancialOpsWorkspace
        actor={session.user.name}
        initialRecords={getFinancialOpsRecords()}
        role={session.user.role}
      />
    </AdminShell>
  );
}
