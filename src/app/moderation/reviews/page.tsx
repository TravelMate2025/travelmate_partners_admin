import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getAdminReviewsFromApi } from "@/modules/review-moderation/server";
import { ReviewModerationWorkspace } from "@/modules/review-moderation/workspace";

export default async function ReviewModerationPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/moderation/reviews", session);

  const { records, error } = await getAdminReviewsFromApi();

  return (
    <AdminShell
      title="Review Moderation"
      description="Inspect submitted guest reviews and publish or reject them before they appear on listings."
    >
      {error ? (
        <section className="tm-panel p-6">
          <p className="tm-kicker">Review Moderation</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">Queue unavailable</h2>
          <p className="tm-muted mt-2 text-sm">{error}</p>
        </section>
      ) : (
        <ReviewModerationWorkspace initialRecords={records} role={session.user.role} />
      )}
    </AdminShell>
  );
}
