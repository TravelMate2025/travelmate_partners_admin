import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getAdminUsersFromApi } from "@/modules/admin-users/server";
import { AdminUsersWorkspace } from "@/modules/admin-users/workspace";

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/admin-users", session);
  const { records, error } = await getAdminUsersFromApi();

  return (
    <AdminShell
      title="Admin Users"
      description="Manage internal admin accounts, invitations, role grants, MFA posture, and access-governance decisions from one super-admin route."
    >
      <AdminUsersWorkspace
        actor={session.user.name}
        initialRecords={records}
        mode="real"
        role={session.user.role}
        surfaceState={error ? { status: "error", title: "Unable to load admin governance records", description: error } : undefined}
      />
    </AdminShell>
  );
}
