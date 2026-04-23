import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getVerificationCasesFromApi } from "@/modules/verification-review/server";
import { VerificationReviewWorkspace } from "@/modules/verification-review/workspace";

export default async function VerificationReviewPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/verification-review", session);
  const actor = session?.user.name ?? "Reviewer lane";
  const { cases, error } = await getVerificationCasesFromApi();

  return (
    <AdminShell
      title="Verification Review"
      description="Back-office review surface for partner KYC/KYB decisions, notes, and lifecycle control aligned to the completed partner verification flow."
    >
      {error ? (
        <section className="tm-panel p-6">
          <p className="tm-kicker">Verification Review</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">Queue unavailable</h2>
          <p className="tm-muted mt-2 text-sm">{error}</p>
        </section>
      ) : (
        <VerificationReviewWorkspace actor={actor} initialCases={cases} mode="real" />
      )}
    </AdminShell>
  );
}
