import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getAdminAccessRecords } from "@/modules/admin-users/data";
import { AdminUsersWorkspace } from "@/modules/admin-users/workspace";

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/admin-users", session);

  return (
    <AdminShell
      title="Admin Users"
      description="Manage internal admin accounts, invitations, role grants, MFA posture, and access-governance decisions from one super-admin route."
    >
      <AdminUsersWorkspace actor={session.user.name} initialRecords={getAdminAccessRecords()} role={session.user.role} />
    </AdminShell>
  );
}
