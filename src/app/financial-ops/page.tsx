import { AdminShell } from "@/components/common/admin-shell";
import { requireAdminRouteAccess } from "@/modules/auth/access.server";
import { getAdminSession } from "@/modules/auth/session";
import {
  getDisbursementBalanceCheckFromApi,
  getDisbursementsFromApi,
  getFailedPaymentAttemptsFromApi,
  getFinancialOpsFromApi,
  getPlatformBalanceFromApi,
} from "@/modules/financial-ops/server";
import type {
  DisbursementBalanceCheck,
  FailedPaymentAttempt,
  PlatformBalance,
} from "@/modules/financial-ops/types";
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

function DisbursementBalancePanel({
  data,
  error,
}: {
  data: DisbursementBalanceCheck | null;
  error: string | null;
}) {
  return (
    <section className="tm-panel p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Disbursement Balance Check</h2>
      {error ? (
        <p className="mt-3 text-sm text-amber-700">{error}</p>
      ) : data ? (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Platform balance ({data.currency})</p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {data.platformBalance !== null ? data.platformBalance.toLocaleString() : "—"}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Pending disbursements</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{data.pendingDisbursementTotal.toLocaleString()}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Sufficient?</p>
              <p
                className={`mt-1 text-base font-semibold ${
                  data.isSufficient === true
                    ? "text-emerald-700"
                    : data.isSufficient === false
                      ? "text-red-700"
                      : "text-slate-500"
                }`}
              >
                {data.isSufficient === true ? "Yes" : data.isSufficient === false ? "No" : "Unknown"}
              </p>
            </div>
          </div>
          {data.balanceError ? <p className="text-xs text-amber-700">Balance fetch error: {data.balanceError}</p> : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Balance check unavailable.</p>
      )}
    </section>
  );
}


function FailedPaymentAttemptsPanel({
  results,
  total,
  error,
}: {
  results: FailedPaymentAttempt[];
  total: number;
  error: string | null;
}) {
  return (
    <section className="tm-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Failed Payment Attempts</h2>
        {total > 0 ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{total} total</span> : null}
      </div>
      {error ? (
        <p className="mt-3 text-sm text-amber-700">{error}</p>
      ) : results.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No failed payment attempts on record.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">Booking ref</th>
                <th className="pb-2 pr-4">Flutterwave ref</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Updated</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => (
                <tr className="border-b border-slate-100" key={item.id}>
                  <td className="py-2 pr-4 font-mono text-xs">{item.bookingReference || "—"}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{item.flutterwaveRef || "—"}</td>
                  <td className="py-2 pr-4">
                    {item.currency} {item.amount !== null ? item.amount.toLocaleString() : "—"}
                  </td>
                  <td className="py-2 pr-4 text-slate-500">{item.updatedAt ? item.updatedAt.slice(0, 16).replace("T", " ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > results.length ? (
            <p className="mt-2 text-xs text-slate-500">Showing {results.length} of {total} failed attempts.</p>
          ) : null}
        </div>
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
    { results: failedAttempts, total: failedTotal, error: failedError },
    { data: disbursements, error: disbursementsError },
    { data: disbursementBalance, error: disbursementBalanceError },
  ] = await Promise.all([
    getFinancialOpsFromApi(),
    getPlatformBalanceFromApi("NGN"),
    getFailedPaymentAttemptsFromApi(1, 20),
    getDisbursementsFromApi(1, 50),
    getDisbursementBalanceCheckFromApi("NGN"),
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
        <div className="grid gap-5 md:grid-cols-2">
          <PlatformBalancePanel balance={balance} error={balanceError} />
          <FailedPaymentAttemptsPanel error={failedError} results={failedAttempts} total={failedTotal} />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <DisbursementBalancePanel data={disbursementBalance} error={disbursementBalanceError} />
          <DisbursementQueueClient data={disbursements} error={disbursementsError} />
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
