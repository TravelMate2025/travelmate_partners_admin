import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getNotificationRecords } from "@/modules/notifications/data";
import { NotificationsWorkspace } from "@/modules/notifications/workspace";

export default async function NotificationsPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/notifications", session);

  return (
    <AdminShell
      title="Partner Messaging"
      description="Back-office communication surface for direct notifications, transactional triggers, announcements, and delivery tracking."
    >
      <NotificationsWorkspace actor={session.user.name} initialRecords={getNotificationRecords()} role={session.user.role} />
    </AdminShell>
  );
}
