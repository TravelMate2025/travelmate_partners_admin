import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getPayoutReviewRecords } from "@/modules/payout-review/data";
import { PayoutReviewWorkspace } from "@/modules/payout-review/workspace";

export default async function PayoutReviewPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/payout-review", session);

  return (
    <AdminShell
      title="Payout Review"
      description="Review settlement-account submissions, masked payout details, risk flags, and settlement holds from one finance-governance route."
    >
      <PayoutReviewWorkspace actor={session.user.name} initialRecords={getPayoutReviewRecords()} role={session.user.role} />
    </AdminShell>
  );
}
