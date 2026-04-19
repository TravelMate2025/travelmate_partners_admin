import { redirect } from "next/navigation";

import { AdminShell } from "@/components/common/admin-shell";
import { getAdminSession } from "@/modules/auth/session";
import { getPayoutReviewRecords } from "@/modules/payout-review/data";
import { PayoutReviewWorkspace } from "@/modules/payout-review/workspace";

const allowedRoles = ["finance", "super_admin"] as const;

export default async function PayoutReviewPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/auth/login?next=/payout-review");
  }

  if (!(allowedRoles as readonly string[]).includes(session.user.role)) {
    redirect("/auth/access-denied?next=/payout-review");
  }

  return (
    <AdminShell
      title="Payout Review"
      description="Review settlement-account submissions, masked payout details, risk flags, and settlement holds from one finance-governance route."
    >
      <PayoutReviewWorkspace actor={session.user.name} initialRecords={getPayoutReviewRecords()} role={session.user.role} />
    </AdminShell>
  );
}
