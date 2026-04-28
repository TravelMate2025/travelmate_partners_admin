import type { AdminRole } from "@/modules/auth/types";
import { getAvailableSupportActions, validateSupportAction } from "@/modules/support-incidents/rules";
import type {
  SupportDiagnosticCheck,
  SupportIncidentActionPayload,
  SupportIncidentActionResult,
  SupportIncidentAuditRecord,
  SupportIncidentRecord,
  SupportIncidentState,
  SupportIncidentStatus,
} from "@/modules/support-incidents/types";

function nextStatus(record: SupportIncidentRecord, action: SupportIncidentActionPayload["action"]): SupportIncidentStatus {
  switch (action) {
    case "flag_incident":
      return "monitoring";
    case "escalate":
      return "escalated";
    case "resolve":
      return "resolved";
    case "run_diagnostics":
    case "log_note":
    case "reinstate_listing":
    case "dismiss_appeal":
      return record.status;
  }
}

function nextIncidentState(record: SupportIncidentRecord, action: SupportIncidentActionPayload["action"]): SupportIncidentState {
  switch (action) {
    case "flag_incident":
    case "escalate":
      return "active";
    case "resolve":
      return "mitigated";
    case "run_diagnostics":
    case "log_note":
    case "reinstate_listing":
    case "dismiss_appeal":
      return record.incidentState;
  }
}

function buildActionLabel(action: SupportIncidentActionPayload["action"]) {
  const labels: Record<SupportIncidentActionPayload["action"], string> = {
    log_note: "logged an internal note on",
    flag_incident: "flagged an incident on",
    escalate: "escalated",
    resolve: "resolved",
    run_diagnostics: "ran safe diagnostics for",
    reinstate_listing: "reinstated listing from appeal for",
    dismiss_appeal: "dismissed listing appeal for",
  };
  return labels[action];
}

function buildAuditSummary(actor: string, action: SupportIncidentActionPayload["action"], title: string) {
  return `${actor} ${buildActionLabel(action)} ${title} and queued the support follow-up trail.`;
}

function buildActivityTitle(action: SupportIncidentActionPayload["action"]) {
  const labels: Record<SupportIncidentActionPayload["action"], string> = {
    log_note: "Internal note logged",
    flag_incident: "Incident flagged",
    escalate: "Case escalated",
    resolve: "Case resolved",
    run_diagnostics: "Safe diagnostics completed",
    reinstate_listing: "Listing reinstated from appeal",
    dismiss_appeal: "Listing appeal dismissed",
  };
  return labels[action];
}

function buildDiagnosticChecks(record: SupportIncidentRecord): SupportDiagnosticCheck[] {
  switch (record.issueType) {
    case "partner_access":
      return [
        { id: `${record.id}-diag-auth`, label: "Partner auth state", status: "warn", detail: "Session restore remains pending after the unlock signal was acknowledged." },
        { id: `${record.id}-diag-verify`, label: "Verification handoff", status: "pass", detail: "Revalidation approval is present and linked correctly to the partner account." },
      ];
    case "refund_followup":
      return [
        { id: `${record.id}-diag-refund`, label: "Refund workflow", status: "warn", detail: "Refund follow-up is queued behind finance reconciliation and still needs settlement confirmation." },
        { id: `${record.id}-diag-ledger`, label: "Masked ledger reference", status: "pass", detail: "Only masked settlement trace batch ****1834 is exposed to support diagnostics." },
      ];
    case "listing_sync":
      return [
        { id: `${record.id}-diag-sync`, label: "Listing sync replay", status: "warn", detail: "Moderation replay lag remains above the expected support threshold." },
        { id: `${record.id}-diag-version`, label: "Revision acceptance", status: "pass", detail: "Corrected listing revision was accepted and versioned without raw payload exposure." },
      ];
    case "verification_handoff":
      return [
        { id: `${record.id}-diag-handoff`, label: "Reviewer handoff", status: "pass", detail: "Reviewer handoff note is intact and ready for partner-facing support follow-up." },
        { id: `${record.id}-diag-docs`, label: "Document guidance", status: "warn", detail: "Partner still needs a clearer proof-of-address instruction before resubmission." },
      ];
    case "policy_concern":
      return [
        { id: `${record.id}-diag-policy`, label: "Policy trace", status: "blocked", detail: "Trust review is still required before support can close the concern." },
      ];
  }
}

export type SupportIncidentRepository = {
  applyAction(
    records: SupportIncidentRecord[],
    payload: SupportIncidentActionPayload,
    role: AdminRole,
  ): Promise<SupportIncidentActionResult>;
};

type ResolveAppealEnvelope = {
  data?: {
    id: string;
    status: string;
    resolution?: string | null;
    resolutionNote?: string | null;
    resolvedAt?: string | null;
    updatedAt?: string;
  };
  message?: string;
  error?: { message?: string };
};

function getResolveAppealErrorMessage(body: ResolveAppealEnvelope | null, status: number): string {
  return (
    body?.message ??
    body?.error?.message ??
    `Unable to resolve listing appeal (HTTP ${status}).`
  );
}

export async function applyListingAppealAction(
  records: SupportIncidentRecord[],
  payload: SupportIncidentActionPayload,
): Promise<SupportIncidentActionResult> {
  const record = records.find((item) => item.id === payload.caseId);
  if (!record || !record.appealId) {
    throw new Error("Selected listing appeal case was not found.");
  }
  if (payload.action !== "reinstate_listing" && payload.action !== "dismiss_appeal") {
    throw new Error("Unsupported listing appeal action.");
  }

  const resolution = payload.action === "reinstate_listing" ? "reinstated" : "dismissed";
  const response = await fetch(`/api/backend/support-incidents/listing-appeals/${encodeURIComponent(record.appealId)}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resolution,
      resolutionNote: payload.note,
      resolution_note: payload.note,
    }),
  });
  const body = (await response.json().catch(() => null)) as ResolveAppealEnvelope | null;
  if (!response.ok || !body?.data) {
    throw new Error(getResolveAppealErrorMessage(body, response.status));
  }

  const timestamp = body.data.resolvedAt ?? body.data.updatedAt ?? new Date().toISOString();
  const updatedRecord: SupportIncidentRecord = {
    ...record,
    status: "resolved",
    incidentState: "mitigated",
    operationalNote: body.data.resolutionNote ?? payload.note.trim(),
    lastUpdatedAt: timestamp,
    activity: [
      {
        id: `support-activity-${record.id}-${Date.now()}`,
        title: payload.action === "reinstate_listing" ? "Listing reinstated from appeal" : "Listing appeal dismissed",
        detail:
          payload.action === "reinstate_listing"
            ? `${payload.actor} reinstated this listing after reviewing the partner appeal.`
            : `${payload.actor} dismissed this listing appeal and retained the suspension.`,
        time: timestamp.slice(11, 16) + " UTC",
        tone: payload.action === "reinstate_listing" ? "success" : "danger",
      },
      ...record.activity,
    ],
  };

  const auditRecord: SupportIncidentAuditRecord = {
    eventId: `support-appeal-audit-${record.id}-${Date.now()}`,
    caseId: record.id,
    actor: payload.actor,
    action: payload.action,
    summary:
      payload.action === "reinstate_listing"
        ? `${payload.actor} reinstated listing ${record.title} after appeal review.`
        : `${payload.actor} dismissed listing appeal for ${record.title}.`,
    status: "queued_for_followup",
  };

  return {
    records: records.map((item) => (item.id === record.id ? updatedRecord : item)),
    updatedRecord,
    auditRecord,
  };
}

export const mockSupportIncidentRepository: SupportIncidentRepository = {
  async applyAction(records, payload, role) {
    const record = records.find((item) => item.id === payload.caseId);

    if (!record) {
      throw new Error("Selected support case was not found.");
    }

    const availableActions = getAvailableSupportActions(record, role);
    if (!availableActions.includes(payload.action)) {
      throw new Error("This action is not available for the selected support case and role.");
    }

    const validationError = validateSupportAction(record, payload.action, role, payload.note);
    if (validationError) {
      throw new Error(validationError);
    }

    const timestamp = new Date().toISOString();
    const auditRecord: SupportIncidentAuditRecord = {
      eventId: `support-audit-${record.id}-${Date.now()}`,
      caseId: record.id,
      actor: payload.actor,
      action: payload.action,
      summary: buildAuditSummary(payload.actor, payload.action, record.title),
      status: "queued_for_followup",
    };

    const diagnostics =
      payload.action === "run_diagnostics"
        ? [
            {
              id: `support-diag-${record.id}-${Date.now()}`,
              runAt: timestamp,
              actor: payload.actor,
              summary: "Safe diagnostics captured masked operational traces only. No sensitive credentials or raw financial data were exposed.",
              checks: buildDiagnosticChecks(record),
            },
            ...record.diagnostics,
          ]
        : record.diagnostics;

    const updatedRecord: SupportIncidentRecord = {
      ...record,
      status: nextStatus(record, payload.action),
      incidentState: nextIncidentState(record, payload.action),
      owner: payload.action === "escalate" ? `${record.escalationTeam} queue` : record.owner,
      operationalNote: payload.note.trim(),
      lastUpdatedAt: timestamp,
      diagnostics,
      activity: [
        {
          id: `support-activity-${record.id}-${Date.now()}`,
          title: buildActivityTitle(payload.action),
          detail:
            payload.action === "escalate"
              ? `${payload.actor} escalated this case to the ${record.escalationTeam} team with a traceable support note.`
              : payload.action === "flag_incident"
                ? `${payload.actor} created an incident thread so the case can be monitored and coordinated safely.`
                : payload.action === "resolve"
                  ? `${payload.actor} resolved the case and marked the incident trail as mitigated.`
                  : payload.action === "run_diagnostics"
                    ? `${payload.actor} ran safe diagnostics and recorded masked operational checks only.`
                    : `${payload.actor} added an internal support note to keep follow-up context traceable.`,
          time: timestamp.slice(11, 16) + " UTC",
          tone:
            payload.action === "resolve"
              ? "success"
              : payload.action === "escalate"
                ? "danger"
                : payload.action === "flag_incident" || payload.action === "run_diagnostics"
                  ? "warning"
                  : "info",
        },
        ...record.activity,
      ],
    };

    return {
      records: records.map((item) => (item.id === record.id ? updatedRecord : item)),
      updatedRecord,
      auditRecord,
    };
  },
};
