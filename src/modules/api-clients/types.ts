import type { AdminRole } from "@/modules/auth/types";

export type ApiClientStatus = "pending_review" | "under_review" | "approved" | "rejected" | "blocked";
export type ApiPlan = "starter" | "growth" | "enterprise";
export type ApiKeyStatus = "not_issued" | "active" | "revoked";
export type ApiRiskLevel = "low" | "medium" | "high";
export type ApiPolicyEnvironment = "sandbox" | "production";
export type ApiPolicyTier = "standard" | "elevated" | "strategic";
export type ApiPolicyAlertProfile = "balanced" | "strict" | "critical_only";
export type ApiPolicyScope =
  | "inventory.read"
  | "pricing.read"
  | "bookings.read"
  | "bookings.write"
  | "payments.read"
  | "payments.write";
export type ApiPolicyProduct = "stays" | "transfers";
export type ApiClientAction =
  | "start_review"
  | "approve_client"
  | "reject_client"
  | "issue_key"
  | "regenerate_key"
  | "revoke_key"
  | "block_client"
  | "restore_client"
  | "update_plan";

export type ApiClientUsage = {
  monthlyRequests: number;
  rateLimitPerMinute: number;
  errorRatePercent: number;
  lastActiveAt: string;
};

export type ApiClientHistoryEntry = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  note: string;
};

export type ApiClientAuditRecord = {
  eventId: string;
  actor: string;
  clientId: string;
  action: ApiClientAction;
  summary: string;
  status: "recorded" | "queued_for_backend";
};

export type ApiPlanEligibility = {
  recommendedPlan: ApiPlan;
  eligiblePlans: ApiPlan[];
  rationale: string;
};

export type ApiClientRecord = {
  id: string;
  companyName: string;
  applicantName: string;
  email: string;
  useCase: string;
  region: string;
  status: ApiClientStatus;
  plan: ApiPlan;
  keyStatus: ApiKeyStatus;
  riskLevel: ApiRiskLevel;
  submittedAt: string;
  approvedAt?: string;
  usage: ApiClientUsage;
  requestedRateLimitPerMinute: number;
  policy: {
    environment: ApiPolicyEnvironment;
    tier: ApiPolicyTier;
    scopes: ApiPolicyScope[];
    products: ApiPolicyProduct[];
    alertProfile: ApiPolicyAlertProfile;
  };
  credentialMetadata?: {
    keyId: string | null;
    secretFingerprint: string | null;
    issuedAt: string | null;
    rotatedAt: string | null;
    revokedAt: string | null;
    revealConsumedAt: string | null;
    revealExpiresAt: string | null;
    revealAvailable: boolean;
  };
  limitState?: {
    isOverLimit: boolean;
    retryAfterSeconds: number;
    warning: string;
  };
  pendingPolicyChange?: {
    effectiveAt: string | null;
    plan: ApiPlan | null;
    rateLimitPerMinute: number | null;
  };
  planEligibility: ApiPlanEligibility;
  isResubmissionPending?: boolean;
  note: string;
  history: ApiClientHistoryEntry[];
  latestAuditRecord?: ApiClientAuditRecord;
};

export type ApiClientFilterState = {
  query: string;
  status: ApiClientStatus | "all";
  plan: ApiPlan | "all";
  risk: ApiRiskLevel | "all";
};

export type ApiClientActionPayload = {
  actor: string;
  clientId: string;
  action: ApiClientAction;
  note: string;
  plan: ApiPlan;
  rateLimitPerMinute: number;
  policyEnvironment: ApiPolicyEnvironment;
  policyTier: ApiPolicyTier;
  policyScopes: ApiPolicyScope[];
  policyProducts: ApiPolicyProduct[];
  policyAlertProfile: ApiPolicyAlertProfile;
  reasonCode: string;
  effectiveAt?: string;
};

export type ApiClientActionResult = {
  records: ApiClientRecord[];
  updatedRecord: ApiClientRecord;
  auditRecord: ApiClientAuditRecord;
};

export type ApiClientsPolicy = {
  role: AdminRole;
  canApprove: boolean;
  canReject: boolean;
  canIssueKey: boolean;
  canRegenerateKey: boolean;
  canRevokeKey: boolean;
  canBlockClient: boolean;
  canRestoreClient: boolean;
  canUpdatePlan: boolean;
  summary: string;
};

export type ApiClientsSurfaceState =
  | {
      status: "loading" | "error" | "exception";
      title?: string;
      description?: string;
    }
  | undefined;
