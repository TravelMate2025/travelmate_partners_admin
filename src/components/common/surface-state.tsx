type SurfaceStateTone = "loading" | "empty" | "error" | "exception";

const toneConfig: Record<
  SurfaceStateTone,
  { badge: string; title: string; description: string; alertClass: string }
> = {
  loading: {
    badge: "Loading",
    title: "Preparing workspace",
    description: "The surface is getting the next operational snapshot ready.",
    alertClass: "tm-alert tm-alert-info",
  },
  empty: {
    badge: "Empty",
    title: "Nothing to review yet",
    description: "This queue is clear right now, so there is nothing active to work from.",
    alertClass: "tm-alert tm-alert-info",
  },
  error: {
    badge: "Error",
    title: "We could not load this surface",
    description: "Try again or refresh the route once the issue is resolved.",
    alertClass: "tm-alert tm-alert-danger",
  },
  exception: {
    badge: "Exception",
    title: "This view fell out of sync",
    description: "Reset the current selection to get back to a valid admin state.",
    alertClass: "tm-alert tm-alert-danger",
  },
};

export function SurfaceState({
  tone,
  title,
  description,
  actionLabel,
  onAction,
}: {
  tone: SurfaceStateTone;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const config = toneConfig[tone];

  return (
    <div className="tm-surface-state">
      <span className="tm-state-pill">{config.badge}</span>
      <h3 className="mt-4 text-2xl font-semibold text-slate-950">{title ?? config.title}</h3>
      <p className="tm-muted mt-3 text-sm">{description ?? config.description}</p>
      <div className={`${config.alertClass} mt-5`}>
        {tone === "loading"
          ? "State support is explicit here so the workspace can handle async Django wiring cleanly."
          : "This state is handled intentionally instead of silently collapsing the interface."}
      </div>
      {actionLabel && onAction ? (
        <button className="tm-btn tm-btn-outline mt-5" onClick={onAction} type="button">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
