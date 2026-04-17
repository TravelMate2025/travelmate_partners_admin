import Link from "next/link";

import { StatusBadge } from "@/components/common/status-badge";

type AlertBannerProps = {
  title: string;
  detail: string;
  href: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
};

export function AlertBanner({ title, detail, href, tone }: AlertBannerProps) {
  return (
    <article className="tm-alert-banner">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="tm-muted mt-2 text-sm">{detail}</p>
        </div>
        <StatusBadge label="Alert" tone={tone} />
      </div>
      <Link className="tm-inline-link mt-4 inline-flex" href={href}>
        Investigate
      </Link>
    </article>
  );
}
