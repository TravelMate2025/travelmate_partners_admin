import { canApplyApiGovernanceAction } from "@/modules/api-monitoring/rules";
import type {
  ApiGovernanceAction,
  ApiGovernanceActionPayload,
  ApiGovernanceActionResult,
  ApiMonitoringRecord,
} from "@/modules/api-monitoring/types";
import type { AdminRole } from "@/modules/auth/types";

function formatTimestamp(date: string) {
  return new Date(date)
    .toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    })
    .replace(",", " UTC");
}

function buildHistoryAction(action: ApiGovernanceAction) {
  switch (action) {
    case "acknowledge_alert":
      return "Alert acknowledged";
    case "open_incident":
      return "Incident opened";
    case "queue_client_containment":
      return "Client containment queued";
  }
}

function buildAuditSummary(actor: string, action: ApiGovernanceAction, title: string) {
  switch (action) {
    case "acknowledge_alert":
      return `${actor} acknowledged API monitoring alert ${title}.`;
    case "open_incident":
      return `${actor} opened an incident from API monitoring alert ${title}.`;
    case "queue_client_containment":
      return `${actor} queued client containment from API monitoring alert ${title}.`;
  }
}

function applyActionToRecord(record: ApiMonitoringRecord, payload: ApiGovernanceActionPayload) {
  const timestamp = new Date().toISOString();
  const note = payload.note.trim().length > 0 ? payload.note.trim() : record.operationalNote;

  switch (payload.action) {
    case "acknowledge_alert":
      return {
        ...record,
        status: "investigating" as const,
        incidentState: record.incidentState,
        operationalNote: note,
        clientLink: {
          ...record.clientLink,
          summary: `${record.clientName} remains linked while the anomaly is under investigation.`,
          lastLinkedAction: payload.action,
        },
        history: [
          {
            id: `api-monitoring-history-${record.id}-acknowledge-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
    case "open_incident":
      return {
        ...record,
        status: "investigating" as const,
        incidentState: "open" as const,
        operationalNote: note,
        governanceRecommendation: "Incident opened. Coordinate API health review and client follow-up through the incident surface.",
        clientLink: {
          ...record.clientLink,
          summary: `${record.clientName} is now linked to an open incident for governance follow-up and access-log review.`,
          lastLinkedAction: payload.action,
        },
        history: [
          {
            id: `api-monitoring-history-${record.id}-incident-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
    case "queue_client_containment":
      return {
        ...record,
        status: "contained" as const,
        incidentState: record.incidentState,
        operationalNote: note,
        governanceRecommendation: "Containment queued. Hand off to API client governance for revocation/block review if backend confirms abuse.",
        clientLink: {
          ...record.clientLink,
          summary: `${record.clientName} is linked for containment follow-up in the API client governance surface.`,
          lastLinkedAction: payload.action,
        },
        history: [
          {
            id: `api-monitoring-history-${record.id}-containment-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
  }
}

export type ApiMonitoringRepository = {
  applyAction(
    records: ApiMonitoringRecord[],
    payload: ApiGovernanceActionPayload,
    role: AdminRole,
  ): Promise<ApiGovernanceActionResult>;
};

type ApiMonitoringListEnvelope = {
  data?: { records?: ApiMonitoringRecord[] };
  message?: string;
  error?: { message?: string };
};

type ApiMonitoringActionEnvelope = {
  data?: ApiGovernanceActionResult;
  message?: string;
  error?: { message?: string };
};

export const mockApiMonitoringRepository: ApiMonitoringRepository = {
  async applyAction(records, payload, role) {
    const record = records.find((item) => item.id === payload.anomalyId);

    if (!record) {
      throw new Error("Selected API anomaly was not found.");
    }

    if (!canApplyApiGovernanceAction(role, record, payload.action)) {
      throw new Error(`Action ${payload.action} is not allowed for this API anomaly.`);
    }

    const updatedRecord = {
      ...applyActionToRecord(record, payload),
      latestAuditRecord: {
        eventId: `api-monitoring-audit-${payload.action}-${Date.now()}`,
        actor: payload.actor,
        anomalyId: record.id,
        action: payload.action,
        summary: buildAuditSummary(payload.actor, payload.action, record.title),
        status: "queued_for_backend" as const,
      },
    };

    return {
      records: records.map((item) => (item.id === record.id ? updatedRecord : item)),
      updatedRecord,
      auditRecord: updatedRecord.latestAuditRecord,
    };
  },
};

export async function fetchApiMonitoringRecords(): Promise<ApiMonitoringRecord[]> {
  const response = await fetch("/api/backend/api-monitoring", { method: "GET", cache: "no-store" });
  const body = (await response.json().catch(() => null)) as ApiMonitoringListEnvelope | null;
  if (!response.ok || !body?.data?.records) {
    throw new Error(body?.message ?? body?.error?.message ?? "Unable to load API monitoring queue.");
  }
  return body.data.records;
}

export const realApiMonitoringRepository: ApiMonitoringRepository = {
  async applyAction(_records, payload, _role) {
    const response = await fetch(`/api/backend/api-monitoring/${encodeURIComponent(payload.anomalyId)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as ApiMonitoringActionEnvelope | null;
    if (!response.ok || !body?.data?.records || !body.data.updatedRecord || !body.data.auditRecord) {
      throw new Error(body?.message ?? body?.error?.message ?? "Unable to manage API monitoring alert.");
    }
    return body.data;
  },
};
