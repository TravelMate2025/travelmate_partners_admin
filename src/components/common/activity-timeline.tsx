import { StatusBadge } from "@/components/common/status-badge";

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
};

type ActivityTimelineProps = {
  items: ActivityItem[];
};

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <ol className="tm-timeline">
      {items.map((item) => (
        <li className="tm-timeline-item" key={item.id}>
          <div className="tm-timeline-dot" />
          <div className="tm-timeline-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                <p className="tm-muted mt-1 text-sm">{item.detail}</p>
              </div>
              <StatusBadge label={item.time} tone={item.tone} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
