import {
  canApplyApiClientAction,
  isEligibleApiPlan,
  validateApiRateLimit,
} from "@/modules/api-clients/rules";
import type {
  ApiClientAction,
  ApiClientActionPayload,
  ApiClientActionResult,
  ApiClientRecord,
} from "@/modules/api-clients/types";
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

function buildHistoryAction(action: ApiClientAction) {
  switch (action) {
    case "start_review":
      return "Review started";
    case "approve_client":
      return "Client approved";
    case "reject_client":
      return "Client rejected";
    case "issue_key":
      return "Key issued";
    case "regenerate_key":
      return "Key regenerated";
    case "revoke_key":
      return "Key revoked";
    case "block_client":
      return "Client suspended";
    case "restore_client":
      return "Client restored";
    case "update_plan":
      return "Plan updated";
  }
}

function buildAuditSummary(actor: string, action: ApiClientAction, companyName: string) {
  switch (action) {
    case "start_review":
      return `${actor} started API client review for ${companyName}.`;
    case "approve_client":
      return `${actor} approved API client ${companyName}.`;
    case "reject_client":
      return `${actor} rejected API client ${companyName}.`;
    case "issue_key":
      return `${actor} issued an API key for ${companyName}.`;
    case "regenerate_key":
      return `${actor} regenerated the API key for ${companyName}.`;
    case "revoke_key":
      return `${actor} revoked the API key for ${companyName}.`;
    case "block_client":
      return `${actor} suspended API client ${companyName}.`;
    case "restore_client":
      return `${actor} restored API client ${companyName}.`;
    case "update_plan":
      return `${actor} updated the API plan for ${companyName}.`;
  }
}

function applyActionToRecord(record: ApiClientRecord, payload: ApiClientActionPayload) {
  const timestamp = new Date().toISOString();
  const note = payload.note.trim().length > 0 ? payload.note.trim() : record.note;

  switch (payload.action) {
    case "start_review":
      return {
        ...record,
        status: "under_review" as const,
        note,
        history: [
          {
            id: `api-history-${record.id}-start-review-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
    case "approve_client":
      return {
        ...record,
        status: "approved" as const,
        approvedAt: timestamp,
        plan: payload.plan,
        policy: {
          environment: payload.policyEnvironment,
          tier: payload.policyTier,
          scopes: payload.policyScopes,
          products: payload.policyProducts,
          alertProfile: payload.policyAlertProfile,
        },
        usage: {
          ...record.usage,
          rateLimitPerMinute: payload.rateLimitPerMinute,
        },
        note,
        history: [
          {
            id: `api-history-${record.id}-approve-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
    case "reject_client":
      return {
        ...record,
        status: "rejected" as const,
        keyStatus: "not_issued" as const,
        note,
        history: [
          {
            id: `api-history-${record.id}-reject-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
    case "issue_key":
      return {
        ...record,
        keyStatus: "active" as const,
        usage: {
          ...record.usage,
          rateLimitPerMinute: payload.rateLimitPerMinute,
        },
        note,
        history: [
          {
            id: `api-history-${record.id}-issue-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
    case "regenerate_key":
      return {
        ...record,
        keyStatus: "active" as const,
        usage: {
          ...record.usage,
          rateLimitPerMinute: payload.rateLimitPerMinute,
        },
        note,
        history: [
          {
            id: `api-history-${record.id}-regenerate-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
    case "revoke_key":
      return {
        ...record,
        keyStatus: "revoked" as const,
        note,
        history: [
          {
            id: `api-history-${record.id}-revoke-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
    case "block_client":
      return {
        ...record,
        status: "blocked" as const,
        keyStatus: record.keyStatus === "active" ? ("revoked" as const) : record.keyStatus,
        note,
        history: [
          {
            id: `api-history-${record.id}-block-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
    case "restore_client":
      return {
        ...record,
        status: "approved" as const,
        keyStatus: "revoked" as const,
        note,
        history: [
          {
            id: `api-history-${record.id}-restore-${Date.now()}`,
            actor: payload.actor,
            action: buildHistoryAction(payload.action),
            timestamp: formatTimestamp(timestamp),
            note,
          },
          ...record.history,
        ],
      };
    case "update_plan":
      return {
        ...record,
        plan: payload.plan,
        policy: {
          environment: payload.policyEnvironment,
          tier: payload.policyTier,
          scopes: payload.policyScopes,
          products: payload.policyProducts,
          alertProfile: payload.policyAlertProfile,
        },
        usage: {
          ...record.usage,
          rateLimitPerMinute: payload.rateLimitPerMinute,
        },
        note,
        history: [
          {
            id: `api-history-${record.id}-plan-${Date.now()}`,
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

export type ApiClientsRepository = {
  applyAction(
    records: ApiClientRecord[],
    payload: ApiClientActionPayload,
    role: AdminRole,
  ): Promise<ApiClientActionResult>;
};

type ApiClientsListEnvelope = {
  data?: { records?: ApiClientRecord[] };
  message?: string;
  error?: { message?: string };
};

type ApiClientsActionEnvelope = {
  data?: ApiClientActionResult;
  message?: string;
  error?: { message?: string };
};

export const mockApiClientsRepository: ApiClientsRepository = {
  async applyAction(records, payload, role) {
    const record = records.find((item) => item.id === payload.clientId);

    if (!record) {
      throw new Error("Selected API client was not found.");
    }

    if (!isEligibleApiPlan(record, payload.plan)) {
      throw new Error(`Plan ${payload.plan} is not eligible for ${record.companyName}.`);
    }

    const rateLimitError = validateApiRateLimit(payload.plan, payload.rateLimitPerMinute);
    if (rateLimitError) {
      throw new Error(rateLimitError);
    }

    if (!canApplyApiClientAction(role, record, payload.action)) {
      throw new Error(`Action ${payload.action} is not allowed for this API client.`);
    }

    const updatedRecord = {
      ...applyActionToRecord(record, payload),
      latestAuditRecord: {
        eventId: `api-client-audit-${payload.action}-${Date.now()}`,
        actor: payload.actor,
        clientId: record.id,
        action: payload.action,
        summary: buildAuditSummary(payload.actor, payload.action, record.companyName),
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

export async function fetchApiClientRecords(): Promise<ApiClientRecord[]> {
  const response = await fetch("/api/backend/api-clients", {
    method: "GET",
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as ApiClientsListEnvelope | null;
  if (!response.ok || !body?.data?.records) {
    throw new Error(body?.message ?? body?.error?.message ?? "Unable to load API clients.");
  }
  return body.data.records;
}

export const realApiClientsRepository: ApiClientsRepository = {
  async applyAction(_records, payload, _role) {
    const response = await fetch(`/api/backend/api-clients/${encodeURIComponent(payload.clientId)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as ApiClientsActionEnvelope | null;
    if (!response.ok || !body?.data?.records || !body.data.updatedRecord || !body.data.auditRecord) {
      throw new Error(body?.message ?? body?.error?.message ?? "Unable to manage API client.");
    }
    return body.data;
  },
};
