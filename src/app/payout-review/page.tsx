import { AdminShell } from "@/components/common/admin-shell";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export default function PayoutReviewPage() {
  return (
    <AdminShell
      title="Payout Review"
      description="Scaffolded route for payout-method approvals, role-based masking, fraud flags, and settlement holds."
    >
      <SectionPlaceholder
        description="This route will review payout-method submissions, trigger re-verification, manage holds, and restrict sensitive payout data by role, especially for non-finance users."
        primaryAction="Review payout cases"
        stage="Route scaffolded"
        supportingNote="Payout review is the admin-side counterpart to partner payout-method submission and verification from Flow 2.15, so the admin dashboard should govern the same payout-method lifecycle rather than create a separate partner-facing variant."
        title="Payout review scaffold"
      />
    </AdminShell>
  );
}
