"use client";
import { useEffect, useMemo, useState } from "react";

import type {
  DisbursementBalanceCheck,
  DisbursementRecord,
  EligibleDisbursementSettlement,
  EligibleDisbursementSettlementListResult,
} from "@/modules/financial-ops/types";

type RunFeedback = { tone: "success" | "error"; message: string } | null;

export function DisbursementReviewClient({
  eligibleSettlements: initialEligibleSettlements,
  eligibleSettlementsError,
  balanceCheck,
  balanceCheckError,
}: {
  eligibleSettlements: EligibleDisbursementSettlementListResult | null;
  eligibleSettlementsError: string | null;
  balanceCheck: DisbursementBalanceCheck | null;
  balanceCheckError: string | null;
}) {
  const [eligibleSettlements, setEligibleSettlements] = useState<EligibleDisbursementSettlement[]>(
    initialEligibleSettlements?.results ?? [],
  );
  const [selectedSettlementId, setSelectedSettlementId] = useState(initialEligibleSettlements?.results[0]?.settlementId ?? "");
  const [runningSettlementId, setRunningSettlementId] = useState<string | null>(null);
  const [runBatchBusy, setRunBatchBusy] = useState(false);
  const [runFeedback, setRunFeedback] = useState<RunFeedback>(null);

  const pendingAmount = useMemo(
    () => eligibleSettlements.reduce((sum, settlement) => sum + settlement.amount, 0),
    [eligibleSettlements],
  );
  const selectedSettlement = useMemo(
    () => eligibleSettlements.find((settlement) => settlement.settlementId === selectedSettlementId) ?? null,
    [eligibleSettlements, selectedSettlementId],
  );

  useEffect(() => {
    if (eligibleSettlements.length === 0) {
      setSelectedSettlementId("");
      return;
    }
    if (!eligibleSettlements.some((settlement) => settlement.settlementId === selectedSettlementId)) {
      setSelectedSettlementId(eligibleSettlements[0].settlementId);
    }
  }, [eligibleSettlements, selectedSettlementId]);

  function removeEligibleSettlement(settlementId: string) {
    setEligibleSettlements((current) => current.filter((settlement) => settlement.settlementId !== settlementId));
  }

  function applyDisbursementResult(result: DisbursementRecord | null, settlementId: string) {
    if (result) {
      removeEligibleSettlement(settlementId);
      return;
    }
    removeEligibleSettlement(settlementId);
  }

  async function handleRunSingle(settlementId: string) {
    const normalizedSettlementId = settlementId.trim();
    if (!normalizedSettlementId) {
      setRunFeedback({ tone: "error", message: "Choose a settlement first." });
      return;
    }
    setRunningSettlementId(normalizedSettlementId);
    setRunFeedback(null);
    try {
      const response = await fetch("/api/backend/financial-ops/disbursements/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settlementId: normalizedSettlementId }),
      });
      const body = (await response.json().catch(() => null)) as { data?: DisbursementRecord; message?: string } | null;
      if (!response.ok || !body?.data) {
        setRunFeedback({ tone: "error", message: body?.message ?? "Disbursement run failed." });
      } else {
        applyDisbursementResult(body.data, normalizedSettlementId);
        setRunFeedback({ tone: "success", message: `Disbursement initiated for ${normalizedSettlementId}.` });
      }
    } catch {
      setRunFeedback({ tone: "error", message: "Network error during disbursement run." });
    } finally {
      setRunningSettlementId(null);
    }
  }

  async function handleRunBatch() {
    setRunBatchBusy(true);
    setRunFeedback(null);
    try {
      const response = await fetch("/api/backend/financial-ops/disbursements/run-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = (await response.json().catch(() => null)) as {
        data?: { processed: number; succeeded: number; failed: number; results: Array<{ settlementId: string; result: DisbursementRecord | null }> };
        message?: string;
      } | null;
      if (!response.ok || !body?.data) {
        setRunFeedback({ tone: "error", message: body?.message ?? "Batch run failed." });
      } else {
        for (const row of body.data.results) {
          if (row.result) {
            removeEligibleSettlement(row.settlementId);
          }
        }
        setRunFeedback({
          tone: "success",
          message: `Batch complete: processed ${body.data.processed}, succeeded ${body.data.succeeded}, failed ${body.data.failed}.`,
        });
      }
    } catch {
      setRunFeedback({ tone: "error", message: "Network error during batch run." });
    } finally {
      setRunBatchBusy(false);
    }
  }

  return (
    <section className="grid gap-5">
      <section className="tm-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="tm-kicker">Finance</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Disbursement Review</h1>
            <p className="tm-muted mt-2 text-sm">
              Review eligible paid settlements in one focused place before running disbursement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="tm-btn tm-btn-outline" href="/financial-ops">
              Back to financial ops
            </a>
            <button className="tm-btn" disabled={runBatchBusy || eligibleSettlements.length === 0} onClick={() => void handleRunBatch()} type="button">
              {runBatchBusy ? "Running batch…" : "Run Batch"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="tm-label">Eligible settlements</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{eligibleSettlements.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="tm-label">Pending amount</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {eligibleSettlements[0]?.currency ?? balanceCheck?.currency ?? "NGN"} {pendingAmount.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="tm-label">Platform balance</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {balanceCheck?.platformBalance !== null && balanceCheck?.platformBalance !== undefined
                ? `${balanceCheck.currency} ${balanceCheck.platformBalance.toLocaleString()}`
                : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="tm-label">Sufficient?</p>
            <p
              className={`mt-2 text-2xl font-semibold ${
                balanceCheck?.isSufficient === true
                  ? "text-emerald-700"
                  : balanceCheck?.isSufficient === false
                    ? "text-red-700"
                    : "text-slate-500"
              }`}
            >
              {balanceCheck?.isSufficient === true ? "Yes" : balanceCheck?.isSufficient === false ? "No" : "Unknown"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {eligibleSettlementsError ? <span className="text-amber-700">{eligibleSettlementsError}</span> : null}
          {balanceCheckError ? <span className="text-amber-700">{balanceCheckError}</span> : null}
          {!eligibleSettlementsError ? <span>Only paid settlements that have not been disbursed yet appear here.</span> : null}
        </div>
      </section>

      {eligibleSettlements.length === 0 ? (
        <section className="tm-panel p-6">
          <p className="text-sm text-slate-500">No paid, undisbursed settlements are available right now.</p>
        </section>
      ) : (
        <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="tm-panel p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Eligible Settlements</h2>
              <span className="text-xs text-slate-500">{eligibleSettlements.length} ready</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="pb-2 pr-4">Booking ref</th>
                    <th className="pb-2 pr-4">Partner</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Updated</th>
                    <th className="pb-2 pr-4 sr-only">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleSettlements.map((settlement) => {
                    const active = settlement.settlementId === selectedSettlementId;
                    return (
                      <tr className={`border-b border-slate-100 ${active ? "bg-slate-50" : ""}`} key={settlement.id}>
                        <td className="py-2 pr-4 font-mono text-xs">{settlement.bookingReference || settlement.settlementId}</td>
                        <td className="py-2 pr-4 text-xs text-slate-700">{settlement.partnerName}</td>
                        <td className="py-2 pr-4">
                          {settlement.currency} {settlement.amount.toLocaleString()}
                        </td>
                        <td className="py-2 pr-4 text-xs text-slate-500">
                          {settlement.status} · {settlement.disbursementState}
                        </td>
                        <td className="py-2 pr-4 text-xs text-slate-500">
                          {settlement.updatedAt ? settlement.updatedAt.slice(0, 16).replace("T", " ") : "—"}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <button
                            className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                            onClick={() => setSelectedSettlementId(settlement.settlementId)}
                            type="button"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="tm-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Settlement Details</h2>
                <p className="mt-2 text-sm text-slate-500">Inspect the selected settlement before disbursement.</p>
              </div>
              {selectedSettlement ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Ready</span>
              ) : null}
            </div>

            {selectedSettlement ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="tm-label">Settlement reference</p>
                  <p className="mt-2 font-mono text-sm text-slate-900">{selectedSettlement.settlementId}</p>
                  <p className="mt-1 text-sm text-slate-600">{selectedSettlement.bookingReference}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="tm-label">Partner</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedSettlement.partnerName}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="tm-label">Amount</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedSettlement.currency} {selectedSettlement.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="tm-label">Settlement state</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedSettlement.status}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="tm-label">Disbursement state</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedSettlement.disbursementState}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="tm-label">Selected row label</p>
                  <p className="mt-2 text-sm text-slate-600">{selectedSettlement.label}</p>
                </div>
                <button
                  className="tm-btn w-full"
                  disabled={runningSettlementId === selectedSettlement.settlementId || runBatchBusy}
                  onClick={() => void handleRunSingle(selectedSettlement.settlementId)}
                  type="button"
                >
                  {runningSettlementId === selectedSettlement.settlementId ? "Running…" : "Run Disbursement"}
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Select a settlement from the list to review it here.</p>
            )}

            {runFeedback ? (
              <p className={`mt-4 text-xs ${runFeedback.tone === "success" ? "text-emerald-700" : "text-red-700"}`}>
                {runFeedback.message}
              </p>
            ) : null}
          </aside>
        </section>
      )}
    </section>
  );
}
