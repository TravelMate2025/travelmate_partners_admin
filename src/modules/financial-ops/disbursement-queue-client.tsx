"use client";
import { Fragment, useState } from "react";

import type { DisbursementListResult, DisbursementRecord, DisbursementStatus } from "@/modules/financial-ops/types";

const STATUS_COLORS: Record<DisbursementStatus, string> = {
  queued: "bg-slate-100 text-slate-700",
  initiated: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  success: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const RETRYABLE_STATUSES: DisbursementStatus[] = ["failed", "cancelled"];

export function DisbursementQueueClient({
  data: initialData,
  error: initialError,
}: {
  data: DisbursementListResult | null;
  error: string | null;
}) {
  const [records, setRecords] = useState<DisbursementRecord[]>(initialData?.results ?? []);
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [page] = useState(initialData?.page ?? 1);
  const [totalPages] = useState(initialData?.totalPages ?? 1);
  const [fetchError] = useState(initialError);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [retryFeedback, setRetryFeedback] = useState<{ id: string; tone: "success" | "error"; message: string } | null>(null);
  const [runSettlementId, setRunSettlementId] = useState("");
  const [runBusy, setRunBusy] = useState(false);
  const [runBatchBusy, setRunBatchBusy] = useState(false);
  const [runFeedback, setRunFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  function mergeRecord(record: DisbursementRecord) {
    setRecords((prev) => {
      const existingIdx = prev.findIndex((d) => d.id === record.id);
      if (existingIdx === -1) {
        setTotal((current) => current + 1);
        return [record, ...prev];
      }
      return prev.map((d) => (d.id === record.id ? record : d));
    });
  }

  async function handleRunSingle() {
    const settlementId = runSettlementId.trim();
    if (!settlementId) {
      setRunFeedback({ tone: "error", message: "Enter a settlement ID first." });
      return;
    }
    setRunBusy(true);
    setRunFeedback(null);
    try {
      const response = await fetch("/api/backend/financial-ops/disbursements/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settlementId }),
      });
      const body = (await response.json().catch(() => null)) as { data?: DisbursementRecord; message?: string } | null;
      if (!response.ok || !body?.data) {
        setRunFeedback({ tone: "error", message: body?.message ?? "Disbursement run failed." });
      } else {
        mergeRecord(body.data);
        setRunFeedback({ tone: "success", message: `Disbursement initiated for ${settlementId}.` });
      }
    } catch {
      setRunFeedback({ tone: "error", message: "Network error during disbursement run." });
    } finally {
      setRunBusy(false);
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
        data?: { processed: number; succeeded: number; failed: number; results: Array<{ result: DisbursementRecord | null }> };
        message?: string;
      } | null;
      if (!response.ok || !body?.data) {
        setRunFeedback({ tone: "error", message: body?.message ?? "Batch run failed." });
      } else {
        for (const row of body.data.results) {
          if (row.result) mergeRecord(row.result);
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

  async function handleRetry(settlementId: string, disbursementId: string) {
    setRetrying(disbursementId);
    setRetryFeedback(null);
    try {
      const response = await fetch(
        `/api/backend/financial-ops/disbursements/${encodeURIComponent(settlementId)}/retry`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) },
      );
      const body = (await response.json().catch(() => null)) as { data?: DisbursementRecord; message?: string } | null;
      if (!response.ok || !body?.data) {
        setRetryFeedback({ id: disbursementId, tone: "error", message: body?.message ?? "Retry failed." });
      } else {
        const updated = body.data;
        setRecords((prev) => prev.map((d) => (d.id === disbursementId ? updated : d)));
        setRetryFeedback({ id: disbursementId, tone: "success", message: `Retry initiated — status: ${updated.status}` });
      }
    } catch {
      setRetryFeedback({ id: disbursementId, tone: "error", message: "Network error during retry." });
    } finally {
      setRetrying(null);
    }
  }

  return (
    <section className="tm-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Disbursement Queue</h2>
        {total > 0 ? <span className="text-xs text-slate-500">{total} total</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className="tm-input min-w-[13rem] px-3 py-1.5 text-xs"
          placeholder="Settlement ID"
          value={runSettlementId}
          onChange={(event) => setRunSettlementId(event.target.value)}
        />
        <button
          className="rounded bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          onClick={() => void handleRunSingle()}
          disabled={runBusy || runBatchBusy}
          type="button"
        >
          {runBusy ? "Running…" : "Run Disbursement"}
        </button>
        <button
          className="rounded bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          onClick={() => void handleRunBatch()}
          disabled={runBatchBusy || runBusy}
          type="button"
        >
          {runBatchBusy ? "Running Batch…" : "Run Batch"}
        </button>
      </div>
      {runFeedback ? (
        <p className={`mt-2 text-xs ${runFeedback.tone === "success" ? "text-emerald-700" : "text-red-700"}`}>
          {runFeedback.message}
        </p>
      ) : null}
      {fetchError ? (
        <p className="mt-3 text-sm text-amber-700">{fetchError}</p>
      ) : records.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No disbursement records found.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">Settlement</th>
                <th className="pb-2 pr-4">Booking ref</th>
                <th className="pb-2 pr-4">Cancellation option</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Retries</th>
                <th className="pb-2 pr-4">Provider ref</th>
                <th className="pb-2 pr-4">Initiated</th>
                <th className="pb-2 pr-4">Confirmed</th>
                <th className="pb-2 pr-4 sr-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((d) => (
                <Fragment key={d.id}>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-mono text-xs">{d.settlementId.slice(0, 8)}…</td>
                    <td className="py-2 pr-4 font-mono text-xs">{d.bookingReference || "—"}</td>
                    <td className="py-2 pr-4 text-xs text-slate-700">
                      {d.cancellationOptionSelection
                        ? `${d.cancellationOptionSelection.label} (${d.cancellationOptionSelection.optionId})`
                        : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      {d.currency} {d.amount.toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[d.status] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-center text-xs text-slate-500">{d.retryCount}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-slate-500">{d.providerReference || "—"}</td>
                    <td className="py-2 pr-4 text-xs text-slate-500">
                      {d.initiatedAt ? d.initiatedAt.slice(0, 16).replace("T", " ") : "—"}
                    </td>
                    <td className="py-2 pr-4 text-xs text-slate-500">
                      {d.confirmedAt ? d.confirmedAt.slice(0, 16).replace("T", " ") : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      {RETRYABLE_STATUSES.includes(d.status) ? (
                        <button
                          className="rounded bg-slate-800 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                          disabled={retrying === d.id}
                          onClick={() => void handleRetry(d.settlementId, d.id)}
                          type="button"
                        >
                          {retrying === d.id ? "Retrying…" : "Retry"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                  {retryFeedback && retryFeedback.id === d.id ? (
                    <tr>
                      <td
                        className={`py-1 text-xs ${retryFeedback.tone === "success" ? "text-emerald-700" : "text-red-700"}`}
                        colSpan={10}
                      >
                        {retryFeedback.message}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
          {total > records.length ? (
            <p className="mt-2 text-xs text-slate-500">
              Showing {records.length} of {total} disbursements (page {page}/{totalPages}).
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
