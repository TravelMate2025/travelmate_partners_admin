"use client";

import type { DisbursementListResult } from "@/modules/financial-ops/types";

export function DisbursementQueueClient({
  data,
  error,
}: {
  data: DisbursementListResult | null;
  error?: string | null;
}) {
  const total = data?.total ?? 0;

  return (
    <section className="tm-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Disbursement</h2>
        {total > 0 ? <span className="text-xs text-slate-500">{total} available</span> : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Disbursement now happens in the dedicated review screen, so this page stays focused on the broader finance
        overview.
      </p>
      {error ? <p className="mt-3 text-xs text-amber-700">{error}</p> : null}
      <div className="mt-4">
          <a className="tm-btn tm-btn-outline" href="/financial-ops/disbursements">
            Open disbursement review
          </a>
      </div>
    </section>
  );
}
