import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import type { VerificationCase } from "@/modules/verification-review/types";

function toneForRisk(risk: VerificationCase["riskLevel"]) {
  if (risk === "high") return "danger" as const;
  if (risk === "medium") return "warning" as const;
  return "success" as const;
}

function toneForVerification(status: VerificationCase["verificationStatus"]) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  if (status === "in_review") return "info" as const;
  return "warning" as const;
}

function toneForLifecycle(state: VerificationCase["lifecycleState"]) {
  if (state === "verified") return "success" as const;
  if (state === "suspended" || state === "rejected") return "danger" as const;
  return "neutral" as const;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function VerificationQueuePanel({
  cases,
  selectedId,
  onSelect,
  emptyTitle,
  emptyDescription,
  onResetFilters,
}: {
  cases: VerificationCase[];
  selectedId: string;
  onSelect: (caseId: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onResetFilters?: () => void;
}) {
  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="tm-kicker">Verification Queue</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Review cases</h2>
        </div>
        <StatusBadge label={`${cases.length} active cases`} tone="info" />
      </div>
      <div className="mt-5 grid gap-4">
        {cases.length > 0 ? (
          cases.map((item) => (
            <button
              className={`tm-review-listing ${item.id === selectedId ? "tm-review-listing-active" : ""}`}
              key={item.id}
              onClick={() => onSelect(item.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{item.partnerName}</p>
                  <p className="tm-muted mt-1 text-sm">{item.businessName}</p>
                </div>
                <StatusBadge label={item.riskLevel} tone={toneForRisk(item.riskLevel)} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge label={item.verificationStatus} tone={toneForVerification(item.verificationStatus)} />
                <StatusBadge label={item.lifecycleState} tone={toneForLifecycle(item.lifecycleState)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge
                  label={
                    item.reviewSignals.flaggedDocumentCount > 0
                      ? `${item.reviewSignals.flaggedDocumentCount} flagged doc${item.reviewSignals.flaggedDocumentCount > 1 ? "s" : ""}`
                      : "docs clear"
                  }
                  tone={item.reviewSignals.flaggedDocumentCount > 0 ? "warning" : "success"}
                />
                <StatusBadge
                  label={item.reviewSignals.needsMoreInfo ? "evidence follow-up" : "evidence complete"}
                  tone={item.reviewSignals.needsMoreInfo ? "warning" : "info"}
                />
              </div>
              <p className="tm-muted mt-3 text-sm">Submitted {formatTimestamp(item.submittedAt)}</p>
              <p className="tm-muted mt-2 text-sm">Latest review event: {item.reviewSignals.latestActionLabel}</p>
            </button>
          ))
        ) : (
          <SurfaceState
            actionLabel={onResetFilters ? "Reset queue" : undefined}
            description={emptyDescription}
            onAction={onResetFilters}
            title={emptyTitle}
            tone="empty"
          />
        )}
      </div>
    </article>
  );
}
