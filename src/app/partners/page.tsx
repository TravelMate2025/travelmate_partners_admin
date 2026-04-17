import { AdminShell } from "@/components/common/admin-shell";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export default function PartnersPage() {
  return (
    <AdminShell
      title="Partner Accounts"
      description="Scaffolded partner account surfaces for search, lifecycle supervision, and portfolio inspection."
    >
      <SectionPlaceholder
        description="This route will host searchable partner records, lock and restore actions, limited metadata updates, and back-office visibility into partner portfolio state."
        primaryAction="Inspect partner record"
        stage="Route scaffolded"
        supportingNote="Partner account management should supervise completed partner onboarding and portfolio states without recreating partner self-service UI, and route naming here should stay explicit because the scaffold uses `/partners` for this operational surface."
        title="Partner operations scaffold"
      />
    </AdminShell>
  );
}
