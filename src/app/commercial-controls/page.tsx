import { AdminShell } from "@/components/common/admin-shell";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/modules/auth/session";
import { getCommercialControlRecords } from "@/modules/commercial-controls/data";
import { CommercialControlsWorkspace } from "@/modules/commercial-controls/workspace";

const allowedRoles = ["finance", "super_admin"] as const;

export default async function CommercialControlsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/auth/login?next=/commercial-controls");
  }

  if (!(allowedRoles as readonly string[]).includes(session.user.role)) {
    redirect("/auth/access-denied?next=/commercial-controls");
  }

  return (
    <AdminShell
      title="Commercial Controls"
      description="Configure commission rules, service fees, and manual financial adjustments with full audit trails."
    >
      <CommercialControlsWorkspace actor={session.user.name} initialRecords={getCommercialControlRecords()} role={session.user.role} />
    </AdminShell>
  );
}
