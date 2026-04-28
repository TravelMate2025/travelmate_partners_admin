import type { AdminRole } from "@/modules/auth/types";
import type {
  SupportAction,
  SupportIncidentFilterState,
  SupportIncidentPolicy,
  SupportIncidentQueue,
  SupportIncidentRecord,
  SupportIncidentSeverity,
  SupportIncidentState,
  SupportIncidentStatus,
} from "@/modules/support-incidents/types";

export const supportIncidentAllowedRoles: AdminRole[] = ["super_admin", "operations", "support", "reviewer", "finance"];

export function getSupportIncidentPolicy(role: AdminRole): SupportIncidentPolicy {
  const canOperate = role === "super_admin" || role === "operations" || role === "support";

  return {
    canLogNote: canOperate,
    canFlagIncident: canOperate,
    canEscalate: canOperate,
    canResolve: canOperate,
    canRunDiagnostics: canOperate,
    summary: canOperate
      ? "Support workspace access includes note logging, incident flagging, escalation, safe diagnostics, and case resolution."
      : "Read-only support visibility. This role can review linked context, notes, incident history, and diagnostics without changing the case.",
    allowedRoles: supportIncidentAllowedRoles,
  };
}

export function getAvailableSupportActions(record: SupportIncidentRecord, role: AdminRole): SupportAction[] {
  if (record.appealId) {
    const isOperationsRole = role === "operations" || role === "super_admin";
    if (!isOperationsRole || record.status === "resolved") {
      return [];
    }
    return ["reinstate_listing", "dismiss_appeal"];
  }

  const policy = getSupportIncidentPolicy(role);
  const actions: SupportAction[] = [];

  if (policy.canLogNote) actions.push("log_note");
  if (policy.canRunDiagnostics && record.status !== "resolved") actions.push("run_diagnostics");
  if (policy.canFlagIncident && record.incidentState === "none" && record.status !== "resolved") actions.push("flag_incident");
  if (policy.canEscalate && record.incidentState === "active" && record.status !== "resolved" && record.status !== "escalated") {
    actions.push("escalate");
  }
  if (policy.canResolve && record.status !== "resolved") actions.push("resolve");

  return actions;
}

export function validateSupportAction(
  record: SupportIncidentRecord,
  action: SupportAction,
  role: AdminRole,
  note: string,
) {
  const policy = getSupportIncidentPolicy(role);
  const trimmedNote = note.trim();
  const isAppeal = Boolean(record.appealId);

  if (isAppeal) {
    const isOperationsRole = role === "operations" || role === "super_admin";
    if (!isOperationsRole) return "Only operations and super admin roles can resolve listing appeals.";
    if (action !== "reinstate_listing" && action !== "dismiss_appeal") {
      return "Only appeal resolution actions are available for this case.";
    }
    if (record.status === "resolved") {
      return "This appeal is already resolved.";
    }
    if (trimmedNote.length < 12) {
      return "Add a resolution note of at least 12 characters before resolving this appeal.";
    }
    return null;
  }

  if (action === "log_note" && !policy.canLogNote) return "This role cannot add internal support notes.";
  if (action === "flag_incident" && !policy.canFlagIncident) return "This role cannot flag incidents.";
  if (action === "escalate" && !policy.canEscalate) return "This role cannot escalate support incidents.";
  if (action === "resolve" && !policy.canResolve) return "This role cannot resolve support incidents.";
  if (action === "run_diagnostics" && !policy.canRunDiagnostics) return "This role cannot run diagnostics from support incidents.";

  if (trimmedNote.length < 12) {
    return "Add an internal note of at least 12 characters before applying this support action.";
  }

  if (action === "flag_incident" && record.incidentState !== "none") {
    return "This case already has an active or mitigated incident record.";
  }

  if (action === "escalate" && record.incidentState !== "active") {
    return "Flag an incident before escalating it.";
  }

  if (action === "escalate" && record.status === "escalated") {
    return "This case has already been escalated.";
  }

  if (action === "resolve" && record.status === "resolved") {
    return "This case is already resolved.";
  }

  return null;
}

export function matchesSupportIncidentFilter(record: SupportIncidentRecord, filters: SupportIncidentFilterState) {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery =
    query.length === 0 ||
    record.title.toLowerCase().includes(query) ||
    record.partnerName.toLowerCase().includes(query) ||
    record.summary.toLowerCase().includes(query) ||
    record.region.toLowerCase().includes(query);

  const matchesStatus = filters.status === "all" || record.status === filters.status;
  const matchesSeverity = filters.severity === "all" || record.severity === filters.severity;
  const matchesQueue = filters.queue === "all" || record.queue === filters.queue;
  const matchesIncidentState = filters.incidentState === "all" || record.incidentState === filters.incidentState;

  return matchesQuery && matchesStatus && matchesSeverity && matchesQueue && matchesIncidentState;
}

export function buildSupportIncidentSummary(records: SupportIncidentRecord[]) {
  return {
    openCases: records.filter((record) => record.status === "open" || record.status === "monitoring").length,
    escalatedCases: records.filter((record) => record.status === "escalated").length,
    activeIncidents: records.filter((record) => record.incidentState === "active").length,
    criticalCases: records.filter((record) => record.severity === "critical" || record.severity === "high").length,
  };
}

export function formatSupportQueueLabel(queue: SupportIncidentQueue) {
  const labels: Record<SupportIncidentQueue, string> = {
    partner_support: "Partner Support",
    trust_ops: "Trust Ops",
    financial_followup: "Financial Follow-up",
    incident_response: "Incident Response",
  };
  return labels[queue];
}

export function formatSupportSeverityLabel(severity: SupportIncidentSeverity) {
  const labels: Record<SupportIncidentSeverity, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };
  return labels[severity];
}

export function formatSupportStatusLabel(status: SupportIncidentStatus) {
  const labels: Record<SupportIncidentStatus, string> = {
    open: "Open",
    monitoring: "Monitoring",
    escalated: "Escalated",
    resolved: "Resolved",
  };
  return labels[status];
}

export function formatSupportIncidentStateLabel(incidentState: SupportIncidentState) {
  const labels: Record<SupportIncidentState, string> = {
    none: "No Incident",
    active: "Incident Active",
    mitigated: "Mitigated",
  };
  return labels[incidentState];
}

export function supportStatusTone(status: SupportIncidentStatus) {
  switch (status) {
    case "resolved":
      return "success" as const;
    case "monitoring":
      return "warning" as const;
    case "escalated":
      return "danger" as const;
    case "open":
      return "info" as const;
  }
}

export function supportSeverityTone(severity: SupportIncidentSeverity) {
  switch (severity) {
    case "low":
      return "neutral" as const;
    case "medium":
      return "info" as const;
    case "high":
      return "warning" as const;
    case "critical":
      return "danger" as const;
  }
}
