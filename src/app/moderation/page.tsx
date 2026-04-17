import { AdminShell } from "@/components/common/admin-shell";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export default function ModerationPage() {
  return (
    <AdminShell
      title="Listing Moderation"
      description="Scaffolded moderation space for reviewing stay and transfer submissions with consistent decision surfaces."
    >
      <SectionPlaceholder
        description="This route will become the shared moderation queue for stay and transfer content, with decision reasons, emergency takedowns, and correction loops aligned to the partner app's listing lifecycle."
        primaryAction="Open moderation queue"
        stage="Route scaffolded"
        supportingNote="Moderation decisions must align with the partner app's listing lifecycle and data-quality correction flows."
        title="Moderation shell scaffold"
      />
    </AdminShell>
  );
}
