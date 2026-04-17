import { AdminShell } from "@/components/common/admin-shell";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export default function NotificationsPage() {
  return (
    <AdminShell
      title="Partner Messaging"
      description="Scaffolded communication route for direct admin notifications, transactional messages, and partner broadcasts."
    >
      <SectionPlaceholder
        description="This route will hold message composition, audience targeting, channel selection, and delivery metadata."
        primaryAction="Compose announcement"
        stage="Route scaffolded"
        supportingNote="Admin messaging should complement the partner app's notification center and leave a strong audit trail."
        title="Messaging scaffold"
      />
    </AdminShell>
  );
}
