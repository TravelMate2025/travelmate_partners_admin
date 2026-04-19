import { redirect } from "next/navigation";

import { AdminShell } from "@/components/common/admin-shell";
import { getAdminSession } from "@/modules/auth/session";
import { getAdminAccessRecords } from "@/modules/admin-users/data";
import { AdminUsersWorkspace } from "@/modules/admin-users/workspace";

const allowedRoles = ["super_admin"] as const;

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/auth/login?next=/admin-users");
  }

  if (!(allowedRoles as readonly string[]).includes(session.user.role)) {
    redirect("/auth/access-denied?next=/admin-users");
  }

  return (
    <AdminShell
      title="Admin Users"
      description="Manage internal admin accounts, invitations, role grants, MFA posture, and access-governance decisions from one super-admin route."
    >
      <AdminUsersWorkspace actor={session.user.name} initialRecords={getAdminAccessRecords()} role={session.user.role} />
    </AdminShell>
  );
}
