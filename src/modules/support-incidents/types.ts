import type { AdminRole } from "@/modules/auth/types";
import type { ActivityItem } from "@/components/common/activity-timeline";

export type SupportIncidentStatus = "open" | "monitoring" | "escalated" | "resolved";
export type SupportIncidentSeverity = "low" | "medium" | "high" | "critical";
export type SupportIncidentQueue = "partner_support" | "trust_ops" | "financial_followup" | "incident_response";
export type SupportIncidentType = "partner_access" | "listing_sync" | "refund_followup" | "verification_handoff" | "policy_concern" | "api_client_anomaly" | "api_client_support_ticket" | "partner_support_ticket";
export type SupportIncidentState = "none" | "active" | "mitigated";
export type SupportDiagnosticStatus = "pass" | "warn" | "blocked";
export type SupportAction =
  | "log_note"
  | "flag_incident"
  | "escalate"
  | "resolve"
  | "run_diagnostics"
  | "reinstate_listing"
  | "dismiss_appeal";

export type SupportLinkedContext = {
  id: string;
  label: string;
  href: string;
  statusLabel: string;
  kind: "partner" | "listing" | "settlement" | "verification";
};

export type SupportDiagnosticCheck = {
  id: string;
  label: string;
  status: SupportDiagnosticStatus;
  detail: string;
};

export type SupportDiagnosticSnapshot = {
  id: string;
  runAt: string;
  actor: string;
  summary: string;
  checks: SupportDiagnosticCheck[];
};

export type SupportIncidentRecord = {
  id: string;
  title: string;
  summary: string;
  partnerName: string;
  partnerId?: string;
  partnerEmail?: string;
  owner: string;
  queue: SupportIncidentQueue;
  severity: SupportIncidentSeverity;
  status: SupportIncidentStatus;
  incidentState: SupportIncidentState;
  issueType: SupportIncidentType;
  channel: "email" | "phone" | "in_app" | "internal" | "system" | "api";
  region: string;
  responseDeadline: string;
  lastUpdatedAt: string;
  openedAt: string;
  escalationTeam: "operations" | "support" | "finance" | "trust" | "security";
  operationalNote: string;
  linkedContext: SupportLinkedContext[];
  diagnostics: SupportDiagnosticSnapshot[];
  activity: ActivityItem[];
  appealId?: string;
  appealListingKind?: "stay" | "transfer";
  appealListingId?: string;
};

export type SupportIncidentFilterState = {
  query: string;
  status: SupportIncidentStatus | "all";
  severity: SupportIncidentSeverity | "all";
  queue: SupportIncidentQueue | "all";
  incidentState: SupportIncidentState | "all";
};

export type SupportIncidentPolicy = {
  canLogNote: boolean;
  canFlagIncident: boolean;
  canEscalate: boolean;
  canResolve: boolean;
  canRunDiagnostics: boolean;
  summary: string;
  allowedRoles: AdminRole[];
};

export type SupportIncidentActionPayload = {
  caseId: string;
  action: SupportAction;
  actor: string;
  note: string;
};

export type SupportIncidentAuditRecord = {
  eventId: string;
  caseId: string;
  actor: string;
  action: SupportAction;
  summary: string;
  status: "queued_for_followup";
};

export type SupportIncidentActionResult = {
  records: SupportIncidentRecord[];
  updatedRecord: SupportIncidentRecord;
  auditRecord: SupportIncidentAuditRecord;
};
