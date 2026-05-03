import type { AdminRole } from "@/modules/auth/types";
import type { ApiClientAction, ApiClientActionPayload, ApiClientRecord, ApiClientsPolicy } from "@/modules/api-clients/types";

const planRateLimitBounds = {
  starter: { min: 10, max: 120 },
  growth: { min: 60, max: 300 },
  enterprise: { min: 300, max: 1200 },
} as const;

export function getApiClientsPolicy(role: AdminRole): ApiClientsPolicy {
  if (role === "super_admin") {
    return {
      role,
      canApprove: true,
      canReject: true,
      canIssueKey: true,
      canRegenerateKey: true,
      canRevokeKey: true,
      canBlockClient: true,
      canRestoreClient: true,
      canUpdatePlan: true,
      summary: "Full API client governance access including approval, key lifecycle, plan, and blocking controls.",
    };
  }

  if (role === "operations") {
    return {
      role,
      canApprove: true,
      canReject: true,
      canIssueKey: true,
      canRegenerateKey: true,
      canRevokeKey: true,
      canBlockClient: true,
      canRestoreClient: true,
      canUpdatePlan: true,
      summary: "Operational API client access for application review, key lifecycle, and quota governance.",
    };
  }

  if (role === "support") {
    return {
      role,
      canApprove: false,
      canReject: false,
      canIssueKey: false,
      canRegenerateKey: false,
      canRevokeKey: true,
      canBlockClient: true,
      canRestoreClient: true,
      canUpdatePlan: false,
      summary: "Support can inspect client history and take containment actions like revoke or block.",
    };
  }

  return {
    role,
      canApprove: false,
      canReject: false,
      canIssueKey: false,
      canRegenerateKey: false,
      canRevokeKey: false,
      canBlockClient: false,
      canRestoreClient: false,
      canUpdatePlan: false,
    summary: "Read-only API client visibility for cross-functional context.",
  };
}

export function canApplyApiClientAction(role: AdminRole, record: ApiClientRecord, action: ApiClientAction) {
  const policy = getApiClientsPolicy(role);

  switch (action) {
    case "start_review":
      return policy.canApprove && record.status === "pending_review";
    case "approve_client":
      return policy.canApprove && record.status === "under_review";
    case "reject_client":
      return policy.canReject && record.status === "under_review";
    case "issue_key":
      return policy.canIssueKey && record.status === "approved" && record.keyStatus === "not_issued";
    case "regenerate_key":
      return policy.canRegenerateKey && record.status === "approved" && record.keyStatus !== "not_issued";
    case "revoke_key":
      return policy.canRevokeKey && record.keyStatus === "active";
    case "block_client":
      return policy.canBlockClient && record.status === "approved";
    case "restore_client":
      return policy.canRestoreClient && record.status === "blocked";
    case "update_plan":
      return policy.canUpdatePlan && record.status === "approved";
  }
}

export function isEligibleApiPlan(record: ApiClientRecord, plan: ApiClientRecord["plan"]) {
  return record.planEligibility.eligiblePlans.includes(plan);
}

export function validateApiRateLimit(plan: ApiClientRecord["plan"], rateLimitPerMinute: number) {
  if (!Number.isFinite(rateLimitPerMinute) || !Number.isInteger(rateLimitPerMinute)) {
    return `Rate limit must be a whole number for the ${plan} plan.`;
  }

  const bounds = planRateLimitBounds[plan];
  if (rateLimitPerMinute < bounds.min || rateLimitPerMinute > bounds.max) {
    return `Rate limit for the ${plan} plan must stay between ${bounds.min} and ${bounds.max} requests per minute.`;
  }

  return null;
}

export function validateApiClientActionPayload(payload: ApiClientActionPayload) {
  if ((payload.action === "start_review" || payload.action === "approve_client" || payload.action === "reject_client") && payload.note.trim().length < 12) {
    return "Add a clear review note (minimum 12 characters) before review decisions.";
  }
  if ((payload.action === "approve_client" || payload.action === "update_plan") && payload.policyScopes.length === 0) {
    return "Select at least one policy scope.";
  }
  if ((payload.action === "approve_client" || payload.action === "update_plan") && payload.policyProducts.length === 0) {
    return "Select at least one product lane.";
  }
  if (["regenerate_key", "revoke_key", "block_client", "restore_client"].includes(payload.action) && payload.reasonCode.trim().length < 3) {
    return "Select a reason code for this action.";
  }
  return null;
}
