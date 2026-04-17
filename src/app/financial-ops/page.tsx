import { AdminShell } from "@/components/common/admin-shell";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export default function FinancialOpsPage() {
  return (
    <AdminShell
      title="Financial Operations"
      description="Scaffolded route for partner settlement supervision, admin settlement runs, reconciliation, refund follow-up, and finance controls."
    >
      <SectionPlaceholder
        description="This route will supervise partner booking-completion settlement states, admin-operated settlement runs, failures, retries, statement generation, refunds, and reconciliation evidence."
        primaryAction="Open settlement operations"
        stage="Route scaffolded"
        supportingNote="Financial operations is the back-office counterpart to the completed partner wallet and settlement flows, so partner-facing settlement statuses should remain aligned while admin run statuses stay explicitly separate."
        title="Financial operations scaffold"
      />
    </AdminShell>
  );
}
