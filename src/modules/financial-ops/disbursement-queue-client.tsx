"use client";

import { useState } from "react";

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
                <>
                  <tr className="border-b border-slate-100" key={d.id}>
                    <td className="py-2 pr-4 font-mono text-xs">{d.settlementId.slice(0, 8)}…</td>
                    <td className="py-2 pr-4 font-mono text-xs">{d.bookingReference || "—"}</td>
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
                    <tr key={`${d.id}-feedback`}>
                      <td
                        className={`py-1 text-xs ${retryFeedback.tone === "success" ? "text-emerald-700" : "text-red-700"}`}
                        colSpan={9}
                      >
                        {retryFeedback.message}
                      </td>
                    </tr>
                  ) : null}
                </>
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
