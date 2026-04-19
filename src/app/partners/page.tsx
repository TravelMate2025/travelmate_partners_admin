import { AdminShell } from "@/components/common/admin-shell";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/modules/auth/session";
import { getPartnerRecords } from "@/modules/partner-operations/data";
import { PartnerOperationsWorkspace } from "@/modules/partner-operations/workspace";

export default async function PartnersPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/auth/login?next=/partners");
  }

  return (
    <AdminShell
      title="Partner Accounts"
      description="Search, inspect, lock, restore, and supervise partner records and portfolio state."
    >
      <PartnerOperationsWorkspace actor={session.user.name} initialRecords={getPartnerRecords()} role={session.user.role} />
    </AdminShell>
  );
}
