import type { AdminRole } from "@/modules/auth/types";

export type DashboardMetric = {
  id: string;
  label: string;
  value: number;
  note: string;
  href: string;
  accent: string;
  badge: {
    label: string;
    tone: "neutral" | "info" | "warning" | "success" | "danger";
  };
};

export type DashboardQueue = {
  id: string;
  title: string;
  owner: string;
  backlog: number;
  urgent: number;
  href: string;
  summary: string;
  status: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
  roles: AdminRole[];
};

export type DashboardAlert = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
};

export type DashboardActivity = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
  href: string;
  roles: AdminRole[];
};

export type DashboardModel = {
  metrics: DashboardMetric[];
  queues: DashboardQueue[];
  alerts: DashboardAlert[];
  activities: DashboardActivity[];
  focusLabel: string;
  overviewNote: string;
};

const allMetrics: DashboardMetric[] = [
  {
    id: "partners",
    label: "Verified Partners",
    value: 284,
    note: "Partner lifecycle is aligned to approved verification outcomes and ready for operational follow-up.",
    href: "/partners",
    accent: "linear-gradient(90deg, #19463e 0%, #2b5f55 100%)",
    badge: { label: "+18 this week", tone: "success" },
  },
  {
    id: "moderation",
    label: "Listings Awaiting Moderation",
    value: 64,
    note: "Stay and transfer submissions need publish, reject, or correction-loop decisions.",
    href: "/moderation",
    accent: "linear-gradient(90deg, #1e5970 0%, #2e6f8c 100%)",
    badge: { label: "12 urgent", tone: "warning" },
  },
  {
    id: "settlements",
    label: "Settlement Exceptions",
    value: 12,
    note: "Failed admin settlement runs, partner payout mismatches, and refund follow-up remain under finance review.",
    href: "/financial-ops",
    accent: "linear-gradient(90deg, #b36330 0%, #e28b2f 100%)",
    badge: { label: "Finance focus", tone: "danger" },
  },
  {
    id: "api",
    label: "API Clients in Review",
    value: 9,
    note: "Governance review is pending for new clients, quota upgrades, and anomalous usage patterns.",
    href: "/api-clients",
    accent: "linear-gradient(90deg, #4f4464 0%, #66537f 100%)",
    badge: { label: "Governance", tone: "info" },
  },
];

const allQueues: DashboardQueue[] = [
  {
    id: "verification",
    title: "Verification Review Queue",
    owner: "Reviewer lane",
    backlog: 128,
    urgent: 9,
    href: "/verification-review",
    summary: "KYC/KYB review requests waiting on approve, reject, or request-more-info decisions.",
    status: "Escalations open",
    tone: "warning",
    roles: ["super_admin", "operations", "reviewer"],
  },
  {
    id: "moderation",
    title: "Listing Moderation Queue",
    owner: "Operations lane",
    backlog: 64,
    urgent: 6,
    href: "/moderation",
    summary: "Stay and transfer listings are awaiting publish, reject, or correction-loop moderation outcomes.",
    status: "Healthy throughput",
    tone: "info",
    roles: ["super_admin", "operations", "reviewer"],
  },
  {
    id: "support",
    title: "Support & Incident Queue",
    owner: "Support lane",
    backlog: 23,
    urgent: 4,
    href: "/support-incidents",
    summary: "Partner issues need escalation, notes, and linked operational follow-up.",
    status: "Needs owners",
    tone: "danger",
    roles: ["super_admin", "operations", "support"],
  },
  {
    id: "finance",
    title: "Settlement Follow-up Queue",
    owner: "Finance lane",
    backlog: 12,
    urgent: 5,
    href: "/financial-ops",
    summary: "Refund escalations, failed runs, and payout mismatches require finance supervision.",
    status: "Blocked exceptions",
    tone: "danger",
    roles: ["super_admin", "finance"],
  },
];

const allAlerts: DashboardAlert[] = [
  {
    id: "payout-risk",
    title: "Payout risk spike",
    detail: "Rapid payout-method changes were detected on three partner accounts and one hold is already active.",
    href: "/payout-review",
    tone: "danger",
  },
  {
    id: "verification-backlog",
    title: "Verification backlog pressure",
    detail: "Nine high-priority verification cases have crossed the same-day SLA and need reviewer ownership.",
    href: "/verification-review",
    tone: "warning",
  },
  {
    id: "api-retries",
    title: "API retry anomaly",
    detail: "Client retries rose 18% after key expiry events; governance review is tracking affected accounts.",
    href: "/api-monitoring",
    tone: "info",
  },
];

const allActivities: DashboardActivity[] = [
  {
    id: "act-1",
    title: "Payout review case flagged",
    detail: "Rapid payout-method changes detected for a Lagos partner account; finance review hold applied.",
    time: "6 min ago",
    tone: "danger",
    href: "/payout-review",
    roles: ["super_admin", "finance"],
  },
  {
    id: "act-2",
    title: "Moderation backlog reduced",
    detail: "Operations approved 18 transfer listings and sent 6 stay listings back for edits.",
    time: "19 min ago",
    tone: "success",
    href: "/moderation",
    roles: ["super_admin", "operations", "reviewer"],
  },
  {
    id: "act-3",
    title: "Verification decision published",
    detail: "A partner moved from verification approved to lifecycle verified with audit notes and partner notification.",
    time: "27 min ago",
    tone: "info",
    href: "/verification-review",
    roles: ["super_admin", "operations", "reviewer"],
  },
  {
    id: "act-4",
    title: "Support escalation linked",
    detail: "A refund dispute was linked to the support queue so finance and support can resolve it together.",
    time: "41 min ago",
    tone: "warning",
    href: "/support-incidents",
    roles: ["super_admin", "support", "finance", "operations"],
  },
];

export function formatDashboardMetric(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function getDashboardModel(role: AdminRole): DashboardModel {
  const visibleQueues = allQueues.filter((queue) => queue.roles.includes(role) || role === "super_admin");
  const visibleActivities = allActivities.filter((item) => item.roles.includes(role) || role === "super_admin");
  const focusQueue = visibleQueues[0];

  const overviewNoteByRole: Record<AdminRole, string> = {
    super_admin: "Platform-wide oversight across verification, moderation, governance, support, and finance.",
    operations: "Operations ownership centered on verification throughput, moderation health, and partner issue coordination.",
    reviewer: "Reviewer focus on KYC/KYB decisions, moderation exceptions, and lifecycle-aligned approvals.",
    support: "Support focus on incidents, escalation routing, and partner-impact visibility across linked queues.",
    finance: "Finance focus on payout risk, settlement exceptions, refund recovery, and reconciliations.",
  };

  return {
    metrics: allMetrics,
    queues: visibleQueues,
    alerts: allAlerts,
    activities: visibleActivities,
    focusLabel: focusQueue ? `${focusQueue.owner} · ${focusQueue.backlog} open cases` : "No assigned queues",
    overviewNote: overviewNoteByRole[role],
  };
}
