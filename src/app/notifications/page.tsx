import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getNotificationsFromApi } from "@/modules/notifications/server";
import { NotificationsWorkspace } from "@/modules/notifications/workspace";

export default async function NotificationsPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/notifications", session);
  const { records, error } = await getNotificationsFromApi();

  return (
    <AdminShell
      title="Partner Messaging"
      description="Back-office communication surface for direct notifications, transactional triggers, announcements, and delivery tracking."
    >
      <NotificationsWorkspace
        actor={session.user.name}
        initialRecords={records}
        mode="real"
        role={session.user.role}
        surfaceState={
          error
            ? {
                status: "error",
                title: "Notifications unavailable",
                description: error,
              }
            : undefined
        }
      />
    </AdminShell>
  );
}
