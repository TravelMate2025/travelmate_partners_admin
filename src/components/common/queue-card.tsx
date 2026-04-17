import Link from "next/link";

import { StatusBadge } from "@/components/common/status-badge";

type QueueCardProps = {
  title: string;
  owner: string;
  backlog: number;
  urgent: number;
  href: string;
  summary: string;
  status: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
};

export function QueueCard({ title, owner, backlog, urgent, href, summary, status, tone }: QueueCardProps) {
  return (
    <article className="tm-queue-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="tm-label">{owner}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">{title}</h3>
        </div>
        <StatusBadge label={status} tone={tone} />
      </div>
      <p className="tm-muted mt-3 text-sm">{summary}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="tm-queue-metric">
          <p className="tm-label">Open</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{backlog}</p>
        </div>
        <div className="tm-queue-metric">
          <p className="tm-label">Urgent</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{urgent}</p>
        </div>
      </div>
      <Link className="tm-inline-link mt-5 inline-flex" href={href}>
        Open queue
      </Link>
    </article>
  );
}
