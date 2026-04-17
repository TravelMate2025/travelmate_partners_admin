import { AdminShell } from "@/components/common/admin-shell";
import { getAdminSession } from "@/modules/auth/session";
import { getVerificationCases } from "@/modules/verification-review/data";
import { VerificationReviewWorkspace } from "@/modules/verification-review/workspace";

export default async function VerificationReviewPage() {
  const session = await getAdminSession();
  const actor = session?.user.name ?? "Reviewer lane";

  return (
    <AdminShell
      title="Verification Review"
      description="Back-office review surface for partner KYC/KYB decisions, notes, and lifecycle control aligned to the completed partner verification flow."
    >
      <VerificationReviewWorkspace actor={actor} initialCases={getVerificationCases()} />
    </AdminShell>
  );
}
