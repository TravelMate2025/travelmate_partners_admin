import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import type { ApiClientAction, ApiClientRecord, ApiPlan } from "@/modules/api-clients/types";

type GovernanceAction = Exclude<ApiClientAction, never>;

export function ApiClientsDetailPanel({
  selectedRecord,
  note,
  plan,
  rateLimitPerMinute,
  pendingAction,
  feedback,
  allowedActions,
  policySummary,
  onNoteChange,
  onPlanChange,
  onRateLimitChange,
  onAction,
  onResetSelection,
}: {
  selectedRecord: ApiClientRecord | null;
  note: string;
  plan: ApiPlan;
  rateLimitPerMinute: number;
  pendingAction: GovernanceAction | null;
  feedback: { tone: "success" | "error"; message: string } | null;
  allowedActions: Record<GovernanceAction, boolean> | null;
  policySummary: string;
  onNoteChange: (value: string) => void;
  onPlanChange: (value: ApiPlan) => void;
  onRateLimitChange: (value: number) => void;
  onAction: (action: GovernanceAction) => void;
  onResetSelection: () => void;
}) {
  if (!selectedRecord) {
    return (
      <article className="tm-panel">
        <SurfaceState
          actionLabel="Reset API client selection"
          description="The selected API client is no longer available in the current queue snapshot."
          onAction={onResetSelection}
          title="Selected API client was not found"
          tone="exception"
        />
      </article>
    );
  }

  return (
    <article className="tm-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tm-kicker">Client Detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedRecord.companyName}</h2>
          <p className="tm-muted mt-2 text-sm">
            {selectedRecord.applicantName} · {selectedRecord.email} · {selectedRecord.region}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={selectedRecord.status} tone="info" />
          <StatusBadge label={selectedRecord.keyStatus} tone="neutral" />
          <StatusBadge label={selectedRecord.plan} tone="success" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="tm-soft-band">
          <p className="tm-label">Application context</p>
          <p className="mt-3 text-sm text-slate-900">{selectedRecord.useCase}</p>
          <ul className="tm-bullet-list mt-4">
            <li>Requested rate limit: {selectedRecord.requestedRateLimitPerMinute}/min</li>
            <li>Monthly requests: {selectedRecord.usage.monthlyRequests.toLocaleString()}</li>
            <li>Error rate: {selectedRecord.usage.errorRatePercent}%</li>
            <li>Last active: {selectedRecord.usage.lastActiveAt}</li>
          </ul>
          <div className="tm-document-meta mt-4">
            <span className="tm-label">Plan eligibility</span>
            <p className="mt-2 text-sm text-slate-900">
              Recommended: {selectedRecord.planEligibility.recommendedPlan}
            </p>
            <p className="tm-muted mt-2 text-sm">{selectedRecord.planEligibility.rationale}</p>
            <p className="tm-muted mt-2 text-sm">
              Eligible plans: {selectedRecord.planEligibility.eligiblePlans.join(", ")}
            </p>
          </div>
        </div>
        <div className="tm-soft-band">
          <p className="tm-label">Plan and quota</p>
          <label className="block mt-4">
            <span className="tm-label">Assigned plan</span>
            <select className="tm-input mt-3" onChange={(event) => onPlanChange(event.target.value as ApiPlan)} value={plan}>
              <option disabled={!selectedRecord.planEligibility.eligiblePlans.includes("starter")} value="starter">
                starter
              </option>
              <option disabled={!selectedRecord.planEligibility.eligiblePlans.includes("growth")} value="growth">
                growth
              </option>
              <option disabled={!selectedRecord.planEligibility.eligiblePlans.includes("enterprise")} value="enterprise">
                enterprise
              </option>
            </select>
          </label>
          <label className="block mt-4">
            <span className="tm-label">Rate limit per minute</span>
            <input
              className="tm-input mt-3"
              min={plan === "starter" ? 10 : plan === "growth" ? 60 : 300}
              max={plan === "starter" ? 120 : plan === "growth" ? 300 : 1200}
              onChange={(event) => onRateLimitChange(Number(event.target.value))}
              type="number"
              value={rateLimitPerMinute}
            />
          </label>
        </div>
      </div>

      <div className="tm-soft-band mt-5">
        <p className="tm-label">Governance action</p>
        <p className="tm-muted mt-2 text-sm">{policySummary}</p>
        <label className="block mt-4">
          <span className="tm-label">Operational note</span>
          <textarea
            className="tm-textarea mt-3"
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Capture approval context, rejection reason, quota decision, or containment note..."
            value={note}
          />
        </label>
        {selectedRecord.latestAuditRecord ? (
          <div className="tm-alert tm-alert-success mt-4">
            Audit prep: {selectedRecord.latestAuditRecord.summary} Event is{" "}
            {selectedRecord.latestAuditRecord.status.replaceAll("_", " ")}.
          </div>
        ) : null}
        {feedback ? <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>{feedback.message}</div> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="tm-btn tm-btn-primary" disabled={pendingAction !== null || !allowedActions?.approve_client} onClick={() => onAction("approve_client")} type="button">
            {pendingAction === "approve_client" ? "Approving..." : "Approve client"}
          </button>
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.reject_client} onClick={() => onAction("reject_client")} type="button">
            {pendingAction === "reject_client" ? "Rejecting..." : "Reject client"}
          </button>
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.issue_key} onClick={() => onAction("issue_key")} type="button">
            {pendingAction === "issue_key" ? "Issuing..." : "Issue key"}
          </button>
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.regenerate_key} onClick={() => onAction("regenerate_key")} type="button">
            {pendingAction === "regenerate_key" ? "Regenerating..." : "Regenerate key"}
          </button>
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.revoke_key} onClick={() => onAction("revoke_key")} type="button">
            {pendingAction === "revoke_key" ? "Revoking..." : "Revoke key"}
          </button>
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.update_plan} onClick={() => onAction("update_plan")} type="button">
            {pendingAction === "update_plan" ? "Updating..." : "Update plan"}
          </button>
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.block_client} onClick={() => onAction("block_client")} type="button">
            {pendingAction === "block_client" ? "Blocking..." : "Block client"}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <p className="tm-kicker">Client history</p>
        <div className="mt-4 grid gap-3">
          {selectedRecord.history.map((entry) => (
            <article className="tm-soft-band" key={entry.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{entry.action}</p>
                  <p className="tm-muted mt-1 text-sm">{entry.note}</p>
                </div>
                <StatusBadge label={entry.timestamp} tone="neutral" />
              </div>
              <p className="tm-muted mt-2 text-sm">{entry.actor}</p>
            </article>
          ))}
        </div>
      </div>
    </article>
  );
}
