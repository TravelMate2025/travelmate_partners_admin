import { StatusBadge } from "@/components/common/status-badge";
import { SurfaceState } from "@/components/common/surface-state";
import type {
  ApiClientAction,
  ApiClientRecord,
  ApiPlan,
  ApiPolicyAlertProfile,
  ApiPolicyEnvironment,
  ApiPolicyScope,
  ApiPolicyProduct,
  ApiPolicyTier,
} from "@/modules/api-clients/types";

type GovernanceAction = Exclude<ApiClientAction, never>;

export function ApiClientsDetailPanel({
  selectedRecord,
  note,
  plan,
  rateLimitPerMinute,
  policyEnvironment,
  policyTier,
  policyScopes,
  policyProducts,
  policyAlertProfile,
  reasonCode,
  effectiveAt,
  pendingAction,
  feedback,
  allowedActions,
  policySummary,
  onNoteChange,
  onPlanChange,
  onRateLimitChange,
  onPolicyEnvironmentChange,
  onPolicyTierChange,
  onPolicyScopesChange,
  onPolicyProductsChange,
  onPolicyAlertProfileChange,
  onReasonCodeChange,
  onEffectiveAtChange,
  onAction,
  onResetSelection,
}: {
  selectedRecord: ApiClientRecord | null;
  note: string;
  plan: ApiPlan;
  rateLimitPerMinute: number;
  policyEnvironment: ApiPolicyEnvironment;
  policyTier: ApiPolicyTier;
  policyScopes: ApiPolicyScope[];
  policyProducts: ApiPolicyProduct[];
  policyAlertProfile: ApiPolicyAlertProfile;
  reasonCode: string;
  effectiveAt: string;
  pendingAction: GovernanceAction | null;
  feedback: { tone: "success" | "error"; message: string } | null;
  allowedActions: Record<GovernanceAction, boolean> | null;
  policySummary: string;
  onNoteChange: (value: string) => void;
  onPlanChange: (value: ApiPlan) => void;
  onRateLimitChange: (value: number) => void;
  onPolicyEnvironmentChange: (value: ApiPolicyEnvironment) => void;
  onPolicyTierChange: (value: ApiPolicyTier) => void;
  onPolicyScopesChange: (value: ApiPolicyScope[]) => void;
  onPolicyProductsChange: (value: ApiPolicyProduct[]) => void;
  onPolicyAlertProfileChange: (value: ApiPolicyAlertProfile) => void;
  onReasonCodeChange: (value: string) => void;
  onEffectiveAtChange: (value: string) => void;
  onAction: (action: GovernanceAction) => void;
  onResetSelection: () => void;
}) {
  if (!selectedRecord) {
    return (
      <article className="tm-panel min-w-0 h-fit">
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

  const actionHint =
    selectedRecord.status === "pending_review"
      ? "This application must be moved to under_review before it can be approved."
      : selectedRecord.status === "under_review"
        ? "Approve or reject is available once your review note and policy inputs are set."
        : selectedRecord.status === "approved"
          ? "This client is already approved. Use key lifecycle, plan update, or suspension actions if needed."
          : selectedRecord.status === "rejected"
            ? "Rejected applications cannot be approved directly until resubmitted."
            : "Blocked applications must be restored before approval actions are available.";
  const approveUnavailableReason = !allowedActions?.approve_client
    ? selectedRecord.status === "pending_review"
      ? "Approve is unavailable: click Start review first."
      : selectedRecord.status === "rejected"
        ? "Approve is unavailable for rejected applications until resubmitted."
        : selectedRecord.status === "blocked"
          ? "Approve is unavailable for blocked applications. Restore first."
          : "Approve is currently unavailable for this application state."
    : null;

  return (
    <article className="tm-panel min-w-0 h-fit">
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
          {selectedRecord.isResubmissionPending ? <StatusBadge label="Re-submission pending" tone="warning" /> : null}
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
            <li>Key id: {selectedRecord.credentialMetadata?.keyId ?? "Not issued"}</li>
            <li>Key fingerprint: {selectedRecord.credentialMetadata?.secretFingerprint ?? "Not available"}</li>
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
            <p className="tm-muted mt-2 text-xs">
              Plan controls allowed rate range: starter (10-120/min), growth (60-300/min), enterprise (300-1200/min).
            </p>
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
            <p className="tm-muted mt-2 text-xs">
              This is the enforced cap for this client within the selected plan range.
            </p>
          </label>
          <label className="block mt-4">
            <span className="tm-label">Policy environment</span>
            <select className="tm-input mt-3" onChange={(event) => onPolicyEnvironmentChange(event.target.value as ApiPolicyEnvironment)} value={policyEnvironment}>
              <option value="sandbox">sandbox</option>
              <option value="production">production</option>
            </select>
          </label>
          <label className="block mt-4">
            <span className="tm-label">Policy tier</span>
            <select className="tm-input mt-3" onChange={(event) => onPolicyTierChange(event.target.value as ApiPolicyTier)} value={policyTier}>
              <option value="standard">standard</option>
              <option value="elevated">elevated</option>
              <option value="strategic">strategic</option>
            </select>
            <p className="tm-muted mt-2 text-xs">
              Tier sets operational trust/risk posture used for governance, review priority, and handling playbooks.
            </p>
          </label>
          <label className="block mt-4">
            <span className="tm-label">Policy alert profile</span>
            <select className="tm-input mt-3" onChange={(event) => onPolicyAlertProfileChange(event.target.value as ApiPolicyAlertProfile)} value={policyAlertProfile}>
              <option value="balanced">balanced</option>
              <option value="strict">strict</option>
              <option value="critical_only">critical_only</option>
            </select>
            <p className="tm-muted mt-2 text-xs">
              balanced = standard sensitivity, strict = earlier/more frequent alerts, critical_only = severe alerts only.
            </p>
          </label>
          <label className="block mt-4">
            <span className="tm-label">Policy scopes</span>
            <div className="mt-3 grid gap-2">
              {(["inventory.read", "pricing.read", "bookings.read", "bookings.write", "payments.read", "payments.write", "reviews.write"] as ApiPolicyScope[]).map((scope) => (
                <label className="inline-flex items-center gap-2 text-sm text-slate-800" key={scope}>
                  <input
                    checked={policyScopes.includes(scope)}
                    onChange={(event) =>
                      onPolicyScopesChange(
                        event.target.checked
                          ? [...policyScopes, scope]
                          : policyScopes.filter((item) => item !== scope),
                      )
                    }
                    type="checkbox"
                  />
                  {scope}
                </label>
              ))}
            </div>
          </label>
          <label className="block mt-4">
            <span className="tm-label">Authorized products</span>
            <div className="mt-3 grid gap-2">
              {(["stays", "transfers"] as ApiPolicyProduct[]).map((product) => (
                <label className="inline-flex items-center gap-2 text-sm text-slate-800" key={product}>
                  <input
                    checked={policyProducts.includes(product)}
                    onChange={(event) =>
                      onPolicyProductsChange(
                        event.target.checked
                          ? [...policyProducts, product]
                          : policyProducts.filter((item) => item !== product),
                      )
                    }
                    type="checkbox"
                  />
                  {product}
                </label>
              ))}
            </div>
          </label>
        </div>
      </div>

      <div className="tm-soft-band mt-5">
        <p className="tm-label">Governance action</p>
        <p className="tm-muted mt-2 text-sm">{policySummary}</p>
        <p className="tm-muted mt-2 text-xs">{actionHint}</p>
        <label className="block mt-4">
          <span className="tm-label">Operational note</span>
          <textarea
            className="tm-textarea mt-3"
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Capture approval context, rejection reason, quota decision, or containment note..."
            value={note}
          />
        </label>
        <label className="block mt-4">
          <span className="tm-label">Reason code (key/security actions)</span>
          <select className="tm-input mt-3" onChange={(event) => onReasonCodeChange(event.target.value)} value={reasonCode}>
            <option value="credential_rotation">credential_rotation</option>
            <option value="security_compromise">security_compromise</option>
            <option value="suspected_abuse">suspected_abuse</option>
            <option value="policy_violation">policy_violation</option>
            <option value="false_positive">false_positive</option>
            <option value="remediation_confirmed">remediation_confirmed</option>
            <option value="ops_maintenance">ops_maintenance</option>
          </select>
        </label>
        <label className="block mt-4">
          <span className="tm-label">Effective at (optional, for scheduled plan updates)</span>
          <input className="tm-input mt-3" type="datetime-local" value={effectiveAt} onChange={(event) => onEffectiveAtChange(event.target.value)} />
        </label>
        {selectedRecord.latestAuditRecord ? (
          <div className="tm-alert tm-alert-success mt-4">
            Audit prep: {selectedRecord.latestAuditRecord.summary} Event is{" "}
            {selectedRecord.latestAuditRecord.status.replaceAll("_", " ")}.
          </div>
        ) : null}
        {feedback ? <div className={`mt-4 tm-alert ${feedback.tone === "error" ? "tm-alert-danger" : "tm-alert-success"}`}>{feedback.message}</div> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.start_review} onClick={() => onAction("start_review")} type="button">
            {pendingAction === "start_review" ? "Starting..." : "Start review"}
          </button>
          <button
            className="tm-btn tm-btn-primary"
            disabled={pendingAction !== null || !allowedActions?.approve_client}
            onClick={() => onAction("approve_client")}
            title={approveUnavailableReason ?? undefined}
            type="button"
          >
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
            {pendingAction === "block_client" ? "Suspending..." : "Suspend client"}
          </button>
          <button className="tm-btn tm-btn-outline" disabled={pendingAction !== null || !allowedActions?.restore_client} onClick={() => onAction("restore_client")} type="button">
            {pendingAction === "restore_client" ? "Restoring..." : "Restore client"}
          </button>
        </div>
        {approveUnavailableReason ? <p className="tm-muted mt-3 text-xs">{approveUnavailableReason}</p> : null}
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
