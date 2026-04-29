import { canApplyPartnerAction, getPartnerPolicy } from "@/modules/partner-operations/policy";
import type {
  PartnerActionPayload,
  PartnerActionResult,
  PartnerAccountState,
  PartnerRecord,
} from "@/modules/partner-operations/types";

function buildHistoryEntry(payload: PartnerActionPayload, record: PartnerRecord) {
  const labelMap = {
    lock: "Account locked",
    unlock: "Account unlocked",
    restore: "Account restored",
    update_metadata: "Metadata updated",
  } as const;

  return {
    id: `partner-${payload.partnerId}-${payload.type}-${Date.now()}`,
    actor: payload.actor,
    action: labelMap[payload.type],
    timestamp: "Just now",
    note:
      payload.type === "update_metadata"
        ? payload.note || `Updated metadata for ${record.businessName}.`
        : payload.note || `${labelMap[payload.type]} by admin policy.`,
  };
}

function applyPartnerAction(records: PartnerRecord[], payload: PartnerActionPayload, role: Parameters<typeof getPartnerPolicy>[0]) {
  const policy = getPartnerPolicy(role);

  return records.map((record) => {
    if (record.id !== payload.partnerId) {
      return record;
    }

    if (payload.type === "update_metadata") {
      if (!policy.canEditMetadata) {
        throw new Error(`Role ${role} cannot update partner metadata.`);
      }

      return {
        ...record,
        metadata: {
          marketOwner: payload.metadata.marketOwner,
          supportTier: payload.metadata.supportTier,
          priority: payload.metadata.priority,
        },
        operationalNote: payload.note || record.operationalNote,
        history: [buildHistoryEntry(payload, record), ...record.history],
      };
    }

    if (!canApplyPartnerAction(role, record, payload.type)) {
      throw new Error(`Action ${payload.type} is not allowed for partner ${record.id}.`);
    }

    const nextAccountState: PartnerAccountState =
      payload.type === "lock" ? "locked" : payload.type === "unlock" ? "active" : "active";

    return {
      ...record,
      accountState: nextAccountState,
      operationalNote: payload.note || record.operationalNote,
      history: [buildHistoryEntry(payload, record), ...record.history],
    };
  });
}

export type PartnerOperationsRepository = {
  applyAction(records: PartnerRecord[], payload: PartnerActionPayload, role: Parameters<typeof getPartnerPolicy>[0]): Promise<PartnerActionResult>;
};

type PartnerOpsListEnvelope = {
  data?: { records?: PartnerRecord[] };
  message?: string;
  error?: { message?: string };
};

type PartnerOpsActionEnvelope = {
  data?: PartnerActionResult;
  message?: string;
  error?: { message?: string };
};

export const mockPartnerOperationsRepository: PartnerOperationsRepository = {
  async applyAction(records, payload, role) {
    const nextRecords = applyPartnerAction(records, payload, role);
    const updatedRecord = nextRecords.find((record) => record.id === payload.partnerId);

    if (!updatedRecord) {
      throw new Error(`Partner ${payload.partnerId} was not found.`);
    }

    return {
      records: nextRecords,
      updatedRecord,
      auditMessage: `${payload.actor} executed ${payload.type} for ${updatedRecord.businessName}.`,
    };
  },
};

export async function fetchPartnerOperationRecords(): Promise<PartnerRecord[]> {
  const response = await fetch("/api/backend/partner-operations", { method: "GET", cache: "no-store" });
  const body = (await response.json().catch(() => null)) as PartnerOpsListEnvelope | null;
  if (!response.ok || !body?.data?.records) {
    throw new Error(body?.message ?? body?.error?.message ?? "Unable to load partner operations.");
  }
  return body.data.records;
}

export const realPartnerOperationsRepository: PartnerOperationsRepository = {
  async applyAction(_records, payload, _role) {
    const response = await fetch(`/api/backend/partner-operations/${encodeURIComponent(payload.partnerId)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as PartnerOpsActionEnvelope | null;
    if (!response.ok || !body?.data?.records || !body.data.updatedRecord) {
      throw new Error(body?.message ?? body?.error?.message ?? "Unable to apply account action.");
    }
    return body.data;
  },
};
