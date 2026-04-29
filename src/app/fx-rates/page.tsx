import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import { getFxRatesFromApi } from "@/modules/fx-rates/server";
import { FxRatesWorkspace } from "@/modules/fx-rates/workspace";

export default async function FxRatesPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/fx-rates", session);

  const { records, error } = await getFxRatesFromApi();
  const surfaceState =
    error && records.length === 0
      ? {
          status: "error" as const,
          title: "FX rates are unavailable",
          description: error,
        }
      : undefined;

  return (
    <AdminShell
      title="FX Rates"
      description="Control settlement conversion rates by currency pair. These admin-managed rates are used as settlement conversion source of truth."
    >
      <FxRatesWorkspace initialRecords={records} surfaceState={surfaceState} />
    </AdminShell>
  );
}
