type Tone = "neutral" | "info" | "warning" | "success" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "tm-badge-neutral",
  info: "tm-badge-info",
  warning: "tm-badge-warning",
  success: "tm-badge-success",
  danger: "tm-badge-danger",
};

type StatusBadgeProps = {
  label: string;
  tone?: Tone;
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return <span className={`tm-status-badge ${toneClasses[tone]}`}>{label}</span>;
}
