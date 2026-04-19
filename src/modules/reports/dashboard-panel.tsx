import { StatCard } from "@/components/common/stat-card";
import type { ReportSnapshot } from "@/modules/reports/types";
import { formatReportMetric } from "@/modules/reports/rules";

export function ReportsDashboardPanel({ snapshot }: { snapshot: ReportSnapshot }) {
  return (
    <article className="tm-panel">
      <div>
        <p className="tm-kicker">Reports & Analytics</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">{snapshot.title}</h2>
        <p className="tm-muted mt-2 text-sm">{snapshot.subtitle}</p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-5">
        {snapshot.metrics.map((metric) => (
          <StatCard
            accent={metric.accent}
            badge={metric.badge}
            key={metric.key}
            label={metric.label}
            note={metric.note}
            value={formatReportMetric(metric)}
          />
        ))}
      </div>
    </article>
  );
}
