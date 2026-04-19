import type { AdminRole } from "@/modules/auth/types";

export type ApiMonitoringSeverity = "low" | "medium" | "high" | "critical";
export type ApiMonitoringCategory = "traffic" | "latency" | "errors" | "rate_limit" | "access";
export type ApiMonitoringStatus = "open" | "investigating" | "contained" | "resolved";
export type ApiIncidentState = "not_open" | "open";
export type ApiGovernanceAction = "acknowledge_alert" | "open_incident" | "queue_client_containment";

export type ApiEndpointMetric = {
  endpointLabel: string;
  requestCount24h: number;
  errorRatePercent: number;
  p95LatencyMs: number;
  rateLimitViolations24h: number;
};

export type ApiClientActivity = {
  id: string;
  timestamp: string;
  actorLabel: string;
  event: string;
  summary: string;
};

export type ApiMonitoringHistoryEntry = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  note: string;
};

export type ApiMonitoringAuditRecord = {
  eventId: string;
  actor: string;
  anomalyId: string;
  action: ApiGovernanceAction;
  summary: string;
  status: "recorded" | "queued_for_backend";
};

export type ApiMonitoringClientLink = {
  href: string;
  label: string;
  summary: string;
  lastLinkedAction?: ApiGovernanceAction;
};

export type ApiMonitoringRecord = {
  id: string;
  title: string;
  category: ApiMonitoringCategory;
  status: ApiMonitoringStatus;
  incidentState: ApiIncidentState;
  severity: ApiMonitoringSeverity;
  clientId: string;
  clientName: string;
  endpointLabel: string;
  region: string;
  summary: string;
  anomalyReason: string;
  firstDetectedAt: string;
  lastSeenAt: string;
  currentTrafficPerMinute: number;
  p95LatencyMs: number;
  errorRatePercent: number;
  rateLimitViolations24h: number;
  impactedEndpoints: ApiEndpointMetric[];
  accessHistory: ApiClientActivity[];
  operationalNote: string;
  governanceRecommendation: string;
  clientLink: ApiMonitoringClientLink;
  history: ApiMonitoringHistoryEntry[];
  latestAuditRecord?: ApiMonitoringAuditRecord;
};

export type ApiMonitoringFilterState = {
  query: string;
  category: ApiMonitoringCategory | "all";
  severity: ApiMonitoringSeverity | "all";
  status: ApiMonitoringStatus | "all";
  client: string | "all";
};

export type ApiGovernanceActionPayload = {
  actor: string;
  anomalyId: string;
  action: ApiGovernanceAction;
  note: string;
};

export type ApiGovernanceActionResult = {
  records: ApiMonitoringRecord[];
  updatedRecord: ApiMonitoringRecord;
  auditRecord: ApiMonitoringAuditRecord;
};

export type ApiMonitoringPolicy = {
  role: AdminRole;
  canAcknowledge: boolean;
  canOpenIncident: boolean;
  canQueueContainment: boolean;
  summary: string;
};

export type ApiMonitoringDashboardSnapshot = {
  openAlerts: number;
  criticalAlerts: number;
  highLatencyAlerts: number;
  rateLimitHotspots: number;
  containedAlerts: number;
};

export type ApiMonitoringSurfaceState =
  | {
      status: "loading" | "error" | "exception";
      title?: string;
      description?: string;
    }
  | undefined;
