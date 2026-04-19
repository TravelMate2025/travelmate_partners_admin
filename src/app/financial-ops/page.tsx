import { redirect } from "next/navigation";

import { AdminShell } from "@/components/common/admin-shell";
import { getAdminSession } from "@/modules/auth/session";
import { getFinancialOpsRecords } from "@/modules/financial-ops/data";
import { FinancialOpsWorkspace } from "@/modules/financial-ops/workspace";

const allowedRoles = ["finance", "super_admin"] as const;

export default async function FinancialOpsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/auth/login?next=/financial-ops");
  }

  if (!(allowedRoles as readonly string[]).includes(session.user.role)) {
    redirect("/auth/access-denied?next=/financial-ops");
  }

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
