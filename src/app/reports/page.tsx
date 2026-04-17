import { AdminShell } from "@/components/common/admin-shell";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export default function ReportsPage() {
  return (
    <AdminShell
      title="Reports & Analytics"
      description="Scaffolded reporting route for conversion, verification, supply, and platform operations analytics."
    >
      <SectionPlaceholder
        description="This route will host partner growth analytics, listing funnel reports, API usage, regional supply, and exports."
        primaryAction="Generate platform report"
        stage="Route scaffolded"
        supportingNote="Admin reporting should summarize platform-wide signals while staying aligned with partner-facing reporting terminology where appropriate."
        title="Reporting scaffold"
      />
    </AdminShell>
  );
}
