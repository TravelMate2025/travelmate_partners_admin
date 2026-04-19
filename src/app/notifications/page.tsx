import { AdminShell } from "@/components/common/admin-shell";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/modules/auth/session";
import { getNotificationRecords } from "@/modules/notifications/data";
import { notificationsAllowedRoles } from "@/modules/notifications/rules";
import { NotificationsWorkspace } from "@/modules/notifications/workspace";

export default async function NotificationsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/auth/login?next=/notifications");
  }

  if (!notificationsAllowedRoles.includes(session.user.role)) {
    redirect("/auth/access-denied?next=/notifications");
  }

  return (
    <AdminShell
      title="Partner Messaging"
      description="Back-office communication surface for direct notifications, transactional triggers, announcements, and delivery tracking."
    >
      <NotificationsWorkspace actor={session.user.name} initialRecords={getNotificationRecords()} role={session.user.role} />
    </AdminShell>
  );
}
