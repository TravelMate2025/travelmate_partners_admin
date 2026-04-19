import { validateExportPayload } from "@/modules/audit-compliance/rules";
import type {
  AuditComplianceActionResult,
  AuditFilterState,
  AuditLogEntry,
  ComplianceExportPayload,
} from "@/modules/audit-compliance/types";
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

function buildExportFileName(filter: AuditFilterState, timestamp: string) {
  const datePart = timestamp.slice(0, 10);
  const categoryPart = filter.category !== "all" ? `-${filter.category.replaceAll("_", "-")}` : "";
  return `travelmate-audit-export-${datePart}${categoryPart}.csv`;
}

function buildExportSummary(actor: string, count: number, filter: AuditFilterState, fileName: string) {
  const scope =
    filter.category !== "all"
      ? `${filter.category.replaceAll("_", " ")} category`
      : "full audit log";

  return `${actor} exported ${count} audit ${count === 1 ? "entry" : "entries"} from ${scope} as ${fileName}.`;
}

export type AuditComplianceRepository = {
  applyExport(
    entries: AuditLogEntry[],
    payload: ComplianceExportPayload,
    role: AdminRole,
  ): Promise<AuditComplianceActionResult>;
};

export const mockAuditComplianceRepository: AuditComplianceRepository = {
  async applyExport(entries, payload, role) {
    const validationError = validateExportPayload(payload, role);
    if (validationError) {
      throw new Error(validationError);
    }

    const timestamp = new Date().toISOString();
    const formattedTimestamp = formatTimestamp(timestamp);
    const fileName = buildExportFileName(payload.filter, timestamp);
    const summary = buildExportSummary(payload.actor, entries.length, payload.filter, fileName);

    const exportRecord = {
      eventId: `audit-export-${Date.now()}`,
      actor: payload.actor,
      action: "export_compliance_data" as const,
      exportedEntryCount: entries.length,
      category: payload.filter.category,
      note: payload.note.trim(),
      exportedAt: formattedTimestamp,
      fileName,
      summary,
      status: "queued_for_backend" as const,
    };

    return { exportRecord };
  },
};
