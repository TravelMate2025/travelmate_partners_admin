import Link from "next/link";

import { StatusBadge } from "@/components/common/status-badge";

type StatCardProps = {
  label: string;
  value: string;
  note: string;
  accent: string;
  badge?: {
    label: string;
    tone?: "neutral" | "info" | "warning" | "success" | "danger";
  };
  href?: string;
};

export function StatCard({ label, value, note, accent, badge, href }: StatCardProps) {
  const card = (
    <article className="tm-stat-card">
      <div className="tm-stat-card-bar" style={{ background: accent }} />
      <div className="tm-stat-card-body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="tm-label">{label}</p>
            <p className="tm-stat-value">{value}</p>
          </div>
          {badge ? <StatusBadge label={badge.label} tone={badge.tone} /> : null}
        </div>
        <p className="tm-muted mt-3 text-sm">{note}</p>
        {href ? (
          <span className="tm-inline-link mt-4 inline-flex">
            Open metric
          </span>
        ) : null}
      </div>
    </article>
  );

  return href ? <Link aria-label={`Open ${label} metric`} href={href}>{card}</Link> : card;
}
