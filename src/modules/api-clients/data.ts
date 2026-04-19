import type { ApiClientRecord } from "@/modules/api-clients/types";

export const apiClientSeed: ApiClientRecord[] = [
  {
    id: "api-client-001",
    companyName: "VoyageStack Labs",
    applicantName: "Tunde Afolabi",
    email: "api@voyagestack.test",
    useCase: "Pull partner inventory into an enterprise travel procurement dashboard.",
    region: "Nigeria",
    status: "pending_review",
    plan: "growth",
    keyStatus: "not_issued",
    riskLevel: "medium",
    submittedAt: "2026-04-17T08:15:00.000Z",
    usage: {
      monthlyRequests: 0,
      rateLimitPerMinute: 120,
      errorRatePercent: 0,
      lastActiveAt: "Not active yet",
    },
    requestedRateLimitPerMinute: 180,
    planEligibility: {
      recommendedPlan: "growth",
      eligiblePlans: ["starter", "growth"],
      rationale: "Use case and projected procurement search volume fit the growth tier; enterprise is not yet required.",
    },
    note: "Applicant requests elevated rate limits for internal procurement search aggregation.",
    history: [
      {
        id: "api-client-history-1",
        actor: "System",
        action: "API application submitted",
        timestamp: "2026-04-17 08:15 UTC",
        note: "New business API access request entered the review queue.",
      },
    ],
  },
  {
    id: "api-client-002",
    companyName: "RouteFlow Integrations",
    applicantName: "Ama Mensah",
    email: "platform@routeflow.test",
    useCase: "Approved transfer and stay sync for managed enterprise travel packages.",
    region: "Ghana",
    status: "approved",
    plan: "starter",
    keyStatus: "not_issued",
    riskLevel: "low",
    submittedAt: "2026-04-15T10:20:00.000Z",
    approvedAt: "2026-04-16T09:10:00.000Z",
    usage: {
      monthlyRequests: 0,
      rateLimitPerMinute: 60,
      errorRatePercent: 0,
      lastActiveAt: "Not active yet",
    },
    requestedRateLimitPerMinute: 60,
    planEligibility: {
      recommendedPlan: "starter",
      eligiblePlans: ["starter", "growth"],
      rationale: "Current sync scope fits starter, with growth permitted if downstream partner volume expands.",
    },
    note: "Approval complete. Issue first production key after plan confirmation.",
    history: [
      {
        id: "api-client-history-2",
        actor: "Operations Admin",
        action: "Client approved",
        timestamp: "2026-04-16 09:10 UTC",
        note: "Application approved for starter plan and initial production access.",
      },
    ],
  },
  {
    id: "api-client-003",
    companyName: "SkyPath Consolidators",
    applicantName: "Maya Kapoor",
    email: "ops@skypath.test",
    useCase: "High-volume itinerary enrichment and partner-content retrieval for a reseller platform.",
    region: "Kenya",
    status: "approved",
    plan: "enterprise",
    keyStatus: "active",
    riskLevel: "high",
    submittedAt: "2026-04-10T11:40:00.000Z",
    approvedAt: "2026-04-11T13:30:00.000Z",
    usage: {
      monthlyRequests: 184200,
      rateLimitPerMinute: 900,
      errorRatePercent: 3.4,
      lastActiveAt: "2026-04-18T08:05:00.000Z",
    },
    requestedRateLimitPerMinute: 900,
    planEligibility: {
      recommendedPlan: "enterprise",
      eligiblePlans: ["enterprise"],
      rationale: "Signed reseller agreement and sustained request volume require enterprise quota and dedicated oversight.",
    },
    note: "Usage spike requires close monitoring after recent error-rate increase.",
    history: [
      {
        id: "api-client-history-3",
        actor: "Operations Admin",
        action: "Enterprise plan assigned",
        timestamp: "2026-04-11 13:30 UTC",
        note: "Approved for enterprise quota based on signed reseller agreement.",
      },
      {
        id: "api-client-history-4",
        actor: "System",
        action: "Key issued",
        timestamp: "2026-04-11 14:00 UTC",
        note: "Production key generated and delivered via secure workflow.",
      },
    ],
  },
];

export function getApiClientRecords() {
  return apiClientSeed;
}
