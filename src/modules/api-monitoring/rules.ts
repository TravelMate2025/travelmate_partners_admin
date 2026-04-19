import type { AdminRole } from "@/modules/auth/types";
import type {
  ApiGovernanceAction,
  ApiMonitoringDashboardSnapshot,
  ApiMonitoringPolicy,
  ApiMonitoringRecord,
} from "@/modules/api-monitoring/types";

export function getApiMonitoringPolicy(role: AdminRole): ApiMonitoringPolicy {
  if (role === "super_admin") {
    return {
      role,
      canAcknowledge: true,
      canOpenIncident: true,
      canQueueContainment: true,
      summary: "Full API monitoring access including incident escalation and client-containment handoff.",
    };
  }

  if (role === "operations") {
    return {
      role,
      canAcknowledge: true,
      canOpenIncident: true,
      canQueueContainment: true,
      summary: "Operational monitoring access for anomaly review, incident escalation, and client-containment preparation.",
    };
  }

  if (role === "support") {
    return {
      role,
      canAcknowledge: true,
      canOpenIncident: true,
      canQueueContainment: false,
      summary: "Support can acknowledge alerts and open incidents, but cannot queue client containment.",
    };
  }

  return {
    role,
    canAcknowledge: false,
    canOpenIncident: false,
    canQueueContainment: false,
    summary: "Read-only API monitoring visibility for cross-functional investigation context.",
  };
}

export function canApplyApiGovernanceAction(
  role: AdminRole,
  record: ApiMonitoringRecord,
  action: ApiGovernanceAction,
) {
  const policy = getApiMonitoringPolicy(role);

  switch (action) {
    case "acknowledge_alert":
      return policy.canAcknowledge && record.status === "open";
    case "open_incident":
      return policy.canOpenIncident && record.status !== "resolved";
    case "queue_client_containment":
      return policy.canQueueContainment && record.status !== "contained" && record.status !== "resolved";
  }
}

export function buildApiMonitoringDashboard(records: ApiMonitoringRecord[]): ApiMonitoringDashboardSnapshot {
  return {
    openAlerts: records.filter((record) => record.status === "open" || record.status === "investigating").length,
    criticalAlerts: records.filter((record) => record.severity === "critical" && record.status !== "resolved").length,
    highLatencyAlerts: records.filter((record) => record.category === "latency" && record.status !== "resolved").length,
    rateLimitHotspots: records.filter((record) => record.rateLimitViolations24h > 0 && record.status !== "resolved").length,
    containedAlerts: records.filter((record) => record.status === "contained").length,
  };
}

export function detectApiMonitoringTags(record: ApiMonitoringRecord) {
  return {
    needsIncident: record.severity === "critical" || record.errorRatePercent >= 5,
    needsContainment: record.rateLimitViolations24h >= 20 || record.p95LatencyMs >= 1000,
    endpointRisk:
      record.category === "access" || record.endpointLabel.includes("/partners/export") || record.endpointLabel.includes("/bookings"),
  };
}
