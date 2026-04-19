import { redirect } from "next/navigation";

import { AdminShell } from "@/components/common/admin-shell";
import { getAdminSession } from "@/modules/auth/session";
import { getSupportIncidentRecords } from "@/modules/support-incidents/data";
import { SupportIncidentsWorkspace } from "@/modules/support-incidents/workspace";

export default async function SupportIncidentsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/auth/login?next=/support-incidents");
  }

  return (
    <AdminShell
      title="Support & Incidents"
      description="Track partner issues, flag incidents, escalate operational risk, and run safe diagnostics with linked partner, listing, verification, and finance context."
    >
      <SupportIncidentsWorkspace
        actor={session.user.name}
        initialRecords={getSupportIncidentRecords()}
        role={session.user.role}
      />
    </AdminShell>
  );
}
