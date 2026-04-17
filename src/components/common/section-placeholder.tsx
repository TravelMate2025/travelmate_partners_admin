import Link from "next/link";

import { FilterBar } from "@/components/common/filter-bar";
import { StatusBadge } from "@/components/common/status-badge";

type SectionPlaceholderProps = {
  title: string;
  description: string;
  stage: string;
  primaryAction: string;
  supportingNote: string;
};

export function SectionPlaceholder({
  title,
  description,
  stage,
  primaryAction,
  supportingNote,
}: SectionPlaceholderProps) {
  return (
    <section className="tm-section-stack">
      <div className="tm-panel tm-panel-hero p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="tm-kicker">Flow 2.0 Scaffold</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{title}</h1>
            <p className="tm-muted mt-3 max-w-2xl text-sm">{description}</p>
          </div>
          <StatusBadge label={stage} tone="info" />
        </div>
        <div className="mt-5">
          <FilterBar filters={["Priority queue", "Needs decision", "Awaiting owner", "Escalated"]} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="tm-panel p-6">
          <h2 className="text-lg font-semibold text-slate-950">Shell Readiness</h2>
          <ul className="tm-bullet-list mt-4">
            <li>Route scaffold is live inside the shared admin shell.</li>
            <li>Table, filter, alert, and drawer primitives are available for this module.</li>
            <li>This placeholder will be replaced by a module-specific workflow in later phases.</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="tm-btn tm-btn-primary" type="button">
              {primaryAction}
            </button>
            <Link className="tm-btn tm-btn-outline" href="/">
              Return to Overview
            </Link>
          </div>
        </article>

        <article className="tm-panel p-6">
          <h2 className="text-lg font-semibold text-slate-950">Back-Office Note</h2>
          <p className="tm-muted mt-3 text-sm">{supportingNote}</p>
          <div className="tm-soft-band mt-5">
            <p className="tm-label">Design Principle</p>
            <p className="mt-2 text-sm text-slate-900">
              Every admin module should inherit the same shell language: dense but calm, data-rich,
              auditable, and fast to scan.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
