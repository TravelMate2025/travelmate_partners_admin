import type { AdminRole } from "@/modules/auth/types";
import { getApiClientsFromApi } from "@/modules/api-clients/server";
import { getFinancialOpsFromApi } from "@/modules/financial-ops/server";
import { getModerationListingsFromApi } from "@/modules/listing-moderation/server";
import { getPartnerOperationsFromApi } from "@/modules/partner-operations/server";
import { getSupportIncidentsFromApi } from "@/modules/support-incidents/server";
import { getVerificationCasesFromApi } from "@/modules/verification-review/server";
import { getDashboardModel, type DashboardModel } from "@/modules/dashboard/data";

function parseDate(value?: string | null): number {
  if (!value) return 0;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
}

function relativeTimeFromNow(timestampMs: number): string {
  if (!timestampMs) return "just now";
  const diffMs = Math.max(0, Date.now() - timestampMs);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export async function getDashboardModelFromApi(role: AdminRole): Promise<{ model: DashboardModel; error: string | null }> {
  const [partnerOps, verification, moderation, support, finance, apiClients] = await Promise.all([
    getPartnerOperationsFromApi(),
    getVerificationCasesFromApi(),
    getModerationListingsFromApi(),
    getSupportIncidentsFromApi(),
    getFinancialOpsFromApi(),
    getApiClientsFromApi(),
  ]);

  const errors = [
    partnerOps.error,
    verification.error,
    moderation.error,
    support.error,
    finance.error,
    apiClients.error,
  ].filter(Boolean) as string[];

  const base = getDashboardModel(role);

  const verifiedPartners = partnerOps.records.filter((item) => item.lifecycleState === "verified").length;
  const pendingModeration = moderation.records.filter((item) => item.status === "pending").length;
  const settlementExceptions = finance.records.filter((item) => item.adminRunStatus === "failed" || item.adminRunStatus === "partial").length;
  const clientsInReview = apiClients.records.filter((item) => item.status === "pending_review").length;

  const metrics = base.metrics.map((metric) => {
    if (metric.id === "partners") return { ...metric, value: verifiedPartners };
    if (metric.id === "moderation") return { ...metric, value: pendingModeration };
    if (metric.id === "settlements") return { ...metric, value: settlementExceptions };
    if (metric.id === "api") return { ...metric, value: clientsInReview };
    return metric;
  });

  const queues = base.queues.map((queue) => {
    if (queue.id === "verification") {
      const backlog = verification.cases.filter(
        (item) => item.verificationStatus === "in_review" || item.verificationStatus === "pending",
      ).length;
      return {
        ...queue,
        backlog,
        urgent: verification.cases.filter(
          (item) => item.riskLevel === "high" || item.reviewSignals.flaggedDocumentCount > 0,
        ).length,
      };
    }
    if (queue.id === "moderation") {
      const backlog = pendingModeration;
      return {
        ...queue,
        backlog,
        urgent: moderation.records.filter(
          (item) =>
            item.reviewSignals.priorityLabel.toLowerCase().includes("high") ||
            item.reviewSignals.priorityLabel.toLowerCase().includes("critical"),
        ).length,
      };
    }
    if (queue.id === "support") {
      return {
        ...queue,
        backlog: support.records.filter((item) => item.status === "open").length,
        urgent: support.records.filter((item) => item.severity === "critical" || item.severity === "high").length,
      };
    }
    if (queue.id === "finance") {
      return { ...queue, backlog: finance.records.length, urgent: settlementExceptions };
    }
    return queue;
  });

  const activityCandidates: Array<{ ts: number; item: DashboardModel["activities"][number] }> = [];

  for (const item of verification.cases.slice(0, 20)) {
    const ts = parseDate(item.history[0]?.timestamp) || parseDate(item.submittedAt);
    activityCandidates.push({
      ts,
      item: {
        id: `act-verification-${item.id}`,
        title: `Verification case ${item.verificationStatus.replace("_", " ")}`,
        detail: `${item.partnerName} · ${item.businessName}`,
        time: relativeTimeFromNow(ts),
        tone: item.riskLevel === "high" ? "warning" : "info",
        href: "/verification-review",
        roles: ["super_admin", "operations", "reviewer"],
      },
    });
  }

  for (const item of moderation.records.slice(0, 20)) {
    const ts = parseDate(item.lastReviewedAt) || parseDate(item.submittedAt);
    activityCandidates.push({
      ts,
      item: {
        id: `act-moderation-${item.id}`,
        title: `${item.kind === "stay" ? "Stay" : "Transfer"} listing ${item.status}`,
        detail: `${item.partnerName} · ${item.title}`,
        time: relativeTimeFromNow(ts),
        tone: item.status === "rejected" ? "warning" : "info",
        href: "/moderation",
        roles: ["super_admin", "operations", "reviewer"],
      },
    });
  }

  for (const item of support.records.slice(0, 20)) {
    const ts = parseDate(item.lastUpdatedAt) || parseDate(item.openedAt);
    activityCandidates.push({
      ts,
      item: {
        id: `act-support-${item.id}`,
        title: `Support case ${item.status}`,
        detail: `${item.partnerName} · ${item.summary}`,
        time: relativeTimeFromNow(ts),
        tone: item.severity === "critical" || item.severity === "high" ? "danger" : "warning",
        href: "/support-incidents",
        roles: ["super_admin", "support", "finance", "operations"],
      },
    });
  }

  for (const item of apiClients.records.slice(0, 20)) {
    const ts = parseDate(item.history[0]?.timestamp) || parseDate(item.submittedAt);
    activityCandidates.push({
      ts,
      item: {
        id: `act-apiclient-${item.id}`,
        title: `API client ${item.status.replace("_", " ")}`,
        detail: `${item.companyName} · ${item.plan} plan`,
        time: relativeTimeFromNow(ts),
        tone: item.riskLevel === "high" ? "danger" : "info",
        href: "/api-clients",
        roles: ["super_admin", "operations", "support"],
      },
    });
  }

  for (const item of partnerOps.records.slice(0, 20)) {
    const ts = parseDate(item.history[0]?.timestamp) || parseDate(item.lastActiveAt);
    activityCandidates.push({
      ts,
      item: {
        id: `act-partner-${item.id}`,
        title: `Partner ${item.lifecycleState}`,
        detail: `${item.partnerName} · ${item.businessName}`,
        time: relativeTimeFromNow(ts),
        tone: item.accountState === "locked" ? "warning" : "neutral",
        href: "/partners",
        roles: ["super_admin", "operations", "support", "reviewer"],
      },
    });
  }

  for (const item of finance.records.slice(0, 20)) {
    const ts = parseDate(item.activity[0]?.time);
    const lifecycleSummary = [
      item.bookingStatus ? `booking ${item.bookingStatus.replace(/_/g, " ")}` : null,
      item.paymentStatus ? `payment ${item.paymentStatus.replace(/_/g, " ")}` : null,
      item.fulfillmentStatus ? `service ${item.fulfillmentStatus.replace(/_/g, " ")}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    activityCandidates.push({
      ts,
      item: {
        id: `act-finance-${item.id}`,
        title: `Settlement ${item.adminRunStatus}${item.paymentStatus ? ` · ${item.paymentStatus}` : ""}`,
        detail: lifecycleSummary
          ? `${item.partnerName} · ${item.bookingReference} · ${lifecycleSummary}`
          : `${item.partnerName} · ${item.bookingReference}`,
        time: relativeTimeFromNow(ts),
        tone: item.adminRunStatus === "failed" || item.adminRunStatus === "partial" ? "danger" : "info",
        href: "/financial-ops",
        roles: ["super_admin", "finance"],
      },
    });
  }

  const activities = activityCandidates
    .sort((a, b) => b.ts - a.ts)
    .map((entry) => entry.item)
    .filter((entry) => entry.roles.includes(role) || role === "super_admin")
    .slice(0, 8);

  const model: DashboardModel = {
    ...base,
    metrics,
    queues,
    activities: activities.length > 0 ? activities : base.activities,
  };

  return {
    model,
    error: errors.length > 0 ? `Some live dashboard sources are unavailable: ${errors[0]}` : null,
  };
}
