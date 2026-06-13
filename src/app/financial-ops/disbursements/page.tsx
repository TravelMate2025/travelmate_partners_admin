import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getDisbursementBalanceCheckFromApi, getEligibleDisbursementSettlementsFromApi } from "@/modules/financial-ops/server";
import { DisbursementReviewClient } from "@/modules/financial-ops/disbursement-review-client";

export default async function DisbursementReviewPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/financial-ops/disbursements", session);

  const [
    { data: eligibleSettlements, error: eligibleSettlementsError },
    { data: balanceCheck, error: balanceCheckError },
  ] = await Promise.all([
    getEligibleDisbursementSettlementsFromApi(1, 100),
    getDisbursementBalanceCheckFromApi("NGN"),
  ]);

  return (
    <AdminShell
      title="Disbursement Review"
      description="Review eligible paid settlements in one focused screen before triggering a payout transfer."
    >
      <DisbursementReviewClient
        balanceCheck={balanceCheck}
        balanceCheckError={balanceCheckError}
        eligibleSettlements={eligibleSettlements}
        eligibleSettlementsError={eligibleSettlementsError}
      />
    </AdminShell>
  );
}
