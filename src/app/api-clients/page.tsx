import { AdminShell } from "@/components/common/admin-shell";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export default function ApiClientsPage() {
  return (
    <AdminShell
      title="API Clients"
      description="Scaffolded governance route for reviewing API access applications, plans, and client key lifecycle."
    >
      <SectionPlaceholder
        description="This route will manage API access reviews, key issuance, plan assignment, quota operations, and abuse controls."
        primaryAction="Review API client queue"
        stage="Route scaffolded"
        supportingNote="This module is admin-owned and intentionally separate from the partner-facing product."
        title="API governance scaffold"
      />
    </AdminShell>
  );
}
