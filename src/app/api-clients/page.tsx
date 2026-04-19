import { AdminShell } from "@/components/common/admin-shell";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/modules/auth/session";
import { getApiClientRecords } from "@/modules/api-clients/data";
import { ApiClientsWorkspace } from "@/modules/api-clients/workspace";

export default async function ApiClientsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/auth/login?next=/api-clients");
  }

  return (
    <AdminShell
      title="API Clients"
      description="Review API access applications, manage client keys, assign usage plans, and govern rate limits."
    >
      <ApiClientsWorkspace actor={session.user.name} initialRecords={getApiClientRecords()} role={session.user.role} />
    </AdminShell>
  );
}
