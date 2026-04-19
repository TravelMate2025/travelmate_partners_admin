import { AdminShell } from "@/components/common/admin-shell";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/modules/auth/session";
import { getInitialReportExports } from "@/modules/reports/data";
import { ReportsWorkspace } from "@/modules/reports/workspace";

export default async function ReportsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/auth/login?next=/reports");
  }

  return (
    <AdminShell
      title="Reports & Analytics"
      description="Track partner growth, verification funnels, listing conversion, regional supply, and API adoption. Export as CSV."
    >
      <ReportsWorkspace actor={session.user.name} initialExports={getInitialReportExports()} />
    </AdminShell>
  );
}
