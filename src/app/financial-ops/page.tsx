import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import {
  getDisbursementsFromApi,
  getFinancialOpsFromApi,
  getPlatformBalanceFromApi,
} from "@/modules/financial-ops/server";
import type { PlatformBalance } from "@/modules/financial-ops/types";
import { DisbursementQueueClient } from "@/modules/financial-ops/disbursement-queue-client";
import { FinancialOpsWorkspace } from "@/modules/financial-ops/workspace";

function PlatformBalancePanel({ balance, error }: { balance: PlatformBalance | null; error: string | null }) {
  return (
    <section className="tm-panel p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Platform Balance (Flutterwave)</h2>
      {error ? (
        <p className="mt-3 text-sm text-amber-700">{error}</p>
      ) : balance ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Currency</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{balance.currency}</p>
          </div>
          <div className="rounded-md border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Available balance</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {balance.available_balance !== null ? balance.available_balance.toLocaleString() : "—"}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Ledger balance</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {balance.ledger_balance !== null ? balance.ledger_balance.toLocaleString() : "—"}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Balance unavailable.</p>
      )}
    </section>
  );
}

export default async function FinancialOpsPage() {
  const session = await getAdminSession();
  requireAdminRouteAccess("/financial-ops", session);
  const [
    { records, error },
    { balance, error: balanceError },
    { data: disbursements, error: disbursementError },
  ] = await Promise.all([
    getFinancialOpsFromApi(),
    getPlatformBalanceFromApi("NGN"),
    getDisbursementsFromApi(),
  ]);
  const initialRecords = records;
  const surfaceState =
    error && records.length === 0
      ? {
          status: "error" as const,
          title: "Financial operations queue is unavailable",
          description: error,
        }
      : undefined;

  return (
    <AdminShell
      title="Financial Operations"
      description="Supervise partner settlement states, admin settlement runs, reconciliation evidence, statement generation, and refund follow-up from one finance route."
    >
      <div className="grid gap-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <PlatformBalancePanel balance={balance} error={balanceError} />
          <DisbursementQueueClient data={disbursements} error={disbursementError} />
        </div>
        <FinancialOpsWorkspace
          actor={session.user.name}
          initialRecords={initialRecords}
          role={session.user.role}
          mode="real"
          surfaceState={surfaceState}
        />
      </div>
    </AdminShell>
  );
}
