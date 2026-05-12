import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getPayoutReviewFromApi } from "@/modules/payout-review/server";
import { PayoutReviewWorkspace } from "@/modules/payout-review/workspace";

export default async function PayoutReviewPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/payout-review", session);
  const { records, error } = await getPayoutReviewFromApi();
  const initialRecords = records;
  const surfaceState =
    error && records.length === 0
      ? {
          status: "error" as const,
          title: "Payout review queue is unavailable",
          description: error,
        }
      : undefined;

  return (
    <AdminShell
      title="Payout Review"
      description="Review settlement-account submissions, masked payout details, risk flags, and settlement holds from one finance-governance route."
    >
      <PayoutReviewWorkspace
        actor={session.user.name}
        initialRecords={initialRecords}
        role={session.user.role}
        mode="real"
        surfaceState={surfaceState}
      />
    </AdminShell>
  );
}
