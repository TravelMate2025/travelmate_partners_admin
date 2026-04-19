import type { AdminRole } from "@/modules/auth/types";
import { getAvailableActions, validateConfigAction } from "@/modules/system-config/rules";
import type {
  SystemConfigActionPayload,
  SystemConfigActionResult,
  SystemConfigAuditRecord,
  SystemConfigRecord,
  SystemConfigStatus,
} from "@/modules/system-config/types";

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

function nextStatus(record: SystemConfigRecord, action: SystemConfigActionPayload["type"]): SystemConfigStatus {
  switch (action) {
    case "publish":
      return record.kind === "content" ? "published" : "active";
    case "deprecate":
      return "deprecated";
    case "archive":
      return "archived";
    case "activate":
      return "active";
    case "deactivate":
      return "disabled";
    case "enable":
      return "enabled";
    case "disable":
      return "disabled";
    case "stage":
      return "staged";
  }
}

function buildActionLabel(action: SystemConfigActionPayload["type"]): string {
  const labels: Record<SystemConfigActionPayload["type"], string> = {
    publish: "Published",
    deprecate: "Deprecated",
    archive: "Archived",
    activate: "Activated",
    deactivate: "Deactivated",
    enable: "Enabled",
    disable: "Disabled",
    stage: "Staged for rollout",
  };
  return labels[action];
}

function buildAuditSummary(actor: string, action: SystemConfigActionPayload["type"], name: string): string {
  return `${actor} ${buildActionLabel(action).toLowerCase()} ${name} and queued config change for backend propagation.`;
}

export type SystemConfigRepository = {
  applyAction(
    records: SystemConfigRecord[],
    payload: SystemConfigActionPayload,
    role: AdminRole,
  ): Promise<SystemConfigActionResult>;
};

export const mockSystemConfigRepository: SystemConfigRepository = {
  async applyAction(records, payload, role) {
    const record = records.find((item) => item.id === payload.itemId);

    if (!record) {
      throw new Error("Selected configuration item was not found.");
    }

    const availableActions = getAvailableActions(record, role);
    if (!availableActions.includes(payload.type)) {
      throw new Error("This action is not available for the selected item and role.");
    }

    const validationError = validateConfigAction(payload, record, role, records);
    if (validationError) {
      throw new Error(validationError);
    }

    const timestamp = new Date().toISOString();
    const formattedTimestamp = formatTimestamp(timestamp);
    const status = nextStatus(record, payload.type);
    const actionLabel = buildActionLabel(payload.type);

    const auditRecord: SystemConfigAuditRecord = {
      eventId: `sysc-audit-${record.id}-${Date.now()}`,
      actor: payload.actor,
      itemId: record.id,
      action: payload.type,
      summary: buildAuditSummary(payload.actor, payload.type, record.name),
      status: "queued_for_backend",
    };

    const updatedRecord: SystemConfigRecord = {
      ...record,
      status,
      rolloutPercent:
        payload.type === "stage"
          ? (payload.rolloutPercent ?? record.rolloutPercent ?? 50)
          : payload.type === "enable"
            ? 100
            : payload.type === "disable"
              ? null
              : record.rolloutPercent,
      operationalNote: payload.note.trim(),
      updatedBy: payload.actor,
      updatedAt: timestamp,
      history: [
        {
          id: `sysc-history-${record.id}-${Date.now()}`,
          actor: payload.actor,
          action: actionLabel,
          timestamp: formattedTimestamp,
          note: payload.note.trim(),
        },
        ...record.history,
      ],
      latestAuditRecord: auditRecord,
    };

    return {
      records: records.map((item) => (item.id === record.id ? updatedRecord : item)),
      updatedRecord,
      auditRecord,
    };
  },
};
